from fastapi.testclient import TestClient
from unittest.mock import patch
from app.main import app
from app.models.user import User, UserRole
from app.core.config import settings
from app.models.profile import SkinProfile, QuestionnaireSubmission
import uuid
from datetime import datetime, timezone

client = TestClient(app)

from app.core.database import get_db
from unittest.mock import MagicMock
import pytest

@pytest.fixture(autouse=True)
def setup_overrides():
    app.dependency_overrides[get_db] = lambda: MagicMock()
    yield

def get_mock_user():
    return User(
        id=uuid.uuid4(),
        email="test@example.com",
        role=UserRole.user,
        is_active=True,
        is_email_verified=True
    )

def get_mock_profile(user_id):
    return SkinProfile(
        id=uuid.uuid4(),
        user_id=user_id,
        skin_type="oily",
        current_concerns=["breakouts"],
        primary_goal="fewer_visible_breakouts",
        sensitivity_tendency="low",
        routine_product_categories=["cleanser"],
        active_ingredient_categories=["none"],
        sunscreen_frequency="daily",
        routine_experience="beginner",
        clinician_directed_treatment=False,
        known_reaction_categories=[],
        known_reaction_other_note=None,
        preference_avoid_categories=[],
        climate=None,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )

def get_mock_snapshot(user_id):
    return QuestionnaireSubmission(
        id=uuid.uuid4(),
        user_id=user_id,
        version="1.0",
        answers={"skin_type": "oily"},
        submitted_at=datetime.now(timezone.utc)
    )

@patch("app.api.deps.SessionService")
@patch("app.api.routes.profile.ProfileService")
def test_get_skin_profile_success(mock_profile_service, mock_session_service):
    user = get_mock_user()
    mock_session_service.return_value.validate_session.return_value = user
    
    mock_ps = mock_profile_service.return_value
    mock_ps.get_current_profile.return_value = get_mock_profile(user.id)
    
    client.cookies.set(settings.SESSION_COOKIE_NAME, "valid_token")
    response = client.get("/api/skin-profile")
    
    assert response.status_code == 200
    assert response.json()["skin_type"] == "oily"

def test_get_skin_profile_unauthenticated():
    client.cookies.clear()
    response = client.get("/api/skin-profile")
    assert response.status_code == 401

@patch("app.api.deps.SessionService")
@patch("app.api.routes.profile.ProfileService")
def test_get_skin_profile_missing_404(mock_profile_service, mock_session_service):
    user = get_mock_user()
    mock_session_service.return_value.validate_session.return_value = user
    
    mock_ps = mock_profile_service.return_value
    mock_ps.get_current_profile.return_value = None
    
    client.cookies.set(settings.SESSION_COOKIE_NAME, "valid_token")
    response = client.get("/api/skin-profile")
    
    assert response.status_code == 404

@patch("app.api.deps.SessionService")
@patch("app.api.routes.profile.ProfileService")
def test_patch_profile_success(mock_profile_service, mock_session_service):
    user = get_mock_user()
    mock_session_service.return_value.validate_session.return_value = user
    
    mock_ps = mock_profile_service.return_value
    profile = get_mock_profile(user.id)
    profile.climate = "hot_humid"
    mock_ps.update_profile.return_value = profile
    
    client.cookies.set(settings.SESSION_COOKIE_NAME, "valid_token")
    response = client.patch("/api/skin-profile", json={"climate": "hot_humid"})
    
    assert response.status_code == 200
    assert response.json()["climate"] == "hot_humid"

@patch("app.api.deps.SessionService")
@patch("app.api.routes.profile.ProfileService")
def test_submit_questionnaire_success(mock_profile_service, mock_session_service):
    user = get_mock_user()
    mock_session_service.return_value.validate_session.return_value = user
    
    mock_ps = mock_profile_service.return_value
    mock_ps.submit_questionnaire.return_value = get_mock_snapshot(user.id)
    
    payload = {
        "skin_type": "oily",
        "current_concerns": ["breakouts"],
        "primary_goal": "fewer_visible_breakouts",
        "sensitivity_tendency": "low",
        "routine_product_categories": ["cleanser"],
        "active_ingredient_categories": ["none"],
        "sunscreen_frequency": "daily",
        "routine_experience": "beginner",
        "clinician_directed_treatment": False,
        "known_reaction_categories": [],
        "known_reaction_other_note": None,
        "preference_avoid_categories": [],
        "climate": None
    }
    
    client.cookies.set(settings.SESSION_COOKIE_NAME, "valid_token")
    response = client.post("/api/questionnaires/submissions", json=payload, headers={"Origin": "http://localhost:5173"})
    
    assert response.status_code == 201
    assert response.json()["version"] == "1.0"
    
def test_submit_questionnaire_unauthenticated():
    client.cookies.clear()
    response = client.post("/api/questionnaires/submissions", json={"skin_type": "oily"})
    assert response.status_code == 401
