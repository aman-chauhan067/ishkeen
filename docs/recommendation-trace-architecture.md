# Recommendation Trace Architecture

This document defines the schema and lifecycle of a `RecommendationTrace`. 

## 1. Trace Lifecycle
Every time `RecommendationEngine.generate()` is called, a `RecommendationTrace` object is instantiated. As the engine progresses through the pipeline, it appends `TraceEvent` objects to the trace. When execution completes, the trace is finalized, rendered immutable, and passed back alongside the `RecommendationResult`.

## 2. Trace Schema Contract
The trace must contain, at minimum, the following structure:

```json
{
  "request_id": "uuid",
  "run_id": "uuid",
  "execution_timestamp": "2026-07-11T12:05:00Z",
  "versions": {
    "engine": "1.0.0",
    "policy": "1.0.0",
    "knowledge": "v2026.07.11",
    "model": "acne_yolo_v1.2"
  },
  "inputs": {
    "questionnaire_snapshot_id": "uuid",
    "analysis_snapshot_id": "uuid"
  },
  "timelines": {
    "evidence": [...],
    "candidate_generation": [...],
    "policy_execution": [...],
    "final_assignment": [...]
  }
}
```

## 3. Timeline Definitions
- **Evidence Timeline**: Logs how raw DB rows were translated into `EvidenceNodes`, and exactly how the Merge Engine resolved conflicts.
- **Candidate Timeline**: Logs which initial active candidates were fetched from the Knowledge Base based on the resolved evidence concerns.
- **Policy Timeline**: Logs every candidate evaluated by every rule. If a candidate is dropped, deferred, or downgraded, an explicit event is logged with the `rule_name` and `reason_code`.
- **Final Assignment**: Logs the exact slots chosen, tracking why Candidate A was chosen over Candidate B (e.g., Priority sorting).

## 4. Preservation Rule
No operational database row or ML output should be required to understand why a specific recommendation was made. The combination of the Trace and the static Knowledge Base file completely explains the output.
