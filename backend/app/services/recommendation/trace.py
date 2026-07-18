import uuid
from datetime import datetime, timezone
import hashlib
import json
import time
from typing import List, Optional

from app.services.recommendation.schema import (
    RecommendationTrace, TraceEvent, TraceIdentifiers, 
    TraceVersions, ProvenanceRefs
)

class TraceBuilder:
    def __init__(self, request_id: uuid.UUID, correlation_id: uuid.UUID, versions: TraceVersions, inputs: ProvenanceRefs):
        self.trace_id = uuid.uuid4()
        self.request_id = request_id
        self.correlation_id = correlation_id
        self.versions = versions
        self.inputs = inputs
        self.events: List[TraceEvent] = []
        self._execution_order = 0
        self._start_time = 0.0
        self._is_finalized = False
        self._has_error = False

    def begin(self):
        self._start_time = time.time()

    def add_event(self, node_id: str, event_type: str, severity: str, reason_code: str, 
                  priority: int, parent_event_id: Optional[uuid.UUID] = None, 
                  parent_node_id: Optional[str] = None) -> Optional[TraceEvent]:
        # Never crash recommendation generation.
        try:
            if self._is_finalized:
                # Cannot add to finalized trace
                return None
                
            self._execution_order += 1
            event = TraceEvent(
                event_id=uuid.uuid4(),
                parent_event_id=parent_event_id,
                node_id=node_id,
                parent_node_id=parent_node_id,
                timestamp=datetime.now(timezone.utc).isoformat(),
                event_type=event_type,
                severity=severity,
                reason_code=reason_code,
                priority=priority,
                execution_order=self._execution_order
            )
            self.events.append(event)
            return event
        except Exception:
            self._has_error = True
            return None

    def compute_execution_hash(self, ordered_evidence: List[str], ordered_outputs: List[str]) -> str:
        # Excludes timestamps to ensure deterministic replay hashing
        hash_input = {
            "engine": self.versions.engine,
            "policy": self.versions.policy,
            "knowledge": self.versions.knowledge,
            "evidence": ordered_evidence,
            "events": [
                {
                    "event_type": e.event_type,
                    "node_id": e.node_id,
                    "reason_code": e.reason_code,
                    "priority": e.priority,
                    "execution_order": e.execution_order
                } for e in self.events
            ],
            "outputs": ordered_outputs
        }
        serialized = json.dumps(hash_input, sort_keys=True)
        return hashlib.sha256(serialized.encode('utf-8')).hexdigest()

    def finalize_success(self, ordered_evidence: List[str], ordered_outputs: List[str]) -> RecommendationTrace:
        try:
            self._is_finalized = True
            duration_ms = (time.time() - self._start_time) * 1000 if self._start_time else 0.0
            
            if self._has_error:
                exec_hash = "ERROR_STATE_REACHED"
            else:
                exec_hash = self.compute_execution_hash(ordered_evidence, ordered_outputs)
            
            return RecommendationTrace(
                identifiers=TraceIdentifiers(
                    trace_id=self.trace_id,
                    request_id=self.request_id,
                    correlation_id=self.correlation_id
                ),
                execution_hash=exec_hash,
                execution_timestamp=datetime.now(timezone.utc).isoformat(),
                duration_ms=duration_ms,
                versions=self.versions,
                inputs=self.inputs,
                events=self.events
            )
        except Exception:
            self._has_error = True
            return self._build_fallback_trace()

    def finalize_failure(self, error: Exception) -> RecommendationTrace:
        try:
            self._has_error = True
            self._is_finalized = True
            
            self._execution_order += 1
            self.events.append(TraceEvent(
                event_id=uuid.uuid4(),
                node_id="system",
                timestamp=datetime.now(timezone.utc).isoformat(),
                event_type="EXECUTION_FAILED",
                severity="critical",
                reason_code="UNHANDLED_EXCEPTION",
                priority=0,
                execution_order=self._execution_order
            ))
            return self._build_fallback_trace()
        except Exception:
            # Absolute fallback
            return self._build_fallback_trace()

    def _build_fallback_trace(self) -> RecommendationTrace:
        duration_ms = (time.time() - self._start_time) * 1000 if self._start_time else 0.0
        return RecommendationTrace(
            identifiers=TraceIdentifiers(
                trace_id=self.trace_id,
                request_id=self.request_id,
                correlation_id=self.correlation_id
            ),
            execution_hash="ERROR_STATE_REACHED",
            execution_timestamp=datetime.now(timezone.utc).isoformat(),
            duration_ms=duration_ms,
            versions=self.versions,
            inputs=self.inputs,
            events=self.events
        )
