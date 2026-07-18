# Questionnaire Design

This document outlines the MVP Ishkeen onboarding questionnaire architecture.

## 1. Goal and Tone
- **Goal**: Collect the absolute minimum structured information needed to provide meaningful, safe, and personalized skincare analysis and recommendations.
- **Tone**: Calm, concise, neutral, non-judgmental, non-diagnostic. (e.g., "What would you like to focus on?" rather than "Diagnose your condition.")

## 2. UX Architecture
- **Structure**: A 3-step progressive form grouping related context logically to balance momentum with clarity.
- **Validation**: Rules (like exclusivity of "none" and max 3 concerns) are enforced cleanly.

## 3. Questionnaire Versioning
- **Strategy**: Application-defined versions (e.g., `v1.0`).
- **Storage**: The backend stores the snapshot as JSONB exactly as it was submitted along with its version, which ensures that controlled vocabularies can evolve in the future without breaking historical snapshots.

## 4. MVP Questionnaire Steps & Fields

### Step 1: Skin & Priorities
| Question | Purpose | Type / Values | Required | Maps to Profile? |
|----------|---------|---------------|----------|------------------|
| "How does your skin usually feel?" | Baseline Skin Type | Single Select: oily, dry, combination, balanced_normal, unsure | Yes | `skin_type` |
| "Which of these are you currently experiencing?" | Current Concerns | Multi Select (Max 3): breakouts, post_acne_marks, uneven_tone, visible_pigmentation, redness, sensitivity, dryness_or_dehydration, excess_oiliness, visible_texture, clogged_pores, fine_lines, dullness | Yes | `current_concerns` |
| "What is your primary goal?" | Target Goal | Single Select: fewer_visible_breakouts, calmer_looking_skin, more_even_looking_tone, improved_hydration, smoother_looking_texture, simpler_routine, prevention_focused_routine | Yes | `primary_goal` |
| "How sensitive is your skin to new products?" | Sensitivity Tendency | Single Select: low, moderate, high, unsure | Yes | `sensitivity_tendency` |

### Step 2: Current Routine
| Question | Purpose | Type / Values | Required | Maps to Profile? |
|----------|---------|---------------|----------|------------------|
| "Which of these do you currently use daily?" | Routine Product Categories | Multi Select: cleanser, moisturizer, sunscreen, serum_or_treatment, none | Yes | `routine_product_categories` |
| "Are you currently using any active ingredients?" | Active Ingredient Exposure | Multi Select: retinoid_type, bha_salicylic_acid, aha_glycolic_lactic_acid, benzoyl_peroxide, azelaic_acid, vitamin_c, niacinamide, pigment_targeting_active, unknown_active, none | Yes | `active_ingredient_categories` |
| "How often do you apply sunscreen?" | Sun safety baseline | Single Select: daily, most_days, occasionally, rarely, never | Yes | `sunscreen_frequency` |
| "How familiar are you with skincare ingredients?" | Recommendation Complexity | Single Select: beginner, familiar, advanced | Yes | `routine_experience` |

### Step 3: Important Context
| Question | Purpose | Type / Values | Required | Maps to Profile? |
|----------|---------|---------------|----------|------------------|
| "Are you currently using prescription skin treatments or under a clinician's care?" | Clinical Safety Boundary | Single Select: true, false | Yes | `clinician_directed_treatment` |
| "Have you had known negative reactions to specific ingredients?" | Reaction Tracking | Multi Select: fragrance, essential_oils, retinoid_type, bha_salicylic_acid, aha_acids, benzoyl_peroxide, vitamin_c, niacinamide, other_known, none | Optional | `known_reaction_categories` |
| "Are there ingredients you personally prefer to avoid?" | Preference Tracking | Multi Select: (Same vocabulary as reactions) | Optional | `preference_avoid_categories` |
| "How would you describe your climate?" | Environmental Context | Single Select: hot_humid, hot_dry, cold_dry, temperate, mixed_seasonal, unsure | Optional | `climate` |

*Note: For `known_reaction_categories` and `preference_avoid_categories`, if `other_known` is selected, an optional short bounded note field is allowed for the user to briefly specify the ingredient. This is NOT a medical history text block.*
