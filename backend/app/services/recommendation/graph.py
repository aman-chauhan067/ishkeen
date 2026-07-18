from typing import List, Tuple, Dict, Set, Optional
from collections import defaultdict
from app.services.recommendation.schema import RecommendationTrace, DecisionGraph, DecisionNode, DecisionEdge

class GraphBuilder:
    def __init__(self):
        self.nodes: Dict[str, DecisionNode] = {}
        self.edges: List[DecisionEdge] = []
        self.errors: List[str] = []

    def _add_node(self, node_id: str, node_type: str, label: str):
        if node_id in self.nodes:
            if self.nodes[node_id].type != node_type:
                self.errors.append(f"Node {node_id} redefined with different type: {node_type} vs {self.nodes[node_id].type}")
            return
        
        if node_type not in ["evidence", "candidate", "rule", "action", "slot"]:
            self.errors.append(f"Invalid node type: {node_type}")
            return
            
        self.nodes[node_id] = DecisionNode(id=node_id, type=node_type, label=label)

    def _add_edge(self, source: str, target: str, edge_type: str, reason_code: Optional[str] = None):
        if edge_type not in ["triggers", "evaluated_by", "results_in", "assigned_to"]:
            self.errors.append(f"Invalid edge type: {edge_type}")
            return
            
        sig = f"{source}->{target}:{edge_type}"
        for e in self.edges:
            if f"{e.source}->{e.target}:{e.type}" == sig:
                self.errors.append(f"Duplicate edge detected: {sig}")
                return
                
        self.edges.append(DecisionEdge(source=source, target=target, type=edge_type, reason_code=reason_code))

    def build(self, trace: RecommendationTrace) -> Tuple[Optional[DecisionGraph], List[str]]:
        self.nodes.clear()
        self.edges.clear()
        self.errors.clear()
        
        # Deterministic event sort using execution order
        events = sorted(trace.events, key=lambda e: e.execution_order)
        
        last_rule_id = None
        
        for e in events:
            # 1. Ensure the referenced node exists
            if e.node_id.startswith("candidate:"):
                self._add_node(e.node_id, "candidate", e.node_id)
            elif e.node_id.startswith("policy:"):
                self._add_node(e.node_id, "rule", e.node_id)
            elif e.node_id.startswith("slot:"):
                self._add_node(e.node_id, "slot", e.node_id)
            elif e.node_id == "engine":
                self._add_node(e.node_id, "evidence", "Engine")
                
            # 2. Build logic based on event type
            if e.event_type == "EVIDENCE_INGESTED":
                pass # Node already added above
                
            elif e.event_type == "CANDIDATE_GENERATED":
                self._add_edge("engine", e.node_id, "triggers", e.reason_code)
                
            elif e.event_type == "RULE_EVALUATED":
                self._add_edge("engine", e.node_id, "triggers", e.reason_code)
                last_rule_id = e.node_id
                
            elif e.event_type in ["CANDIDATE_REJECTED", "CANDIDATE_DEFERRED", "SAFETY_FILTER_APPLIED"]:
                action_id = str(e.event_id)
                self._add_node(action_id, "action", e.event_type)
                
                if last_rule_id:
                    self._add_edge(last_rule_id, action_id, "results_in", e.reason_code)
                else:
                    self._add_edge("engine", action_id, "results_in", e.reason_code)
                    
                # Action points to the affected node
                self._add_edge(action_id, e.node_id, "evaluated_by", e.reason_code)
                
            elif e.event_type == "SLOT_ASSIGNED":
                self._add_edge("engine", e.node_id, "results_in", e.reason_code)

        self._validate_graph()
        
        if self.errors:
            return None, self.errors
            
        # Guarantee 100% mathematical determinism
        sorted_nodes = sorted(list(self.nodes.values()), key=lambda n: n.id)
        sorted_edges = sorted(self.edges, key=lambda e: (e.source, e.target, e.type))
        
        return DecisionGraph(
            graph_version="1.0.0",
            deterministic_node_order=[n.id for n in sorted_nodes],
            deterministic_edge_order=[f"{e.source}->{e.target}:{e.type}" for e in sorted_edges],
            nodes=sorted_nodes,
            edges=sorted_edges
        ), []

    def _validate_graph(self):
        node_ids = set(self.nodes.keys())
        
        # 1. Missing Parents & Orphan Nodes
        connected_nodes = set()
        for e in self.edges:
            if e.source not in node_ids:
                self.errors.append(f"Edge source missing: {e.source}")
            if e.target not in node_ids:
                self.errors.append(f"Edge target missing: {e.target}")
            connected_nodes.add(e.source)
            connected_nodes.add(e.target)
            
        for n_id in node_ids:
            # We don't mark 'engine' or isolated nodes that are deliberately isolated if they have no edges?
            # Wait, every node MUST be connected. Orphan detection.
            if n_id not in connected_nodes and n_id != "engine":
                # Is there a valid reason for a node to be an orphan? E.g. execution completed event might not create edges
                # but "engine" is connected to other things. If there's an orphan candidate, it's an error.
                self.errors.append(f"Orphan node detected: {n_id}")
                
        # 2. Cycle Detection (DFS)
        adj = defaultdict(list)
        for e in self.edges:
            adj[e.source].append(e.target)
            
        visited = set()
        rec_stack = set()
        
        def dfs(node):
            visited.add(node)
            rec_stack.add(node)
            for neighbor in adj.get(node, []):
                if neighbor not in visited:
                    if dfs(neighbor):
                        return True
                elif neighbor in rec_stack:
                    return True
            rec_stack.remove(node)
            return False
            
        for n in node_ids:
            if n not in visited:
                if dfs(n):
                    self.errors.append("Cycle detected in the graph")
                    break
