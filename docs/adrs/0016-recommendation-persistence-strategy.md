# ADR 0016: Recommendation Persistence Strategy

## Status
Accepted

## Context
When the engine generates a recommendation, the output could be computed dynamically on the fly every time the user visits the frontend, or it could be persisted to the database.

## Decision
We will **persist every finalized recommendation run** to the database (`RecommendationRun` and `RecommendationItem` tables).
- A recommendation run captures a point-in-time snapshot of the inputs (`QuestionnaireSubmission` UUID and `SkinAnalysis` UUID) alongside the exact engine, policy, and knowledge versions used.
- Dynamic recalculation on the fly is explicitly prohibited for displaying historical recommendations.

## Consequences
- **Positive**: Complete auditability. If a user complains about a bad reaction, we have cryptographic certainty regarding exactly what we recommended and why.
- **Positive**: Stability. If the Clinical Knowledge base is updated, existing users will not see their "Current Routine" silently change beneath them. They must explicitly request a new analysis/recommendation.
- **Negative**: Increased database storage requirements (mitigated by storing explanation traces as compressed JSON rather than relational rows).
