import io
import uuid
from typing import List
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_verified_user, get_current_user, get_inference_service
from app.models.user import User
from app.schemas.analysis import SkinAnalysisResponse, SkinAnalysisListResponse
from app.services.analysis_service import AnalysisService
from app.services.inference_service import InferenceService
from app.services.image_pipeline import (
    UnsupportedFormatError, ImageTooLargeError, DimensionsTooSmallError, InvalidImageError
)

router = APIRouter()

MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10 MB
CHUNK_SIZE = 1024 * 1024  # 1 MB

@router.post("/analyses", response_model=SkinAnalysisResponse, status_code=201)
async def create_analysis(
    file: UploadFile = File(...),
    current_user: User = Depends(get_verified_user),
    db: Session = Depends(get_db),
    inference_service: InferenceService = Depends(get_inference_service)
):
    # Early UX-oriented check (security relies on magic bytes later)
    if file.content_type not in ("image/jpeg", "image/png", "image/webp"):
        raise HTTPException(status_code=415, detail="Unsupported Media Type. Must be JPEG, PNG, or WebP.")
        
    from datetime import datetime, timezone
    from app.models.analysis import SkinAnalysis
    if current_user.role.value != "admin":
        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        today_count = db.query(SkinAnalysis).filter(
            SkinAnalysis.user_id == current_user.id,
            SkinAnalysis.created_at >= today_start
        ).count()
        if today_count >= current_user.daily_analysis_limit:
            raise HTTPException(status_code=429, detail=f"Daily limit reached. You can only perform {current_user.daily_analysis_limit} analyses per day.")

    total_size = 0
    buffer = io.BytesIO()

    try:
        while chunk := await file.read(CHUNK_SIZE):
            total_size += len(chunk)
            if total_size > MAX_UPLOAD_BYTES:
                raise HTTPException(status_code=413, detail="Payload Too Large. Max size is 10MB.")
            buffer.write(chunk)
    finally:
        await file.close()

    buffer.seek(0)
    service = AnalysisService(db, inference_service)

    try:
        analysis = service.create_analysis(current_user.id, buffer)
        return analysis
    except HTTPException as e:
        raise e
    except UnsupportedFormatError as e:
        raise HTTPException(status_code=415, detail=str(e))
    except ImageTooLargeError as e:
        raise HTTPException(status_code=413, detail=str(e))
    except DimensionsTooSmallError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except InvalidImageError as e:
        raise HTTPException(status_code=422, detail=str(e))

@router.get("/analyses", response_model=SkinAnalysisListResponse)
def list_analyses(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_verified_user),
    db: Session = Depends(get_db),
    inference_service: InferenceService = Depends(get_inference_service)
):
    service = AnalysisService(db, inference_service)
    items, total = service.list_analyses(current_user.id, page=page, size=size)
    return {
        "items": items,
        "total": total,
        "page": page,
        "size": size
    }

@router.get("/analyses/{analysis_id}", response_model=SkinAnalysisResponse)
def get_analysis(
    analysis_id: uuid.UUID,
    current_user: User = Depends(get_verified_user),
    db: Session = Depends(get_db),
    inference_service: InferenceService = Depends(get_inference_service)
):
    service = AnalysisService(db, inference_service)
    return service.get_analysis(analysis_id, current_user.id)

@router.get("/analyses/{analysis_id}/image")
def get_analysis_image(
    analysis_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    inference_service: InferenceService = Depends(get_inference_service)
):
    service = AnalysisService(db, inference_service)
    stream = service.get_analysis_image_stream(analysis_id, current_user.id)
    
    headers = {
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
        "Content-Disposition": 'inline; filename="analysis.jpg"'
    }
    
    # Returns the File stream via StreamingResponse
    return StreamingResponse(
        stream,
        media_type="image/jpeg",
        headers=headers
    )
