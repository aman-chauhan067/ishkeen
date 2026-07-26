import uuid
import pytest
from app.services.recommendation.engine import RecommendationEngine
from app.services.recommendation.knowledge import get_default_knowledge_base
import app.models.user # Ensure models are loaded for SQLAlchemy mapper
from app.models.profile import QuestionnaireSubmission

@pytest.fixture
def kb():
    return get_default_knowledge_base()

def test_engine_empty_actives_success(kb):
    # Test that a user under clinician care gets a valid recommendation but 0 actives.
    answers = {
        "current_concerns": ["breakouts"],
        "clinician_directed_treatment": True
    }
    submission = QuestionnaireSubmission(id=uuid.uuid4(), answers=answers)
    
    engine = RecommendationEngine(kb)
    result = engine.generate(submission, additional_concerns=["breakouts"])
    
    assert len(result.ingredient_guidance) == 0
    assert len(result.deferred_guidance) > 0
    
    # Assert routine still exists without a treatment slot
    categories = [slot.category for slot in result.morning_routine]
    assert any("cleanser" in c for c in categories)
    assert any("moisturizer" in c for c in categories)
    assert any("spf" in c for c in categories)
    assert not any("treatment" in c for c in categories)

def test_engine_deterministic_output(kb):
    answers = {
        "current_concerns": ["dullness", "breakouts"],
        "skin_type": "oily",
        "routine_experience": "advanced", # allows 3 actives
        "sensitivity_tendency": "low"
    }
    submission = QuestionnaireSubmission(id=uuid.uuid4(), answers=answers)
    engine = RecommendationEngine(kb)
    
    result1 = engine.generate(submission, additional_concerns=["dullness", "breakouts"])
    result2 = engine.generate(submission, additional_concerns=["dullness", "breakouts"])
    
    assert result1.model_dump() == result2.model_dump()
    
    # bha_salicylic_acid, benzoyl_peroxide, retinoid_type, azelaic_acid, aha_glycolic_lactic_acid, vitamin_c
    # Sort order of concerns: "breakouts", "dullness"
    # Breakouts: bha, benzoyl, retinoid, azelaic
    # Dullness: aha, vitamin_c
    # Because of advanced, they get max 3.
    # It should pick the first 3 deterministic candidates: bha, benzoyl, retinoid
    assert len(result1.ingredient_guidance) == 3
    cats = [g.category for g in result1.ingredient_guidance]
    assert cats == ["bha_salicylic_acid", "benzoyl_peroxide", "retinoid_type"]
    
    # Treatment slot should just have the first one (bha is in night routine)
    treatment = next(s for s in result1.night_routine if "treatment" in s.step_name.lower() or "treatment" in s.category.lower())
    assert treatment.category == "bha_salicylic_acid"

def test_no_hidden_model_provenance(kb):
    answers = {"current_concerns": ["breakouts"]}
    submission = QuestionnaireSubmission(id=uuid.uuid4(), answers=answers)
    engine = RecommendationEngine(kb)
    result = engine.generate(submission)
    
    assert result.provenance_refs.questionnaire_id == submission.id
    assert result.provenance_refs.skin_analysis_id is None
