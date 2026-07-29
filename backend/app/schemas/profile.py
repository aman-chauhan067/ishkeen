from pydantic import BaseModel, ConfigDict, Field, model_validator, field_validator
from typing import List, Optional, Any
from datetime import datetime
from uuid import UUID

from app.models.profile import (
    SkinType,
    PrimaryGoal,
    SensitivityTendency,
    SunscreenFrequency,
    RoutineExperience,
    Climate
)

def check_no_duplicates(v: List[str]) -> List[str]:
    if v is None:
        return v
    if len(v) != len(set(v)):
        raise ValueError("Duplicate values are not allowed")
    return v

def check_none_exclusivity(v: List[str]) -> List[str]:
    if v is None:
        return v
    if "none" in v and len(v) > 1:
        raise ValueError("'none' cannot be combined with other selections")
    return v

# All allowed values for the array fields to prevent arbitrary strings
ALLOWED_ROUTINE_CATEGORIES = {"cleanser", "moisturizer", "sunscreen", "serum_or_treatment", "none"}
ALLOWED_ACTIVE_CATEGORIES = {"retinoid_type", "bha_salicylic_acid", "aha_glycolic_lactic_acid", "benzoyl_peroxide", "azelaic_acid", "vitamin_c", "niacinamide", "pigment_targeting_active", "unknown_active", "none"}
ALLOWED_REACTION_CATEGORIES = {"fragrance", "essential_oils", "retinoid_type", "bha_salicylic_acid", "aha_acids", "benzoyl_peroxide", "vitamin_c", "niacinamide", "other_known", "none"}
ALLOWED_CONCERNS = {
    "breakouts", "acne_breakouts",
    "post_acne_marks", "uneven_tone", "visible_pigmentation", "redness",
    "sensitivity", "dryness_or_dehydration", "excess_oiliness", "visible_texture",
    "clogged_pores", "enlarged_pores",
    "fine_lines", "wrinkles_fine_lines", "wrinkles",
    "dullness", "rosacea", "dehydration", "hyperpigmentation", "melasma",
    "irritated_skin", "damaged_barrier", "eczema_prone", "sun_damage", "dark_circles"
}

def validate_vocabulary(v: List[str], allowed: set) -> List[str]:
    if v is None:
        return v
    for item in v:
        if item not in allowed:
            raise ValueError(f"Invalid value: {item}")
    return v

class SubmissionCreate(BaseModel):
    # Step 1
    skin_type: SkinType
    current_concerns: List[str] = Field(..., min_length=1, max_length=5)
    primary_goal: PrimaryGoal
    sensitivity_tendency: SensitivityTendency
    
    # Step 2
    routine_product_categories: List[str] = Field(..., min_length=1)
    active_ingredient_categories: List[str] = Field(..., min_length=1)
    sunscreen_frequency: SunscreenFrequency
    routine_experience: RoutineExperience
    
    # Step 3
    clinician_directed_treatment: bool
    known_reaction_categories: List[str] = Field(default_factory=list)
    known_reaction_other_note: Optional[str] = Field(None, max_length=200)
    preference_avoid_categories: List[str] = Field(default_factory=list)
    climate: Optional[Climate] = None
    
    model_config = ConfigDict(extra="forbid")

    @field_validator("current_concerns")
    def validate_concerns_vocab(cls, v):
        return validate_vocabulary(v, ALLOWED_CONCERNS)
        
    @field_validator("routine_product_categories")
    def validate_routine_vocab(cls, v):
        return validate_vocabulary(v, ALLOWED_ROUTINE_CATEGORIES)
        
    @field_validator("active_ingredient_categories")
    def validate_actives_vocab(cls, v):
        return validate_vocabulary(v, ALLOWED_ACTIVE_CATEGORIES)
        
    @field_validator("known_reaction_categories", "preference_avoid_categories")
    def validate_reactions_vocab(cls, v):
        return validate_vocabulary(v, ALLOWED_REACTION_CATEGORIES)

    @field_validator(
        "current_concerns",
        "routine_product_categories",
        "active_ingredient_categories",
        "known_reaction_categories",
        "preference_avoid_categories",
    )
    def validate_no_duplicates(cls, v):
        return check_no_duplicates(v)

    @field_validator(
        "routine_product_categories",
        "active_ingredient_categories",
        "known_reaction_categories",
        "preference_avoid_categories",
    )
    def validate_none_exclusivity(cls, v):
        return check_none_exclusivity(v)

    @model_validator(mode="after")
    def validate_other_note(self):
        if self.known_reaction_other_note is not None:
            self.known_reaction_other_note = self.known_reaction_other_note.strip()
            if not self.known_reaction_other_note:
                self.known_reaction_other_note = None
                
        has_other_known = "other_known" in self.known_reaction_categories
        
        if self.known_reaction_other_note and not has_other_known:
            raise ValueError("known_reaction_other_note is only allowed when 'other_known' is selected")
            
        if has_other_known and not self.known_reaction_other_note:
            raise ValueError("known_reaction_other_note is required when 'other_known' is selected")
            
        return self

class SkinProfileUpdate(BaseModel):
    skin_type: Optional[SkinType] = None
    current_concerns: Optional[List[str]] = Field(None, min_length=1, max_length=5)
    primary_goal: Optional[PrimaryGoal] = None
    sensitivity_tendency: Optional[SensitivityTendency] = None
    
    routine_product_categories: Optional[List[str]] = Field(None, min_length=1)
    active_ingredient_categories: Optional[List[str]] = Field(None, min_length=1)
    sunscreen_frequency: Optional[SunscreenFrequency] = None
    routine_experience: Optional[RoutineExperience] = None
    
    clinician_directed_treatment: Optional[bool] = None
    known_reaction_categories: Optional[List[str]] = None
    known_reaction_other_note: Optional[str] = Field(None, max_length=200)
    preference_avoid_categories: Optional[List[str]] = None
    climate: Optional[Climate] = None
    
    model_config = ConfigDict(extra="forbid")

    @field_validator("current_concerns")
    def validate_concerns_vocab(cls, v):
        return validate_vocabulary(v, ALLOWED_CONCERNS)
        
    @field_validator("routine_product_categories")
    def validate_routine_vocab(cls, v):
        return validate_vocabulary(v, ALLOWED_ROUTINE_CATEGORIES)
        
    @field_validator("active_ingredient_categories")
    def validate_actives_vocab(cls, v):
        return validate_vocabulary(v, ALLOWED_ACTIVE_CATEGORIES)
        
    @field_validator("known_reaction_categories", "preference_avoid_categories")
    def validate_reactions_vocab(cls, v):
        return validate_vocabulary(v, ALLOWED_REACTION_CATEGORIES)

    @field_validator(
        "current_concerns",
        "routine_product_categories",
        "active_ingredient_categories",
        "known_reaction_categories",
        "preference_avoid_categories",
    )
    def validate_no_duplicates(cls, v):
        return check_no_duplicates(v)

    @field_validator(
        "routine_product_categories",
        "active_ingredient_categories",
        "known_reaction_categories",
        "preference_avoid_categories",
    )
    def validate_none_exclusivity(cls, v):
        return check_none_exclusivity(v)

    @model_validator(mode="before")
    def validate_required_fields_not_null(cls, values):
        if not isinstance(values, dict):
            return values
        required_keys = [
            "skin_type", "current_concerns", "primary_goal", "sensitivity_tendency",
            "routine_product_categories", "active_ingredient_categories", "sunscreen_frequency",
            "routine_experience", "clinician_directed_treatment", "known_reaction_categories",
            "preference_avoid_categories"
        ]
        for key in required_keys:
            if key in values and values[key] is None:
                raise ValueError(f"{key} cannot be explicitly null")
        return values

    @model_validator(mode="after")
    def validate_other_note(self):
        if self.known_reaction_other_note is not None:
            self.known_reaction_other_note = self.known_reaction_other_note.strip()
            if not self.known_reaction_other_note:
                self.known_reaction_other_note = None
                
        # If reaction categories is being updated to remove other_known, we should require known_reaction_other_note to be cleared or the service handles it.
        # But since this is a partial update, we don't have the full context here.
        # The service layer must handle the strict invariant check across the merged state.
        if self.known_reaction_categories is not None:
            has_other_known = "other_known" in self.known_reaction_categories
            if has_other_known and self.known_reaction_other_note is None:
                # We can't strictly reject missing note here because it might already be in DB. 
                pass
        return self

class SkinProfileResponse(BaseModel):
    id: UUID
    user_id: UUID
    skin_type: SkinType
    current_concerns: List[str]
    primary_goal: PrimaryGoal
    sensitivity_tendency: SensitivityTendency
    routine_product_categories: List[str]
    active_ingredient_categories: List[str]
    sunscreen_frequency: SunscreenFrequency
    routine_experience: RoutineExperience
    clinician_directed_treatment: bool
    known_reaction_categories: List[str]
    known_reaction_other_note: Optional[str]
    preference_avoid_categories: List[str]
    climate: Optional[Climate]
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class SubmissionResponse(BaseModel):
    id: UUID
    user_id: UUID
    version: str
    answers: dict
    submitted_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
