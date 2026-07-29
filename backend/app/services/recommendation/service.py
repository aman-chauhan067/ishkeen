import logging
import uuid
from typing import List, Optional
from uuid import UUID
import time
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException, status

from app.models.recommendation import RecommendationRun, RecommendationItem
from app.models.profile import QuestionnaireSubmission
from app.services.recommendation.engine import RecommendationEngine, ENGINE_VERSION
from app.services.recommendation.knowledge import get_default_knowledge_base
from app.services.profile_service import ProfileService
from app.models.analysis import SkinAnalysis
from app.services.recommendation.ml_evidence_adapter import adapt, ConfidencePolicy, MLEvidenceResult

from app.services.recommendation.trace import TraceBuilder
from app.services.recommendation.schema import TraceVersions, ProvenanceRefs
from app.services.recommendation.storage import TraceStorage, DisabledTraceStorage
from app.services.recommendation.telemetry import TelemetryPublisher, NoOpTelemetryPublisher

class RecommendationService:
    def __init__(
        self, 
        db: Session, 
        trace_storage: Optional[TraceStorage] = None,
        telemetry_publisher: Optional[TelemetryPublisher] = None
    ):
        self.db = db
        self.profile_service = ProfileService(db)
        self.trace_storage = trace_storage or DisabledTraceStorage()
        self.telemetry = telemetry_publisher or NoOpTelemetryPublisher()
        
    def generate_recommendation(self, user_id: UUID, consultation_payload: dict = None) -> RecommendationRun:
        start_time = time.time()
        
        # 1. Fetch latest questionnaire snapshot
        submission = self.profile_service.get_latest_submission(user_id)
        if not submission:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, 
                detail="No questionnaire submission found for user."
            )
            
        kb = get_default_knowledge_base()
        engine = RecommendationEngine(knowledge=kb)
        
        # 2. Fetch latest skin analysis and adapt ML results through Evidence Adapter
        analysis = self.db.query(SkinAnalysis).filter(
            SkinAnalysis.user_id == user_id
        ).order_by(SkinAnalysis.created_at.desc()).first()
        
        ml_evidence: MLEvidenceResult = adapt(
            ml_results=analysis.ml_results if analysis else None,
            policy=ConfidencePolicy()
        )
        
        # 3. Setup Tracing
        request_id = uuid.uuid4()
        correlation_id = uuid.uuid4()
        versions = TraceVersions(engine=ENGINE_VERSION, policy=engine.policy_version, knowledge=kb.version)
        inputs = ProvenanceRefs(questionnaire_id=submission.id)
        
        trace_builder = TraceBuilder(request_id, correlation_id, versions, inputs)
        
        # 4. Generate Result — engine receives ONLY canonical evidence and new consultation
        try:
            result = engine.generate(
                submission,
                db=self.db,
                additional_concerns=ml_evidence.additional_concerns,
                consultation_payload=consultation_payload,
                provenance_analysis_id=analysis.id if analysis else None,
                trace_builder=trace_builder
            )
        except Exception as e:
            logging.error(f"Engine failure: {str(e)}")
            trace = trace_builder.finalize_failure(e)
            self._safe_persist_trace(trace)
            self._safe_emit_telemetry("recommendation_failure", 1.0, {"error": type(e).__name__})
            raise HTTPException(status_code=500, detail="Recommendation generation failed internally.")
            
        try:
            ordered_evidence = sorted(submission.answers.get("current_concerns", [])) if isinstance(submission.answers, dict) else []
            ordered_outputs = list(set([s.category for s in result.morning_routine] + [s.category for s in result.night_routine]))
            trace = trace_builder.finalize_success(ordered_evidence, ordered_outputs)
        except Exception as e:
            logging.error(f"TraceBuilder failure: {str(e)}")
            trace = trace_builder.finalize_failure(e)
            self._safe_emit_telemetry("trace_builder_failure", 1.0, {"error": type(e).__name__})
            
        # 5. Persist the run and items atomically
        routine_dict = {
            "morning": [d.model_dump() for d in result.morning_routine],
            "night": [d.model_dump() for d in result.night_routine],
            "weekly_schedule": result.weekly_schedule,
            "introduction_schedule": result.introduction_schedule,
            "patch_test_instructions": result.patch_test_instructions,
            "timeline": [d.model_dump() for d in result.timeline]
        }
        
        db_run = RecommendationRun(
            user_id=user_id,
            questionnaire_submission_id=submission.id,
            skin_analysis_id=analysis.id if analysis else None,
            engine_version=result.engine_version,
            policy_version=result.policy_version,
            knowledge_version=result.knowledge_version,
            status="generated",
            safety_adjustments=[d.model_dump() for d in result.safety_adjustments],
            routine_data=routine_dict
        )
        self.db.add(db_run)
            
        try:
            self.db.commit()
        except SQLAlchemyError as e:
            self.db.rollback()
            self._safe_emit_telemetry("database_transaction_failed", 1.0, {"error": type(e).__name__})
            raise HTTPException(status_code=500, detail="Database transaction failed during persistence.")
            
        self.db.refresh(db_run)
        
        # 6. Persist Trace & Emit Telemetry Outside the DB Transaction
        self._safe_persist_trace(trace)
        db_run._ephemeral_trace = trace
        
        duration_ms = (time.time() - start_time) * 1000
        self._safe_emit_telemetry("recommendation_success_duration_ms", duration_ms, {"engine_version": ENGINE_VERSION})
        
        return db_run

    def _safe_persist_trace(self, trace):
        try:
            self.trace_storage.save(trace)
        except Exception as e:
            logging.error(f"TraceStorage failed to save trace: {str(e)}")
            self._safe_emit_telemetry("trace_storage_failure", 1.0, {"error": type(e).__name__})

    def _safe_emit_telemetry(self, name: str, value: float, tags: dict):
        try:
            self.telemetry.publish_metric(name, value, tags)
        except Exception as e:
            logging.error(f"TelemetryPublisher failed: {str(e)}")

    def get_latest_recommendation(self, user_id: UUID) -> Optional[RecommendationRun]:
        return self.db.query(RecommendationRun)\
            .filter(RecommendationRun.user_id == user_id)\
            .order_by(RecommendationRun.created_at.desc())\
            .first()
