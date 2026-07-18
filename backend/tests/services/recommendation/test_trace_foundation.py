import uuid
import time
import pytest
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor

from app.services.recommendation.schema import (
    TraceVersions, TraceIdentifiers, ProvenanceRefs, RecommendationTrace
)
from app.services.recommendation.trace import TraceBuilder

@pytest.fixture
def base_versions():
    return TraceVersions(engine="1.0.0", policy="1.0.0", knowledge="v1")

@pytest.fixture
def base_inputs():
    return ProvenanceRefs(questionnaire_id=uuid.uuid4(), skin_analysis_id=None)

def test_empty_trace(base_versions, base_inputs):
    req_id = uuid.uuid4()
    corr_id = uuid.uuid4()
    builder = TraceBuilder(req_id, corr_id, base_versions, base_inputs)
    builder.begin()
    trace = builder.finalize_success([], [])
    
    assert trace.identifiers.request_id == req_id
    assert trace.identifiers.correlation_id == corr_id
    assert trace.duration_ms >= 0
    assert len(trace.events) == 0
    assert isinstance(trace.execution_hash, str)

def test_1000_events(base_versions, base_inputs):
    builder = TraceBuilder(uuid.uuid4(), uuid.uuid4(), base_versions, base_inputs)
    builder.begin()
    
    for i in range(1000):
        builder.add_event(
            node_id=f"node_{i}",
            event_type="RULE_EVALUATED",
            severity="info",
            reason_code="PASSED",
            priority=1
        )
        
    trace = builder.finalize_success([], [])
    assert len(trace.events) == 1000
    assert trace.events[-1].execution_order == 1000

def test_hash_determinism(base_versions, base_inputs):
    req_id = uuid.uuid4()
    corr_id = uuid.uuid4()
    
    # Trace 1
    b1 = TraceBuilder(req_id, corr_id, base_versions, base_inputs)
    b1.add_event("node_1", "TYPE", "info", "R1", 1)
    
    # Artificial delay to ensure different timestamps
    time.sleep(0.01)
    
    # Trace 2
    b2 = TraceBuilder(req_id, corr_id, base_versions, base_inputs)
    b2.add_event("node_1", "TYPE", "info", "R1", 1)
    
    t1 = b1.finalize_success(["ev1"], ["out1"])
    t2 = b2.finalize_success(["ev1"], ["out1"])
    
    # Hashes must match exactly despite different timestamps and trace_ids
    assert t1.execution_hash == t2.execution_hash
    # Timestamps should be different
    assert t1.events[0].timestamp != t2.events[0].timestamp

def test_hash_different_ordering(base_versions, base_inputs):
    b1 = TraceBuilder(uuid.uuid4(), uuid.uuid4(), base_versions, base_inputs)
    b1.add_event("node_1", "TYPE", "info", "R1", 1)
    b1.add_event("node_2", "TYPE", "info", "R1", 1)
    
    b2 = TraceBuilder(uuid.uuid4(), uuid.uuid4(), base_versions, base_inputs)
    b2.add_event("node_2", "TYPE", "info", "R1", 1)
    b2.add_event("node_1", "TYPE", "info", "R1", 1)
    
    t1 = b1.finalize_success([], [])
    t2 = b2.finalize_success([], [])
    
    assert t1.execution_hash != t2.execution_hash

def test_hash_duplicate_events(base_versions, base_inputs):
    b1 = TraceBuilder(uuid.uuid4(), uuid.uuid4(), base_versions, base_inputs)
    b1.add_event("node_1", "TYPE", "info", "R1", 1)
    
    b2 = TraceBuilder(uuid.uuid4(), uuid.uuid4(), base_versions, base_inputs)
    b2.add_event("node_1", "TYPE", "info", "R1", 1)
    b2.add_event("node_1", "TYPE", "info", "R1", 1)
    
    t1 = b1.finalize_success([], [])
    t2 = b2.finalize_success([], [])
    
    assert t1.execution_hash != t2.execution_hash

def test_failure_finalization(base_versions, base_inputs):
    builder = TraceBuilder(uuid.uuid4(), uuid.uuid4(), base_versions, base_inputs)
    builder.begin()
    builder.add_event("node_1", "TYPE", "info", "R1", 1)
    
    trace = builder.finalize_failure(ValueError("Test error"))
    
    assert trace.execution_hash == "ERROR_STATE_REACHED"
    assert len(trace.events) == 2
    assert trace.events[-1].event_type == "EXECUTION_FAILED"
    assert trace.events[-1].severity == "critical"

def test_internal_builder_exception(base_versions, base_inputs, monkeypatch):
    builder = TraceBuilder(uuid.uuid4(), uuid.uuid4(), base_versions, base_inputs)
    
    # Mock to throw
    def throw_err(*args, **kwargs):
        raise RuntimeError("Oops")
    
    monkeypatch.setattr(uuid, "uuid4", throw_err)
    
    # Should not crash
    event = builder.add_event("node_1", "TYPE", "info", "R1", 1)
    assert event is None
    
    trace = builder.finalize_success([], [])
    assert trace.execution_hash == "ERROR_STATE_REACHED"

def test_thread_local_independence(base_versions, base_inputs):
    def worker(i):
        builder = TraceBuilder(uuid.uuid4(), uuid.uuid4(), base_versions, base_inputs)
        builder.add_event(f"node_{i}", "TYPE", "info", "R1", 1)
        return builder.finalize_success([], [])

    with ThreadPoolExecutor(max_workers=10) as executor:
        results = list(executor.map(worker, range(100)))
        
    assert len(results) == 100
    hashes = {r.execution_hash for r in results}
    assert len(hashes) == 100 # All should be unique due to different node_ids

def test_serialization_deserialization(base_versions, base_inputs):
    builder = TraceBuilder(uuid.uuid4(), uuid.uuid4(), base_versions, base_inputs)
    builder.add_event("node_1", "TYPE", "info", "R1", 1)
    trace = builder.finalize_success([], [])
    
    # Pydantic dump and load
    data = trace.model_dump(mode="json")
    assert isinstance(data, dict)
    
    trace_restored = RecommendationTrace.model_validate(data)
    assert trace_restored.execution_hash == trace.execution_hash
    assert trace_restored.identifiers.trace_id == trace.identifiers.trace_id
