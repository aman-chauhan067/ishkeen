# ML Evidence Adapter

> How ML predictions are translated into canonical concern strings for the Evidence Graph — without leaking raw model payloads into the recommendation engine.

---

## Problem: Phase 9A's Direct Mutation

Phase 9A introduced ML-based skin analysis but bypassed the Evidence Graph architecture entirely:

- `RecommendationEngine`'s evidence list was **directly mutated** with a hardcoded `"acne_breakouts"` string.
- The engine had to know about ML payloads, confidence scores, and threshold logic — responsibilities that do not belong to it.
- Adding a second ML concern would have required modifying the engine itself.

This coupling violated the separation between *evidence production* and *evidence consumption*.

---

## Solution: MLEvidenceAdapter

`MLEvidenceAdapter` is a stateless translation layer that sits between `SkinAnalysis` and `RecommendationEngine`:

```
SkinAnalysis.ml_results (JSONB)
    → MLEvidenceAdapter.adapt()
    → List[str] of canonical concern strings
    → RecommendationService merges into evidence list
    → RecommendationEngine consumes evidence (unchanged)
```

The engine never sees raw ML payloads. It receives the same `List[str]` evidence format it already understands.

---

## How It Works

### Input

The adapter reads from the `SkinAnalysis.ml_results` JSONB column, which contains the structured output of the inference pipeline:

```json
{
  "schema_version": "1.0",
  "predictions": {
    "acne_breakouts": { "probability": 0.92, "status": "POSITIVE" }
  }
}
```

### Validation

1. **Schema version check**: The payload's `schema_version` must match `ML_RESULTS_SCHEMA_VERSION`. Mismatched versions are rejected — the adapter returns an empty list rather than misinterpreting a changed format.

### Thresholding

2. **Confidence policy application**: Each prediction is evaluated against a `ConfidencePolicy`:
   - `prob >= positive_threshold` → include the canonical concern string (e.g., `"acne_breakouts"`)
   - `prob < positive_threshold` → exclude (either ABSTAIN or NEGATIVE — both result in omission)

### Output

3. **Canonical strings only**: The adapter produces a `List[str]` — e.g., `["acne_breakouts"]` — containing only concerns that passed the confidence threshold.
4. **Empty list on abstention**: When the model is uncertain or confidence is below `negative_threshold`, the adapter returns `[]`. This is a valid, expected output — not an error.

---

## Function Signature

```python
def adapt(ml_results: dict, policy: ConfidencePolicy) -> MLEvidenceResult
```

- **Stateless**: No instance variables, no side effects, no database access.
- **Pure function**: Same inputs always produce the same outputs.
- **Testable in isolation**: No dependency on FastAPI, SQLAlchemy, or any service layer.

---

## Integration Point

`RecommendationService` is the sole consumer of the adapter:

```python
# Inside RecommendationService
ml_concerns = MLEvidenceAdapter.adapt(analysis.ml_results, self.confidence_policy)
evidence = base_evidence + ml_concerns  # merged, not mutated
recommendations = self.engine.recommend(evidence)
```

`RecommendationEngine` is never modified. It continues to operate on a flat list of concern strings, unaware that some originated from ML predictions.

---

## Why This Matters

The adapter enforces a clean architectural boundary:

1. **Single Responsibility**: The adapter owns *translation and thresholding*. The engine owns *recommendation logic*. Neither reaches into the other's domain.
2. **Extensibility**: Adding a new ML concern (e.g., `"hyperpigmentation"`) requires zero changes to `RecommendationEngine` — only the model and adapter's concern mapping need updating.
3. **Testability**: The adapter is a pure function. Unit tests can cover every threshold edge case without spinning up a database or API server.
4. **Safety**: Schema version gating prevents silent breakage when the ML payload format evolves. A version mismatch produces an explicit empty result, not corrupted evidence.
