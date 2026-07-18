from typing import List, Optional
from uuid import UUID
from app.services.recommendation.context import RecommendationContext
from app.services.recommendation.knowledge import KnowledgeBase
from app.services.recommendation.policy import PolicyEngine
from app.services.recommendation.schema import (
    RecommendationResult, IngredientGuidance, 
    DeferredGuidance, SafetyDecision, ProvenanceRefs,
    RoutineStep, TimelinePhase
)
from app.services.recommendation.trace import TraceBuilder
from app.models.profile import QuestionnaireSubmission

ENGINE_VERSION = "1.0.0"

class RecommendationEngine:
    """
    Pure recommendation engine. Consumes ONLY canonical inputs:
    - QuestionnaireSubmission (questionnaire answers)
    - additional_concerns (List[str]) — pre-validated canonical concern strings
    
    This engine NEVER reads raw ML payloads, SkinAnalysis objects, or
    probabilistic outputs. All ML-to-evidence translation happens in
    MLEvidenceAdapter before reaching this engine.
    """
    def __init__(self, knowledge: KnowledgeBase, policy_version: str = "1.0.0"):
        self.knowledge = knowledge
        self.policy_version = policy_version

    def _trace(self, tb: Optional[TraceBuilder], action: str, *args, **kwargs):
        if tb:
            try:
                if action == "begin":
                    tb.begin()
                elif action == "add_event":
                    tb.add_event(*args, **kwargs)
            except Exception:
                pass

    def generate(
        self,
        submission: QuestionnaireSubmission,
        additional_concerns: Optional[List[str]] = None,
        consultation_payload: Optional[dict] = None,
        provenance_analysis_id: Optional[UUID] = None,
        trace_builder: Optional[TraceBuilder] = None
    ) -> RecommendationResult:
        """
        Generate a recommendation from canonical inputs only.
        
        Parameters:
            submission: The questionnaire snapshot.
            additional_concerns: Pre-validated canonical concern strings
                                 produced by MLEvidenceAdapter. May be empty or None.
            provenance_analysis_id: The UUID of the SkinAnalysis that produced
                                    the additional_concerns, for provenance tracking.
            trace_builder: Optional trace for debugging.
        """
        self._trace(trace_builder, "begin")
        self._trace(trace_builder, "add_event", "engine", "EVIDENCE_INGESTED", "info", "STARTED", 1)

        # 1. Normalize Context
        answers = submission.answers if isinstance(submission.answers, dict) else {}
        ctx = RecommendationContext(**answers)
        
        ordered_evidence = sorted(ctx.current_concerns)
        
        # 2. Merge pre-validated canonical concerns from ML adapter
        if additional_concerns:
            for concern in additional_concerns:
                if concern not in ordered_evidence:
                    ordered_evidence.append(concern)
                    self._trace(trace_builder, "add_event", "ml_adapter", "EVIDENCE_AUGMENTED", "info", f"CANONICAL_CONCERN:{concern}", 1)
            ordered_evidence = sorted(ordered_evidence)
        
        # 3. Generate Initial Candidates (deterministic sort)
        raw_candidates = []
        for concern in ordered_evidence:
            for c in self.knowledge.get_candidates_for_concern(concern):
                if c not in raw_candidates:
                    raw_candidates.append(c)
                    self._trace(trace_builder, "add_event", f"candidate:{c}", "CANDIDATE_GENERATED", "info", f"FOR_CONCERN:{concern}", 1)
                    
        # 4. Apply Policies
        policy = PolicyEngine(ctx, self.knowledge, trace_builder=trace_builder)
        candidates, deferred = policy.apply_policies(raw_candidates)
        
        # 5. Build Advanced Routine
        routine_data = self._build_advanced_routine(ctx, candidates, consultation_payload, trace_builder)
        
        # 6. Format Guidance
        ingredient_guidance = [IngredientGuidance(category=c) for c in candidates]
        explanation_codes = list(policy.explanation_codes)
        
        # 7. Provenance
        provenance = ProvenanceRefs(
            questionnaire_id=submission.id,
            skin_analysis_id=provenance_analysis_id
        )
        
        result = RecommendationResult(
            morning_routine=routine_data["morning"],
            night_routine=routine_data["night"],
            weekly_schedule=routine_data["weekly_schedule"],
            introduction_schedule=routine_data["introduction_schedule"],
            patch_test_instructions=routine_data["patch_test_instructions"],
            timeline=routine_data["timeline"],
            ingredient_guidance=ingredient_guidance,
            deferred_guidance=deferred,
            safety_adjustments=policy.decisions,
            explanation_codes=explanation_codes,
            provenance_refs=provenance,
            engine_version=ENGINE_VERSION,
            policy_version=self.policy_version,
            knowledge_version=self.knowledge.version
        )
        
        self._trace(trace_builder, "add_event", "engine", "EXECUTION_COMPLETED", "info", "SUCCESS", 1)
        return result

    def _build_advanced_routine(self, ctx: RecommendationContext, candidates: List[str], consultation: Optional[dict], tb: Optional[TraceBuilder]) -> dict:
        from .products import get_product
        consultation = consultation or {}
        budget = consultation.get("budget", "mid_range")
        routine_pref = consultation.get("routinePreference", "balanced")
        skin_sensitivity = consultation.get("skinSensitivity", "normal")
        
        morning = []
        night = []
        
        def _add_step(routine_list, step_name, category, product_type, ingredient, why, instructions, frequency, warnings=None):
            product = get_product(category, budget)
            rec_product_str = f"{product.brand} {product.name}" if product else "Generic Option"
            routine_list.append(RoutineStep(
                step_name=step_name, category=category, product_type=product_type,
                ingredient=ingredient, why=why, instructions=instructions,
                frequency=frequency, warnings=warnings, recommended_product=rec_product_str
            ))
        
        # Cleanser logic
        cleanser_cat = "gentle_cleanser"
        if ctx.skin_type in ["dry", "unsure"]:
            cleanser_cat = "hydrating_cleanser"
        elif ctx.skin_type == "oily":
            cleanser_cat = "foaming_cleanser"
            
        _add_step(morning, "Step 1: Cleanse", cleanser_cat, "Cleanser", "N/A", "To remove overnight sebum and prep the skin.", "Massage gently onto damp skin for 60 seconds.", "Every morning")
        _add_step(night, "Step 1: Double Cleanse", "cleansing_balm", "Cleansing Balm/Oil", "N/A", "To break down SPF and makeup.", "Massage onto dry skin, then emulsify with water.", "Every night")
        _add_step(night, "Step 2: Water Cleanse", cleanser_cat, "Cleanser", "N/A", "To deeply clean the pores.", "Use immediately after the cleansing balm.", "Every night")

        # Distribute treatments (candidates)
        for c in candidates:
            if c == "vitamin_c":
                _add_step(morning, "Step 2: Antioxidant", c, "Serum", "Ascorbic Acid", "Protects against free radicals and brightens tone.", "Apply 3-4 drops to dry skin.", "Every morning", "Keep away from light and air.")
            elif c in ["bha_salicylic_acid", "retinoid_type", "aha_glycolic_lactic_acid"]:
                _add_step(night, "Step 3: Treatment", c, "Serum / Cream", c.replace("_", " ").title(), "Targets primary concerns effectively.", "Apply a pea-sized amount to dry skin.", "2-3 nights a week to start", "Increases sun sensitivity. Must wear SPF.")
            else:
                _add_step(morning, "Step 3: Treatment", c, "Serum", c.replace("_", " ").title(), "Soothes and targets specific concerns.", "Apply to damp skin.", "Daily")

        # Moisturizer
        moist_cat = "barrier_moisturizer"
        if ctx.climate == "hot_humid" or ctx.skin_type == "oily":
            moist_cat = "gel_moisturizer"
            
        _add_step(morning, "Step 4: Moisturize", moist_cat, "Moisturizer", "Ceramides/Hyaluronic Acid", "Seals in hydration.", "Apply an even layer.", "Every morning")
        _add_step(night, "Step 4: Nourish", "rich_night_cream" if ctx.skin_type == "dry" else moist_cat, "Moisturizer", "Ceramides", "Supports barrier repair overnight.", "Apply generously as the final step.", "Every night")

        # Sunscreen
        _add_step(morning, "Step 5: Protect", "broad_spectrum_spf", "Sunscreen", "Zinc Oxide or Chemical Filters", "Crucial defense against UV damage and post-acne marks.", "Apply 2 finger lengths 15 minutes before exposure.", "Every morning, reapply every 2 hours if outdoors", "Required when using actives.")

        return {
            "morning": morning,
            "night": night,
            "weekly_schedule": "Alternate actives on different nights. Do not use BHA and Retinoids on the same night.",
            "introduction_schedule": "Introduce one new product at a time, waiting 3-4 days before introducing the next.",
            "patch_test_instructions": "Apply a small amount behind the ear for 24 hours before full face application.",
            "timeline": [
                TimelinePhase(phase="Week 2", expected_results="Possible mild purging or flaking if using retinoids/BHA. Skin feels more hydrated.", adjustments="Reduce active frequency if irritation occurs."),
                TimelinePhase(phase="Week 4", expected_results="Purging subsides. Noticeable improvement in texture and hydration.", adjustments=None),
                TimelinePhase(phase="Week 8", expected_results="Significant reduction in breakouts and fading of newer marks.", adjustments="Can increase active frequency if tolerated."),
                TimelinePhase(phase="Week 12", expected_results="Optimal results achieved. Skin tone is more even and barrier is healthy.", adjustments=None)
            ]
        }
