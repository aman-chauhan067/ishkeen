import uuid
import pytest
from concurrent.futures import ThreadPoolExecutor

from app.services.recommendation.schema import RecommendationTrace, TraceIdentifiers, TraceVersions, ProvenanceRefs
from app.services.recommendation.storage import (
    EmbeddedTraceStorage, DisabledTraceStorage, TraceNotFoundError, 
    TraceDuplicateError, TraceCorruptionError
)
from app.services.recommendation.telemetry import (
    RecordingTelemetryPublisher, NoOpTelemetryPublisher, TelemetryError
)

@pytest.fixture
def sample_trace():
    return RecommendationTrace(
        identifiers=TraceIdentifiers(
            trace_id=uuid.uuid4(),
            request_id=uuid.uuid4(),
            correlation_id=uuid.uuid4()
        ),
        execution_hash="ABCDEF123456",
        execution_timestamp="2026-07-11T00:00:00Z",
        duration_ms=42.0,
        versions=TraceVersions(engine="1.0", policy="1.0", knowledge="v1"),
        inputs=ProvenanceRefs(questionnaire_id=uuid.uuid4()),
        events=[]
    )

def test_storage_save_load_exists_delete(sample_trace):
    storage = EmbeddedTraceStorage()
    
    assert not storage.exists(sample_trace.identifiers.trace_id)
    
    storage.save(sample_trace)
    assert storage.exists(sample_trace.identifiers.trace_id)
    
    loaded = storage.load(sample_trace.identifiers.trace_id)
    assert loaded.execution_hash == sample_trace.execution_hash
    
    assert storage.delete(sample_trace.identifiers.trace_id)
    assert not storage.exists(sample_trace.identifiers.trace_id)

def test_disabled_storage(sample_trace):
    storage = DisabledTraceStorage()
    
    # Save is a no-op
    storage.save(sample_trace)
    assert not storage.exists(sample_trace.identifiers.trace_id)
    
    with pytest.raises(TraceNotFoundError):
        storage.load(sample_trace.identifiers.trace_id)

def test_duplicate_ids_protection(sample_trace):
    storage = EmbeddedTraceStorage()
    storage.save(sample_trace)
    
    with pytest.raises(TraceDuplicateError):
        storage.save(sample_trace)

def test_serialization_failure():
    storage = EmbeddedTraceStorage()
    
    class BadTrace:
        def __init__(self):
            self.identifiers = TraceIdentifiers(trace_id=uuid.uuid4(), request_id=uuid.uuid4(), correlation_id=uuid.uuid4())
        def model_dump_json(self):
            raise ValueError("Bad dump")
            
    bad_trace = BadTrace()
    
    with pytest.raises(TraceCorruptionError):
        storage.save(bad_trace)

def test_corrupted_payload(sample_trace):
    storage = EmbeddedTraceStorage()
    storage.save(sample_trace)
    
    # Intentionally corrupt the JSON payload internally
    storage._corrupt_payload(sample_trace.identifiers.trace_id)
    
    with pytest.raises(TraceCorruptionError):
        storage.load(sample_trace.identifiers.trace_id)

def test_telemetry_emission():
    telemetry = RecordingTelemetryPublisher()
    
    telemetry.publish_metric("engine_duration_ms", 42.5, {"status": "success"})
    
    assert len(telemetry.metrics) == 1
    assert telemetry.metrics[0]["name"] == "engine_duration_ms"
    assert telemetry.metrics[0]["value"] == 42.5
    assert telemetry.metrics[0]["tags"] == {"status": "success"}

def test_telemetry_failure():
    telemetry = RecordingTelemetryPublisher()
    telemetry.set_failure_mode(True)
    
    with pytest.raises(TelemetryError):
        telemetry.publish_metric("engine_duration_ms", 42.5, {})

def test_noop_telemetry():
    telemetry = NoOpTelemetryPublisher()
    telemetry.publish_metric("test", 1.0, {}) # Should not raise or do anything

def test_concurrent_storage():
    storage = EmbeddedTraceStorage()
    
    def worker(i):
        t = RecommendationTrace(
            identifiers=TraceIdentifiers(
                trace_id=uuid.uuid4(),
                request_id=uuid.uuid4(),
                correlation_id=uuid.uuid4()
            ),
            execution_hash=str(i),
            execution_timestamp="2026-07-11T00:00:00Z",
            duration_ms=10.0,
            versions=TraceVersions(engine="1", policy="1", knowledge="1"),
            inputs=ProvenanceRefs(questionnaire_id=uuid.uuid4()),
            events=[]
        )
        storage.save(t)
        return storage.load(t.identifiers.trace_id)

    with ThreadPoolExecutor(max_workers=10) as executor:
        results = list(executor.map(worker, range(100)))
        
    assert len(results) == 100
    # ensure no traces were lost or overwritten improperly
    hashes = {r.execution_hash for r in results}
    assert len(hashes) == 100

def test_concurrent_telemetry():
    telemetry = RecordingTelemetryPublisher()
    
    def worker(i):
        telemetry.publish_metric("metric", float(i), {"worker": str(i)})

    with ThreadPoolExecutor(max_workers=10) as executor:
        list(executor.map(worker, range(100)))
        
    assert len(telemetry.metrics) == 100
