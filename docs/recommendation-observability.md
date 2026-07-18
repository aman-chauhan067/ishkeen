# Recommendation Observability Architecture

This document defines how the Recommendation Engine exposes its internal state to production telemetry systems.

## 1. Observability Boundary
The core Recommendation module (the `PolicyEngine`, `MergeEngine`, and `RecommendationEngine`) does not contain Datadog, Prometheus, or OpenTelemetry SDKs. It only generates primitive Python objects (`TraceEvent`, `DecisionGraph`). 

The `RecommendationService` is the boundary. After the core engine returns, the Service parses the `RecommendationTrace` and emits metrics to the global application metrics publisher.

## 2. Emitted Events
The Service layer will extract and emit the following structural events:

### Counters
- `recommendation.runs_total` (tags: `status=success|failure`, `mode=v1|v2`)
- `recommendation.candidates_generated` (tags: `category`)
- `recommendation.rule_triggered` (tags: `rule_name`, `reason_code`, `category`)
- `recommendation.evidence_conflict` (tags: `concern`, `winner`)
- `recommendation.slot_assigned` (tags: `slot`, `category`)

### Distributions / Gauges
- `recommendation.execution_latency_ms`
- `recommendation.active_count` (e.g., how many users are getting 3 actives vs 1 active)

## 3. Telemetry Uses
By tracking `recommendation.rule_triggered{rule_name="SensitivityFilter"}`, product teams can build dashboards showing exactly how often users are being downgraded to gentler ingredients. If the frequency of `EXCLUDED_KNOWN_REACTION` spikes after a knowledge base update, the team is instantly alerted to a potential misconfiguration.
