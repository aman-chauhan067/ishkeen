import uuid
import enum
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Enum, Index, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base

def utcnow():
    return datetime.now(timezone.utc)

class SkinType(str, enum.Enum):
    oily = "oily"
    dry = "dry"
    combination = "combination"
    balanced_normal = "balanced_normal"
    unsure = "unsure"

class SensitivityTendency(str, enum.Enum):
    low = "low"
    moderate = "moderate"
    high = "high"
    unsure = "unsure"

class PrimaryGoal(str, enum.Enum):
    fewer_visible_breakouts = "fewer_visible_breakouts"
    calmer_looking_skin = "calmer_looking_skin"
    more_even_looking_tone = "more_even_looking_tone"
    improved_hydration = "improved_hydration"
    smoother_looking_texture = "smoother_looking_texture"
    simpler_routine = "simpler_routine"
    prevention_focused_routine = "prevention_focused_routine"

class SunscreenFrequency(str, enum.Enum):
    daily = "daily"
    most_days = "most_days"
    occasionally = "occasionally"
    rarely = "rarely"
    never = "never"

class RoutineExperience(str, enum.Enum):
    beginner = "beginner"
    familiar = "familiar"
    advanced = "advanced"

class Climate(str, enum.Enum):
    hot_humid = "hot_humid"
    hot_dry = "hot_dry"
    cold_dry = "cold_dry"
    temperate = "temperate"
    mixed_seasonal = "mixed_seasonal"
    unsure = "unsure"

class SkinProfile(Base):
    __tablename__ = "skin_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    skin_type = Column(Enum(SkinType), nullable=False)
    current_concerns = Column(JSON, nullable=False)
    primary_goal = Column(Enum(PrimaryGoal), nullable=False)
    sensitivity_tendency = Column(Enum(SensitivityTendency), nullable=False)
    
    routine_product_categories = Column(JSON, nullable=False)
    active_ingredient_categories = Column(JSON, nullable=False)
    sunscreen_frequency = Column(Enum(SunscreenFrequency), nullable=False)
    routine_experience = Column(Enum(RoutineExperience), nullable=False)
    
    clinician_directed_treatment = Column(Boolean, nullable=False)
    known_reaction_categories = Column(JSON, nullable=False)
    known_reaction_other_note = Column(String(200), nullable=True)
    preference_avoid_categories = Column(JSON, nullable=False)
    climate = Column(Enum(Climate), nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    user = relationship("User")


class QuestionnaireSubmission(Base):
    __tablename__ = "questionnaire_submissions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    version = Column(String, nullable=False)
    answers = Column(JSON, nullable=False)
    
    submitted_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    user = relationship("User")

    __table_args__ = (
        Index("ix_questionnaire_submissions_user_id_submitted_at", "user_id", submitted_at.desc(), id.desc()),
    )
