import pytest
from app.services.recommendation.context import RecommendationContext
from app.services.recommendation.policy import PolicyEngine
from app.services.recommendation.knowledge import get_default_knowledge_base

@pytest.fixture
def kb():
    return get_default_knowledge_base()

def get_candidates(kb, ctx):
    raw_candidates = []
    for concern in sorted(ctx.current_concerns):
        for c in kb.get_candidates_for_concern(concern):
            if c not in raw_candidates:
                raw_candidates.append(c)
    engine = PolicyEngine(ctx, kb)
    candidates, deferred = engine.apply_policies(raw_candidates)
    return candidates, deferred

def test_scenario_1_clinician_care(kb):
    ctx = RecommendationContext(
        current_concerns=["breakouts"],
        clinician_directed_treatment=True
    )
    candidates, deferred = get_candidates(kb, ctx)
    assert len(candidates) == 0
    assert len(deferred) > 0
    assert deferred[0].reason_code == "CONSERVATIVE_CLINICIAN_CARE"

def test_scenario_2_sensitive_acne(kb):
    ctx = RecommendationContext(
        current_concerns=["breakouts"],
        sensitivity_tendency="high",
        routine_experience="beginner"
    )
    candidates, deferred = get_candidates(kb, ctx)
    # breakouts normally -> bha, benzoyl, retinoid, azelaic
    # benzoyl & retinoid are high irritation -> dropped
    # beginner caps to 1 active -> bha (since it's first)
    assert len(candidates) == 1
    assert candidates[0] == "bha_salicylic_acid"
    
    # What if they avoid BHA?
    ctx.preference_avoid_categories = ["bha_salicylic_acid"]
    candidates, deferred = get_candidates(kb, ctx)
    assert len(candidates) == 1
    assert candidates[0] == "azelaic_acid"

def test_scenario_3_simpler_routine_override(kb):
    ctx = RecommendationContext(
        current_concerns=["breakouts", "post_acne_marks"],
        routine_experience="advanced", # allows 3
        primary_goal="simpler_routine" # overrides to 1
    )
    candidates, deferred = get_candidates(kb, ctx)
    assert len(candidates) == 1
