from app.services.recommendation.context import RecommendationContext
from app.services.recommendation.policy import PolicyEngine
from app.services.recommendation.knowledge import get_default_knowledge_base

def test_hard_exclusions():
    kb = get_default_knowledge_base()
    ctx = RecommendationContext(
        known_reaction_categories=["bha_salicylic_acid"],
        preference_avoid_categories=["retinoid_type"]
    )
    engine = PolicyEngine(ctx, kb)
    candidates, deferred = engine.apply_policies(["bha_salicylic_acid", "retinoid_type", "azelaic_acid"])
    
    assert "azelaic_acid" in candidates
    assert "bha_salicylic_acid" not in candidates
    assert "retinoid_type" not in candidates
    
    deferred_cats = [d.category for d in deferred]
    assert "bha_salicylic_acid" in deferred_cats
    assert "retinoid_type" in deferred_cats

def test_clinician_care():
    kb = get_default_knowledge_base()
    ctx = RecommendationContext(
        clinician_directed_treatment=True
    )
    engine = PolicyEngine(ctx, kb)
    candidates, deferred = engine.apply_policies(["azelaic_acid"])
    
    assert len(candidates) == 0
    assert len(deferred) == 1
    assert deferred[0].reason_code == "CONSERVATIVE_CLINICIAN_CARE"

def test_complexity_cap_beginner():
    kb = get_default_knowledge_base()
    ctx = RecommendationContext(
        routine_experience="beginner",
        active_ingredient_categories=["none"]
    )
    engine = PolicyEngine(ctx, kb)
    candidates, deferred = engine.apply_policies(["bha_salicylic_acid", "azelaic_acid"])
    
    # Beginner allows 1 max active
    assert len(candidates) == 1
    assert candidates[0] == "bha_salicylic_acid"
    
    assert len(deferred) == 1
    assert deferred[0].category == "azelaic_acid"
    assert deferred[0].reason_code == "COMPLEXITY_LIMIT_ENFORCED"

def test_complexity_cap_simpler_routine_overrides_familiar():
    kb = get_default_knowledge_base()
    ctx = RecommendationContext(
        routine_experience="familiar",
        primary_goal="simpler_routine",
        active_ingredient_categories=["none"]
    )
    engine = PolicyEngine(ctx, kb)
    candidates, deferred = engine.apply_policies(["bha_salicylic_acid", "azelaic_acid"])
    
    # Simpler routine overrides familiar (2) down to 1
    assert len(candidates) == 1
    assert candidates[0] == "bha_salicylic_acid"

def test_sensitivity_downgrade():
    kb = get_default_knowledge_base()
    ctx = RecommendationContext(
        sensitivity_tendency="high",
        routine_experience="familiar" # allow 2 candidates so complexity doesn't drop one
    )
    engine = PolicyEngine(ctx, kb)
    # benzoyl_peroxide is high irritation, azelaic_acid is low
    candidates, deferred = engine.apply_policies(["benzoyl_peroxide", "azelaic_acid"])
    
    assert "azelaic_acid" in candidates
    assert "benzoyl_peroxide" not in candidates
    
    deferred_cats = [d.category for d in deferred]
    assert "benzoyl_peroxide" in deferred_cats
    
def test_unsure_sensitivity_downgrades_high_irritation():
    kb = get_default_knowledge_base()
    ctx = RecommendationContext(
        sensitivity_tendency="unsure"
    )
    engine = PolicyEngine(ctx, kb)
    candidates, deferred = engine.apply_policies(["benzoyl_peroxide", "azelaic_acid"])
    
    assert "benzoyl_peroxide" not in candidates
    
def test_existing_actives_pass_complexity():
    kb = get_default_knowledge_base()
    ctx = RecommendationContext(
        routine_experience="beginner", # normally max 1
        active_ingredient_categories=["benzoyl_peroxide", "bha_salicylic_acid"],
        sensitivity_tendency="low" # prevent benzoyl_peroxide from dropping due to unsure sensitivity
    )
    engine = PolicyEngine(ctx, kb)
    candidates, deferred = engine.apply_policies(["benzoyl_peroxide", "bha_salicylic_acid", "azelaic_acid"])
    
    # Existing ones are retained, new one (azelaic) is blocked due to 0 slots left (max 1 - 2 = 0)
    assert "benzoyl_peroxide" in candidates
    assert "bha_salicylic_acid" in candidates
    assert "azelaic_acid" not in candidates
    
    deferred_cats = [d.category for d in deferred]
    assert "azelaic_acid" in deferred_cats

def test_adversarial_profile():
    kb = get_default_knowledge_base()
    ctx = RecommendationContext(
        current_concerns=["breakouts", "fine_lines", "dullness"],
        known_reaction_categories=["bha_salicylic_acid"],
        preference_avoid_categories=["retinoid_type"],
        routine_experience="advanced", # Allows 3 actives
        sensitivity_tendency="high"
    )
    engine = PolicyEngine(ctx, kb)
    
    # breakout candidates: bha, benzoyl, retinoid, azelaic
    # fine_lines candidates: retinoid, vitamin_c
    # dullness candidates: aha, vitamin_c
    # combined unique: bha, benzoyl, retinoid, azelaic, vitamin_c, aha
    raw_candidates = [
        "bha_salicylic_acid", "benzoyl_peroxide", "retinoid_type", 
        "azelaic_acid", "vitamin_c", "aha_glycolic_lactic_acid"
    ]
    
    candidates, deferred = engine.apply_policies(raw_candidates)
    
    assert "bha_salicylic_acid" not in candidates # Hard reaction
    assert "retinoid_type" not in candidates # Hard preference avoid
    assert "benzoyl_peroxide" not in candidates # High irritation dropped by sensitivity
    # remaining: azelaic_acid (low irritant), vitamin_c (moderate), aha (moderate)
    # wait, aha_glycolic_lactic_acid is moderate. sensitivity drops HIGH, keeps MODERATE.
    assert "azelaic_acid" in candidates
    assert "vitamin_c" in candidates
    assert "aha_glycolic_lactic_acid" in candidates
    
    # We requested 3 actives max, so it should keep the first 3 that pass.
    # The list after dropping the first 3 is: azelaic, vitamin_c, aha. Which is exactly 3.
    assert len(candidates) == 3
