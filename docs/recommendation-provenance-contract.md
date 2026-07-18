# Recommendation Provenance Contract

## 1. Current Repository Truth Table

The following table represents the exact fields currently operational in the backend `SkinProfile` and `QuestionnaireSubmission` models (as defined in `app/schemas/profile.py` and `app/models/profile.py`).

| Category | Input Field | Data Type | Currently Exists? | Description / Allowed Values |
| :--- | :--- | :--- | :--- | :--- |
| **USER-REPORTED** | `skin_type` | Enum | **YES** | oily, dry, combination, balanced_normal, unsure |
| **USER-REPORTED** | `current_concerns` | Array[str] | **YES** | breakouts, post_acne_marks, uneven_tone, visible_pigmentation, redness, sensitivity, dryness_or_dehydration, excess_oiliness, visible_texture, clogged_pores, fine_lines, dullness |
| **USER-REPORTED** | `primary_goal` | Enum | **YES** | fewer_visible_breakouts, calmer_looking_skin, more_even_looking_tone, improved_hydration, smoother_looking_texture, simpler_routine, prevention_focused_routine |
| **USER-REPORTED** | `sensitivity_tendency` | Enum | **YES** | low, moderate, high, unsure |
| **USER-REPORTED** | `routine_product_categories` | Array[str] | **YES** | cleanser, moisturizer, sunscreen, serum_or_treatment, none |
| **USER-REPORTED** | `active_ingredient_categories` | Array[str] | **YES** | retinoid_type, bha_salicylic_acid, aha_glycolic_lactic_acid, benzoyl_peroxide, azelaic_acid, vitamin_c, niacinamide, pigment_targeting_active, unknown_active, none |
| **USER-REPORTED** | `sunscreen_frequency` | Enum | **YES** | daily, most_days, occasionally, rarely, never |
| **USER-REPORTED** | `routine_experience` | Enum | **YES** | beginner, familiar, advanced |
| **USER-REPORTED** | `clinician_directed_treatment`| Boolean | **YES** | true / false |
| **USER-REPORTED** | `known_reaction_categories` | Array[str] | **YES** | fragrance, essential_oils, retinoid_type, bha_salicylic_acid, aha_acids, benzoyl_peroxide, vitamin_c, niacinamide, other_known, none |
| **USER-REPORTED** | `known_reaction_other_note` | String | **YES** | Optional free-text note. |
| **USER-REPORTED** | `preference_avoid_categories` | Array[str] | **YES** | (Same as known_reaction_categories) |
| **USER-REPORTED** | `climate` | Enum | **YES** | hot_humid, hot_dry, cold_dry, temperate, mixed_seasonal, unsure |
| **MODEL-DERIVED** | `visible_breakout_pattern` | Boolean | *NO* | Future feature (Phase 5B/6). Must not be invented. |
| **MODEL-DERIVED** | `abstained` | Boolean | *NO* | Future feature. |
| **POLICY-DERIVED**| `adjusted_for_complexity` | Boolean | *NO* | Computed implicitly by the recommendation engine. |
| **POLICY-DERIVED**| `excluded_for_reaction` | Array[str] | *NO* | Computed implicitly by the recommendation engine. |

**Important Note**: The repository currently holds zero Model-Derived inputs. 

## 2. Provenance Boundaries

To prevent silent merging of data, the Recommendation Engine internal input state strictly tags the source of every fact.

### 2.1 Principle of Non-Destructive Overwrites
User-Reported data and Model-Derived data represent two distinct observations. They must **never** silently overwrite each other.

### 2.2 Handling Contradictions (User vs. Model)

#### Scenario A: User reports breakouts, Model abstains.
- **Resolution**: The engine accepts the user's report as ground truth for their lived experience. Model abstention does not mean "clear skin", it means "insufficient data" or "low confidence".
- **Action**: Recommendation engine acts on `concern=breakouts` (Provenance: USER).
- **Explanation Code**: `GOAL_BREAKOUT_SUPPORT_USER_REPORTED`.

#### Scenario B: User reports breakouts, Model confidently detects NO breakouts.
- **Resolution**: The user's lived experience is prioritized (breakouts might be transient, on a different area of the face, or invisible under current lighting). The engine acknowledges the model's negative detection but does not delete the user's concern.
- **Action**: The recommendation proceeds based on the user's report, but the explanation UI may gently suggest "We didn't detect visible breakouts today, but based on your report..."
- **Explanation Code**: `GOAL_BREAKOUT_SUPPORT_USER_REPORTED_MODEL_CLEAR`.

#### Scenario C: User does NOT report breakouts, Model confidently detects breakouts.
- **Resolution**: The engine must never diagnose a condition the user did not ask to treat, as this is invasive and legally risky (treatment claims).
- **Action**: The engine does NOT add "breakouts" to the target concerns. The engine retains the user's chosen concerns. The UI may surface a separate insight component ("Our analysis noticed some redness/breakout patterns—would you like to update your goals?"), but the deterministic engine operates purely on the User's explicitly approved goals.
- **Explanation Code**: No change to active treatments.

### 2.3 Stale Model / Temporal Provenance
- **Scenario**: User submits questionnaire today, but their image analysis is 6 months old.
- **Resolution**: *Note: For Phase 6B V1, recommendation generation operates strictly in questionnaire-only mode as no real MODEL-DERIVED findings exist.* When model data is eventually integrated, it must have a configurable freshness policy (e.g., 24 hours as a hypothetical starting point, to be validated). Stale model data will be dropped from the recommendation input payload. The absence of model data must NEVER be treated as a negative model result.
- **Action**: Engine computes purely on `USER-REPORTED` provenance.
- **Explanation Code**: `STALE_MODEL_EVIDENCE_IGNORED` recorded in the engine run.

### 2.4 Stale Questionnaire / New Image
- **Scenario**: Questionnaire is 6 months old, user uploads a new image today.
- **Resolution**: A recommendation run captures the exact `QuestionnaireSubmission` UUID and `SkinAnalysis` UUID. If the questionnaire is older than a set threshold (e.g., 30 days as an example policy), the frontend must block the recommendation flow and prompt a questionnaire review. The engine will refuse to run if temporal drift exceeds the validated policy.

## 3. Strict Provenance Typing
Internally, the engine uses a typed state:
```python
class RecommendationFact(BaseModel):
    value: Any
    provenance: Literal["USER", "MODEL", "POLICY"]
    timestamp: datetime
    source_id: UUID # Links back to QuestionnaireSubmission or SkinAnalysis
```
Every rule execution generates a trace referencing these exact facts.
