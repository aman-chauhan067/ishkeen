from app.core.limiter import limiter
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.auth import SignupRequest, LoginRequest, MessageResponse
from app.schemas.user import UserResponse
from app.models.user import User
from app.services.auth_service import AuthService
from app.services.session_service import SessionService
from app.api.deps import get_current_user, verify_csrf_origin
from app.core.config import settings
from app.services.notification_service import NotificationService
from app.models.notification import NotificationType
import urllib.parse
import secrets
from pydantic import BaseModel

class GoogleUrlResponse(BaseModel):
    url: str

class GoogleLoginRequest(BaseModel):
    code: str
    state: str
    redirect_uri: str | None = None

router = APIRouter(dependencies=[Depends(verify_csrf_origin)])

def set_auth_cookie(response: Response, raw_token: str):
    """
    Sets the secure HttpOnly cookie for the authentication session.
    """
    response.set_cookie(
        key=settings.SESSION_COOKIE_NAME,
        value=raw_token,
        max_age=settings.SESSION_EXPIRE_MINUTES * 60,
        httponly=True,
        secure=True,
        samesite="none",
        path="/"
    )

from app.services.email_service import email_service, generate_secure_token
from app.models.token import VerificationToken, PasswordResetToken
from datetime import datetime, timedelta, timezone

@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
def signup(request: Request, payload: SignupRequest, db: Session = Depends(get_db)):
    """
    Register a new user.
    """
    auth_service = AuthService(db)
    try:
        user = auth_service.create_user(payload.email, payload.password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Account with this email already exists"
            )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # Generate verification token
    token_str = generate_secure_token()
    v_token = VerificationToken(
        user_id=user.id,
        token=token_str,
        expires_at=datetime.now(timezone.utc) + timedelta(hours=24)
    )
    db.add(v_token)
    db.commit()
    
    verify_url = f"{settings.APP_URL.rstrip('/')}/verify-email?token={token_str}"
    from app.services.email_service import EmailDeliveryException
    try:
        email_service.send_verification_email(user.email, token_str, verify_url)
    except EmailDeliveryException as e:
        # Don't rollback DB because user should exist, just let them resend later
        raise HTTPException(status_code=502, detail=str(e))
    
    NotificationService.dispatch(
        db=db,
        notification_type=NotificationType.info,
        title="New User Registration",
        message=f"User {user.email} has registered.",
        link=f"/admin/users/{user.id}"
    )
    
    return user

@router.post("/login", response_model=UserResponse, status_code=status.HTTP_200_OK)
@limiter.limit("10/minute")
def login(request: Request, payload: LoginRequest, response: Response, db: Session = Depends(get_db)):
    """
    Authenticate a user and set a session cookie.
    """
    auth_service = AuthService(db)
    user = auth_service.authenticate_user(payload.email, payload.password)
    
    if not user:
        # Generic error message to prevent enumeration
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
        
    session_service = SessionService(db)
    # Extract user-agent for basic session tracking (bounded to 255 chars in service)
    user_agent = request.headers.get("user-agent", "")
    
    raw_token = session_service.create_session(user.id, user_agent)
    set_auth_cookie(response, raw_token)
    
    NotificationService.dispatch(
        db=db,
        notification_type=NotificationType.info,
        title="User Login",
        message=f"User {user.email} logged in.",
        link=f"/admin/users/{user.id}"
    )
    
    return user

@router.post("/logout", response_model=MessageResponse, status_code=status.HTTP_200_OK)
def logout(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Revoke the current session and clear the cookie.
    """
    raw_token = request.cookies.get(settings.SESSION_COOKIE_NAME)
    if raw_token:
        session_service = SessionService(db)
        session_service.revoke_session(raw_token)
        
    response.delete_cookie(
        key=settings.SESSION_COOKIE_NAME,
        path="/",
        secure=True,
        httponly=True,
        samesite="none"
    )
    return {"message": "Successfully logged out"}

@router.get("/me", response_model=UserResponse, status_code=status.HTTP_200_OK)
def read_users_me(current_user = Depends(get_current_user)):
    """
    Get current authenticated user details.
    """
    return current_user

from app.schemas.user import UserUpdate

@router.patch("/me", response_model=UserResponse, status_code=status.HTTP_200_OK)
def update_users_me(
    update_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Update current authenticated user details.
    """
    if update_data.name is not None:
        current_user.name = update_data.name
    if update_data.avatar_url is not None:
        current_user.avatar_url = update_data.avatar_url
        
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/change-email", response_model=MessageResponse, status_code=status.HTTP_200_OK)
def change_email(
    update_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Change email and trigger re-verification."""
    if not update_data.email:
        raise HTTPException(status_code=400, detail="Email is required")
        
    # Check if email is already taken
    existing_user = db.query(User).filter(User.email == update_data.email).first()
    if existing_user and existing_user.id != current_user.id:
        raise HTTPException(status_code=400, detail="Email already in use")
        
    current_user.email = update_data.email
    current_user.is_email_verified = False
    db.commit()
    
    # Send verification email
    auth_service = AuthService(db)
    token = auth_service.create_verification_token(current_user.id)
    email_provider = get_email_provider()
    email_provider.send_verification_email(current_user.email, token.token_hash)
    
    return {"message": "Email updated. Please verify your new email."}

from fastapi import UploadFile, File
import shutil
import os
from pathlib import Path

@router.post("/me/avatar", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def upload_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Upload a profile avatar.
    """
    upload_dir = Path("uploads/avatars")
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    file_ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"{current_user.id}.{file_ext}"
    file_path = upload_dir / filename
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    current_user.avatar_url = f"/api/users/avatars/{filename}"
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user

from pydantic import BaseModel

class VerifyEmailRequest(BaseModel):
    token: str

class ResendVerifyRequest(BaseModel):
    email: str

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    password: str

@router.post("/verify-email", response_model=MessageResponse)
@limiter.limit("5/minute")
def verify_email(request: Request, req: VerifyEmailRequest, db: Session = Depends(get_db)):
    token_record = db.query(VerificationToken).filter(VerificationToken.token == req.token).first()
    now_utc = datetime.now(timezone.utc).replace(tzinfo=None)
    if not token_record or token_record.used_at or token_record.expires_at < now_utc:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
        
    user = db.query(User).filter(User.id == token_record.user_id).first()
    if user:
        user.is_email_verified = True
        token_record.used_at = datetime.now(timezone.utc)
        db.commit()
    return {"message": "Email successfully verified"}

@router.post("/resend-verification", response_model=MessageResponse)
@limiter.limit("3/minute")
def resend_verification(request: Request, req: ResendVerifyRequest, db: Session = Depends(get_db)):
    auth_service = AuthService(db)
    try:
        norm_email = auth_service.normalize_email(req.email)
    except:
        return {"message": "If this email is registered, a new verification link has been sent."}
        
    user = db.query(User).filter(User.email == norm_email).first()
    if user and not user.is_email_verified:
        token_str = generate_secure_token()
        v_token = VerificationToken(
            user_id=user.id,
            token=token_str,
            expires_at=datetime.now(timezone.utc) + timedelta(hours=24)
        )
        db.add(v_token)
        db.commit()
        verify_url = f"{settings.APP_URL.rstrip('/')}/verify-email?token={token_str}"
        from app.services.email_service import EmailDeliveryException
        try:
            email_service.send_verification_email(user.email, token_str, verify_url)
        except EmailDeliveryException as e:
            raise HTTPException(status_code=502, detail=str(e))
        
    return {"message": "If this email is registered, a new verification link has been sent."}

@router.post("/forgot-password", response_model=MessageResponse)
@limiter.limit("3/minute")
def forgot_password(request: Request, req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    auth_service = AuthService(db)
    try:
        norm_email = auth_service.normalize_email(req.email)
    except:
        return {"message": "If this email is registered, a password reset link has been sent."}
        
    user = db.query(User).filter(User.email == norm_email).first()
    if user:
        token_str = generate_secure_token()
        r_token = PasswordResetToken(
            user_id=user.id,
            token=token_str,
            expires_at=datetime.now(timezone.utc) + timedelta(hours=1)
        )
        db.add(r_token)
        db.commit()
        reset_url = f"{settings.APP_URL.rstrip('/')}/reset-password?token={token_str}"
        from app.services.email_service import EmailDeliveryException
        try:
            email_service.send_password_reset_email(user.email, token_str, reset_url)
        except EmailDeliveryException as e:
            raise HTTPException(status_code=502, detail=str(e))
        
    return {"message": "If this email is registered, a password reset link has been sent."}

from app.core.security import get_password_hash

@router.post("/reset-password", response_model=MessageResponse)
@limiter.limit("3/minute")
def reset_password(request: Request, req: ResetPasswordRequest, db: Session = Depends(get_db)):
    token_record = db.query(PasswordResetToken).filter(PasswordResetToken.token == req.token).first()
    now_utc = datetime.now(timezone.utc).replace(tzinfo=None)
    if not token_record or token_record.used_at or token_record.expires_at < now_utc:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
        
    auth_service = AuthService(db)
    try:
        auth_service.validate_password(req.password)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    user = db.query(User).filter(User.id == token_record.user_id).first()
    if user:
        user.hashed_password = get_password_hash(req.password)
        token_record.used_at = datetime.now(timezone.utc)
        
        # Revoke all existing sessions for this user!
        from app.models.user import AuthSession
        sessions = db.query(AuthSession).filter(AuthSession.user_id == user.id, AuthSession.revoked_at == None).all()
        for s in sessions:
            s.revoked_at = datetime.now(timezone.utc)
            
        db.commit()
    return {"message": "Password successfully reset"}

@router.get("/sessions")
def get_sessions(request: Request, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from app.models.user import AuthSession
    from app.core.security import hash_session_token
    sessions = db.query(AuthSession).filter(AuthSession.user_id == current_user.id, AuthSession.revoked_at == None).all()
    
    raw_token = request.cookies.get(settings.SESSION_COOKIE_NAME)
    current_hash = hash_session_token(raw_token) if raw_token else None

    result = []
    for s in sessions:
        ua = s.user_agent or "Unknown"
        device = "Desktop" if "Windows" in ua or "Macintosh" in ua else "Mobile" if "Mobile" in ua else "Unknown"
        browser = "Chrome" if "Chrome" in ua else "Safari" if "Safari" in ua else "Firefox" if "Firefox" in ua else "Unknown"
        is_current = (s.token_hash == current_hash)
        
        result.append({
            "id": str(s.id),
            "device": f"{device} ({browser})",
            "ip": "Unknown IP",
            "last_active": s.last_used_at.isoformat(),
            "is_current": is_current
        })
    return result
@router.delete("/sessions/{session_id}")
def revoke_specific_session(session_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from app.models.user import AuthSession
    from datetime import datetime, timezone
    session_record = db.query(AuthSession).filter(AuthSession.id == session_id, AuthSession.user_id == current_user.id).first()
    if session_record:
        session_record.revoked_at = datetime.now(timezone.utc)
        db.commit()
    return {"message": "Session revoked"}

@router.delete("/sessions")
def revoke_other_sessions(request: Request, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from app.models.user import AuthSession
    from app.core.security import hash_session_token
    from datetime import datetime, timezone
    raw_token = request.cookies.get(settings.SESSION_COOKIE_NAME)
    current_hash = hash_session_token(raw_token) if raw_token else None
    
    sessions = db.query(AuthSession).filter(AuthSession.user_id == current_user.id, AuthSession.revoked_at == None).all()
    for s in sessions:
        if s.token_hash != current_hash:
            s.revoked_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "Other sessions revoked"}

@router.get("/google/url", response_model=GoogleUrlResponse)
def get_google_url(request: Request, response: Response):
    state = secrets.token_urlsafe(32)
    # Store state securely in a short-lived cookie for validation
    response.set_cookie(
        key="oauth_state",
        value=state,
        max_age=300, # 5 minutes
        httponly=True,
        secure=True,
        samesite="none",
        path="/"
    )
    
    # Dynamically determine callback URI based on Origin or Referer header
    origin = request.headers.get("origin") or request.headers.get("referer")
    if origin and any(domain in origin for domain in [".workers.dev", ".pages.dev", "localhost", "ishkeen"]):
        from urllib.parse import urlparse
        parsed = urlparse(origin)
        redirect_uri = f"{parsed.scheme}://{parsed.netloc}/auth/google/callback"
    else:
        redirect_uri = settings.GOOGLE_REDIRECT_URI or "https://ishkeen.akashchauhan325069.workers.dev/auth/google/callback"

    if not settings.GOOGLE_CLIENT_ID or settings.GOOGLE_CLIENT_ID == "None":
        raise HTTPException(
            status_code=400,
            detail="Google OAuth is not configured on the server. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Render Environment Variables."
        )

    base_url = "https://accounts.google.com/o/oauth2/v2/auth"
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "access_type": "online",
        "prompt": "select_account"
    }
    url = f"{base_url}?{urllib.parse.urlencode(params)}"
    return GoogleUrlResponse(url=url)

@router.post("/google/login", response_model=UserResponse)
def google_login(request: Request, payload: GoogleLoginRequest, response: Response, db: Session = Depends(get_db)):
    cookie_state = request.cookies.get("oauth_state")
    if cookie_state and cookie_state != payload.state:
        raise HTTPException(status_code=400, detail="Invalid state parameter. Please try again.")

    # Clear state cookie if present
    if cookie_state:
        response.delete_cookie("oauth_state", path="/", secure=True, samesite="none")

    auth_service = AuthService(db)
    try:
        user = auth_service.authenticate_google(payload.code, payload.redirect_uri)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    if not user:
        raise HTTPException(status_code=400, detail="Google authentication failed")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")

    session_service = SessionService(db)
    raw_token = session_service.create_session(
        user_id=user.id,
        user_agent=request.headers.get("user-agent", "")
    )
    
    set_auth_cookie(response, raw_token)
    return user
