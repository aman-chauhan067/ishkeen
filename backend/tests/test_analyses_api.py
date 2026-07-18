from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from app.main import app
from app.models.user import User, UserRole
from app.models.profile import QuestionnaireSubmission
from app.models.analysis import SkinAnalysis
from app.core.config import settings
import uuid
import io
from datetime import datetime, timezone

client = TestClient(app)

# Override InferenceService for all analyses tests
from app.api.deps import get_inference_service
app.dependency_overrides[get_inference_service] = lambda: MagicMock()

def get_mock_user():
    return User(
        id=uuid.uuid4(),
        email="test@example.com",
        role=UserRole.user,
        is_active=True
    )

def get_mock_submission(user_id):
    return QuestionnaireSubmission(
        id=uuid.uuid4(),
        user_id=user_id,
        version="1.0",
        answers={"skin_type": "oily"},
        submitted_at=datetime.now(timezone.utc)
    )

def get_mock_analysis(user_id, submission_id):
    return SkinAnalysis(
        id=uuid.uuid4(),
        user_id=user_id,
        questionnaire_submission_id=submission_id,
        status="uploaded",
        image_storage_key=f"{uuid.uuid4().hex}.jpg",
        preprocessing_version="1.0",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )

def _create_mock_image(fmt="JPEG") -> bytes:
    from PIL import Image
    img = Image.new("RGB", (600, 600), color="blue")
    buf = io.BytesIO()
    img.save(buf, format=fmt)
    return buf.getvalue()

@patch("app.api.deps.SessionService")
@patch("app.api.routes.analyses.AnalysisService")
def test_create_analysis_success(mock_analysis_service, mock_session_service):
    user = get_mock_user()
    mock_session_service.return_value.validate_session.return_value = user
    
    mock_as = mock_analysis_service.return_value
    mock_as.create_analysis.return_value = get_mock_analysis(user.id, uuid.uuid4())
    
    client.cookies.set(settings.SESSION_COOKIE_NAME, "valid_token")
    
    file_bytes = _create_mock_image("JPEG")
    files = {"file": ("test.jpg", file_bytes, "image/jpeg")}
    
    response = client.post("/api/analyses", files=files, headers={"Origin": "http://localhost:5173"})
    
    assert response.status_code == 201
    assert response.json()["status"] == "uploaded"

@patch("app.api.deps.SessionService")
@patch("app.api.routes.analyses.AnalysisService")
def test_create_analysis_missing_profile(mock_analysis_service, mock_session_service):
    user = get_mock_user()
    mock_session_service.return_value.validate_session.return_value = user
    
    # Simulate service raising 422 for missing profile
    from fastapi import HTTPException
    mock_as = mock_analysis_service.return_value
    mock_as.create_analysis.side_effect = HTTPException(status_code=422, detail="A completed skin profile is required before analysis")
    
    client.cookies.set(settings.SESSION_COOKIE_NAME, "valid_token")
    file_bytes = _create_mock_image("JPEG")
    files = {"file": ("test.jpg", file_bytes, "image/jpeg")}
    
    response = client.post("/api/analyses", files=files, headers={"Origin": "http://localhost:5173"})
    
    assert response.status_code == 422
    assert "completed skin profile is required" in response.json()["detail"]

@patch("app.api.deps.SessionService")
@patch("app.api.routes.analyses.AnalysisService")
def test_create_analysis_payload_too_large(mock_analysis_service, mock_session_service):
    user = get_mock_user()
    mock_session_service.return_value.validate_session.return_value = user
    
    client.cookies.set(settings.SESSION_COOKIE_NAME, "valid_token")
    
    # Simulate a file slightly larger than 10MB
    import app.api.routes.analyses
    original_max = app.api.routes.analyses.MAX_UPLOAD_BYTES
    app.api.routes.analyses.MAX_UPLOAD_BYTES = 1000 # artificially lower for test
    
    file_bytes = b"0" * 2000
    files = {"file": ("test.jpg", file_bytes, "image/jpeg")}
    
    response = client.post("/api/analyses", files=files, headers={"Origin": "http://localhost:5173"})
    
    assert response.status_code == 413
    assert "Payload Too Large" in response.json()["detail"]
    
    app.api.routes.analyses.MAX_UPLOAD_BYTES = original_max

@patch("app.api.deps.SessionService")
@patch("app.api.routes.analyses.AnalysisService")
def test_create_analysis_unsupported_format(mock_analysis_service, mock_session_service):
    user = get_mock_user()
    mock_session_service.return_value.validate_session.return_value = user
    
    client.cookies.set(settings.SESSION_COOKIE_NAME, "valid_token")
    
    # Send a text file that has a fake extension but we can bypass the frontend check to test the actual pipeline
    # Wait, the endpoint checks `file.content_type` early, so let's fail that first
    file_bytes = b"fake data"
    files = {"file": ("test.txt", file_bytes, "text/plain")}
    response = client.post("/api/analyses", files=files, headers={"Origin": "http://localhost:5173"})
    
    assert response.status_code == 415

    # Bypass early check, fail in pipeline
    files = {"file": ("test.jpg", file_bytes, "image/jpeg")}
    from app.services.image_pipeline import UnsupportedFormatError
    mock_as = mock_analysis_service.return_value
    mock_as.create_analysis.side_effect = UnsupportedFormatError("Unsupported image format")
    
    response = client.post("/api/analyses", files=files, headers={"Origin": "http://localhost:5173"})
    assert response.status_code == 415
    assert "Unsupported image format" in response.json()["detail"]

@patch("app.api.deps.SessionService")
@patch("app.api.routes.analyses.AnalysisService")
def test_get_analyses_list(mock_analysis_service, mock_session_service):
    user = get_mock_user()
    mock_session_service.return_value.validate_session.return_value = user
    
    mock_as = mock_analysis_service.return_value
    mock_as.list_analyses.return_value = ([get_mock_analysis(user.id, uuid.uuid4())], 1)
    
    client.cookies.set(settings.SESSION_COOKIE_NAME, "valid_token")
    response = client.get("/api/analyses?page=1&size=20")
    
    assert response.status_code == 200
    assert response.json()["total"] == 1
    assert len(response.json()["items"]) == 1

@patch("app.api.deps.SessionService")
@patch("app.api.routes.analyses.AnalysisService")
def test_get_analysis_image(mock_analysis_service, mock_session_service):
    user = get_mock_user()
    mock_session_service.return_value.validate_session.return_value = user
    
    mock_as = mock_analysis_service.return_value
    mock_as.get_analysis_image_stream.return_value = io.BytesIO(b"fake_jpeg_bytes")
    
    client.cookies.set(settings.SESSION_COOKIE_NAME, "valid_token")
    response = client.get(f"/api/analyses/{uuid.uuid4()}/image")
    
    assert response.status_code == 200
    assert response.headers["content-type"] == "image/jpeg"
    assert response.headers["cache-control"] == "private, no-store, max-age=0"
    assert response.headers["x-content-type-options"] == "nosniff"
    assert "inline" in response.headers["content-disposition"]
