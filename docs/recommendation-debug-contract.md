# Recommendation Debug Contract

This document defines the interface for Developer Debug Mode.

## 1. Triggering Debug Mode
An API request to generate a recommendation can include an optional header or parameter `X-Ishkeen-Debug: true` (only respected for admin/developer roles, not end users).

## 2. Debug Payload Schema
When Debug Mode is triggered, the `/api/recommendations/generate` response payload is expanded to include a `debug` block. This block is derived entirely from the `RecommendationTrace` and `DecisionGraph`.

```json
{
  "recommendation": {
    "engine_version": "1.0.0",
    "items": [...]
  },
  "debug": {
    "resolved_evidence": [
      {"concern": "breakouts", "sources": ["questionnaire", "model"]}
    ],
    "candidate_pool_raw": ["bha", "benzoyl", "retinoid"],
    "rule_evaluations": [
      {
        "candidate": "bha",
        "rule": "HardExclusionFilter",
        "action": "dropped",
        "reason": "EXCLUDED_KNOWN_REACTION"
      },
      {
        "candidate": "benzoyl",
        "rule": "SensitivityFilter",
        "action": "dropped",
        "reason": "HIGH_IRRITATION_NOT_ALLOWED"
      },
      {
        "candidate": "retinoid",
        "rule": "ComplexityCap",
        "action": "assigned",
        "reason": "SLOT_AVAILABLE"
      }
    ],
    "final_priority_sort": ["retinoid"]
  }
}
```

## 3. Guarantees
- Debug mode does not alter the actual recommendation generated.
- Debug mode exposes internal engine state that is normally discarded.
- The UI can use this payload to build an interactive inspector tool for customer support or clinical review teams.
