import pytest
from pydantic import ValidationError
from app.schemas.profile import SubmissionCreate, SkinProfileUpdate

def valid_payload():
    return {
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

def test_valid_submission():
    payload = valid_payload()
    schema = SubmissionCreate(**payload)
    assert schema.skin_type == "oily"
    assert schema.current_concerns == ["breakouts"]

def test_zero_concerns_rejected():
    payload = valid_payload()
    payload["current_concerns"] = []
    with pytest.raises(ValidationError) as exc:
        SubmissionCreate(**payload)
    assert "List should have at least 1 item" in str(exc.value)

def test_more_than_3_concerns_rejected():
    payload = valid_payload()
    payload["current_concerns"] = ["breakouts", "redness", "sensitivity", "dullness"]
    with pytest.raises(ValidationError) as exc:
        SubmissionCreate(**payload)
    assert "List should have at most 3 items" in str(exc.value)

def test_duplicate_concerns_rejected():
    payload = valid_payload()
    payload["current_concerns"] = ["breakouts", "breakouts"]
    with pytest.raises(ValidationError) as exc:
        SubmissionCreate(**payload)
    assert "Duplicate values are not allowed" in str(exc.value)

def test_contradictory_none_in_routine():
    payload = valid_payload()
    payload["routine_product_categories"] = ["none", "cleanser"]
    with pytest.raises(ValidationError) as exc:
        SubmissionCreate(**payload)
    assert "'none' cannot be combined with other selections" in str(exc.value)

def test_contradictory_none_in_actives():
    payload = valid_payload()
    payload["active_ingredient_categories"] = ["none", "vitamin_c"]
    with pytest.raises(ValidationError) as exc:
        SubmissionCreate(**payload)
    assert "'none' cannot be combined with other selections" in str(exc.value)

def test_duplicate_routine_categories_rejected():
    payload = valid_payload()
    payload["routine_product_categories"] = ["cleanser", "cleanser"]
    with pytest.raises(ValidationError) as exc:
        SubmissionCreate(**payload)
    assert "Duplicate values are not allowed" in str(exc.value)

def test_invalid_enum_rejected():
    payload = valid_payload()
    payload["skin_type"] = "invalid_type"
    with pytest.raises(ValidationError):
        SubmissionCreate(**payload)

def test_invalid_vocabulary_rejected():
    payload = valid_payload()
    payload["current_concerns"] = ["not_a_concern"]
    with pytest.raises(ValidationError) as exc:
        SubmissionCreate(**payload)
    assert "Invalid value" in str(exc.value)

def test_extra_fields_rejected():
    payload = valid_payload()
    payload["extra_field"] = "hacker"
    with pytest.raises(ValidationError) as exc:
        SubmissionCreate(**payload)
    assert "Extra inputs are not permitted" in str(exc.value)

def test_reaction_note_without_other_known_rejected():
    payload = valid_payload()
    payload["known_reaction_categories"] = ["fragrance"]
    payload["known_reaction_other_note"] = "random note"
    with pytest.raises(ValidationError) as exc:
        SubmissionCreate(**payload)
    assert "is only allowed when 'other_known' is selected" in str(exc.value)

def test_reaction_note_required_when_other_known():
    payload = valid_payload()
    payload["known_reaction_categories"] = ["other_known"]
    payload["known_reaction_other_note"] = None
    with pytest.raises(ValidationError) as exc:
        SubmissionCreate(**payload)
    assert "is required when 'other_known' is selected" in str(exc.value)
    
def test_reaction_note_whitespace_trimmed():
    payload = valid_payload()
    payload["known_reaction_categories"] = ["other_known"]
    payload["known_reaction_other_note"] = "  some note  "
    schema = SubmissionCreate(**payload)
    assert schema.known_reaction_other_note == "some note"

def test_oversized_note_rejected():
    payload = valid_payload()
    payload["known_reaction_categories"] = ["other_known"]
    payload["known_reaction_other_note"] = "a" * 201
    with pytest.raises(ValidationError) as exc:
        SubmissionCreate(**payload)
    assert "String should have at most 200 characters" in str(exc.value)

def test_patch_updates_only_supplied_fields():
    update = SkinProfileUpdate(skin_type="dry")
    dump = update.model_dump(exclude_unset=True)
    assert dump == {"skin_type": "dry"}

def test_patch_explicit_climate_clearing():
    update = SkinProfileUpdate(climate=None)
    dump = update.model_dump(exclude_unset=True)
    assert dump == {"climate": None}

def test_patch_required_fields_cannot_be_null():
    with pytest.raises(ValidationError):
        SkinProfileUpdate(skin_type=None)
