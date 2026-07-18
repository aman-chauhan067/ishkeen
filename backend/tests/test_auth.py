from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from app.main import app
from app.models.user import User, UserRole
from app.core.config import settings
import uuid
from datetime import datetime, timezone

client = TestClient(app)

def get_mock_user():
    return User(
        id=uuid.uuid4(),
        email="test@example.com",
        hashed_password="hashed",
        role=UserRole.user,
        is_active=True,
        is_email_verified=False,
        created_at=datetime.now(timezone.utc)
    )

def get_mock_admin():
    u = get_mock_user()
    u.role = UserRole.admin
    return u

@patch("app.api.routes.auth.AuthService")
def test_signup_success(mock_auth_service):
    mock_instance = mock_auth_service.return_value
    mock_instance.create_user.return_value = get_mock_user()
    
    # Try to inject role and is_active (Pydantic should ignore them or service should)
    response = client.post("/api/auth/signup", json={
        "email": "test@example.com",
        "password": "SuperSecretPassword123",
        "role": "admin",
        "is_active": False
    })
    
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["role"] == "user"  # Role injection ignored
    assert "hashed_password" not in data

@patch("app.api.routes.auth.AuthService")
def test_signup_duplicate(mock_auth_service):
    mock_instance = mock_auth_service.return_value
    mock_instance.create_user.return_value = None  # Duplicate
    
    response = client.post("/api/auth/signup", json={
        "email": "duplicate@example.com",
        "password": "SuperSecretPassword123"
    })
    
    assert response.status_code == 409
    assert "Account with this email already exists" in response.json()["detail"]

@patch("app.api.routes.auth.SessionService")
@patch("app.api.routes.auth.AuthService")
def test_login_success(mock_auth_service, mock_session_service):
    mock_auth = mock_auth_service.return_value
    mock_auth.authenticate_user.return_value = get_mock_user()
    
    mock_session = mock_session_service.return_value
    mock_session.create_session.return_value = "raw_token_string"
    
    response = client.post("/api/auth/login", json={
        "email": "test@example.com",
        "password": "SuperSecretPassword123"
    })
    
    assert response.status_code == 200
    assert settings.SESSION_COOKIE_NAME in response.cookies
    assert response.cookies[settings.SESSION_COOKIE_NAME] == "raw_token_string"

@patch("app.api.routes.auth.AuthService")
def test_login_failure(mock_auth_service):
    mock_auth = mock_auth_service.return_value
    mock_auth.authenticate_user.return_value = None
    
    response = client.post("/api/auth/login", json={
        "email": "wrong@example.com",
        "password": "wrong"
    })
    
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password"

@patch("app.api.deps.SessionService")
def test_get_me_success(mock_session_service):
    mock_session = mock_session_service.return_value
    mock_session.validate_session.return_value = get_mock_user()
    
    client.cookies.set(settings.SESSION_COOKIE_NAME, "valid_token")
    response = client.get("/api/auth/me")
    
    assert response.status_code == 200
    assert response.json()["email"] == "test@example.com"
    assert "hashed_password" not in response.json()

@patch("app.api.deps.SessionService")
def test_get_me_unauthorized(mock_session_service):
    mock_session = mock_session_service.return_value
    mock_session.validate_session.return_value = None
    
    client.cookies.set(settings.SESSION_COOKIE_NAME, "invalid_or_expired_token")
    response = client.get("/api/auth/me")
    
    assert response.status_code == 401

@patch("app.api.routes.auth.SessionService")
@patch("app.api.routes.auth.AuthService")
def test_origin_csrf_validation(mock_auth_service, mock_session_service):
    mock_auth = mock_auth_service.return_value
    mock_auth.authenticate_user.return_value = get_mock_user()
    
    mock_session = mock_session_service.return_value
    mock_session.create_session.return_value = "raw_token_string"

    # Test valid origin
    response = client.post("/api/auth/login", json={"email": "a@b.com", "password": "abc"}, headers={"Origin": "http://localhost:5173"})
    assert response.status_code == 200

    # Test invalid origin
    response = client.post("/api/auth/login", json={"email": "a@b.com", "password": "abc"}, headers={"Origin": "http://evil.com"})
    assert response.status_code == 403
    assert response.json()["detail"] == "Invalid Origin"
    
    # Test invalid referer
    response = client.post("/api/auth/login", json={"email": "a@b.com", "password": "abc"}, headers={"Referer": "http://evil.com/page"})
    assert response.status_code == 403
    assert response.json()["detail"] == "Invalid Referer"

