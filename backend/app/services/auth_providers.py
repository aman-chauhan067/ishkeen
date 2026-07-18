from typing import Optional, Protocol, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from email_validator import validate_email, EmailNotValidError
from app.models.user import User, UserRole
from app.core.security import get_password_hash, verify_password
from app.core.config import settings
import requests
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

def normalize_email(email: str) -> str:
    email = email.strip().lower()
    try:
        valid = validate_email(email, check_deliverability=False)
        return valid.normalized
    except EmailNotValidError:
        raise ValueError("Invalid email format")

class AuthenticationProvider(Protocol):
    def authenticate(self, db: Session, **kwargs) -> Optional[User]:
        ...

class PasswordProvider:
    def authenticate(self, db: Session, email: str, plain_password: str) -> Optional[User]:
        try:
            norm_email = normalize_email(email)
        except ValueError:
            return None

        user = db.query(User).filter(User.email == norm_email).first()
        if not user or not user.hashed_password:
            return None

        is_valid, new_hash = verify_password(plain_password, user.hashed_password)
        if not is_valid:
            return None

        if new_hash:
            user.hashed_password = new_hash
            db.commit()

        return user

class GoogleOAuthProvider:
    def authenticate(self, db: Session, code: str) -> Optional[User]:
        # Exchange authorization code for ID token
        token_endpoint = "https://oauth2.googleapis.com/token"
        payload = {
            "code": code,
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code",
        }
        resp = requests.post(token_endpoint, data=payload)
        if resp.status_code != 200:
            raise ValueError(f"Failed to exchange code: {resp.text}")

        tokens = resp.json()
        raw_id_token = tokens.get("id_token")
        if not raw_id_token:
            raise ValueError("No id_token in response")

        try:
            # Verify the ID token
            id_info = id_token.verify_oauth2_token(
                raw_id_token, google_requests.Request(), settings.GOOGLE_CLIENT_ID
            )
        except ValueError as e:
            raise ValueError(f"Invalid ID token: {str(e)}")
            
        if id_info.get("iss") not in ["accounts.google.com", "https://accounts.google.com"]:
            raise ValueError("Invalid issuer.")

        email = id_info.get("email")
        if not email:
            raise ValueError("Email not provided by Google")

        try:
            norm_email = normalize_email(email)
        except ValueError:
            raise ValueError("Invalid email format returned by Google")

        # Account Linking / Creation
        user = db.query(User).filter(User.email == norm_email).first()
        
        if user:
            # Existing user: Case A (linked)
            if user.auth_provider != "google":
                user.auth_provider = "google"
                user.provider_id = id_info.get("sub")
                db.commit()
                db.refresh(user)
            return user
        else:
            # New user: Case B
            new_user = User(
                email=norm_email,
                hashed_password=None,
                role=UserRole.user,
                is_email_verified=True, # Google verified
                auth_provider="google",
                provider_id=id_info.get("sub"),
                name=id_info.get("name"),
                avatar_url=id_info.get("picture")
            )
            db.add(new_user)
            try:
                db.commit()
                db.refresh(new_user)
                return new_user
            except IntegrityError:
                db.rollback()
                return db.query(User).filter(User.email == norm_email).first()
