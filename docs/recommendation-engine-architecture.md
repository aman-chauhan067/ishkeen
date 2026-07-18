# Recommendation Engine Architecture

## 1. Core Architectural Decision: Deterministic Rules Engine (Option C)

We have evaluated the architectural options (Pure Rules, Direct LLM, Rules + LLM Explanation, RAG + LLM). 
**Selected Architecture**: Option C - Deterministic Candidate Generation + Deterministic Safety Filters + Optional LLM Explanation Layer (Future).

**Rationale**:
- **Safety**: A pure LLM cannot reliably respect hard boolean exclusions (e.g., known reactions) 100% of the time, risking severe user harm.
- **Determinism & Testability**: A rules engine allows rigorous unit testing and reproducible outputs for the exact same inputs.
- **Explainability**: Every decision maps strictly to a reason code.
- **Future-proofing**: The deterministic output can be passed to an LLM in Phase 6B/7 for styling and verbalization without risking the integrity of the clinical/safety logic.

## 2. Exact V1 Engine Boundary

**Input Contract**:
The exact executable V1 boundary accepts strictly:
- `questionnaire_submission`: An immutable snapshot of the user's answers.
- `engine_version`: The Semver version of the executing engine.
- `policy_version`: The Semver version of the safety policy logic.
- `knowledge_version`: The Semver/Date version of the loaded knowledge graph.
*(No ML result participates in V1 decisions, and no normalized profile projection is required unless specifically needed for caching).*

**Output Contract (RecommendationResult)**:
The internal result returned by the engine is a strictly typed object that guarantees no commercial product bias and supports zero active-treatment recommendations as a valid success state.

```python
class RecommendationResult(BaseModel):
    routine_slots: List[RoutineSlot] # cleanser, treatment, moisturizer, sunscreen
    ingredient_guidance: List[IngredientGuidance] # Permitted actives
    deferred_guidance: List[DeferredGuidance] # Actives blocked for safety
    safety_adjustments: List[SafetyDecision] # Traces of exclusions/downgrades
    explanation_codes: List[str]
    provenance_refs: ProvenanceRefs # { "questionnaire_id": UUID }
    engine_version: str
    policy_version: str
    knowledge_version: str
```
## 3. Knowledge Base Representation

**Selected Representation**: Hybrid Typed Rules + Versioned Policy Data.
- Core safety logic (Priority sorting, conflict resolution) will live as **Python Code** to ensure type safety and deterministic execution.
- The Knowledge Graph (Concern -> Candidates mapping) will live in **JSON/YAML policy files**.
- This ensures that updating ingredient mappings doesn't require rewriting complex engine loops, while keeping the critical safety execution mathematically rigorous.

## 4. API Contract (Future Phase 6B)

```http
POST /api/recommendations/generate
```
**Behavior**: Synchronously generates a new recommendation based on the *latest* `QuestionnaireSubmission` and *latest* valid `SkinAnalysis` (if present and fresh).
- If ML is unavailable, it gracefully generates a questionnaire-only recommendation and explicitly tags it with `USER-REPORTED` provenance.
- If the questionnaire contains legacy/deprecated vocabulary, the engine applies compatibility mapping or refuses generation (422) if safety cannot be guaranteed.

```http
GET /api/recommendations/latest
```
Returns the most recently generated, persisted recommendation.

## 5. Frontend Contract (Future Phase 6B)

The UI must be designed to natively reflect provenance:
- **Visual Segregation**: "Based on your questionnaire" vs "Based on your image analysis".
- **Safety Transparency**: Warnings like "Because you reported high sensitivity..." must be prominently attached to the deferred or swapped items.
- **Design Reference**: Must align with the Origin Studio aesthetic—premium, editorial, minimal.

## 6. Proposed Domain Model

```python
class RecommendationRun(Base):
    id = UUID()
    user_id = UUID()
    questionnaire_submission_id = UUID()
    skin_analysis_id = UUID(nullable=True)
    engine_version = String()
    policy_version = String()
    knowledge_version = String()
    status = String() # generated, failed
    created_at = DateTime()
    
class RecommendationItem(Base):
    id = UUID()
    recommendation_run_id = UUID()
    routine_step = String() # cleanser, treatment, moisturizer, sunscreen
    category = String() # e.g., bha_salicylic_acid, gentle_cleanser
    priority = Integer()
    explanation_codes = ARRAY(String())
```

*Note: Safety Decisions (e.g., exclusions) will NOT be persisted in relational rows to avoid DB bloat. They will be stored in an immutable decision trace JSON attached to the `RecommendationRun`.*
