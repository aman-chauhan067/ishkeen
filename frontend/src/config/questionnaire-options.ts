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
  { value: 'oily', label: 'Oily', description: 'Excess shine across entire face' },
  { value: 'dry', label: 'Dry', description: 'Tight, flaky, or lacking oil/sebum' },
  { value: 'combination', label: 'Combination (Oily / Dry)', description: 'Oily T-zone with dry or dehydrated cheeks' },
  { value: 'balanced_normal', label: 'Balanced / Normal', description: 'Neither overly oily nor dry' },
  { value: 'unsure', label: 'Unsure', description: 'Need AI clinical analysis to determine' },
];

export const CURRENT_CONCERNS_OPTIONS: OptionConfig[] = [
  { value: 'breakouts', label: 'Acne & Breakouts', description: 'Active blemishes, pustules, or acne vulgaris' },
  { value: 'rosacea', label: 'Rosacea / Chronic Redness', description: 'Persistent facial flushing, erythema, or vascular reactivity' },
  { value: 'dryness_or_dehydration', label: 'Dryness / Flakiness', description: 'Tightness, rough texture, or lipid deficiency' },
  { value: 'dehydration', label: 'Dehydrated Skin', description: 'Water depletion, tightness despite oil production' },
  { value: 'excess_oiliness', label: 'Excess Oiliness & Shine', description: 'Overactive sebum production across face' },
  { value: 'hyperpigmentation', label: 'Hyperpigmentation & Dark Spots', description: 'Sun spots, post-inflammatory pigmentation, or age spots' },
  { value: 'melasma', label: 'Melasma / Hormonal Pigmentation', description: 'Symmetrical brownish or grayish facial patches' },
  { value: 'post_acne_marks', label: 'Post-Acne Marks (PIE / PIH)', description: 'Red or brown lingering marks after blemishes heal' },
  { value: 'wrinkles_fine_lines', label: 'Wrinkles & Fine Lines', description: 'Visible expression lines, crow’s feet, or loss of elasticity' },
  { value: 'fine_lines', label: 'Early Fine Lines', description: 'Subtle surface expression lines' },
  { value: 'irritated_skin', label: 'Irritated / Compromised Barrier', description: 'Stinging, burning, peeling, or damaged moisture barrier' },
  { value: 'eczema_prone', label: 'Eczema / Dermatitis-Prone', description: 'Dry, itchy, or reactive patches' },
  { value: 'sensitivity', label: 'Sensitivity & Reactivity', description: 'Easily flushed or reactive to skincare products' },
  { value: 'enlarged_pores', label: 'Enlarged or Clogged Pores', description: 'Visible pore texture, blackheads, or sebaceous filaments' },
  { value: 'clogged_pores', label: 'Clogged Pores & Comedones', description: 'Congested follicles or sebaceous filaments' },
  { value: 'sun_damage', label: 'Sun Damage / Photoaging', description: 'UV-induced texture changes and solar lentigines' },
  { value: 'uneven_tone', label: 'Uneven Skin Tone', description: 'Blotchy or irregular facial complexion' },
  { value: 'visible_texture', label: 'Rough / Uneven Texture', description: 'Bumpy skin surface or keratin buildup' },
  { value: 'dullness', label: 'Dullness / Lack of Radiance', description: 'Lacking natural luminosity or cellular turnover' },
  { value: 'dark_circles', label: 'Dark Circles & Under-Eye Puffiness', description: 'Periorbital pigmentation or fluid retention' },
  { value: 'redness', label: 'Localized Redness', description: 'Patchy erythema or flushing' },
  { value: 'visible_pigmentation', label: 'Visible Pigmentation', description: 'Discoloration or melanin patches' },
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
