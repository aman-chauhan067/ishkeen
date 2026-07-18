# Recommendation Safety Policy & Priority System

This document outlines the strict deterministic safety policies and their execution priority within the Ishkeen Recommendation Engine.

## 0. Strict Terminology Rules
The engine and its output must never present itself as providing a diagnosis, a prescription, a treatment replacement, or a clinician override. 
- Words like "treat", "cure", "prescribe", and "diagnose" are strictly prohibited in output logic or UI representation.
- Words like "support", "target", "improve appearance of", and "manage" should be used.
- Actives are classified as "guidance" or "recommendations", not "treatments" unless specifically deferring to a user's clinician.

## 1. Execution Priority Order

The engine executes in a strict deterministic order. Rules at a higher priority permanently eliminate or modify candidates, overriding any lower-priority desire to treat a concern.

1. **Hard Safety Exclusions** (Known Reactions & User Preferences)
2. **Clinician-Directed Care Restrictions**
3. **Current Routine Duplication Prevention**
4. **Active Stacking & Complexity Caps**
5. **Sensitivity Down-ranking / Deferral**
6. **Primary Goal Alignment** (e.g., simpler routine)
7. **Concern Candidate Generation** (Propose candidates for specific concerns)
8. **Sunscreen Context Integration**
9. **Climate Adjustments** (Texture/format preferences, not active selection)

## 2. Policy Definitions

### A. Known Reaction Exclusion
- **Trigger**: A candidate category is present in the user's `known_reaction_categories` or `preference_avoid_categories`.
- **Action**: The candidate is definitively removed from the recommendation set. 
- **Provenance**: USER
- **Explanation Code**: `EXCLUDED_KNOWN_REACTION` or `EXCLUDED_USER_PREFERENCE`

### B. Clinician-Directed Treatment
- **Trigger**: `clinician_directed_treatment == true`
- **Action**: All aggressive active treatment candidates (e.g., Retinoids, BHA, Benzoyl Peroxide) are deferred or excluded. The engine defaults entirely to a conservative, supportive routine (Gentle Cleanser, Barrier Moisturizer, Sunscreen).
- **Provenance**: USER
- **Explanation Code**: `CONSERVATIVE_CLINICIAN_CARE`
- **Constraint**: The engine MUST NOT infer medication interactions, must not advise stopping treatment, and must clearly encourage following the clinician's guidance.

### C. Existing Routine Duplication
- **Trigger**: A candidate category is already present in `active_ingredient_categories`.
- **Action**: The candidate is shifted from "Recommended to Add" to "Continue Existing". The engine prevents recommending escalation or duplicating an active.
- **Provenance**: USER
- **Explanation Code**: `ALREADY_USING_CATEGORY`

### D. Active Stacking & Beginner Complexity Cap
- **Trigger**: The candidate generation step produces multiple active treatment candidates, OR the user is already using actives.
- **Action**: 
  - If `routine_experience == beginner`: Maximum of 1 total active category allowed across the entire routine.
  - If `routine_experience == familiar`: Maximum of 2 total active categories.
  - If `routine_experience == advanced`: Maximum of 3 total active categories, but flag with `CAUTION_STACKING` if combining known irritants (e.g., BHA + Retinoid).
  - If the cap is exceeded, excess candidates are deferred.
- **Provenance**: POLICY
- **Explanation Code**: `COMPLEXITY_LIMIT_ENFORCED`

### E. Sensitivity Tendency
- **Trigger**: `sensitivity_tendency == high`
- **Action**: Aggressive actives (like high-strength AHA or Benzoyl Peroxide) are removed or swapped for gentler alternatives (e.g., Azelaic Acid, PHA). Introduction pace is explicitly flagged as "Slow/Patch Test".
- **Provenance**: USER -> POLICY
- **Explanation Code**: `SENSITIVITY_DOWNGRADE`

### F. Primary Goal Alignment (Simpler Routine)
- **Trigger**: `primary_goal == simpler_routine`
- **Action**: Limits the total recommended routine steps to 3 (Cleanser, Moisturizer, Sunscreen) plus a maximum of 1 multi-tasking active. Drops secondary concerns.
- **Provenance**: USER
- **Explanation Code**: `SIMPLER_ROUTINE_PRIORITIZED`

### G. Sunscreen Context
- **Trigger**: `sunscreen_frequency` is rarely or never, AND a photosensitizing active (e.g., AHA, Retinoid) is generated.
- **Action**: The photosensitizing active is DEFERRED. A strong sunscreen foundation recommendation is prioritized instead.
- **Provenance**: POLICY
- **Explanation Code**: `SUNSCREEN_FOUNDATION_REQUIRED`

## 3. Conflict Resolution Strategy
If two rules collide (e.g., Concern generation adds an active, but Sensitivity policy removes it), **Safety always wins**. The engine explicitly builds a `SafetyDecision` trace array, recording:
`{ "candidate": "aha_acids", "action": "deferred", "policy_code": "SENSITIVITY_DOWNGRADE" }`
No output depends on accidental JSON iteration order; candidates are resolved against the ordered priority pipeline.
