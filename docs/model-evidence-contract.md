# Model Evidence Contract

This document defines the exact contract by which future ML models (e.g., Object Detection for acne) will contribute facts to the Recommendation Engine. 

## 1. Single Model Contribution
An ML model does not output a recommendation. It outputs an analysis array stored in the `SkinAnalysis.raw_ml_output` JSONB column.
When ingested into the Evidence Graph, a parser adapter translates this raw output into a standard `EvidenceNode`.

### Abstract Schema
```json
{
  "node_id": "uuid",
  "source_type": "model",
  "source_ref": "skin_analysis_uuid",
  "fact_type": "concern_detected",
  "concern_category": "breakouts",
  "severity": "moderate",
  "confidence": 0.92,
  "model_version": "acne_yolo_v1.2",
  "timestamp": "2026-07-11T12:00:00Z"
}
```

## 2. Multiple Models
If multiple models run (e.g., one for acne, one for wrinkles), they each produce isolated Evidence Nodes. The Evidence Graph simply accumulates these nodes. If two models detect the *same* `concern_category`, both nodes are added to the graph, and the Merge Engine resolves the priority.

## 3. Abstention vs. "Nothing Detected"
- **Abstention**: The model fails to run, the image is blurry, or the confidence is below the minimum threshold (e.g., < 0.60).
  - *Contract*: The adapter yields **zero** Evidence Nodes. The Recommendation Engine falls back to User Evidence natively.
- **Nothing Detected**: The model successfully runs and confidently detects zero lesions.
  - *Contract*: The adapter yields a specific node: `{"fact_type": "concern_absence", "concern_category": "breakouts", "confidence": 0.95}`.

## 4. Stale Analysis
An analysis is considered **stale** if the `SkinAnalysis.created_at` is older than a configurable threshold (e.g., 7 days) relative to the time the recommendation is requested.
- *Contract*: The Evidence Graph Builder automatically filters out stale `SkinAnalysis` rows. Stale analyses contribute zero nodes.

## 5. Missing Analysis
If a user submits a questionnaire but bypasses the image upload, or the image pipeline fails completely.
- *Contract*: `skin_analysis_id` is null. Zero model nodes are contributed. The engine operates purely in V1 mode.
