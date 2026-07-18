from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from app.main import app
from app.models.user import User, UserRole
from app.core.config import settings
import uuid
from datetime import datetime, timezone

client = TestClient(app)

from app.core.database import get_db
app.dependency_overrides[get_db] = lambda: MagicMock()

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

@patch("app.api.deps.SessionService")
@patch("app.api.routes.recommendations.RecommendationService")
def test_generate_recommendation(mock_rec_service_cls, mock_session_service):
    mock_session = mock_session_service.return_value
    mock_session.validate_session.return_value = get_mock_user()
    
    mock_rec_service = mock_rec_service_cls.return_value
    mock_run = MagicMock()
    mock_run.engine_version = "1.0.0"
    mock_run.policy_version = "1.0.0"
    mock_run.knowledge_version = "v1"
    mock_run.created_at = datetime.now(timezone.utc)
    
    item = MagicMock()
    item.routine_step = "cleanser"
    item.category = "gentle_cleanser"
    item.explanation_codes = []
    mock_run.items = [item]
    
    mock_rec_service.generate_recommendation.return_value = mock_run
    
    client.cookies.set(settings.SESSION_COOKIE_NAME, "valid_token")
    response = client.post("/api/recommendations/generate")
    
    assert response.status_code == 200
    data = response.json()
    assert data["engine_version"] == "1.0.0"
    assert len(data["items"]) == 1
    assert data["items"][0]["routine_step"] == "cleanser"

@patch("app.api.deps.SessionService")
@patch("app.api.routes.recommendations.RecommendationService")
def test_get_latest_recommendation(mock_rec_service_cls, mock_session_service):
    mock_session = mock_session_service.return_value
    mock_session.validate_session.return_value = get_mock_user()
    
    mock_rec_service = mock_rec_service_cls.return_value
    mock_run = MagicMock()
    mock_run.engine_version = "1.0.0"
    mock_run.policy_version = "1.0.0"
    mock_run.knowledge_version = "v1"
    mock_run.created_at = datetime.now(timezone.utc)
    
    item = MagicMock()
    item.routine_step = "treatment"
    item.category = "bha_salicylic_acid"
    item.explanation_codes = ["EXCLUDED_KNOWN_REACTION"]
    mock_run.items = [item]
    
    mock_rec_service.get_latest_recommendation.return_value = mock_run
    
    client.cookies.set(settings.SESSION_COOKIE_NAME, "valid_token")
    response = client.get("/api/recommendations/latest")
    
    assert response.status_code == 200
    data = response.json()
    assert data["engine_version"] == "1.0.0"
    assert len(data["items"]) == 1
    assert data["items"][0]["routine_step"] == "treatment"

@patch("app.api.deps.SessionService")
@patch("app.api.routes.recommendations.RecommendationService")
def test_generate_recommendation_debug_present(mock_rec_service_cls, mock_session_service):
    from app.services.recommendation.schema import RecommendationTrace, TraceVersions, ProvenanceRefs, TraceIdentifiers, RecommendationResult
    
    mock_session = mock_session_service.return_value
    mock_session.validate_session.return_value = get_mock_user()
    
    mock_rec_service = mock_rec_service_cls.return_value
    mock_run = MagicMock()
    mock_run.engine_version = "1.0.0"
    mock_run.policy_version = "1.0.0"
    mock_run.knowledge_version = "v1"
    mock_run.created_at = datetime.now(timezone.utc)
    mock_run.items = []
    
    # Setup ephemeral trace
    trace = RecommendationTrace(
        identifiers=TraceIdentifiers(request_id=uuid.uuid4(), correlation_id=uuid.uuid4(), trace_id=uuid.uuid4()),
        inputs=ProvenanceRefs(questionnaire_id=uuid.uuid4()),
        execution_timestamp=datetime.now(timezone.utc).isoformat(),
        versions=TraceVersions(engine="1.0", policy="1.0", knowledge="1.0"),
        execution_hash="test_hash",
        events=[],
        duration_ms=10.0,
        status="success",
        result=RecommendationResult(
            engine_version="1.0", 
            policy_version="1.0", 
            knowledge_version="1.0", 
            routine_slots=[], 
            explanation_codes=[], 
            safety_adjustments=[],
            ingredient_guidance=[],
            deferred_guidance=[],
            provenance_refs=ProvenanceRefs(questionnaire_id=uuid.uuid4())
        )
    )
    mock_run._ephemeral_trace = trace
    
    mock_rec_service.generate_recommendation.return_value = mock_run
    
    client.cookies.set(settings.SESSION_COOKIE_NAME, "valid_token")
    response = client.post("/api/recommendations/generate", headers={"X-Ishkeen-Debug": "true"})
    
    assert response.status_code == 200
    data = response.json()
    assert "_debug" in data
    assert data["_debug"]["execution_hash"] == "test_hash"
    assert "RecommendationTrace" in data["_debug"]
    assert "DecisionGraph" in data["_debug"]
    # Verify graph generated
    assert isinstance(data["_debug"]["DecisionGraph"], dict)

@patch("app.api.deps.SessionService")
@patch("app.api.routes.recommendations.RecommendationService")
def test_generate_recommendation_debug_malformed(mock_rec_service_cls, mock_session_service):
    mock_session = mock_session_service.return_value
    mock_session.validate_session.return_value = get_mock_user()
    
    mock_rec_service = mock_rec_service_cls.return_value
    mock_run = MagicMock()
    mock_run.engine_version = "1.0.0"
    mock_run.policy_version = "1.0.0"
    mock_run.knowledge_version = "v1"
    mock_run.created_at = datetime.now(timezone.utc)
    mock_run.items = []
    mock_run._ephemeral_trace = "I should not be accessed"
    
    mock_rec_service.generate_recommendation.return_value = mock_run
    
    client.cookies.set(settings.SESSION_COOKIE_NAME, "valid_token")
    response = client.post("/api/recommendations/generate", headers={"X-Ishkeen-Debug": "malformed_true"})
    
    assert response.status_code == 200
    data = response.json()
    assert "_debug" not in data # Should be ignored and omitted

def test_generate_recommendation_unauthorized():
    client.cookies.clear()
    # header present but unauthorized
    response = client.post("/api/recommendations/generate", headers={"X-Ishkeen-Debug": "true"})
    assert response.status_code == 401
