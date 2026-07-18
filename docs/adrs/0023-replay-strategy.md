# ADR 0023: Recommendation Replay Strategy

## Status
Accepted

## Context
When troubleshooting a bad recommendation or performing system regression testing, developers must be able to recreate the exact conditions that led to a specific recommendation. Because policies, models, and knowledge bases change over time, simply passing the old questionnaire snapshot into the current engine will yield a different result.

## Decision
We implement a **Deterministic Replay Architecture** with explicit mismatch detection.

1. **Replay Input**: A replay request takes a `RecommendationRun` UUID.
2. **Context Hydration**: The engine retrieves the exact `QuestionnaireSubmission` and `SkinAnalysis` snapshots linked to that run.
3. **Execution**: The engine executes the pipeline using the *current* codebase (Engine logic, Policy rules, Knowledge base).
4. **Mismatch Detection**: The system compares the newly generated `RecommendationResult` (and its `DecisionGraph`) against the historically persisted `RecommendationRun`.
   - If they match exactly: The historical recommendation is still valid under current rules.
   - If they mismatch: The engine outputs a **Replay Diff Report**, pinpointing exactly which outputs, candidates, or trace edges diverged.
5. **Version Checking**: The replay runner explicitly warns the developer if the requested run's recorded versions (`policy_version`, `knowledge_version`, etc.) differ from the currently active versions in the codebase.

## Consequences
- **Positive**: Enables test-driven refinement of policies. Developers can replay thousands of historical runs against a new policy draft to calculate exact impact (e.g., "This policy change alters 12% of past recommendations").
- **Positive**: Bug reports can be definitively proven as "fixed" by replaying the bad run and verifying the output has changed.
- **Negative**: The engine must remain purely deterministic, preventing the use of random seed operations or non-deterministic ML calls inside the core loop.
