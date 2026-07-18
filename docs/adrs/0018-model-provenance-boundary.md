# ADR 0018: Model Provenance Boundary for Recommendations

## Status
Accepted

## Context
When ML models are integrated into the pipeline, we must ensure that a recommendation can be deterministically reproduced in the future. ML models are non-deterministic over time (models are retrained, thresholds change).

## Decision
1. **Immutable Snapshots Only**: The Recommendation Engine will never call an ML Inference API directly. It will only read from a persisted `SkinAnalysis` database row that contains the exact JSON outputs of the model.
2. **Explicit Provenance References**: The `RecommendationRun` currently tracks `questionnaire_submission_id`. It will be expanded to also track `skin_analysis_id` (already designed in Phase 6B as an optional column).
3. **Model Version Capture**: The `SkinAnalysis` record must contain the exact `model_version` (e.g., `yolo_v1.2_acne04`). If an analysis lacks a version, it is considered invalid for recommendation evidence.
4. **No Hidden Overwrites**: If a user submits a new image but the ML pipeline fails or is delayed, the engine must either use the stale analysis (if within the staleness window) or fallback to Questionnaire-Only mode. It must explicitly record which mode was used in the `status` or `provenance_refs` of the `RecommendationRun`.

## Consequences
- **Positive**: Complete replayability. We can always reconstruct exactly why a recommendation was made by loading the exact `SkinAnalysis` row.
- **Positive**: If the ML pipeline is down, the recommendation engine can safely fall back to Questionnaire-Only mode without breaking.
- **Negative**: Requires strict versioning of ML models and rigorous adherence to the `SkinAnalysis` schema contract.
