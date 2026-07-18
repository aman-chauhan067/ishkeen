import type { 
  SkinType, 
  PrimaryGoal, 
  SensitivityTendency, 
  RoutineExperience, 
  SunscreenFrequency, 
  Climate 
} from '../types/profile';

export interface OptionConfig<T = string> {
  value: T;
  label: string;
  description?: string;
}

export const SKIN_TYPE_OPTIONS: OptionConfig<SkinType>[] = [
  { value: 'oily', label: 'Oily' },
  { value: 'dry', label: 'Dry' },
  { value: 'combination', label: 'Combination' },
  { value: 'balanced_normal', label: 'Balanced / Normal' },
  { value: 'unsure', label: 'Unsure' },
];

export const CURRENT_CONCERNS_OPTIONS: OptionConfig[] = [
  { value: 'breakouts', label: 'Breakouts' },
  { value: 'post_acne_marks', label: 'Post-acne marks' },
  { value: 'uneven_tone', label: 'Uneven tone' },
  { value: 'visible_pigmentation', label: 'Visible pigmentation' },
  { value: 'redness', label: 'Redness' },
  { value: 'sensitivity', label: 'Sensitivity' },
  { value: 'dryness_or_dehydration', label: 'Dryness or dehydration' },
  { value: 'excess_oiliness', label: 'Excess oiliness' },
  { value: 'visible_texture', label: 'Visible texture' },
  { value: 'clogged_pores', label: 'Clogged pores' },
  { value: 'fine_lines', label: 'Fine lines' },
  { value: 'dullness', label: 'Dullness' },
];

export const PRIMARY_GOAL_OPTIONS: OptionConfig<PrimaryGoal>[] = [
  { value: 'fewer_visible_breakouts', label: 'Fewer visible breakouts' },
  { value: 'calmer_looking_skin', label: 'Calmer looking skin' },
  { value: 'more_even_looking_tone', label: 'More even looking tone' },
  { value: 'improved_hydration', label: 'Improved hydration' },
  { value: 'smoother_looking_texture', label: 'Smoother looking texture' },
  { value: 'simpler_routine', label: 'Simpler routine' },
  { value: 'prevention_focused_routine', label: 'Prevention focused routine' },
];

export const SENSITIVITY_TENDENCY_OPTIONS: OptionConfig<SensitivityTendency>[] = [
  { value: 'low', label: 'Low' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'high', label: 'High' },
  { value: 'unsure', label: 'Unsure' },
];

export const ROUTINE_PRODUCT_CATEGORIES_OPTIONS: OptionConfig[] = [
  { value: 'cleanser', label: 'Cleanser' },
  { value: 'moisturizer', label: 'Moisturizer' },
  { value: 'sunscreen', label: 'Sunscreen' },
  { value: 'serum_or_treatment', label: 'Serum or Treatment' },
  { value: 'none', label: 'None' },
];

export const ACTIVE_INGREDIENT_CATEGORIES_OPTIONS: OptionConfig[] = [
  { value: 'retinoid_type', label: 'Retinoid type' },
  { value: 'bha_salicylic_acid', label: 'BHA / Salicylic acid' },
  { value: 'aha_glycolic_lactic_acid', label: 'AHA / Glycolic & Lactic acid' },
  { value: 'benzoyl_peroxide', label: 'Benzoyl peroxide' },
  { value: 'azelaic_acid', label: 'Azelaic acid' },
  { value: 'vitamin_c', label: 'Vitamin C' },
  { value: 'niacinamide', label: 'Niacinamide' },
  { value: 'pigment_targeting_active', label: 'Pigment-targeting active' },
  { value: 'unknown_active', label: 'Unknown active' },
  { value: 'none', label: 'None' },
];

export const SUNSCREEN_FREQUENCY_OPTIONS: OptionConfig<SunscreenFrequency>[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'most_days', label: 'Most days' },
  { value: 'occasionally', label: 'Occasionally' },
  { value: 'rarely', label: 'Rarely' },
  { value: 'never', label: 'Never' },
];

export const ROUTINE_EXPERIENCE_OPTIONS: OptionConfig<RoutineExperience>[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'familiar', label: 'Familiar' },
  { value: 'advanced', label: 'Advanced' },
];

export const CLINICIAN_DIRECTED_TREATMENT_OPTIONS: OptionConfig<boolean>[] = [
  { value: true, label: 'Yes' },
  { value: false, label: 'No' },
];

export const KNOWN_REACTION_CATEGORIES_OPTIONS: OptionConfig[] = [
  { value: 'fragrance', label: 'Fragrance' },
  { value: 'essential_oils', label: 'Essential oils' },
  { value: 'retinoid_type', label: 'Retinoid type' },
  { value: 'bha_salicylic_acid', label: 'BHA / Salicylic acid' },
  { value: 'aha_acids', label: 'AHA acids' },
  { value: 'benzoyl_peroxide', label: 'Benzoyl peroxide' },
  { value: 'vitamin_c', label: 'Vitamin C' },
  { value: 'niacinamide', label: 'Niacinamide' },
  { value: 'other_known', label: 'Other known reaction' },
  { value: 'none', label: 'None' },
];

export const PREFERENCE_AVOID_CATEGORIES_OPTIONS: OptionConfig[] = [
  { value: 'fragrance', label: 'Fragrance' },
  { value: 'essential_oils', label: 'Essential oils' },
  { value: 'retinoid_type', label: 'Retinoid type' },
  { value: 'bha_salicylic_acid', label: 'BHA / Salicylic acid' },
  { value: 'aha_acids', label: 'AHA acids' },
  { value: 'benzoyl_peroxide', label: 'Benzoyl peroxide' },
  { value: 'vitamin_c', label: 'Vitamin C' },
  { value: 'niacinamide', label: 'Niacinamide' },
  { value: 'other_known', label: 'Other known reaction' },
  { value: 'none', label: 'None' },
];

export const CLIMATE_OPTIONS: OptionConfig<Climate>[] = [
  { value: 'hot_humid', label: 'Hot and humid' },
  { value: 'hot_dry', label: 'Hot and dry' },
  { value: 'cold_dry', label: 'Cold and dry' },
  { value: 'temperate', label: 'Temperate' },
  { value: 'mixed_seasonal', label: 'Mixed seasonal' },
  { value: 'unsure', label: 'Unsure' },
];
