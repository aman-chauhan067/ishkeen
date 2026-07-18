# ADR 0022: Decision Graph Modeling

## Status
Accepted

## Context
A flat text-based execution trace is difficult to analyze programmatically. In a complex recommendation system where multiple evidence nodes trigger multiple candidates that pass through multiple safety filters, we need a formalized way to visualize and query the logic path.

## Decision
We model the recommendation execution as a **Directed Acyclic Graph (DAG) of Decisions**.

1. **Nodes**:
   - `EvidenceNode`: A fact (e.g., "User has breakouts").
   - `CandidateNode`: An active ingredient considered (e.g., `bha_salicylic_acid`).
   - `RuleNode`: A safety filter applied (e.g., `ComplexityCap`, `SensitivityFilter`).
   - `ActionNode`: The outcome for a candidate (e.g., `Dropped`, `Deferred`, `Assigned`).
   - `OutputNode`: The final slot (e.g., `TreatmentSlot`).

2. **Edges**:
   - Edges denote causality. For example, an edge connects `EvidenceNode(Breakouts)` to `CandidateNode(BHA)` with weight `priority=1`. 
   - An edge connects `CandidateNode(BHA)` to `RuleNode(SensitivityFilter)` showing it passed.
   - An edge connects `CandidateNode(Retinoid)` to `ActionNode(Dropped)` with property `reason=EXCLUDED_KNOWN_REACTION`.

3. **Format**: The Decision Graph is encoded inside the Recommendation Trace (see ADR 0021) as a list of Vertices and Edges.

## Consequences
- **Positive**: Enables automated tooling to render flowcharts of exact recommendation paths.
- **Positive**: Simplifies detecting dead-ends (candidates generated but never evaluated due to an earlier blocking rule).
- **Negative**: Increases the cognitive overhead of the logging implementation; the engine must manually track and emit node/edge connections during execution.
