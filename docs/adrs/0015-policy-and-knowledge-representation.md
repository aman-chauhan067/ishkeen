# ADR 0015: Policy and Knowledge Representation

## Status
Accepted

## Context
The recommendation engine needs to encode clinical knowledge (e.g., "AHA targets visible texture") and safety policies (e.g., "Max 1 active for beginners"). We must decide where and how this logic is stored (Database, Python, YAML, etc.).

## Decision
We will use a **Hybrid Typed Rules + Versioned Policy Data** approach.
1. **Safety Policies and Priority Execution**: Implemented strictly in **Python code** (e.g., `PriorityEngine`). This ensures mathematical determinism, tight integration with Pydantic schemas, and exhaustive unit testing.
2. **Knowledge Base (Concern-to-Ingredient mappings)**: Stored in version-controlled **JSON/YAML files** loaded into memory at startup.

## Consequences
- **Positive**: Modifying which ingredient treats which concern does not require rewriting core Python engine logic, allowing easier updates as clinical guidelines evolve.
- **Positive**: Safety logic remains highly rigid and typed, preventing accidental bypasses of exclusions.
- **Negative**: The engine must manage independent version tracking for both the Code version (Engine/Policy) and the Data version (Knowledge Base JSON).
