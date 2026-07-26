from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_verified_user, get_current_user
from app.models.user import User
from app.services.recommendation.service import RecommendationService
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime

from app.api.serializers.debug import DebugSerializer
from app.services.notification_service import NotificationService
from app.models.notification import NotificationType

router = APIRouter(prefix="/recommendations", tags=["recommendations"])

class RoutineStepSchema(BaseModel):
    step_name: str
    category: str
    product_type: str
    ingredient: str
    why: str
    instructions: str
    frequency: str
    warnings: Optional[str] = None
    recommended_product: Optional[str] = None
    
class TimelinePhaseSchema(BaseModel):
    phase: str
    expected_results: str
    adjustments: Optional[str] = None

class RecommendationResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    engine_version: str
    policy_version: str
    knowledge_version: str
    created_at: datetime
    
    morning_routine: List[RoutineStepSchema]
    night_routine: List[RoutineStepSchema]
    weekly_schedule: str
    introduction_schedule: str
    patch_test_instructions: str
    timeline: List[TimelinePhaseSchema]
    
    debug: Optional[Dict[str, Any]] = Field(None, alias="_debug")

class ConsultationPayload(BaseModel):
    budget: str = "mid_range"
    routinePreference: str = "balanced"
    morningTime: str = "3_minutes"
    nightTime: str = "10_minutes"
    skinSensitivity: str = "normal"
    experience: str = "intermediate"

from fastapi import Header

@router.post("/generate", response_model=RecommendationResponse, response_model_by_alias=True, response_model_exclude_none=True)
def generate_recommendation(
    payload: ConsultationPayload = Body(default_factory=ConsultationPayload),
    current_user: User = Depends(get_verified_user),
    db: Session = Depends(get_db),
    x_ishkeen_debug: Optional[str] = Header(None)
):
    service = RecommendationService(db)
    try:
        run = service.generate_recommendation(current_user.id, payload.model_dump())
    except Exception as e:
        NotificationService.dispatch(
            db=db,
            notification_type=NotificationType.warning,
            title="Recommendation Failed",
            message=f"Failed to generate recommendation for {current_user.email}: {str(e)}",
            link=None
        )
        raise e
    
    # Map to schema
    routine_data = run.routine_data or {}
    
    debug_payload = None
    if x_ishkeen_debug == "true" and hasattr(run, "_ephemeral_trace"):
        debug_payload = DebugSerializer.build_payload(run._ephemeral_trace)

    return RecommendationResponse(
        engine_version=run.engine_version,
        policy_version=run.policy_version,
        knowledge_version=run.knowledge_version,
        created_at=run.created_at,
        morning_routine=routine_data.get("morning", []),
        night_routine=routine_data.get("night", []),
        weekly_schedule=routine_data.get("weekly_schedule", ""),
        introduction_schedule=routine_data.get("introduction_schedule", ""),
        patch_test_instructions=routine_data.get("patch_test_instructions", ""),
        timeline=routine_data.get("timeline", []),
        debug=debug_payload
    )

@router.get("/latest", response_model=Optional[RecommendationResponse], response_model_exclude_none=True)
def get_latest_recommendation(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = RecommendationService(db)
    run = service.get_latest_recommendation(current_user.id)
    if not run:
        return None
        
    routine_data = run.routine_data or {}
        
    return RecommendationResponse(
        engine_version=run.engine_version,
        policy_version=run.policy_version,
        knowledge_version=run.knowledge_version,
        created_at=run.created_at,
        morning_routine=routine_data.get("morning", []),
        night_routine=routine_data.get("night", []),
        weekly_schedule=routine_data.get("weekly_schedule", ""),
        introduction_schedule=routine_data.get("introduction_schedule", ""),
        patch_test_instructions=routine_data.get("patch_test_instructions", ""),
        timeline=routine_data.get("timeline", [])
    )
