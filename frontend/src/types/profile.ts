export type SkinType = 'oily' | 'dry' | 'combination' | 'balanced_normal' | 'unsure';
export type PrimaryGoal = 'fewer_visible_breakouts' | 'calmer_looking_skin' | 'more_even_looking_tone' | 'improved_hydration' | 'smoother_looking_texture' | 'simpler_routine' | 'prevention_focused_routine';
export type SensitivityTendency = 'low' | 'moderate' | 'high' | 'unsure';
export type SunscreenFrequency = 'daily' | 'most_days' | 'occasionally' | 'rarely' | 'never';
export type RoutineExperience = 'beginner' | 'familiar' | 'advanced';
export type Climate = 'hot_humid' | 'hot_dry' | 'cold_dry' | 'temperate' | 'mixed_seasonal' | 'unsure';

export interface SubmissionCreate {
  skin_type: SkinType;
  current_concerns: string[];
  primary_goal: PrimaryGoal;
  sensitivity_tendency: SensitivityTendency;
  routine_product_categories: string[];
  active_ingredient_categories: string[];
  sunscreen_frequency: SunscreenFrequency;
  routine_experience: RoutineExperience;
  clinician_directed_treatment: boolean;
  known_reaction_categories: string[];
  known_reaction_other_note?: string | null;
  preference_avoid_categories: string[];
  climate?: Climate | null;
}

export interface SkinProfile {
  id: string;
  user_id: string;
  skin_type: SkinType;
  current_concerns: string[];
  primary_goal: PrimaryGoal;
  sensitivity_tendency: SensitivityTendency;
  routine_product_categories: string[];
  active_ingredient_categories: string[];
  sunscreen_frequency: SunscreenFrequency;
  routine_experience: RoutineExperience;
  clinician_directed_treatment: boolean;
  known_reaction_categories: string[];
  known_reaction_other_note: string | null;
  preference_avoid_categories: string[];
  climate: Climate | null;
  created_at: string;
  updated_at: string;
}
