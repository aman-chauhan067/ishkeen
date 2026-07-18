# Failure Mode & Mutation Audit (Phase 6D)

This document records the adversarial simulations conducted against the proposed Future ML Integration Architecture.

## 1. Environmental Failure Modes

| Scenario | Simulated Action | Expected Result | Did Architecture Detect/Handle? | Resolution |
| :--- | :--- | :--- | :--- | :--- |
| **No Image** | User skips image step. | Engine runs V1 mode. | Yes | `skin_analysis_id` is null; adapter yields 0 nodes. Merge Engine gracefully falls back to Questionnaire. |
| **Stale Analysis** | User clicks "regenerate" 3 months later without new image. | Engine ignores old image. | Yes | Contract explicitly defines staleness threshold. Adapter drops nodes. |
| **Corrupted Analysis** | ML pipeline saves malformed JSON. | Engine falls back to V1. | Yes | Adapter parsing fails safely, yields 0 nodes, logs error. |
| **Model Version Unknown** | DB contains `model_version: "experimental_1"`. | Engine drops analysis. | Yes | No registered adapter matches version string. Yields 0 nodes. |
| **Multiple Conflicting Models** | Model A says Acne (conf 0.9), Model B says None. | Engine defaults to Conservative (Acne). | Yes | Merge Engine conflict matrix prefers conservative safety. |

## 2. Mutation Attacks on Architecture Principles

| Mutation | Simulated Action | Expected Failure | Did Architecture Detect/Handle? | Resolution / Revision |
| :--- | :--- | :--- | :--- | :--- |
| **Remove Provenance** | Drop `skin_analysis_id` from `RecommendationRun`. | Loss of replayability. | Detected | ADR 0018 mandates strict FK storage. Mutation blocked by DB schema contract. |
| **Reverse Evidence Priority** | Allow ML to silently overwrite user's reported "dryness" to "oily". | User gaslighting, unsafe active recommendations. | Detected | ADR 0019 explicitly forbids ML overwriting subjective user facts. |
| **Bypass Conflict UI** | Auto-add ML discovered concerns to context without user confirmation. | User receives products for conditions they are unaware of. | Detected | ADR 0019 requires explicit `requires_confirmation` UI loop. |
| **Ignore Model Version** | Update ML model without changing version string. | Historical replay drift. | Detected | ADR 0020 enforces explicit version tags and immutable analysis rows. |
| **LLM Edit** | Allow LLM to dynamically rewrite the final routine based on graph. | Complete loss of safety and determinism. | Detected | Architecture places Policy Engine AFTER the Merge Engine. Output remains strictly locked to Knowledge Base JSON. |

## 3. Regression Review
Does the integration of the Evidence Graph break Phase 6A/6B contracts?
- **Determinism**: Maintained. Merge logic is hardcoded matrix, not probabilistic.
- **Safety**: Maintained. The generated context passes through the exact same Policy Engine (complexity caps, exclusions) built in Phase 6B.
- **Explainability**: Maintained. Nodes carry their origin (`source_type`).

## Conclusion
The architecture has survived the adversarial audit. No structural changes are required. The Merge Engine design successfully insulates the deterministic V1 core from ML volatility.
