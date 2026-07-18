# ML Context & Recommendation Input Contract

## 1. Independent Computer Vision Inference (Stage A)

The computer vision model must operate independently from user expectations to prevent confirmation bias and data leakage. 
The image inference returns raw, unbiased data:
- Finding type (e.g., erythema, comedones)
- Confidence score
- Severity estimate (if validated)
- Image-quality indicators
- Uncertainty metrics

**CRITICAL**: Self-reported `current_concerns` DO NOT silently change the CV model's detection thresholds.

## 2. Contextual Interpretation & Recommendation Boundary (Stage B)

The recommendation engine synthesizes the independent image findings with the user's explicit profile. Disagreements between self-reported concerns and image findings are documented and weighed, never silently overwritten.

The final recommendation input explicitly separates data provenance into three categories:

### A. USER-REPORTED
Data sourced from `skin_profiles` or the exact `questionnaire_submissions` snapshot:
- `skin_type`
- `current_concerns`
- `primary_goal`
- `sensitivity_tendency`
- `routine_product_categories`
- `active_ingredient_categories`
- `sunscreen_frequency`
- `routine_experience`
- `known_reaction_categories`
- `preference_avoid_categories`
- `climate`
- `clinician_directed_treatment`

### B. MODEL-DERIVED
Data sourced strictly from Stage A independent image inference:
- `visible_findings`
- `confidence`
- `image_quality`
- `uncertainty`

### C. POLICY-DERIVED
Application-level constraints and guardrails enforced prior to or during the recommendation generation:
- **Contraindication/Interaction Rules**: When evidence-supported (e.g., prohibiting AHA with Retinoid if experience is beginner).
- **Conservative Fallback Rules**: Enforced when uncertainty is high or data is missing.
- **Confidence Thresholds**: Cutoffs for acting on model-derived findings.
- **Escalation Boundaries**: Triggers for halting recommendations (e.g., severe reactions).

## 3. Clinical Safety Boundary (Prescription Treatment Policy)

The application enforces a conceptual safety boundary for users under clinical care.
When `clinician_directed_treatment == true`:
- The engine must **not** advise stopping, replacing, changing frequency, or modifying the clinician-directed treatment.
- The engine must **not** make interaction-sensitive active recommendations without sufficient policy evidence.
- Default toward conservative, supportive routine guidance (e.g., basic hydration and sun protection).
- Surface an explicit uncertainty/safety boundary when interaction context is incomplete.
- Encourage confirmation with the treating clinician before making additions to the routine.
