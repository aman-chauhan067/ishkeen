import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Index, CheckConstraint, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.core.database import Base

class SkinAnalysis(Base):
    __tablename__ = "skin_analyses"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    questionnaire_submission_id = Column(UUID(as_uuid=True), ForeignKey("questionnaire_submissions.id", ondelete="RESTRICT"), nullable=False)
    status = Column(String, nullable=False, default="uploaded")
    image_storage_key = Column(String, unique=True, nullable=False)
    preprocessing_version = Column(String, nullable=False)
    ml_results = Column(JSON, nullable=True)
    failure_code = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        Index('ix_skin_analyses_user_id_created_at', user_id, created_at.desc()),
        CheckConstraint(status.in_(['created', 'uploaded', 'validating', 'ready', 'processing', 'completed', 'failed', 'rejected']), name='ck_skin_analyses_status')
    )
