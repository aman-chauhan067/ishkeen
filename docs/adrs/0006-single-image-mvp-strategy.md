# 6. Single Image MVP Strategy

Date: 2026-07-10

## Status
Accepted

## Context
Skin analysis systems often ask users for front, left, and right profile photos to ensure full facial coverage. However, capturing and analyzing multiple images introduces significant friction during user onboarding, increases database payload complexity, and multiplies storage and inference costs. 

## Decision
For the Phase 4 MVP, Ishkeen will require exactly **one frontal face image**.

## Consequences
- **Positive:** Simplifies UI/UX, database schema, upload multipart logic, and ML pipeline ingestion.
- **Negative:** The ML model will not be able to detect concerns on the extreme sides of the jawline or cheeks not visible from the front.
- **Mitigation:** The capture guidance will instruct users to ensure their primary concerns are visible in the frontal shot.
