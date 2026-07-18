# Evidence Graph Architecture

## Purpose
To decouple the Recommendation Engine from direct database schemas and future ML model structures, we introduce the **Evidence Graph**. The graph acts as the single source of truth for the recommendation pipeline.

## Graph Structure
The graph is not a literal graph database, but an in-memory directed collection of **Evidence Nodes** that resolve into a **Resolved Context**.

### Node Types
1. **User Node**: Extracted from `QuestionnaireSubmission.answers`.
   - `fact_type`: e.g., `user_concern`
   - `value`: e.g., `breakouts`
   - `source_ref`: `submission_uuid`
2. **Model Node**: Extracted from `SkinAnalysis.raw_ml_output`.
   - `fact_type`: e.g., `model_detection`
   - `value`: e.g., `breakouts`
   - `confidence`: `0.95`
   - `source_ref`: `analysis_uuid`
3. **Policy Node**: (Optional for future) Inferences drawn by global clinical constraints.

### The Build Process
1. **Fetch**: The engine retrieves the `QuestionnaireSubmission` and (if present and valid) the `SkinAnalysis`.
2. **Extract**: Adapters convert these DB rows into discrete Evidence Nodes.
3. **Merge**: The `MergeEngine` evaluates nodes targeting the same logical entity (e.g., both targeting `concern_category="breakouts"`).
4. **Resolve**: The graph outputs a `ResolvedEvidenceContext` (which maps perfectly to the existing `RecommendationContext` used in V1), plus a `ConflictReport` (for frontend UI confirmation flags).

## Future Proofing
When we swap `yolo_v1` for `yolo_v2`, only the Extraction Adapter changes. The Evidence Nodes remain standard, and the Merge Engine continues to function without modification. The `RecommendationContext` boundary remains perfectly stable.
