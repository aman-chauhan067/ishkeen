from typing import Any, Dict
from app.services.recommendation.schema import RecommendationTrace, DecisionNode, DecisionEdge
from app.services.recommendation.graph import GraphBuilder, DecisionGraph

class DebugSerializer:
    @staticmethod
    def build_payload(trace: RecommendationTrace) -> Dict[str, Any]:
        """
        Builds the developer debug payload from a RecommendationTrace.
        """
        graph, errors = GraphBuilder().build(trace)
        
        return {
            "RecommendationTrace": trace.model_dump(mode="json"),
            "DecisionGraph": graph.model_dump(mode="json") if graph else {"errors": errors},
            "execution_hash": trace.execution_hash,
            "versions": trace.versions.model_dump(mode="json")
        }
