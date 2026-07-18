import uuid
from abc import ABC, abstractmethod
from typing import Dict
from threading import Lock
from app.services.recommendation.schema import RecommendationTrace

class TraceStorageError(Exception):
    pass

class TraceNotFoundError(TraceStorageError):
    pass

class TraceDuplicateError(TraceStorageError):
    pass

class TraceCorruptionError(TraceStorageError):
    pass

class TraceStorage(ABC):
    @abstractmethod
    def save(self, trace: RecommendationTrace) -> None:
        pass

    @abstractmethod
    def load(self, trace_id: uuid.UUID) -> RecommendationTrace:
        pass

    @abstractmethod
    def exists(self, trace_id: uuid.UUID) -> bool:
        pass

    @abstractmethod
    def delete(self, trace_id: uuid.UUID) -> bool:
        pass


class DisabledTraceStorage(TraceStorage):
    def save(self, trace: RecommendationTrace) -> None:
        pass

    def load(self, trace_id: uuid.UUID) -> RecommendationTrace:
        raise TraceNotFoundError(f"Trace {trace_id} not found in DisabledTraceStorage")

    def exists(self, trace_id: uuid.UUID) -> bool:
        return False

    def delete(self, trace_id: uuid.UUID) -> bool:
        return False


class EmbeddedTraceStorage(TraceStorage):
    """
    In-memory trace storage for development and testing.
    Thread-safe.
    """
    def __init__(self):
        self._lock = Lock()
        self._traces: Dict[uuid.UUID, str] = {} # Store as JSON to simulate serialization/deserialization

    def save(self, trace: RecommendationTrace) -> None:
        trace_id = trace.identifiers.trace_id
        
        try:
            serialized = trace.model_dump_json()
        except Exception as e:
            raise TraceCorruptionError(f"Failed to serialize trace {trace_id}: {str(e)}")
            
        with self._lock:
            if trace_id in self._traces:
                raise TraceDuplicateError(f"Trace {trace_id} already exists")
            self._traces[trace_id] = serialized

    def load(self, trace_id: uuid.UUID) -> RecommendationTrace:
        with self._lock:
            if trace_id not in self._traces:
                raise TraceNotFoundError(f"Trace {trace_id} not found")
            serialized = self._traces[trace_id]
            
        try:
            # Simulate parsing
            return RecommendationTrace.model_validate_json(serialized)
        except Exception as e:
            raise TraceCorruptionError(f"Failed to deserialize trace {trace_id}: {str(e)}")

    def exists(self, trace_id: uuid.UUID) -> bool:
        with self._lock:
            return trace_id in self._traces

    def delete(self, trace_id: uuid.UUID) -> bool:
        with self._lock:
            if trace_id in self._traces:
                del self._traces[trace_id]
                return True
            return False

    # Simulate a partial write or corruption for testing
    def _corrupt_payload(self, trace_id: uuid.UUID):
        with self._lock:
            if trace_id in self._traces:
                self._traces[trace_id] = self._traces[trace_id][:-10] # Break JSON format
