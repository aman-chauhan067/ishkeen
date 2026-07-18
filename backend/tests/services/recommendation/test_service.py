import pytest
from unittest.mock import MagicMock
import uuid
from fastapi import HTTPException
from app.services.recommendation.service import RecommendationService
from app.models.profile import QuestionnaireSubmission
from app.models.user import User

def test_generate_recommendation_success():
    db = MagicMock()
    user_id = uuid.uuid4()
    submission = QuestionnaireSubmission(
        id=uuid.uuid4(),
        user_id=user_id,
        version="1.0",
        answers={"current_concerns": ["breakouts"]}
    )
    # Mock profile service
    service = RecommendationService(db)
    service.profile_service = MagicMock()
    service.profile_service.get_latest_submission.return_value = submission
    # Ensure SkinAnalysis query returns None to avoid ValidationError on mock ID
    db.query.return_value.filter.return_value.order_by.return_value.first.return_value = None
    
    run = service.generate_recommendation(user_id)
    
    assert run is not None
    assert run.user_id == user_id
    assert run.questionnaire_submission_id == submission.id
    assert run.status == "generated"
    assert db.add.call_count > 1 # 1 run + multiple items
    assert db.commit.call_count == 1

def test_generate_recommendation_no_questionnaire():
    db = MagicMock()
    user_id = uuid.uuid4()
    
    service = RecommendationService(db)
    service.profile_service = MagicMock()
    service.profile_service.get_latest_submission.return_value = None
    
    with pytest.raises(HTTPException) as exc:
        service.generate_recommendation(user_id)
        
    assert exc.value.status_code == 422
    assert "No questionnaire submission" in exc.value.detail

def test_get_latest_recommendation():
    db = MagicMock()
    user_id = uuid.uuid4()
    
    service = RecommendationService(db)
    service.get_latest_recommendation(user_id)
    
    # Check that it called filter and order_by
    order_by_call = db.query.return_value.filter.return_value.order_by
    assert order_by_call.called
