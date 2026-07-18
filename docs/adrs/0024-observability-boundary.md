# ADR 0024: Observability Boundary and Production Telemetry

## Status
Accepted

## Context
As the recommendation engine scales, we need to know how it is behaving in production without manually reading database rows or relying on users to report bad recommendations. We need structured telemetry to track safety constraint firing rates, rule drops, and model abstentions. However, we cannot couple the core deterministic engine to specific monitoring libraries (e.g., Datadog, Prometheus) as that breaks testability and modularity.

## Decision
We enforce a strict **Observability Boundary**.

1. **Telemetry Emitter Contract**: The Recommendation Engine and Policy Engine will yield standard `TelemetryEvent` objects (or simple counters inside the `RecommendationTrace`). They will **never** make network calls to monitoring services directly.
2. **Service Layer Responsibility**: The `RecommendationService` acts as the Observability Boundary. Upon receiving the `RecommendationResult` and `RecommendationTrace` from the engine, the Service layer translates the trace events into system metrics.
3. **Core Metrics Defined**: The architecture dictates the emission of specific metric categories:
   - Counters for every Rule triggered (e.g., `policy_dropped_candidate{reason="complexity_cap"}`).
   - Conflict frequency between Model and User evidence.
   - Abstention frequency of the ML model.
   - Overall latency of the engine execution.
   - Distribution of recommended active categories.

## Consequences
- **Positive**: The core engine remains a pure Python module, easily unit-testable without mocking HTTP network calls to Datadog.
- **Positive**: Telemetry logic is centralized in the service layer, making it easy to swap monitoring providers.
- **Negative**: Adds mapping boilerplate in the `RecommendationService` to translate trace data into metric payloads.
