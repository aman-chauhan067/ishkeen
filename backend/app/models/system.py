import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Integer
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base

def utcnow():
    return datetime.now(timezone.utc)

class SystemSetting(Base):
    __tablename__ = "system_settings"
    
    id = Column(String, primary_key=True) # always 'global'
    default_daily_limit = Column(Integer, default=5)
    registration_enabled = Column(Boolean, default=True)
    analysis_enabled = Column(Boolean, default=True)
    maintenance_mode = Column(Boolean, default=False)
    export_enabled = Column(Boolean, default=True)
    ai_analysis_enabled = Column(Boolean, default=True)
    recommendation_engine_enabled = Column(Boolean, default=True)
    
    dataset_version = Column(String, default="v2.1.0-clinical")
    ml_model_version = Column(String, default="Ishkeen-ViT-L-v4")
    
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

class SystemLog(Base):
    __tablename__ = "system_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    timestamp = Column(DateTime(timezone=True), default=utcnow, index=True)
    level = Column(String(20), nullable=False) # INFO, ERROR, WARN
    user_id = Column(UUID(as_uuid=True), nullable=True)
    ip_address = Column(String(50), nullable=True)
    endpoint = Column(String(255), nullable=True)
    method = Column(String(10), nullable=True)
    status_code = Column(Integer, nullable=True)
    duration_ms = Column(Integer, nullable=True)
    user_agent = Column(String, nullable=True)
    exception = Column(String, nullable=True)
    message = Column(String, nullable=False)
