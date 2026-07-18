# Future Recommendation Pipeline Integration

This document outlines how the existing Recommendation Engine (Phase 6B) will sit inside the larger future pipeline (Phase 6E+).

## Pipeline Architecture

```text
[Questionnaire DB]       [Skin Analysis DB]
        │                        │
        ▼                        ▼
[Questionnaire Adapter]  [Model Adapter(s)]
        │                        │
        └──► [Evidence Graph] ◄──┘
                    │
                    ▼
              [Merge Engine]
                    │
                    ▼
        [Resolved Context (V1 format)]
                    │
                    ▼
          [Candidate Generator]
                    │
                    ▼
            [Policy Engine]  ◄──── [Knowledge Base V1]
                    │
                    ▼
        [Routine Slot Assignment]
                    │
                    ▼
        [Recommendation Service] (Atomically persists Run & Items)
```

## Clear Ownership
1. **Adapters**: Responsible solely for mapping raw DB JSON into `EvidenceNode` structures. They know about specific model versions.
2. **Evidence Graph & Merge Engine**: Responsible for resolving conflicts based on the Merge Policy. Knows nothing about model versions or UI, only about `EvidenceNode` confidence and source type.
3. **Candidate Generator & Policy Engine**: The **EXACT SAME** components built in Phase 6B. They receive a cleanly resolved `RecommendationContext`. They know nothing about ML models or where the data came from.
4. **Recommendation Service**: Responsible for DB persistence. It will be updated to save the `skin_analysis_id` alongside the `questionnaire_id` to establish the dual-provenance boundary.

## Why this works
By injecting the Merge Engine *before* the V1 Pipeline, we completely preserve the determinism, testing, and safety policies of the recommendation core. The core engine is mathematically insulated from ML uncertainty.
