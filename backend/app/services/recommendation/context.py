from pydantic import BaseModel, Field
from typing import List, Optional

class RecommendationContext(BaseModel):
    skin_type: str = "unsure"
    current_concerns: List[str] = Field(default_factory=list)
    primary_goal: str = "prevention_focused_routine"
    sensitivity_tendency: str = "unsure"
    routine_product_categories: List[str] = Field(default_factory=list)
    active_ingredient_categories: List[str] = Field(default_factory=list)
    sunscreen_frequency: str = "unsure"
    routine_experience: str = "beginner"
    clinician_directed_treatment: bool = False
    known_reaction_categories: List[str] = Field(default_factory=list)
    preference_avoid_categories: List[str] = Field(default_factory=list)
    climate: str = "unsure"
