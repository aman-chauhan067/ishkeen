from unittest.mock import MagicMock
from datetime import datetime, timezone, timedelta
from app.services.session_service import SessionService
from app.services.auth_service import AuthService
from app.models.user import AuthSession, User, UserRole
from app.core.security import hash_session_token
import uuid

def utcnow():
    return datetime.now(timezone.utc)

def test_session_service_validate_session():
    mock_db = MagicMock()
    service = SessionService(mock_db)
    
    user = User(id=uuid.uuid4(), email="test@example.com", is_active=True)
    raw_token = "some_raw_token"
    hashed = hash_session_token(raw_token)
    
    # 1. Valid session
    valid_session = AuthSession(
        token_hash=hashed,
        expires_at=utcnow() + timedelta(days=1),
        last_used_at=utcnow() - timedelta(minutes=10),
        user=user
    )
    
    mock_db.query.return_value.filter.return_value.first.return_value = valid_session
    validated_user = service.validate_session(raw_token)
    assert validated_user == user
    assert mock_db.commit.called  # Throttled update occurred
    
    mock_db.commit.reset_mock()
    
    # 2. Expired session
    expired_session = AuthSession(
        token_hash=hashed,
        expires_at=utcnow() - timedelta(days=1),
        last_used_at=utcnow() - timedelta(minutes=10),
        user=user
    )
    mock_db.query.return_value.filter.return_value.first.return_value = expired_session
    assert service.validate_session(raw_token) is None
    
    # 3. Revoked session
    revoked_session = AuthSession(
        token_hash=hashed,
        expires_at=utcnow() + timedelta(days=1),
        revoked_at=utcnow(),
        user=user
    )
    mock_db.query.return_value.filter.return_value.first.return_value = revoked_session
    assert service.validate_session(raw_token) is None
    
    # 4. Inactive user
    inactive_user = User(id=uuid.uuid4(), email="inactive@example.com", is_active=False)
    inactive_session = AuthSession(
        token_hash=hashed,
        expires_at=utcnow() + timedelta(days=1),
        user=inactive_user
    )
    mock_db.query.return_value.filter.return_value.first.return_value = inactive_session
    assert service.validate_session(raw_token) is None
    
    # 5. Throttled update (no commit if last_used_at is very recent)
    recent_session = AuthSession(
        token_hash=hashed,
        expires_at=utcnow() + timedelta(days=1),
        last_used_at=utcnow() - timedelta(minutes=1),
        user=user
    )
    mock_db.query.return_value.filter.return_value.first.return_value = recent_session
    assert service.validate_session(raw_token) == user
    assert not mock_db.commit.called

def test_admin_dependency():
    from app.api.deps import get_current_admin_user
    from fastapi import HTTPException
    
    user = User(role=UserRole.user)
    try:
        get_current_admin_user(user)
        assert False, "Should raise HTTPException"
    except HTTPException as e:
        assert e.status_code == 403
        
    admin = User(role=UserRole.admin)
    assert get_current_admin_user(admin) == admin
