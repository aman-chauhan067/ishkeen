# ADR 0013: Deterministic Recommendation Ownership

## Status
Accepted

## Context
Ishkeen must generate skincare routine recommendations. The recommendation engine could be built as a deterministic rules engine, a direct LLM generation system, or a RAG-based LLM system. We must choose an architecture that prioritizes safety, explainability, and determinism. Medical/treatment-like claims and unsafe active combinations must be strictly prevented.

## Decision
We will build a **Deterministic Rules Engine** to own all recommendation logic.
- The engine will strictly generate structured recommendation data (e.g., category targets, safety deferrals).
- LLMs (if used in Phase 6B/7) will be strictly restricted to a **presentation layer** (verbalizing the structured output) and will never be permitted to add ingredients, remove safety exclusions, or invent diagnoses.
- All MVP recommendations will use safe, templated presentation strings mapped to the engine's deterministic "reason codes".

## Consequences
- **Positive**: 100% testable, reproducible, and safe. Zero risk of hallucinating a dangerous chemical combination.
- **Positive**: Explainability is mathematically guaranteed.
- **Negative**: Higher upfront engineering effort to encode skincare safety policies as explicit Python code and knowledge graphs.
