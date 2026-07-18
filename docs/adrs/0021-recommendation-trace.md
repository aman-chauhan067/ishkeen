# ADR 0021: Recommendation Execution Trace

## Status
Accepted

## Context
The current recommendation engine records `safety_adjustments` (deferred and blocked candidates) and basic versioning. However, the exact timeline of evaluation—from evidence gathering, to candidate generation, through each rule filter, to the final assignment—is lost after execution. To achieve full observability and debuggability, we need a complete Execution Trace.

## Decision
We introduce the **Recommendation Trace Object**, a structured, serializable timeline that accompanies every recommendation generation. 

1. **Trace Payload**: The trace will include:
   - Request ID
   - Timestamp
   - Snapshot IDs (`questionnaire`, `analysis`)
   - Explicit Versions (`engine`, `policy`, `knowledge`, `model`)
   - An ordered array of `TraceEvents` capturing:
     - Evidence Merging (Conflicts resolved)
     - Candidate Generation (Initial list based on facts)
     - Policy Execution (Iterative filtering per rule)
     - Output Slotting (Priority assignments)
2. **Persistence Isolation**: To prevent database bloat, the full trace will NOT be stored relationally. It will be serialized and stored as an immutable JSONB document attached to the `RecommendationRun` (or shipped to an external telemetry system, pending Phase 7B implementation).
3. **Immutability**: Once the trace is generated for a specific run, it cannot be altered.

## Consequences
- **Positive**: We can exactly reconstruct why any product was recommended or rejected without reading the codebase.
- **Positive**: Bug reports can include the exact trace payload, instantly identifying if a failure was caused by bad evidence, a policy bug, or a knowledge base error.
- **Negative**: High data volume. Storing full traces requires efficient JSONB management or offloading to a logging sink.
