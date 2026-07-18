# Recommendation Replay Strategy

This document defines the architecture for deterministically replaying historical recommendation runs against current codebase rules.

## 1. Replay Request
A replay is initiated via an admin endpoint (e.g., `/api/admin/recommendations/replay/{run_id}`).

## 2. Context Hydration
The replay engine looks up the `RecommendationRun` UUID. It extracts the `questionnaire_submission_id` and `skin_analysis_id` (if present). It fetches these exact historical JSON payloads from the database. It does **not** fetch the latest snapshot for the user.

## 3. Execution Execution
The engine runs the standard `RecommendationEngine.generate()` using the hydrated historical inputs, but executing the **current** `PolicyEngine`, `KnowledgeBase`, and `MergeEngine` logic active in the server's memory.

## 4. Delta Calculation
The replay engine generates a new `RecommendationResult` and a new `RecommendationTrace`. It then fetches the historical `RecommendationItem`s and `RecommendationTrace` (if stored) from the database and runs a deep object comparison.

## 5. Mismatch Reporting
The engine outputs a `ReplayReport`:
```json
{
  "run_id": "uuid",
  "match": false,
  "version_deltas": {
    "historical_policy": "1.0.0",
    "current_policy": "1.1.0"
  },
  "item_deltas": [
    {
      "slot": "treatment",
      "historical": "bha_salicylic_acid",
      "current": "azelaic_acid"
    }
  ],
  "trace_deltas": [
    "Candidate bha_salicylic_acid passed in historical but dropped by SensitivityFilter in current."
  ]
}
```

## 6. Regression Testing
This strategy allows developers to run batch replays of 10,000 historical runs to mathematically prove that a proposed policy change (e.g., tweaking the complexity cap) does exactly what is expected and causes no unintended side effects.
