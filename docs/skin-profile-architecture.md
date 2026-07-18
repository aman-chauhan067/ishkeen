# Skin Profile & Architecture

## 1. Skin Profile vs Questionnaire Submission

**Skin Profile** represents the user's mutable, *current* skincare context.
- **Purpose**: Provides a fast, relational view of the user's current baseline used frequently by the application to populate UI or pass to prediction logic.
- **Lifecycle**: Created when the user first completes onboarding. Updated when a new questionnaire is submitted or when edited directly in settings. Hard deleted upon account deletion.
- **Structure**: Strongly typed columns or mapped Enums/Arrays that make indexing and application logic easy.

**Questionnaire Submission** represents an immutable, historical snapshot of answers at a point in time.
- **Purpose**: Auditability, reproducibility of recommendations, and tracking historical changes over time.
- **Lifecycle**: Append-only. Hard deleted upon account deletion. Never modified historically.
- **Structure**: JSONB blob storing the exact questions, versions, and raw answers submitted.

## 2. Profile Update Semantics
- **Atomicity**: Onboarding submission creation and `SkinProfile` projection update must succeed atomically.
- **Independence**: Manual edits to the `SkinProfile` directly (e.g., via settings) update the current profile but do *not* generate a fake questionnaire submission. 
- **Auditability**: Future recommendation records will explicitly reference the exact `questionnaire_submissions.id` and/or `skin_profiles.updated_at` context used.

## 3. Initial Domain Model Boundaries

### `skin_profiles`
- **Ownership**: 1:1 with `users`.
- **Relational Columns / Controlled Arrays**:
  - `id` (UUID)
  - `user_id` (UUID, FK, Unique)
  - `skin_type` (Enum: oily, dry, combination, balanced_normal, unsure)
  - `sensitivity_tendency` (Enum: low, moderate, high, unsure)
  - `primary_goal` (Enum)
  - `current_concerns` (Array of Enum, Max 3)
  - `routine_product_categories` (Array of Enum)
  - `active_ingredient_categories` (Array of Enum)
  - `sunscreen_frequency` (Enum)
  - `routine_experience` (Enum)
  - `known_reaction_categories` (Array of Enum)
  - `preference_avoid_categories` (Array of Enum)
  - `clinician_directed_treatment` (Boolean)
  - `climate` (Enum, Optional)
- **Deletion Behavior**: CASCADE on `user_id`.

### `questionnaire_submissions`
- **Ownership**: 1:N with `users`.
- **Fields**:
  - `id` (UUID)
  - `user_id` (UUID, FK)
  - `version` (String, e.g., '1.0')
  - `answers` (JSONB) — Snapshot of submitted payload.
  - `created_at` (Timestamp)
- **Deletion Behavior**: CASCADE on `user_id`.

## 4. Controlled Selection Validation Rules
To ensure data integrity for ML and Recommendation inputs, the following boundaries are strictly enforced:
- **Mutual Exclusivity**: `none` cannot coexist with any other values in multi-select arrays (e.g., `routine_product_categories`, `active_ingredient_categories`, `known_reaction_categories`, `preference_avoid_categories`).
- **Maximum Limits**: `current_concerns` is strictly limited to 3 items.
- **Data Integrity**: Duplicate selections are rejected or silently normalized. Unknown enum values are rejected by the Pydantic schema validation layer.

## 5. Privacy & Data Deletion
- Demographics (Age, DOB, Sex, Gender, Ethnicity) and exact location are **not collected**.
- Account deletion explicitly cascades down to `skin_profiles` and `questionnaire_submissions`. No identifying traces are left behind.
