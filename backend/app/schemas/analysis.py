from uuid import UUID
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, List

class SkinAnalysisResponse(BaseModel):
    id: UUID
    status: str
    preprocessing_version: str
    failure_code: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None
    ml_results: Optional[dict] = None

    model_config = ConfigDict(from_attributes=True)

class SkinAnalysisListResponse(BaseModel):
    items: List[SkinAnalysisResponse]
    total: int
    page: int
    size: int
