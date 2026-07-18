# Decision Graph Architecture

This document defines the schema of the recommendation Decision Graph, which models the execution trace as a Directed Acyclic Graph (DAG) for visualization and advanced automated querying.

## 1. Graph Structure
The graph is serialized as a JSON list of `nodes` and `edges`.

### Node Contract
```json
{
  "node_id": "string",
  "node_type": "evidence | candidate | rule | action | output",
  "label": "string",
  "metadata": {} 
}
```

### Edge Contract
```json
{
  "source_id": "string",
  "target_id": "string",
  "edge_type": "triggers | evaluated_by | results_in | assigned_to",
  "weight": "float",
  "metadata": {"reason": "string"}
}
```

## 2. Example Pathway

1. **Evidence Node**: `{"node_id": "E1", "node_type": "evidence", "label": "breakouts"}`
2. **Candidate Node**: `{"node_id": "C1", "node_type": "candidate", "label": "bha_salicylic_acid"}`
3. **Edge**: `E1` -> `C1` (`triggers`)

4. **Rule Node**: `{"node_id": "R1", "node_type": "rule", "label": "HardExclusionFilter"}`
5. **Edge**: `C1` -> `R1` (`evaluated_by`)

6. **Action Node**: `{"node_id": "A1", "node_type": "action", "label": "dropped"}`
7. **Edge**: `R1` -> `A1` (`results_in`, `metadata`: `{"reason": "EXCLUDED_KNOWN_REACTION"}`)

*(If it had passed the rule...)*
8. **Action Node**: `{"node_id": "A2", "node_type": "action", "label": "passed"}`
9. **Output Node**: `{"node_id": "O1", "node_type": "output", "label": "treatment_slot"}`
10. **Edge**: `A2` -> `O1` (`assigned_to`)

## 3. Utility
By converting the trace into a DAG, a frontend admin dashboard can easily render a flowchart showing exactly how `bha_salicylic_acid` flowed from an evidence fact until it hit the `HardExclusionFilter` and fell into the `dropped` bucket.
