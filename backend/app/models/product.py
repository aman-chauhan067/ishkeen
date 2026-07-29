import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base

def utcnow():
    return datetime.now(timezone.utc)

class Product(Base):
    __tablename__ = "products"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    brand = Column(String, nullable=True)
    category = Column(String, nullable=False, index=True) # e.g., 'gentle_cleanser', 'bha_salicylic_acid'
    is_starred = Column(Boolean, default=False, nullable=False, index=True)
    
    ingredients = Column(Text, nullable=True)
    usage_instructions = Column(Text, nullable=True)
    suitable_for = Column(JSON, nullable=True) # Can store list of conditions/skin types
    warnings = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)
