# ADR 0019: Evidence Merge Strategy and Conflict Resolution

## Status
Accepted

## Context
When ML-derived evidence (from Skin Analysis) is introduced alongside User-reported evidence (from the Questionnaire), conflicts are inevitable. For example, a user may report no breakouts, but the ML model may detect active acne lesions. Alternatively, a user may report severe breakouts, but the ML model (due to poor lighting, low confidence, or algorithm failure) detects nothing.

## Decision
We establish a strict, deterministic Evidence Merge Policy based on the principle of "Safety and User Truth First":

1. **User Subjective Experience is Irrefutable**: If a user reports a concern (e.g., "breakouts", "sensitivity"), it is **never** invalidated by an ML model. If the ML model detects nothing, the User evidence wins.
2. **Model Discoveries Require Confirmation**: If the ML model detects a severe concern that the user did not report, the Model evidence wins **internally** (it is added to the Graph), BUT the engine will explicitly flag it requiring User UI confirmation before it becomes an active recommendation constraint.
3. **Abstention vs. Nothing Detected**: 
   - An ML model "Abstaining" (e.g., due to blur, low confidence, or missing region) means the model contributes zero evidence.
   - An ML model detecting "Nothing" (high confidence clear skin) contributes negative evidence. However, per Rule 1, it cannot override a user's reported concern.
4. **Multiple Model Disagreement**: If multiple future models (e.g., YOLO and a separate CNN) conflict on a fact, the engine takes the most conservative safety path. If one model detects a severe lesion and the other does not, the severe detection is passed to the Merge Engine (subject to confidence thresholds).

## Consequences
- **Positive**: Prevents gaslighting users about their own skin concerns.
- **Positive**: Maintains conservative safety by not ignoring potentially severe ML findings.
- **Negative**: Requires the frontend to implement a confirmation flow for ML-discovered concerns that contradict the questionnaire.
