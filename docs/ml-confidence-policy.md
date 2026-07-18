# ML Confidence Policy

> Why Ishkeen uses a three-zone confidence model instead of a simple `prob > 0.5` cutoff — and how abstention is a feature, not a failure.

---

## Problem: Phase 9A's Fixed Threshold

Phase 9A applied a single hard threshold:

```python
if probability > 0.5:
    concerns.append("acne_breakouts")
```

This created two problems:

1. **No abstention zone**: A prediction at `prob = 0.51` was treated identically to `prob = 0.99`. The model had no way to say "I'm not sure."
2. **No configurability**: The threshold was hardcoded. Tuning it for a different concern, dataset, or risk tolerance required a code change.

In a skincare domain, a false positive can trigger incorrect ingredient recommendations — an outcome that should be actively guarded against.

---

## Solution: ConfidencePolicy with Three Zones

`ConfidencePolicy` partitions the `[0, 1]` probability space into three decision zones:

```
0.0                     0.20                      0.80                     1.0
 ├──── NEGATIVE ─────────┤──── ABSTAIN ─────────────┤──── POSITIVE ──────────┤
 │  No detection          │  Uncertain — do not act  │  Confident detection   │
```

| Zone | Condition | Action |
|---|---|---|
| **POSITIVE** | `prob >= 0.80` | Emit canonical concern string |
| **ABSTAIN** | `0.20 < prob < 0.80` | Return nothing — model is uncertain |
| **NEGATIVE** | `prob <= 0.20` | Return nothing — no detection |

---

## Default Thresholds

| Parameter | Default | Rationale |
|---|---|---|
| `positive_threshold` | `0.80` | High bar before acting on a detection in a health-adjacent domain |
| `negative_threshold` | `0.20` | Symmetric lower bound; anything below is confidently negative |

### Why 0.80 / 0.20?

- **Domain risk**: Skincare recommendations based on false positives can suggest inappropriate ingredients (e.g., salicylic acid for non-acne skin). A high positive threshold minimizes this risk.
- **Abstention width**: The 60-percentage-point abstention zone is deliberately wide. In early deployment with limited training data, the model should abstain often — this is correct behavior.
- **Symmetric design**: The 0.20 lower bound mirrors the 0.80 upper bound around 0.50, making the policy intuitive to reason about.

---

## Configurability

Thresholds are configurable via environment variables or application settings:

```
ML_POSITIVE_THRESHOLD=0.80
ML_NEGATIVE_THRESHOLD=0.20
```

This allows operators to:

- **Tighten** the positive threshold (e.g., `0.90`) for higher-stakes concerns.
- **Loosen** it (e.g., `0.70`) when the model has been validated on a large, representative dataset.
- **Adjust per-concern** if the policy is extended to support concern-specific thresholds in the future.

---

## Abstention Is Not Failure

A common misconception is that abstention means the model "didn't work." In Ishkeen's architecture, abstention is a **first-class decision**:

- The adapter returns an empty concern list → the recommendation engine proceeds with non-ML evidence only.
- The user still receives recommendations — just not ML-augmented ones.
- No error is logged, no fallback is triggered. The system operates normally.

This is the correct behavior when model confidence is low. Doing nothing is better than doing the wrong thing.

---

## Integration

`ConfidencePolicy` is consumed exclusively by `MLEvidenceAdapter`:

```python
class MLEvidenceAdapter:
    @staticmethod
    def adapt(ml_results: dict, policy: ConfidencePolicy) -> MLEvidenceResult:
        # policy.positive_threshold used here
        # policy.negative_threshold used here
```

`RecommendationEngine` never sees `ConfidencePolicy`. It receives pre-filtered concern strings and has no knowledge of thresholds, probabilities, or abstention logic.

---

## Why This Matters

1. **Patient safety analogy**: In medical decision support, the standard practice is to require high confidence before acting. Ishkeen applies the same principle to skincare — a lower-stakes but analogous domain.
2. **Graceful degradation**: When the model is uncertain, the system falls back to quiz-based evidence rather than injecting unreliable ML signals.
3. **Operational control**: Thresholds can be tuned without retraining the model or modifying application code — a clean separation between model capability and deployment policy.
4. **Auditability**: Each prediction carries an explicit status (`POSITIVE`, `NEGATIVE`, `ABSTAIN`) in the stored `ml_results`, making post-hoc analysis straightforward.
