# ADR 0020: Model Version Isolation and Replayability

## Status
Accepted

## Context
As ML models are updated, retrained, or replaced, their output contracts and confidence thresholds may change. If a past recommendation run relied on a specific ML model output, we must be able to completely explain and replay that recommendation months later, even if the model has been deprecated.

## Decision
1. **Strict Version Decoupling**: The Recommendation Engine must track versioning separately for the Engine itself (`engine_version`), the Rules (`policy_version`), the Curation (`knowledge_version`), and the ML Models (`model_version` array stored on the `SkinAnalysis` row).
2. **Analysis Immutability**: A `SkinAnalysis` database record is immutable once created. If a model is updated, we do not re-run inference on old images to overwrite the old `SkinAnalysis` row. Instead, if a re-analysis is triggered, a entirely new `SkinAnalysis` row is created with the new `model_version`.
3. **Evidence Graph Snapshotting**: The Evidence Graph builder captures the `SkinAnalysis` snapshot UUID. Replaying a recommendation involves loading the exact `QuestionnaireSubmission` UUID and the exact `SkinAnalysis` UUID.
4. **Unsupported Legacy Models**: If a legacy ML model output format is no longer supported by the Evidence Builder, the recommendation engine must either (a) maintain a translation adapter for the legacy schema, or (b) fall back to Questionnaire-Only V1 mode for replays, loudly logging the degradation.

## Consequences
- **Positive**: Prevents silent drift in historical recommendations.
- **Positive**: Allows confident A/B testing of new ML models because old recommendations are completely isolated from new model deployments.
- **Negative**: Database storage for `SkinAnalysis` will grow faster since records are never updated in place.
