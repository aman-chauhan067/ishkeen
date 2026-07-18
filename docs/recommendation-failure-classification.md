# Recommendation Failure Classification & Mutations

This document catalogs adversarial attacks against the Observability Architecture to ensure robustness.

## 1. Simulated Architecture Attacks

| Attack Vector | Simulated Action | Architecture Defense | Resolution |
| :--- | :--- | :--- | :--- |
| **Remove Policy Trace** | Delete the trace append in `PolicyEngine`. | Replay mismatch fails. Debug output is blank. | Defense passes. ADR 0021 mandates the trace object is explicitly checked during replay audits. |
| **Randomize Execution** | Use `set()` instead of `list()` for candidate generation. | Determinism broken. Trace graph path changes unpredictably. | Defense passes. ADR 0023 Replay Strategy will instantly flag a mismatch between historical trace and new trace, preventing deployment. |
| **Remove Versions** | Nullify `knowledge_version` in DB. | Historical replay cannot run safely. | Defense passes. DB schema mandates version strings. ADR 0023 requires explicit version checks. |
| **Duplicate Rules** | Add `SensitivityFilter` twice in the policy chain. | Trace graph shows identical nodes chained. | Defense passes. Telemetry counters for `rule_triggered` will double for that rule, triggering an anomaly alert. |
| **Infinite Loops** | A deferred candidate is re-injected endlessly. | Latency spike. Server crash. | Defense passes. Production Telemetry (ADR 0024) catches latency spikes > 500ms and triggers critical alert. Trace object caps at maximum iterations safely. |

## 2. Failure Category Ontology
When a failure occurs, the trace and telemetry classify it into one of these buckets:
1. **Evidence Failure**: ML model returned bad JSON, or snapshot missing. (Caught by Builder).
2. **Knowledge Failure**: Unmapped concern or missing category definition. (Caught by Candidate Generator).
3. **Constraint Failure**: All candidates were safely dropped by the Policy Engine (e.g., highly sensitive skin with reactions to everything). Result is 0 actives. This is a *Safe Failure*.
4. **Execution Failure**: Unhandled exception in Python code (e.g., memory, syntax). (Caught by global error handler).
