from abc import ABC, abstractmethod
from typing import Dict, List, Any
from threading import Lock

class TelemetryError(Exception):
    pass

class TelemetryPublisher(ABC):
    @abstractmethod
    def publish_metric(self, name: str, value: float, tags: Dict[str, str]) -> None:
        pass

class NoOpTelemetryPublisher(TelemetryPublisher):
    def publish_metric(self, name: str, value: float, tags: Dict[str, str]) -> None:
        pass

class RecordingTelemetryPublisher(TelemetryPublisher):
    """
    In-memory telemetry publisher for testing.
    Thread-safe.
    """
    def __init__(self):
        self._lock = Lock()
        self.metrics: List[Dict[str, Any]] = []
        self._simulate_failure = False

    def publish_metric(self, name: str, value: float, tags: Dict[str, str]) -> None:
        with self._lock:
            if self._simulate_failure:
                raise TelemetryError("Simulated telemetry failure")
            
            self.metrics.append({
                "name": name,
                "value": value,
                "tags": tags
            })

    def clear(self):
        with self._lock:
            self.metrics.clear()
            
    def set_failure_mode(self, fail: bool):
        with self._lock:
            self._simulate_failure = fail
