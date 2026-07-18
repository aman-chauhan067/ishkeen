"""
Tests for MLEvidenceAdapter, ConfidencePolicy, and the Evidence Graph boundary.

These tests verify:
1. The adapter correctly translates ML results into canonical evidence
2. Confidence thresholds produce correct decisions
3. Abstention works correctly in the uncertainty zone
4. The RecommendationEngine never receives raw ML payloads
5. Schema version validation works
6. Error/edge case handling
"""

import pytest
from app.services.recommendation.ml_evidence_adapter import (
    adapt, ConfidencePolicy, MLEvidenceResult
)


class TestConfidencePolicy:
    def test_default_thresholds(self):
        policy = ConfidencePolicy()
        assert policy.positive_threshold == 0.80
        assert policy.negative_threshold == 0.20

    def test_custom_thresholds(self):
        policy = ConfidencePolicy(positive_threshold=0.90, negative_threshold=0.10)
        assert policy.positive_threshold == 0.90
        assert policy.negative_threshold == 0.10


class TestMLEvidenceAdapter:
    """Tests for the adapt() pure function."""

    def test_no_data_returns_empty(self):
        result = adapt(None, ConfidencePolicy())
        assert result.decision == "no_data"
        assert result.additional_concerns == []
        assert result.confidence is None

    def test_error_status_returns_error(self):
        ml_results = {
            "acne_detected": False,
            "acne_confidence": 0.0,
            "status": "error: model crashed"
        }
        result = adapt(ml_results, ConfidencePolicy())
        assert result.decision == "error"
        assert result.additional_concerns == []

    def test_model_not_loaded_returns_error(self):
        ml_results = {
            "acne_detected": False,
            "acne_confidence": 0.0,
            "status": "model_not_loaded"
        }
        result = adapt(ml_results, ConfidencePolicy())
        assert result.decision == "error"
        assert result.additional_concerns == []

    def test_high_confidence_produces_positive(self):
        ml_results = {
            "acne_detected": True,
            "acne_confidence": 0.92,
            "status": "success"
        }
        result = adapt(ml_results, ConfidencePolicy())
        assert result.decision == "positive"
        assert result.additional_concerns == ["acne_breakouts"]
        assert result.confidence == 0.92

    def test_low_confidence_produces_negative(self):
        ml_results = {
            "acne_detected": False,
            "acne_confidence": 0.08,
            "status": "success"
        }
        result = adapt(ml_results, ConfidencePolicy())
        assert result.decision == "negative"
        assert result.additional_concerns == []
        assert result.confidence == 0.08

    def test_uncertain_confidence_produces_abstain(self):
        ml_results = {
            "acne_detected": True,
            "acne_confidence": 0.55,
            "status": "success"
        }
        result = adapt(ml_results, ConfidencePolicy())
        assert result.decision == "abstain"
        assert result.additional_concerns == []
        assert result.confidence == 0.55

    def test_boundary_exactly_positive_threshold(self):
        ml_results = {
            "acne_detected": True,
            "acne_confidence": 0.80,
            "status": "success"
        }
        result = adapt(ml_results, ConfidencePolicy())
        assert result.decision == "positive"
        assert result.additional_concerns == ["acne_breakouts"]

    def test_boundary_exactly_negative_threshold(self):
        ml_results = {
            "acne_detected": False,
            "acne_confidence": 0.20,
            "status": "success"
        }
        result = adapt(ml_results, ConfidencePolicy())
        assert result.decision == "negative"
        assert result.additional_concerns == []

    def test_boundary_just_above_negative(self):
        ml_results = {
            "acne_detected": False,
            "acne_confidence": 0.21,
            "status": "success"
        }
        result = adapt(ml_results, ConfidencePolicy())
        assert result.decision == "abstain"
        assert result.additional_concerns == []

    def test_boundary_just_below_positive(self):
        ml_results = {
            "acne_detected": True,
            "acne_confidence": 0.79,
            "status": "success"
        }
        result = adapt(ml_results, ConfidencePolicy())
        assert result.decision == "abstain"
        assert result.additional_concerns == []

    def test_custom_policy_tighter_thresholds(self):
        tight = ConfidencePolicy(positive_threshold=0.95, negative_threshold=0.05)
        ml_results = {
            "acne_detected": True,
            "acne_confidence": 0.90,
            "status": "success"
        }
        result = adapt(ml_results, tight)
        # 0.90 < 0.95 positive threshold → abstain
        assert result.decision == "abstain"
        assert result.additional_concerns == []

    def test_missing_confidence_returns_error(self):
        ml_results = {
            "acne_detected": True,
            "status": "success"
        }
        result = adapt(ml_results, ConfidencePolicy())
        assert result.decision == "error"
        assert result.additional_concerns == []

    def test_invalid_confidence_type_returns_error(self):
        ml_results = {
            "acne_detected": True,
            "acne_confidence": "not_a_number",
            "status": "success"
        }
        result = adapt(ml_results, ConfidencePolicy())
        assert result.decision == "error"
        assert result.additional_concerns == []

    def test_result_is_pydantic_model(self):
        result = adapt(None, ConfidencePolicy())
        assert isinstance(result, MLEvidenceResult)
        # Can serialize
        d = result.model_dump()
        assert "additional_concerns" in d
        assert "decision" in d


class TestAdapterEngineIntegration:
    """
    Verify that the canonical concerns produced by the adapter
    are correctly consumed by the engine without any raw ML leakage.
    """
    
    def test_engine_with_no_additional_concerns(self):
        """Engine works identically when adapter produces no concerns."""
        import uuid
        from app.services.recommendation.engine import RecommendationEngine
        from app.services.recommendation.knowledge import get_default_knowledge_base
        from app.models.profile import QuestionnaireSubmission
        
        kb = get_default_knowledge_base()
        engine = RecommendationEngine(kb)
        
        answers = {"current_concerns": ["breakouts"], "skin_type": "oily"}
        submission = QuestionnaireSubmission(id=uuid.uuid4(), answers=answers)
        
        # No additional concerns (adapter abstained or no analysis)
        result = engine.generate(submission, additional_concerns=[])
        
        steps = [s.step for s in result.routine_slots]
        assert "cleanser" in steps
        assert "moisturizer" in steps
        assert "sunscreen" in steps
        assert result.provenance_refs.skin_analysis_id is None

    def test_engine_with_additional_concerns_from_adapter(self):
        """Engine correctly processes canonical concerns from adapter."""
        import uuid
        from app.services.recommendation.engine import RecommendationEngine
        from app.services.recommendation.knowledge import get_default_knowledge_base
        from app.models.profile import QuestionnaireSubmission
        
        kb = get_default_knowledge_base()
        engine = RecommendationEngine(kb)
        
        # User didn't self-report acne, but ML detected it
        answers = {"current_concerns": ["dullness"], "skin_type": "normal"}
        submission = QuestionnaireSubmission(id=uuid.uuid4(), answers=answers)
        
        analysis_id = uuid.uuid4()
        result = engine.generate(
            submission,
            additional_concerns=["acne_breakouts"],
            provenance_analysis_id=analysis_id
        )
        
        # The acne concern should trigger acne-related candidates
        assert result.provenance_refs.skin_analysis_id == analysis_id
        
    def test_engine_deduplicates_concerns(self):
        """If user already reported acne and ML confirms it, no duplicate."""
        import uuid
        from app.services.recommendation.engine import RecommendationEngine
        from app.services.recommendation.knowledge import get_default_knowledge_base
        from app.models.profile import QuestionnaireSubmission
        
        kb = get_default_knowledge_base()
        engine = RecommendationEngine(kb)
        
        answers = {"current_concerns": ["acne_breakouts"], "skin_type": "oily"}
        submission = QuestionnaireSubmission(id=uuid.uuid4(), answers=answers)
        
        # Both user and ML say acne — should produce same result as user alone
        result_user_only = engine.generate(submission)
        result_both = engine.generate(submission, additional_concerns=["acne_breakouts"])
        
        # Determinism: same canonical input → same output
        assert result_user_only.routine_slots == result_both.routine_slots
        assert result_user_only.ingredient_guidance == result_both.ingredient_guidance
