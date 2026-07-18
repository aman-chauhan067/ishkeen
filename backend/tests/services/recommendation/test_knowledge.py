import pytest
from pydantic import ValidationError
from app.services.recommendation.knowledge import KnowledgeBase, get_default_knowledge_base

def test_load_default_knowledge_base():
    kb = get_default_knowledge_base()
    assert kb.version.startswith("v")
    
    # Check that it loaded concerns correctly
    breakout_candidates = kb.get_candidates_for_concern("breakouts")
    assert "bha_salicylic_acid" in breakout_candidates
    assert "benzoyl_peroxide" in breakout_candidates
    
    # Check metadata
    bha_meta = kb.get_metadata("bha_salicylic_acid")
    assert bha_meta is not None
    assert bha_meta.photosensitizing is False
    assert bha_meta.irritation_potential == "moderate"

def test_duplicate_concerns_rejected():
    data = {
        "version": "v1",
        "mappings": [
            {"concern": "acne", "candidate_categories": ["bha"]},
            {"concern": "acne", "candidate_categories": ["aha"]}
        ],
        "category_metadata": {
            "bha": {"photosensitizing": False, "irritation_potential": "low", "conflicts": []},
            "aha": {"photosensitizing": True, "irritation_potential": "low", "conflicts": []}
        }
    }
    with pytest.raises(ValueError, match="Duplicate concerns found"):
        KnowledgeBase(data)

def test_unknown_fields_rejected():
    data = {
        "version": "v1",
        "mappings": [],
        "category_metadata": {},
        "unknown_field": "test"
    }
    with pytest.raises(ValidationError):
        KnowledgeBase(data)

def test_missing_metadata_schema_validation():
    data = {
        "version": "v1",
        "mappings": [{"concern": "acne", "candidate_categories": ["bha"]}],
        "category_metadata": {
            "bha": {"irritation_potential": "low", "conflicts": []} # Missing photosensitizing
        }
    }
    with pytest.raises(ValidationError):
        KnowledgeBase(data)
