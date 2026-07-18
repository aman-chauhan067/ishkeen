import uuid
import pytest
from unittest.mock import MagicMock, patch
from concurrent.futures import ThreadPoolExecutor
from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.models.user import User
from app.models.profile import QuestionnaireSubmission, SkinProfile
from app.models.recommendation import RecommendationRun
from app.services.recommendation.service import RecommendationService
from app.services.recommendation.storage import EmbeddedTraceStorage, TraceCorruptionError
from app.services.recommendation.telemetry import RecordingTelemetryPublisher, TelemetryError
from app.services.recommendation.trace import TraceBuilder

@pytest.fixture
def mock_db():
    db = MagicMock(spec=Session)
    db.query.return_value.filter.return_value.order_by.return_value.first.return_value = None
    return db

@pytest.fixture
def test_submission():
    return QuestionnaireSubmission(
        id=uuid.uuid4(),
        user_id=uuid.uuid4(),
        version="1.0",
        answers={
            "current_concerns": ["breakouts", "dark_spots"],
            "skin_type": "oily",
            "sensitivity_tendency": "high",
            "routine_experience": "familiar",
            "climate": "hot_humid",
            "primary_goal": "address_concerns",
            "clinician_directed_treatment": False,
            "active_ingredient_categories": ["none"],
            "known_reaction_categories": ["benzoyl_peroxide"],
            "preference_avoid_categories": []
        }
    )

def test_successful_wiring(mock_db, test_submission, monkeypatch):
    mock_profile_service = MagicMock()
    mock_profile_service.get_latest_submission.return_value = test_submission
    monkeypatch.setattr("app.services.recommendation.service.ProfileService", lambda db: mock_profile_service)
    
    storage = EmbeddedTraceStorage()
    telemetry = RecordingTelemetryPublisher()
    service = RecommendationService(mock_db, trace_storage=storage, telemetry_publisher=telemetry)
    
    run = service.generate_recommendation(test_submission.user_id)
    
    assert run is not None
    
    # Actually, we need to inspect the traces in EmbeddedTraceStorage
    assert len(storage._traces) == 1
    assert any("recommendation_success_duration_ms" == m["name"] for m in telemetry.metrics)

def test_storage_failure(mock_db, test_submission, monkeypatch):
    mock_profile_service = MagicMock()
    mock_profile_service.get_latest_submission.return_value = test_submission
    monkeypatch.setattr("app.services.recommendation.service.ProfileService", lambda db: mock_profile_service)
    
    storage = EmbeddedTraceStorage()
    def fail_save(*args, **kwargs):
        raise TraceCorruptionError("Disk Full")
    storage.save = fail_save
    
    telemetry = RecordingTelemetryPublisher()
    service = RecommendationService(mock_db, trace_storage=storage, telemetry_publisher=telemetry)
    
    # Recommendation should still succeed!
    run = service.generate_recommendation(test_submission.user_id)
    assert run is not None
    
    # Telemetry should record the storage failure
    assert any("trace_storage_failure" == m["name"] for m in telemetry.metrics)

def test_telemetry_failure(mock_db, test_submission, monkeypatch):
    mock_profile_service = MagicMock()
    mock_profile_service.get_latest_submission.return_value = test_submission
    monkeypatch.setattr("app.services.recommendation.service.ProfileService", lambda db: mock_profile_service)
    
    storage = EmbeddedTraceStorage()
    telemetry = RecordingTelemetryPublisher()
    telemetry.set_failure_mode(True) # Force TelemetryError
    
    service = RecommendationService(mock_db, trace_storage=storage, telemetry_publisher=telemetry)
    
    # Recommendation should still succeed!
    run = service.generate_recommendation(test_submission.user_id)
    assert run is not None
    assert len(storage._traces) == 1

def test_trace_failure(mock_db, test_submission, monkeypatch):
    mock_profile_service = MagicMock()
    mock_profile_service.get_latest_submission.return_value = test_submission
    monkeypatch.setattr("app.services.recommendation.service.ProfileService", lambda db: mock_profile_service)
    
    storage = EmbeddedTraceStorage()
    telemetry = RecordingTelemetryPublisher()
    
    # Break TraceBuilder
    def crash_builder(*args, **kwargs):
        raise RuntimeError("Fake trace builder crash")
    monkeypatch.setattr(TraceBuilder, "finalize_success", crash_builder)
    
    service = RecommendationService(mock_db, trace_storage=storage, telemetry_publisher=telemetry)
    
    # Recommendation should still succeed!
    run = service.generate_recommendation(test_submission.user_id)
    assert run is not None
        
    assert any("trace_builder_failure" == m["name"] for m in telemetry.metrics)

def test_engine_failure(mock_db, test_submission, monkeypatch):
    mock_profile_service = MagicMock()
    mock_profile_service.get_latest_submission.return_value = test_submission
    monkeypatch.setattr("app.services.recommendation.service.ProfileService", lambda db: mock_profile_service)
    
    def crash_engine(*args, **kwargs):
        raise ValueError("Engine explosion")
    monkeypatch.setattr("app.services.recommendation.engine.RecommendationEngine.generate", crash_engine)
    
    storage = EmbeddedTraceStorage()
    telemetry = RecordingTelemetryPublisher()
    service = RecommendationService(mock_db, trace_storage=storage, telemetry_publisher=telemetry)
    
    with pytest.raises(HTTPException) as exc:
        service.generate_recommendation(test_submission.user_id)
        
    assert exc.value.status_code == 500
    assert any("recommendation_failure" == m["name"] for m in telemetry.metrics)
    assert len(storage._traces) == 1 # Error trace was persisted

def test_transaction_rollback(mock_db, test_submission, monkeypatch):
    mock_profile_service = MagicMock()
    mock_profile_service.get_latest_submission.return_value = test_submission
    monkeypatch.setattr("app.services.recommendation.service.ProfileService", lambda db: mock_profile_service)
    
    mock_db.commit.side_effect = SQLAlchemyError("DB lock")
    
    storage = EmbeddedTraceStorage()
    telemetry = RecordingTelemetryPublisher()
    service = RecommendationService(mock_db, trace_storage=storage, telemetry_publisher=telemetry)
    
    with pytest.raises(HTTPException) as exc:
        service.generate_recommendation(test_submission.user_id)
        
    assert exc.value.status_code == 500
    assert mock_db.rollback.called
    assert any("database_transaction_failed" == m["name"] for m in telemetry.metrics)

def test_no_behavior_drift_and_deterministic_output(mock_db, test_submission, monkeypatch):
    mock_profile_service = MagicMock()
    mock_profile_service.get_latest_submission.return_value = test_submission
    monkeypatch.setattr("app.services.recommendation.service.ProfileService", lambda db: mock_profile_service)
    
    service = RecommendationService(mock_db)
    
    run1 = service.generate_recommendation(test_submission.user_id)
    run2 = service.generate_recommendation(test_submission.user_id)
    
    # The executions must be identical in everything except possibly IDs
    assert run1.safety_adjustments == run2.safety_adjustments
    assert run1.engine_version == run2.engine_version

def test_concurrent_requests(mock_db, test_submission, monkeypatch):
    mock_profile_service = MagicMock()
    mock_profile_service.get_latest_submission.return_value = test_submission
    monkeypatch.setattr("app.services.recommendation.service.ProfileService", lambda db: mock_profile_service)
    
    storage = EmbeddedTraceStorage()
    telemetry = RecordingTelemetryPublisher()
    service = RecommendationService(mock_db, trace_storage=storage, telemetry_publisher=telemetry)
    
    def worker(i):
        return service.generate_recommendation(test_submission.user_id)
        
    with ThreadPoolExecutor(max_workers=10) as executor:
        results = list(executor.map(worker, range(50)))
        
    assert len(results) == 50
    assert len(storage._traces) == 50
    assert len(telemetry.metrics) == 50
