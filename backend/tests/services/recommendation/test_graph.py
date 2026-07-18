import uuid
import pytest
import random
from app.services.recommendation.graph import GraphBuilder
from app.services.recommendation.schema import RecommendationTrace, TraceEvent, TraceIdentifiers, TraceVersions, ProvenanceRefs

@pytest.fixture
def base_trace():
    return RecommendationTrace(
        identifiers=TraceIdentifiers(
            trace_id=uuid.uuid4(),
            request_id=uuid.uuid4(),
            correlation_id=uuid.uuid4()
        ),
        execution_hash="HASH",
        execution_timestamp="2026-07-11T00:00:00Z",
        duration_ms=10.0,
        versions=TraceVersions(engine="1", policy="1", knowledge="1"),
        inputs=ProvenanceRefs(questionnaire_id=uuid.uuid4()),
        events=[]
    )

def create_event(event_type: str, node_id: str, exec_order: int, reason_code: str = "TEST"):
    return TraceEvent(
        event_id=uuid.uuid4(),
        node_id=node_id,
        timestamp="2026-07-11T00:00:00Z",
        event_type=event_type,
        severity="info",
        reason_code=reason_code,
        priority=1,
        execution_order=exec_order
    )

def test_empty_trace(base_trace):
    gb = GraphBuilder()
    graph, errors = gb.build(base_trace)
    assert graph is not None
    assert len(errors) == 0
    assert len(graph.nodes) == 0
    assert len(graph.edges) == 0

def test_single_recommendation(base_trace):
    base_trace.events = [
        create_event("EVIDENCE_INGESTED", "engine", 1),
        create_event("CANDIDATE_GENERATED", "candidate:c1", 2),
        create_event("RULE_EVALUATED", "policy:p1", 3),
        create_event("SLOT_ASSIGNED", "slot:s1", 4)
    ]
    
    gb = GraphBuilder()
    graph, errors = gb.build(base_trace)
    assert not errors
    assert len(graph.nodes) == 4
    assert len(graph.edges) == 3

def test_multi_candidate(base_trace):
    base_trace.events = [
        create_event("EVIDENCE_INGESTED", "engine", 1),
        create_event("CANDIDATE_GENERATED", "candidate:c1", 2),
        create_event("CANDIDATE_GENERATED", "candidate:c2", 3)
    ]
    gb = GraphBuilder()
    graph, errors = gb.build(base_trace)
    assert not errors
    assert len(graph.nodes) == 3
    
def test_multiple_rule_evaluations_and_actions(base_trace):
    base_trace.events = [
        create_event("EVIDENCE_INGESTED", "engine", 1),
        create_event("RULE_EVALUATED", "policy:p1", 2),
        create_event("CANDIDATE_REJECTED", "candidate:c1", 3),
        create_event("RULE_EVALUATED", "policy:p2", 4),
        create_event("CANDIDATE_DEFERRED", "candidate:c2", 5)
    ]
    gb = GraphBuilder()
    graph, errors = gb.build(base_trace)
    assert not errors
    assert len(graph.nodes) == 7 # engine, p1, a1, c1, p2, a2, c2

def test_multiple_slot_assignments(base_trace):
    base_trace.events = [
        create_event("EVIDENCE_INGESTED", "engine", 1),
        create_event("SLOT_ASSIGNED", "slot:s1", 2),
        create_event("SLOT_ASSIGNED", "slot:s2", 3)
    ]
    gb = GraphBuilder()
    graph, errors = gb.build(base_trace)
    assert not errors
    assert len(graph.nodes) == 3

def test_duplicate_event_detection(base_trace):
    # If the exact same trace event is passed, our dict implementation overwrites seamlessly
    e = create_event("CANDIDATE_GENERATED", "candidate:c1", 2)
    base_trace.events = [
        create_event("EVIDENCE_INGESTED", "engine", 1),
        e, e
    ]
    gb = GraphBuilder()
    graph, errors = gb.build(base_trace)
    assert "Duplicate edge detected: engine->candidate:c1:triggers" in errors
    assert graph is None

def test_orphan_node_detection(base_trace):
    # A node not connected to 'engine' or anything else
    base_trace.events = [
        create_event("EVIDENCE_INGESTED", "engine", 1)
    ]
    gb = GraphBuilder()
    gb._add_node("orphan:1", "evidence", "test")
    gb._validate_graph()
    assert "Orphan node detected: orphan:1" in gb.errors

def test_cycle_detection():
    gb = GraphBuilder()
    gb._add_node("n1", "candidate", "n1")
    gb._add_node("n2", "candidate", "n2")
    gb._add_edge("n1", "n2", "triggers")
    gb._add_edge("n2", "n1", "triggers")
    gb._validate_graph()
    assert "Cycle detected in the graph" in gb.errors

def test_serialization_deserialization(base_trace):
    base_trace.events = [
        create_event("EVIDENCE_INGESTED", "engine", 1),
        create_event("CANDIDATE_GENERATED", "candidate:c1", 2)
    ]
    gb = GraphBuilder()
    graph, errors = gb.build(base_trace)
    assert not errors
    
    data = graph.model_dump(mode="json")
    from app.services.recommendation.schema import DecisionGraph
    restored = DecisionGraph.model_validate(data)
    
    assert restored.deterministic_node_order == graph.deterministic_node_order

def test_graph_equality(base_trace):
    base_trace.events = [
        create_event("EVIDENCE_INGESTED", "engine", 1),
        create_event("CANDIDATE_GENERATED", "candidate:c1", 2)
    ]
    gb = GraphBuilder()
    g1, _ = gb.build(base_trace)
    g2, _ = gb.build(base_trace)
    assert g1.model_dump() == g2.model_dump()

def test_randomized_event_ordering(base_trace):
    events = [
        create_event("EVIDENCE_INGESTED", "engine", 1),
        create_event("CANDIDATE_GENERATED", "candidate:c1", 2),
        create_event("RULE_EVALUATED", "policy:p1", 3),
        create_event("SLOT_ASSIGNED", "slot:s1", 4)
    ]
    
    gb = GraphBuilder()
    
    # Run 1
    base_trace.events = list(events)
    g1, _ = gb.build(base_trace)
    
    # Run 2 with shuffled order (graph builder sorts internally by execution_order anyway)
    shuffled = list(events)
    random.shuffle(shuffled)
    base_trace.events = shuffled
    g2, _ = gb.build(base_trace)
    
    assert g1.model_dump() == g2.model_dump()

def test_100_deterministic_rebuilds(base_trace):
    base_trace.events = [
        create_event("EVIDENCE_INGESTED", "engine", 1),
        create_event("CANDIDATE_GENERATED", "candidate:c1", 2),
        create_event("RULE_EVALUATED", "policy:p1", 3),
        create_event("SLOT_ASSIGNED", "slot:s1", 4)
    ]
    gb = GraphBuilder()
    first_graph, _ = gb.build(base_trace)
    first_dump = first_graph.model_dump()
    
    for _ in range(100):
        g, e = gb.build(base_trace)
        assert not e
        assert g.model_dump() == first_dump
