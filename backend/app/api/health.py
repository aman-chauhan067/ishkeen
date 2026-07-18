from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import get_db

router = APIRouter()

@router.get("/health", status_code=status.HTTP_200_OK)
def health_check():
    """
    Liveness check endpoint.
    Responds immediately when the application process is running.
    """
    return {"status": "healthy"}

@router.get("/ready", status_code=status.HTTP_200_OK)
def readiness_check(db: Session = Depends(get_db)):
    """
    Readiness check endpoint.
    Fails quickly if the database is unreachable due to connect_timeout.
    """
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database unavailable"
        )
        
    return {"status": "ready"}
