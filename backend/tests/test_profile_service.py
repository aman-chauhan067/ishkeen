import pytest
from unittest.mock import MagicMock
from uuid import uuid4
from datetime import datetime, timezone
from app.services.profile_service import ProfileService
from app.schemas.profile import SubmissionCreate, SkinProfileUpdate
from app.models.profile import SkinProfile, QuestionnaireSubmission

def get_valid_submission_payload():
    return SubmissionCreate(
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
        climate=None
    )

def test_first_submission_creates_snapshot_and_profile():
    db = MagicMock()
    db.query.return_value.filter.return_value.first.return_value = None # No existing profile
    
    service = ProfileService(db)
    user_id = uuid4()
    
    snapshot = service.submit_questionnaire(user_id, get_valid_submission_payload())
    
    assert db.add.call_count == 2 # Added snapshot, added new profile
    assert db.commit.call_count == 1
    assert db.refresh.call_count == 1
    assert snapshot.user_id == user_id
    assert snapshot.version == "1.0"

def test_later_submission_updates_current_profile():
    db = MagicMock()
    existing_profile = SkinProfile(user_id=uuid4())
    db.query.return_value.filter.return_value.first.return_value = existing_profile
    
    service = ProfileService(db)
    user_id = existing_profile.user_id
    
    payload = get_valid_submission_payload()
    from app.models.profile import SkinType
    payload.skin_type = SkinType.dry
    
    snapshot = service.submit_questionnaire(user_id, payload)
    
    assert db.add.call_count == 1 # Added snapshot, profile updated directly on existing object
    assert db.commit.call_count == 1
    assert existing_profile.skin_type == "dry"

def test_projection_failure_rolls_back_snapshot():
    db = MagicMock()
    db.commit.side_effect = Exception("DB Error")
    
    service = ProfileService(db)
    user_id = uuid4()
    
    with pytest.raises(Exception):
        service.submit_questionnaire(user_id, get_valid_submission_payload())
        
    assert db.rollback.call_count == 1

def test_update_profile_works():
    db = MagicMock()
    existing_profile = SkinProfile(user_id=uuid4(), skin_type="oily", current_concerns=["breakouts"], known_reaction_categories=[], known_reaction_other_note=None)
    db.query.return_value.filter.return_value.first.return_value = existing_profile
    
    service = ProfileService(db)
    
    update_data = SkinProfileUpdate(skin_type="dry") # Excludes unset
    updated = service.update_profile(existing_profile.user_id, update_data)
    
    assert updated.skin_type == "dry"
    assert updated.current_concerns == ["breakouts"]
    assert db.commit.call_count == 1

def test_update_profile_cross_field_validations():
    from fastapi import HTTPException
    
    db = MagicMock()
    existing_profile = SkinProfile(
        user_id=uuid4(), 
        skin_type="oily", 
        known_reaction_categories=["other_known"], 
        known_reaction_other_note="A note"
    )
    db.query.return_value.filter.return_value.first.return_value = existing_profile
    service = ProfileService(db)

    # 1. Unrelated field update should work fine, existing note is preserved
    update_data = SkinProfileUpdate(climate="hot_dry")
    updated = service.update_profile(existing_profile.user_id, update_data)
    assert updated.climate == "hot_dry"
    assert updated.known_reaction_other_note == "A note"
    
    # 2. Removing other_known explicitly clears the note
    update_data = SkinProfileUpdate(known_reaction_categories=["fragrance"])
    updated = service.update_profile(existing_profile.user_id, update_data)
    assert updated.known_reaction_categories == ["fragrance"]
    assert updated.known_reaction_other_note is None

    # Reset profile
    existing_profile.known_reaction_categories = ["other_known"]
    existing_profile.known_reaction_other_note = "A note"

    # 3. Setting note when other_known is removed should fail
    update_data = SkinProfileUpdate(known_reaction_categories=["fragrance"], known_reaction_other_note="This should fail")
    with pytest.raises(HTTPException) as exc:
        service.update_profile(existing_profile.user_id, update_data)
    assert "only allowed when 'other_known' is selected" in str(exc.value.detail)
    
    # 4. Removing note when other_known is present should fail
    update_data = SkinProfileUpdate(known_reaction_other_note=None)
    # We need to simulate explicit None (since Pydantic's exclude_unset will normally drop it if not set)
    # In Pydantic v2, if we pass it as None, it will be included in exclude_unset=True if explicitly provided
    update_data = SkinProfileUpdate.model_construct(known_reaction_other_note=None)
    update_data.__pydantic_fields_set__.add('known_reaction_other_note')
    
    with pytest.raises(HTTPException) as exc:
        service.update_profile(existing_profile.user_id, update_data)
    assert "is required when 'other_known' is selected" in str(exc.value.detail)

def test_latest_query_returns_latest():
    db = MagicMock()
    service = ProfileService(db)
    user_id = uuid4()
    
    service.get_latest_submission(user_id)
    
    # Verify the order_by is called correctly
    order_by_call = db.query.return_value.filter.return_value.order_by
    assert order_by_call.called
