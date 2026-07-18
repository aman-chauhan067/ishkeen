from pydantic import BaseModel, ConfigDict
from typing import List, Literal, Optional
from uuid import UUID

class RoutineStep(BaseModel):
    step_name: str
    category: str
    product_type: str
    ingredient: str
    why: str
    instructions: str
    frequency: str
    warnings: Optional[str] = None
    recommended_product: Optional[str] = None
    
class TimelinePhase(BaseModel):
    phase: str
    expected_results: str
    adjustments: Optional[str] = None

class IngredientGuidance(BaseModel):
    category: str
    
class DeferredGuidance(BaseModel):
    category: str
    reason_code: str

class SafetyDecision(BaseModel):
    decision_type: Literal["EXCLUDE", "DEFER", "DOWNGRADE", "LIMIT_COMPLEXITY", "CONTINUE_EXISTING", "FALLBACK"]
    category: Optional[str] = None
    reason_code: str

class ProvenanceRefs(BaseModel):
    questionnaire_id: UUID
    skin_analysis_id: Optional[UUID] = None

class RecommendationResult(BaseModel):
    morning_routine: List[RoutineStep]
    night_routine: List[RoutineStep]
    weekly_schedule: str
    introduction_schedule: str
    patch_test_instructions: str
    timeline: List[TimelinePhase]
    ingredient_guidance: List[IngredientGuidance]
    deferred_guidance: List[DeferredGuidance]
    safety_adjustments: List[SafetyDecision]
    explanation_codes: List[str]
    provenance_refs: ProvenanceRefs
    engine_version: str
    policy_version: str
    knowledge_version: str

# Trace Components

class TraceEvent(BaseModel):
    event_id: UUID
    parent_event_id: Optional[UUID] = None
    node_id: str
    parent_node_id: Optional[str] = None
    timestamp: str  # iso8601
    event_type: str
    severity: Literal["info", "warning", "critical"]
    reason_code: str
    priority: int
    execution_order: int

class DecisionNode(BaseModel):
    id: str
    type: Literal["evidence", "candidate", "rule", "action", "slot"]
    label: str

class DecisionEdge(BaseModel):
    source: str
    target: str
    type: Literal["triggers", "evaluated_by", "results_in", "assigned_to"]
    reason_code: Optional[str] = None
    priority: Optional[int] = None

class DecisionGraph(BaseModel):
    graph_version: str = "1.0.0"
    deterministic_node_order: List[str]
    deterministic_edge_order: List[str]
    nodes: List[DecisionNode]
    edges: List[DecisionEdge]

class TraceIdentifiers(BaseModel):
    trace_id: UUID
    request_id: UUID
    correlation_id: UUID

class TraceVersions(BaseModel):
    engine: str
    policy: str
    knowledge: str

class TraceMetadata(BaseModel):
    compression: Literal["none", "gzip"] = "none"

class RecommendationTrace(BaseModel):
    trace_schema_version: str = "1.1.0"
    trace_generator_version: str = "1.0.0"
    identifiers: TraceIdentifiers
    execution_hash: str
    execution_timestamp: str
    duration_ms: float
    versions: TraceVersions
    inputs: ProvenanceRefs
    events: List[TraceEvent]
    decision_graph: Optional[DecisionGraph] = None
    metadata: TraceMetadata = TraceMetadata()
