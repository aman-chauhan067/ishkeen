from fastapi import Depends, Request, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User, UserRole
from app.services.session_service import SessionService
from app.core.config import settings
from app.services.inference_service import InferenceService

def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    """
    Dependency to get the authenticated user from the session cookie.
    Validates the opaque session token.
    """
    raw_token = request.cookies.get(settings.SESSION_COOKIE_NAME)
    if not raw_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
        
    session_service = SessionService(db)
    user = session_service.validate_session(raw_token)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated or session expired"
        )
        
    return user

def get_verified_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Dependency to ensure the current user has verified their email address.
    """
    if not current_user.is_email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email verification required"
        )
    return current_user

def get_current_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Dependency to ensure the current user is an admin.
    """
    if current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user

def verify_csrf_origin(request: Request):
    """
    Dependency to verify the Origin or Referer header for state-changing requests.
    This acts as a CSRF defense layered with SameSite=Lax cookies.
    """
    if request.method not in ["GET", "HEAD", "OPTIONS", "TRACE"]:
        origin = request.headers.get("origin")
        if origin:
            if origin not in settings.BACKEND_CORS_ORIGINS:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid Origin")
        else:
            # If Origin is missing, fall back to Referer
            referer = request.headers.get("referer")
            if referer:
                # Basic check: does referer start with any allowed origin?
                if not any(referer.startswith(o) for o in settings.BACKEND_CORS_ORIGINS):
                    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid Referer")
            # If both missing, we allow it (trusting SameSite=Lax for same-site omission),
            # or we could strictly reject. The prompt says "without breaking legitimate same-site requests unnecessarily".
            # Modern browsers send Origin or Referer for cross-origin POSTs. 
            pass

def get_inference_service(request: Request) -> InferenceService:
    """
    Dependency that extracts the singleton InferenceService from app.state.
    The service is created once during application startup (lifespan).
    """
    return request.app.state.inference_service
