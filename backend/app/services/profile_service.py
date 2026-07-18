from sqlalchemy.orm import Session
from sqlalchemy import desc
from uuid import UUID
from datetime import datetime, timezone
from fastapi.encoders import jsonable_encoder

from app.models.profile import SkinProfile, QuestionnaireSubmission
from app.schemas.profile import SubmissionCreate, SkinProfileUpdate

QUESTIONNAIRE_VERSION = "1.0"

class ProfileService:
    def __init__(self, db: Session):
        self.db = db

    def get_current_profile(self, user_id: UUID) -> SkinProfile:
        return self.db.query(SkinProfile).filter(SkinProfile.user_id == user_id).first()

    def update_profile(self, user_id: UUID, update_data: SkinProfileUpdate) -> SkinProfile:
        profile = self.get_current_profile(user_id)
        if not profile:
            return None
            
        update_dict = update_data.model_dump(exclude_unset=True)
        
        # Merge dictionary with current object state to evaluate final cross-field validation
        final_categories = update_dict.get("known_reaction_categories", profile.known_reaction_categories or [])
        final_note = update_dict.get("known_reaction_other_note", profile.known_reaction_other_note)
        
        has_other_known = "other_known" in final_categories
        
        # If removing other_known explicitly or implicitly via categories change, clear the note
        if not has_other_known:
            if "known_reaction_other_note" in update_dict and update_dict["known_reaction_other_note"] is not None:
                # Supplied a note but effective categories don't have other_known
                from fastapi import HTTPException
                from starlette import status
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="known_reaction_other_note is only allowed when 'other_known' is selected"
                )
            # Safe clearing of note since other_known is not present
            update_dict["known_reaction_other_note"] = None
        else:
            # has_other_known is True
            if final_note is None:
                from fastapi import HTTPException
                from starlette import status
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="known_reaction_other_note is required when 'other_known' is selected"
                )
        
        for key, value in update_dict.items():
            setattr(profile, key, value)
            
        self.db.add(profile)
        self.db.commit()
        self.db.refresh(profile)
        return profile

    def submit_questionnaire(self, user_id: UUID, submission: SubmissionCreate) -> QuestionnaireSubmission:
        """
        Atomically creates an immutable snapshot and upserts the SkinProfile projection.
        """
        # 1. Canonical normalization for JSONB
        canonical_answers = jsonable_encoder(submission)
        
        # 2. Create the snapshot
        snapshot = QuestionnaireSubmission(
            user_id=user_id,
            version=QUESTIONNAIRE_VERSION,
            answers=canonical_answers,
            submitted_at=datetime.now(timezone.utc)
        )
        
        self.db.add(snapshot)
        
        # 3. UPSERT the SkinProfile
        profile = self.get_current_profile(user_id)
        if not profile:
            profile = SkinProfile(user_id=user_id)
            self.db.add(profile)
            
        # Project all submission fields onto the profile
        profile_data = submission.model_dump()
        for key, value in profile_data.items():
            setattr(profile, key, value)
            
        # 4. Commit atomic transaction
        try:
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise
            
        self.db.refresh(snapshot)
        return snapshot

    def get_latest_submission(self, user_id: UUID) -> QuestionnaireSubmission:
        return self.db.query(QuestionnaireSubmission)\
            .filter(QuestionnaireSubmission.user_id == user_id)\
            .order_by(desc(QuestionnaireSubmission.submitted_at), desc(QuestionnaireSubmission.id))\
            .first()
