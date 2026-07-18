# Recommendation Versioning Strategy

## 1. Context
To maintain strict reproducibility, auditability, and safety over the lifecycle of the application, we must be able to recreate exactly why a specific recommendation was shown to a user on a specific date. 

## 2. Version Dimensions
The engine depends on three independent version axes:

### Engine Version (`engine_version`)
- **Definition**: The version of the core execution engine (the Python code that implements the pipeline, loop, and API).
- **Semver**: `v1.0.0`
- **Bump Trigger**: Bug fixes in the engine, architectural changes, addition of new explanation structures, changes in rule execution priority.

### Policy Version (`policy_version`)
- **Definition**: The version of the Safety Policies (e.g., Sensitivity downgrades, active stacking limits).
- **Semver**: `v1.2.0`
- **Bump Trigger**: Changing the max number of actives for a beginner from 1 to 2; adding a new rule for a new boolean flag like pregnancy safety.

### Knowledge Base Version (`knowledge_version`)
- **Definition**: The JSON/YAML file mapping concerns to ingredients.
- **Semver**: `v2026.07.11` (Date-based or Semver)
- **Bump Trigger**: Changing the evidence base (e.g., adding Azelaic Acid to the "Fine Lines" concern mapping based on new research).

## 3. Persistence Strategy (Option B/D Hybrid)
**Selected Strategy**: Persist every generated recommendation run.

**Rationale**:
- If we compute dynamically on the fly (Option A), a user opening the app six months later will see a *different* recommendation than what they actually started using, because our Knowledge Base might have updated in the meantime. This creates a terrifying user experience where their "current routine guidance" silently morphs out from under them.
- We must persist the recommendation run with its exact IDs, engine versions, and explanation codes. If the user wants a new recommendation based on updated science, they must explicitly click "Refresh Recommendation", which generates a NEW run.

## 4. Idempotency & Reproducibility
A rerun of the engine with the identical:
- `questionnaire_submission_id`
- `skin_analysis_id`
- `engine_version`
- `policy_version`
- `knowledge_version`
must yield a byte-for-byte identical output, including list ordering. If ordering can change, the architecture is flawed. We enforce deterministic sorting (e.g., alphabetical by category name) on any candidate lists before outputting.
