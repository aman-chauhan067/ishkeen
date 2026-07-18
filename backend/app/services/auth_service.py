from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.models.user import User, UserRole
from app.core.security import get_password_hash
from app.services.auth_providers import normalize_email, PasswordProvider, GoogleOAuthProvider

class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.password_provider = PasswordProvider()
        self.google_provider = GoogleOAuthProvider()

    def normalize_email(self, email: str) -> str:
        return normalize_email(email)

    def validate_password(self, password: str) -> None:
        import re
        if len(password) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not re.search(r"[A-Z]", password):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", password):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"[0-9]", password):
            raise ValueError("Password must contain at least one number")
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
            raise ValueError("Password must contain at least one special character")

    def create_user(self, email: str, plain_password: str) -> Optional[User]:
        try:
            norm_email = self.normalize_email(email)
            self.validate_password(plain_password)
        except ValueError as e:
            raise e

        hashed = get_password_hash(plain_password)
        user = User(
            email=norm_email,
            hashed_password=hashed,
            role=UserRole.user,
            is_email_verified=False,
            auth_provider="local"
        )
        self.db.add(user)
        try:
            self.db.commit()
            self.db.refresh(user)
            return user
        except IntegrityError:
            self.db.rollback()
            return None

    def authenticate_user(self, email: str, plain_password: str) -> Optional[User]:
        return self.password_provider.authenticate(self.db, email, plain_password)
        
    def authenticate_google(self, code: str) -> Optional[User]:
        return self.google_provider.authenticate(self.db, code)
