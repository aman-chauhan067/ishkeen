from typing import List, Tuple, Set, Optional
from app.services.recommendation.schema import SafetyDecision, DeferredGuidance, IngredientGuidance
from app.services.recommendation.context import RecommendationContext
from app.services.recommendation.knowledge import KnowledgeBase
from app.services.recommendation.trace import TraceBuilder

class PolicyEngine:
    def __init__(self, context: RecommendationContext, knowledge: KnowledgeBase, trace_builder: Optional[TraceBuilder] = None):
        self.context = context
        self.knowledge = knowledge
        self.trace_builder = trace_builder
        self.decisions: List[SafetyDecision] = []
        self.explanation_codes: Set[str] = set()
        
    def _add_decision(self, decision: SafetyDecision):
        self.decisions.append(decision)
        self.explanation_codes.add(decision.reason_code)

    def _trace(self, node_id: str, event_type: str, severity: str, reason_code: str, priority: int = 1):
        if not self.trace_builder: return
        try:
            self.trace_builder.add_event(
                node_id=node_id,
                event_type=event_type,
                severity=severity,
                reason_code=reason_code,
                priority=priority
            )
        except Exception:
            pass

    def apply_policies(self, raw_candidates: List[str]) -> Tuple[List[str], List[DeferredGuidance]]:
        """
        Takes generated candidates and applies the strict safety policy order:
        1. Hard Exclusions (Reactions/Preferences)
        2. Clinician-Care Restrictions
        3. Routine Duplication Prevention
        4. Active Stacking & Complexity Caps
        5. Sensitivity Down-ranking
        6. Simpler Routine Behavior
        """
        # We process uniquely to avoid dupes, but keep order stable
        candidates = []
        for c in raw_candidates:
            if c not in candidates:
                candidates.append(c)
                
        deferred = []
        
        # 1. Hard Exclusions
        self._trace("policy:hard_exclusions", "RULE_EVALUATED", "info", "STARTED", 1)
        candidates, deferred = self._apply_hard_exclusions(candidates, deferred)
        
        # 2. Clinician-Care
        self._trace("policy:clinician_care", "RULE_EVALUATED", "info", "STARTED", 2)
        candidates, deferred = self._apply_clinician_care(candidates, deferred)
        
        # 3. Routine Duplication
        self._trace("policy:routine_duplication", "RULE_EVALUATED", "info", "STARTED", 3)
        candidates, deferred = self._apply_routine_duplication(candidates, deferred)
        
        # 5. Sensitivity Downgrade (Run before complexity so we don't waste slots on things we'll drop)
        self._trace("policy:sensitivity_downgrade", "RULE_EVALUATED", "info", "STARTED", 4)
        candidates, deferred = self._apply_sensitivity(candidates, deferred)
        
        # 4 & 6. Complexity Caps and Simpler Routine
        self._trace("policy:complexity_caps", "RULE_EVALUATED", "info", "STARTED", 5)
        candidates, deferred = self._apply_complexity_caps(candidates, deferred)
        
        return candidates, deferred

    def _apply_hard_exclusions(self, candidates: List[str], deferred: List[DeferredGuidance]):
        filtered = []
        for c in candidates:
            if c in self.context.known_reaction_categories:
                self._add_decision(SafetyDecision(decision_type="EXCLUDE", category=c, reason_code="EXCLUDED_KNOWN_REACTION"))
                deferred.append(DeferredGuidance(category=c, reason_code="EXCLUDED_KNOWN_REACTION"))
                self._trace(f"candidate:{c}", "CANDIDATE_REJECTED", "warning", "EXCLUDED_KNOWN_REACTION", 1)
            elif c in self.context.preference_avoid_categories:
                self._add_decision(SafetyDecision(decision_type="EXCLUDE", category=c, reason_code="EXCLUDED_USER_PREFERENCE"))
                deferred.append(DeferredGuidance(category=c, reason_code="EXCLUDED_USER_PREFERENCE"))
                self._trace(f"candidate:{c}", "CANDIDATE_REJECTED", "info", "EXCLUDED_USER_PREFERENCE", 1)
            else:
                filtered.append(c)
        return filtered, deferred

    def _apply_clinician_care(self, candidates: List[str], deferred: List[DeferredGuidance]):
        if not self.context.clinician_directed_treatment:
            return candidates, deferred
            
        filtered = []
        for c in candidates:
            # We don't add ANY new actives if under clinician care.
            self._add_decision(SafetyDecision(decision_type="DEFER", category=c, reason_code="CONSERVATIVE_CLINICIAN_CARE"))
            deferred.append(DeferredGuidance(category=c, reason_code="CONSERVATIVE_CLINICIAN_CARE"))
            self._trace(f"candidate:{c}", "CANDIDATE_DEFERRED", "info", "CONSERVATIVE_CLINICIAN_CARE", 2)
        return filtered, deferred

    def _apply_routine_duplication(self, candidates: List[str], deferred: List[DeferredGuidance]):
        filtered = []
        for c in candidates:
            if c in self.context.active_ingredient_categories:
                self._add_decision(SafetyDecision(decision_type="CONTINUE_EXISTING", category=c, reason_code="ALREADY_USING_CATEGORY"))
                filtered.append(c) # still a candidate, but flagged as existing
                self._trace(f"candidate:{c}", "SAFETY_FILTER_APPLIED", "info", "ALREADY_USING_CATEGORY", 3)
            else:
                filtered.append(c)
        return filtered, deferred

    def _apply_complexity_caps(self, candidates: List[str], deferred: List[DeferredGuidance]):
        filtered = []
        
        # Calculate max new actives allowed
        max_actives = 1
        if self.context.routine_experience == "familiar":
            max_actives = 2
        elif self.context.routine_experience == "advanced":
            max_actives = 3
            
        if self.context.primary_goal == "simpler_routine":
            max_actives = 1
            self._add_decision(SafetyDecision(decision_type="LIMIT_COMPLEXITY", category=None, reason_code="SIMPLER_ROUTINE_PRIORITIZED"))
            self._trace("policy:complexity_caps", "SAFETY_FILTER_APPLIED", "info", "SIMPLER_ROUTINE_PRIORITIZED", 5)
            
        current_active_count = len([c for c in self.context.active_ingredient_categories if c != "none" and c != "unknown_active"])
        available_slots = max(0, max_actives - current_active_count)
        
        new_actives_added = 0
        for c in candidates:
            if c in self.context.active_ingredient_categories:
                filtered.append(c) # existing ones pass through complexity cap
            else:
                if new_actives_added < available_slots:
                    filtered.append(c)
                    new_actives_added += 1
                else:
                    self._add_decision(SafetyDecision(decision_type="DEFER", category=c, reason_code="COMPLEXITY_LIMIT_ENFORCED"))
                    deferred.append(DeferredGuidance(category=c, reason_code="COMPLEXITY_LIMIT_ENFORCED"))
                    self._trace(f"candidate:{c}", "CANDIDATE_DEFERRED", "info", "COMPLEXITY_LIMIT_ENFORCED", 5)
        return filtered, deferred

    def _apply_sensitivity(self, candidates: List[str], deferred: List[DeferredGuidance]):
        is_sensitive = self.context.sensitivity_tendency in ["high", "unsure"]
        
        filtered = []
        for c in candidates:
            meta = self.knowledge.get_metadata(c)
            if not meta:
                filtered.append(c)
                continue
                
            if is_sensitive and meta.irritation_potential == "high":
                # Check for alternatives? For now, we drop it for safety.
                self._add_decision(SafetyDecision(decision_type="DOWNGRADE", category=c, reason_code="SENSITIVITY_DOWNGRADE"))
                deferred.append(DeferredGuidance(category=c, reason_code="SENSITIVITY_DOWNGRADE"))
                self._trace(f"candidate:{c}", "CANDIDATE_REJECTED", "warning", "SENSITIVITY_DOWNGRADE", 4)
            else:
                filtered.append(c)
                
        return filtered, deferred
