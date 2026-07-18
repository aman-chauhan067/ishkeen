import uuid
from typing import BinaryIO, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from fastapi import HTTPException
from app.models.analysis import SkinAnalysis
from app.models.profile import QuestionnaireSubmission
from app.services.storage import LocalStorageService
from app.services.image_pipeline import sanitize_and_normalize, IMAGE_PREPROCESSING_VERSION, ImageValidationError
from app.services.inference_service import InferenceService
from app.services.notification_service import NotificationService
from app.models.notification import NotificationType

from datetime import timedelta

class AnalysisService:
    def __init__(self, db: Session, inference_service: InferenceService):
        """
        AnalysisService receives InferenceService via dependency injection.
        It NEVER creates its own InferenceService instance.
        """
        self.db = db
        self.storage = LocalStorageService()
        self.inference = inference_service

    def create_analysis(self, user_id: uuid.UUID, stream: BinaryIO) -> SkinAnalysis:

        # Provenance: Ensure questionnaire exists
        stmt = select(QuestionnaireSubmission).where(
            QuestionnaireSubmission.user_id == user_id
        ).order_by(
            QuestionnaireSubmission.submitted_at.desc(),
            QuestionnaireSubmission.id.desc()
        ).limit(1)
        
        submission = self.db.scalar(stmt)
        if not submission:
            raise HTTPException(status_code=422, detail="A completed skin profile is required before analysis")

        # Process image (safe decoding and normalization)
        try:
            normalized_bytes = sanitize_and_normalize(stream)
        except ImageValidationError as e:
            # Re-raise as 422, 413, or 415 based on error type? The route should handle this.
            raise e

        # Run ML inference using the injected singleton service
        try:
            ml_results = self.inference.predict(normalized_bytes)
        except Exception as e:
            # Dispatch analysis failed
            NotificationService.dispatch(
                db=self.db,
                notification_type=NotificationType.warning,
                title="Analysis Failed",
                message=f"An error occurred during ML inference: {str(e)}",
                link=None
            )
            raise e

        analysis_id = uuid.uuid4()
        final_key = f"{analysis_id.hex}.jpg"
        tmp_key = f"tmp_{final_key}"

        # 1. Write to temporary storage
        self.storage.save_temp(tmp_key, normalized_bytes)

        # 2. Finalize storage (atomic replace on disk)
        self.storage.finalize(tmp_key, final_key)

        # 3. DB Transaction
        analysis = SkinAnalysis(
            id=analysis_id,
            user_id=user_id,
            questionnaire_submission_id=submission.id,
            status="completed",
            image_storage_key=final_key,
            preprocessing_version=IMAGE_PREPROCESSING_VERSION,
            ml_results=ml_results,
            completed_at=func.now()
        )
        self.db.add(analysis)

        try:
            self.db.commit()
            self.db.refresh(analysis)
        except Exception as e:
            self.db.rollback()
            # Compensation: delete the successfully written file if DB fails
            try:
                self.storage.delete(final_key)
            except Exception:
                pass
            raise e

        # Dispatch successful notification
        NotificationService.dispatch(
            db=self.db,
            notification_type=NotificationType.success,
            title="Analysis Completed",
            message=f"Analysis completed successfully.",
            link=f"/admin/analyses/{analysis.id}"
        )

        # Generate recommendation automatically
        from app.services.recommendation.service import RecommendationService
        rec_service = RecommendationService(self.db)
        try:
            rec_service.generate_recommendation(user_id)
        except Exception as e:
            # We don't fail the upload if recommendations fail, just log it.
            # Notification is already dispatched by the RecommendationService itself.
            pass

        return analysis

    def get_analysis(self, analysis_id: uuid.UUID, user_id: uuid.UUID) -> SkinAnalysis:
        analysis = self.db.get(SkinAnalysis, analysis_id)
        if not analysis or analysis.user_id != user_id:
            raise HTTPException(status_code=404, detail="Analysis not found")
        return analysis

    def list_analyses(self, user_id: uuid.UUID, page: int = 1, size: int = 20) -> Tuple[list[SkinAnalysis], int]:
        if page < 1:
            page = 1
        if size < 1 or size > 100:
            size = 20
            
        offset = (page - 1) * size

        # Count
        count_stmt = select(func.count(SkinAnalysis.id)).where(SkinAnalysis.user_id == user_id)
        total = self.db.scalar(count_stmt)

        # Items
        stmt = select(SkinAnalysis).where(
            SkinAnalysis.user_id == user_id
        ).order_by(
            SkinAnalysis.created_at.desc(),
            SkinAnalysis.id.desc()
        ).limit(size).offset(offset)
        items = list(self.db.scalars(stmt))

        return items, total

    def get_analysis_image_stream(self, analysis_id: uuid.UUID, user_id: uuid.UUID) -> BinaryIO:
        analysis = self.get_analysis(analysis_id, user_id)
        # Returns the readable stream. Caller must close or stream it.
        return self.storage.get_stream(analysis.image_storage_key)
