# Analysis Domain Model

This document outlines the database schema and status lifecycles for Skin Analysis.

## 1. Database Entities

### `SkinAnalysis`
Represents a single analysis session and acts as the root aggregate.
- `id`: `UUID` (Primary Key)
- `user_id`: `UUID` (Foreign Key -> `users.id`)
- `questionnaire_submission_id`: `UUID` (Foreign Key -> `questionnaire_submissions.id`, Nullable. Links this analysis to a specific historical questionnaire context if provided).
- `status`: `String` (Enum)
- `image_storage_key`: `String` (Pointer to the canonical normalized `.jpg`)
- `model_version`: `String` (Nullable until inference is complete)
- `preprocessing_version`: `String` (Nullable)
- `failure_code`: `String` (Nullable, controlled taxonomy)
- `created_at`: `DateTime`
- `completed_at`: `DateTime` (Nullable)

### `AnalysisFinding`
Represents an individual concern detected by the ML model.
- `id`: `UUID` (Primary Key)
- `analysis_id`: `UUID` (Foreign Key -> `skin_analyses.id`)
- `concern_type`: `String` (e.g., `'acne'`)
- `confidence`: `Float` (Probability output by model)
- *Note on Severity*: Severity (`mild`, `moderate`) and Region (bounding boxes) remain omitted/optional for Phase 4A architecture until actual dataset labels and model output formats provide concrete evidence for their inclusion.

## 2. Analysis Status Machine
- `created`: The record is instantiated (used for tracking orphaned requests or pre-upload initialization).
- `validating`: Image is undergoing format, bounds, and EXIF normalization.
- `ready`: Image is saved, normalized, and awaits ML inference.
- `processing`: ML inference is actively running (useful for future async architectures).
- `completed`: Inference succeeded, findings are saved.
- `failed`: An internal system or ML processing error occurred.
- `rejected`: The user input was invalid (e.g., multiple faces, blurry).

### Allowed Transitions:
`created` → `validating` → `ready` → `processing` → `completed`
*Any state* → `rejected`
*Any state* → `failed`

## 3. Failure Code Taxonomy
Failure codes are controlled strings stored in the DB, separate from internal Python exceptions.

**Validation / Rejected Codes:**
- `unsupported_format`
- `image_too_large`
- `dimensions_too_small`
- `invalid_image` (corrupted)
- `no_face_detected`
- `multiple_faces_detected`
- `face_too_small`

**Quality Warnings (Non-terminal):**
- `image_blurry`
- `poor_lighting`

**Internal Failure:**
- `processing_failed` (Generic safe user-facing message, while raw stack traces remain in backend logs).
