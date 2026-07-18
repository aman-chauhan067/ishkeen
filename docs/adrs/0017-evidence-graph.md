# ADR 0017: Evidence Graph Architecture for Recommendation Inputs

## Status
Accepted

## Context
Phase 6B implemented a deterministic Recommendation Engine that currently relies exclusively on user-reported questionnaire data (V1 mode). For Phase 6D, we need an architecture that seamlessly integrates ML-derived evidence (Skin Analysis) without breaking determinism, explainability, or breaking the V1 engine. We must avoid directly injecting ML outputs into the `RecommendationContext` without resolving conflicts.

## Decision
We will introduce an **Evidence Graph** as an intermediate abstraction between Raw Inputs (Questionnaire, ML Models) and the Recommendation Engine.

1. **Evidence Nodes**: Every fact (e.g., "User has breakouts", "Model detected acne") will be modeled as an isolated Evidence Node containing:
   - `id`: Unique identifier for the fact.
   - `fact_type`: The category of the fact (e.g., `acne_presence`).
   - `value`: The boolean or enum value.
   - `source_type`: `user` | `model` | `policy`.
   - `source_ref`: UUID of the `QuestionnaireSubmission` or `SkinAnalysis`.
   - `confidence`: Float (only applicable for `model`, `1.0` for `user`).
   - `timestamp`: Extraction time.

2. **Graph Construction**: Before generating a recommendation, an Evidence Graph Builder collects all valid nodes from the latest user snapshot and the latest valid ML analysis snapshot.

3. **Decoupling**: The Recommendation Engine will no longer read directly from `QuestionnaireSubmission` dictionaries. Instead, it will read a normalized `ResolvedEvidenceContext` produced by the Evidence Graph.

## Consequences
- **Positive**: Complete traceability. If a recommendation changes, we can trace it back to the exact Evidence Node (and thus the exact ML Model version or Questionnaire ID) that introduced the fact.
- **Positive**: The Recommendation Engine logic remains entirely decoupled from ML inference formats.
- **Negative**: Adds a mapping layer (Evidence Builder) that must be maintained whenever new ML models or questionnaire inputs are added.
