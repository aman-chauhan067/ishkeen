import uuid
import pytest
from app.services.recommendation.engine import RecommendationEngine
from app.services.recommendation.knowledge import get_default_knowledge_base
from app.services.recommendation.trace import TraceBuilder
from app.services.recommendation.schema import TraceVersions, ProvenanceRefs
from app.models.profile import QuestionnaireSubmission

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

@pytest.fixture
def knowledge():
    return get_default_knowledge_base()

@pytest.fixture
def trace_builder():
    return TraceBuilder(
        request_id=uuid.uuid4(),
        correlation_id=uuid.uuid4(),
        versions=TraceVersions(engine="1.0.0", policy="1.0.0", knowledge="v1"),
        inputs=ProvenanceRefs(questionnaire_id=uuid.uuid4(), skin_analysis_id=None)
    )

def test_engine_emits_events_and_policy_emits_events(knowledge, test_submission, trace_builder):
    engine = RecommendationEngine(knowledge=knowledge)
    engine.generate(test_submission, trace_builder=trace_builder)
    
    events = trace_builder.events
    assert len(events) > 0
    
    # Engine events
    assert any(e.event_type == "EVIDENCE_INGESTED" for e in events)
    assert any(e.event_type == "CANDIDATE_GENERATED" for e in events)
    assert any(e.event_type == "SLOT_ASSIGNED" for e in events)
    assert any(e.event_type == "EXECUTION_COMPLETED" for e in events)
    
    # Policy events
    assert any(e.event_type == "RULE_EVALUATED" for e in events)
    assert any(e.event_type == "CANDIDATE_REJECTED" for e in events)

def test_trace_order_is_monotonic(knowledge, test_submission, trace_builder):
    engine = RecommendationEngine(knowledge=knowledge)
    engine.generate(test_submission, trace_builder=trace_builder)
    
    orders = [e.execution_order for e in trace_builder.events]
    assert orders == sorted(orders)
    assert len(set(orders)) == len(orders) # All unique

def test_recommendation_output_unchanged(knowledge, test_submission):
    engine = RecommendationEngine(knowledge=knowledge)
    
    # Run without trace builder
    res1 = engine.generate(test_submission)
    
    # Run with trace builder
    tb = TraceBuilder(uuid.uuid4(), uuid.uuid4(), TraceVersions(engine="1", policy="1", knowledge="1"), ProvenanceRefs(questionnaire_id=uuid.uuid4()))
    res2 = engine.generate(test_submission, trace_builder=tb)
    
    # Byte-for-byte identical (excluding trace builder, since it's not in the result itself here)
    assert res1.model_dump() == res2.model_dump()

def test_trace_disabled_runs_fine(knowledge, test_submission):
    engine = RecommendationEngine(knowledge=knowledge)
    res = engine.generate(test_submission, trace_builder=None)
    assert res.routine_slots[0].step == "cleanser"

def test_trace_survives_exceptions_in_builder(knowledge, test_submission, monkeypatch):
    engine = RecommendationEngine(knowledge=knowledge)
    tb = TraceBuilder(uuid.uuid4(), uuid.uuid4(), TraceVersions(engine="1", policy="1", knowledge="1"), ProvenanceRefs(questionnaire_id=uuid.uuid4()))
    
    def crash_add_event(*args, **kwargs):
        raise RuntimeError("Fake trace failure")
    
    monkeypatch.setattr(tb, "add_event", crash_add_event)
    
    # Engine should not crash
    res = engine.generate(test_submission, trace_builder=tb)
    assert res.routine_slots[0].step == "cleanser"
    # But TraceBuilder caught the error internally and set _has_error
    # Wait, my monkeypatch overrides add_event entirely, meaning the try/except inside add_event doesn't run!
    # Let's mock uuid.uuid4 instead to trigger the try/except inside add_event.
    pass

def test_trace_internal_failure(knowledge, test_submission, monkeypatch):
    engine = RecommendationEngine(knowledge=knowledge)
    tb = TraceBuilder(uuid.uuid4(), uuid.uuid4(), TraceVersions(engine="1", policy="1", knowledge="1"), ProvenanceRefs(questionnaire_id=uuid.uuid4()))
    
    def crash_uuid():
        raise RuntimeError("Fake UUID failure")
    
    monkeypatch.setattr("app.services.recommendation.trace.uuid.uuid4", crash_uuid)
    
    # Should not crash the recommendation
    res = engine.generate(test_submission, trace_builder=tb)
    assert res.routine_slots[0].step == "cleanser"
    assert tb._has_error == True

def test_100_recommendation_deterministic_comparison(knowledge, test_submission):
    engine = RecommendationEngine(knowledge=knowledge)
    first_res = engine.generate(test_submission).model_dump()
    
    for i in range(100):
        # Even with an active trace builder for every iteration
        tb = TraceBuilder(uuid.uuid4(), uuid.uuid4(), TraceVersions(engine="1", policy="1", knowledge="1"), ProvenanceRefs(questionnaire_id=uuid.uuid4()))
        res = engine.generate(test_submission, trace_builder=tb).model_dump()
        assert res == first_res

def test_mutation_proving_instrumentation_cannot_affect_output(knowledge, test_submission, monkeypatch):
    # What if TraceBuilder starts returning weird data?
    engine = RecommendationEngine(knowledge=knowledge)
    tb = TraceBuilder(uuid.uuid4(), uuid.uuid4(), TraceVersions(engine="1", policy="1", knowledge="1"), ProvenanceRefs(questionnaire_id=uuid.uuid4()))
    
    def malicious_add_event(*args, **kwargs):
        return "this is a string, not an event"
    
    monkeypatch.setattr(tb, "add_event", malicious_add_event)
    
    res1 = engine.generate(test_submission)
    res2 = engine.generate(test_submission, trace_builder=tb)
    assert res1.model_dump() == res2.model_dump()
