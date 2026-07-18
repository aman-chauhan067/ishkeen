import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Index, Integer, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

def utcnow():
    return datetime.now(timezone.utc)

class RecommendationRun(Base):
    __tablename__ = "recommendation_runs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    questionnaire_submission_id = Column(UUID(as_uuid=True), ForeignKey("questionnaire_submissions.id", ondelete="RESTRICT"), nullable=False)
    skin_analysis_id = Column(UUID(as_uuid=True), ForeignKey("skin_analyses.id", ondelete="SET NULL"), nullable=True)
    
    engine_version = Column(String, nullable=False)
    policy_version = Column(String, nullable=False)
    knowledge_version = Column(String, nullable=False)
    
    status = Column(String, nullable=False, default="generated")
    
    # Store the safety decision traces here to avoid DB bloat with relational rows
    safety_adjustments = Column(JSON, nullable=False, default=list)
    routine_data = Column(JSON, nullable=True) # Stores weekly schedule, timeline, etc.
    
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    user = relationship("User")
    items = relationship("RecommendationItem", back_populates="run", cascade="all, delete-orphan", order_by="RecommendationItem.priority")

    __table_args__ = (
        Index("ix_recommendation_runs_user_id_created_at", "user_id", created_at.desc()),
    )


class RecommendationItem(Base):
    __tablename__ = "recommendation_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    recommendation_run_id = Column(UUID(as_uuid=True), ForeignKey("recommendation_runs.id", ondelete="CASCADE"), nullable=False)
    
    routine_step = Column(String, nullable=False) # e.g. am_cleanser, pm_treatment
    category = Column(String, nullable=False) # e.g. gentle_cleanser, bha_salicylic_acid
    priority = Column(Integer, nullable=False) # To ensure deterministic ordering independent of DB row order
    explanation_codes = Column(JSON, nullable=False)
    
    product_type = Column(String, nullable=True)
    ingredient = Column(String, nullable=True)
    why = Column(String, nullable=True)
    instructions = Column(String, nullable=True)
    frequency = Column(String, nullable=True)
    warnings = Column(String, nullable=True)
    
    run = relationship("RecommendationRun", back_populates="items")
    
    __table_args__ = (
        Index("ix_recommendation_items_run_id", "recommendation_run_id"),
    )
