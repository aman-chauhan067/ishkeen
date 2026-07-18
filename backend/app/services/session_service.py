from typing import Optional
from datetime import timedelta, timezone
from sqlalchemy.orm import Session
from app.models.user import AuthSession, User, utcnow
from app.core.security import generate_session_token, hash_session_token
from app.core.config import settings

# Threshold for updating last_used_at to prevent excessive DB writes
SESSION_TOUCH_INTERVAL_MINUTES = 5

class SessionService:
    def __init__(self, db: Session):
        self.db = db

    def create_session(self, user_id, user_agent: Optional[str] = None) -> str:
        """
        Creates a new session and returns the RAW token (which must be sent to the client).
        The raw token is NEVER persisted.
        """
        raw_token = generate_session_token()
        hashed_token = hash_session_token(raw_token)
        
        expires_at = utcnow() + timedelta(minutes=settings.SESSION_EXPIRE_MINUTES)
        
        # Privacy: truncate user_agent to fit bounded length
        if user_agent:
            user_agent = user_agent[:255]
            
        session_record = AuthSession(
            user_id=user_id,
            token_hash=hashed_token,
            expires_at=expires_at,
            user_agent=user_agent
        )
        self.db.add(session_record)
        self.db.commit()
        
        return raw_token

    def validate_session(self, raw_token: str) -> Optional[User]:
        """
        Validates a raw token from the cookie.
        Rejects non-existent, expired, or revoked sessions, and sessions of inactive users.
        Updates last_used_at if the touch interval has passed.
        Returns the User if valid, else None.
        """
        hashed_token = hash_session_token(raw_token)
        
        # Use a join to get user and session in one query, though lazy loading works
        session_record = self.db.query(AuthSession).filter(AuthSession.token_hash == hashed_token).first()
        
        if not session_record:
            return None
            
        now = utcnow()
        
        # Validation checks
        if session_record.revoked_at is not None:
            return None
        
        expires_at = session_record.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
            
        if expires_at < now:
            return None
        
        user = session_record.user
        if not user or not user.is_active:
            return None
            
        # Throttled touch update
        # If last_used_at is older than the interval, update it
        last_used_at = session_record.last_used_at
        if last_used_at.tzinfo is None:
            last_used_at = last_used_at.replace(tzinfo=timezone.utc)
        if last_used_at < now - timedelta(minutes=SESSION_TOUCH_INTERVAL_MINUTES):
            session_record.last_used_at = now
            self.db.commit()
            
        return user

    def revoke_session(self, raw_token: str) -> bool:
        """
        Revokes a specific session. Returns True if revoked, False if not found.
        """
        hashed_token = hash_session_token(raw_token)
        session_record = self.db.query(AuthSession).filter(AuthSession.token_hash == hashed_token).first()
        
        if session_record and not session_record.revoked_at:
            session_record.revoked_at = utcnow()
            self.db.commit()
            return True
        return False

    def revoke_all_user_sessions(self, user_id) -> int:
        """
        Revokes all active sessions for a user.
        """
        now = utcnow()
        count = self.db.query(AuthSession).filter(
            AuthSession.user_id == user_id,
            AuthSession.revoked_at.is_(None)
        ).update({"revoked_at": now}, synchronize_session=False)
        self.db.commit()
        return count
