from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID

from app.core.database import get_db
from app.api.deps import get_verified_user, get_current_user, verify_csrf_origin
from app.models.user import User
from app.schemas.profile import (
    SkinProfileResponse,
    SkinProfileUpdate,
    SubmissionCreate,
    SubmissionResponse
)
from app.services.profile_service import ProfileService

router = APIRouter(dependencies=[Depends(verify_csrf_origin)])

@router.get("/skin-profile", response_model=SkinProfileResponse)
def get_skin_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_user)
):
    """
    Retrieve the current authenticated user's SkinProfile.
    """
    profile_service = ProfileService(db)
    profile = profile_service.get_current_profile(current_user.id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    return profile

@router.patch("/skin-profile", response_model=SkinProfileResponse)
def update_skin_profile(
    update_data: SkinProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_user)
):
    """
    Partially update the current authenticated user's SkinProfile.
    """
    profile_service = ProfileService(db)
    # Validate body isn't fully empty if we wanted to, but Pydantic allows empty dict. 
    # Let's ensure empty body is technically a no-op but allowed.
    updated = profile_service.update_profile(current_user.id, update_data)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    return updated

@router.post("/questionnaires/submissions", response_model=SubmissionResponse, status_code=status.HTTP_201_CREATED)
def submit_questionnaire(
    submission_data: SubmissionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_user)
):
    """
    Submit a questionnaire. Atomically creates an immutable snapshot
    and upserts the current user's SkinProfile.
    """
    profile_service = ProfileService(db)
    snapshot = profile_service.submit_questionnaire(current_user.id, submission_data)
    return snapshot

@router.get("/questionnaires/submissions/latest", response_model=SubmissionResponse)
def get_latest_submission(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_user)
):
    """
    Retrieve the user's latest immutable questionnaire snapshot.
    """
    profile_service = ProfileService(db)
    latest = profile_service.get_latest_submission(current_user.id)
    if not latest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No submissions found"
        )
    return latest
