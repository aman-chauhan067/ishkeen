# Model Versioning Strategy

This document describes how the system maintains reproducibility in the face of continuous ML model evolution.

## The Problem
ML models are highly volatile. A model `v1.0` might detect acne accurately, while `v1.1` might introduce a regression or change its confidence calibration. If we do not isolate versions, historical recommendations will become unexplainable.

## The Strategy

1. **Explicit Version Tags**: Every ML model deployed to the inference pipeline must have an explicit version string (e.g., `acne_yolo_v1.0.2`).
2. **Analysis Immutability**: The inference pipeline writes its output to `SkinAnalysis.raw_ml_output` and saves `model_version`. This row is **never** updated.
3. **Engine State Capture**: When `RecommendationService.generate_recommendation` runs, it records:
   - `engine_version` (The core code logic)
   - `policy_version` (The safety rules)
   - `knowledge_version` (The curated JSON file)
   - `questionnaire_submission_id` (The exact user snapshot)
   - `skin_analysis_id` (The exact ML snapshot)
4. **Deprecation Strategy**: 
   - If an old model version is deprecated, its adapter in the Evidence Builder can be removed **IF AND ONLY IF** the business accepts that replaying those specific historical recommendations will fall back to V1 Questionnaire-Only mode. 
   - To maintain perfect historical replay, adapters for legacy schema versions must be preserved.

## Migration Scenarios
- **Minor Model Update (v1.1 -> v1.2)**: New threshold tuning. The Evidence Adapter is updated to handle `v1.2` alongside `v1.1`. Old runs replayed against `v1.1` analysis still output the original recommendation. New runs use `v1.2` analysis.
- **Major Model Swap (YOLO -> ResNet)**: Entirely new schema. A new Evidence Adapter is written. Both adapters coexist in the codebase, selecting based on the `model_version` in the `SkinAnalysis` row.
