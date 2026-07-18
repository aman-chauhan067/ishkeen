# Evidence Merge Policy (Conflict Resolution Matrix)

This document dictates how the `MergeEngine` resolves conflicting Evidence Nodes before finalizing the `ResolvedEvidenceContext`.

## Principles
1. **User Subjective Truth**: The user is the ultimate authority on their lived experience (e.g., sensitivity, dryness, self-reported breakouts).
2. **Conservative Safety**: When in doubt, or when models conflict, adopt the safer, more conservative stance (e.g., assuming a breakout exists if a high-confidence model sees it, even if the user didn't mention it, but requiring user confirmation).
3. **No Silent Overwrites**: The UI and Provenance engine must always know if a model altered the baseline questionnaire facts.

## Conflict Matrix

| Scenario | User Evidence | Model Evidence | Winner | User Confirmation Required | Provenance Action |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Agreement** | Reports Breakouts | Detects Breakouts | **Both** | No | Tag both sources in graph. |
| **False Positive Protection** | Reports Breakouts | Detects Nothing | **User** | No | Model negative evidence discarded. |
| **Silent Discovery** | Reports Nothing | Detects Breakouts | **Model** | **Yes** | Flag `requires_confirmation` in result. |
| **Model Failure** | Reports Breakouts | Abstains/Low Conf. | **User** | No | Proceed in V1 Questionnaire-Only mode. |
| **Stale Image** | Reports Breakouts | Image > 7 Days Old | **User** | No | Ignore model completely. |
| **Model Disagreement** | N/A | Model A: Yes, Model B: No | **Conservative** | **Yes** | Flag `requires_confirmation`, use Model A. |

## Confirmation Flow UI Impact
If the Merge Engine outputs a `requires_confirmation` flag for a specific concern (e.g., "We noticed some texture issues, would you like to address those?"), the UI must present this to the user. The recommendation engine will initially **exclude** this concern from the primary recommendation until the user confirms. If confirmed, a new RecommendationRun is generated with the merged context.
