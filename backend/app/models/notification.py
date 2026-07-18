from sqlalchemy import Column, String, DateTime, Boolean, Enum
from sqlalchemy.sql import func
import enum
from app.core.database import Base
import uuid

class NotificationType(enum.Enum):
    info = "info"
    warning = "warning"
    success = "success"

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    type = Column(Enum(NotificationType), nullable=False)
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    link = Column(String, nullable=True)
    read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
