import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../../contexts/ProfileContext';
import { useAuthenticatedApi } from '../../hooks/useAuthenticatedApi';
import { Container } from '../../components/ui/Container';
import { Glass } from '../../components/ui/Glass';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { PageTransition, Fade, HoverLift } from '../../components/motion';
import {
  SKIN_TYPE_OPTIONS,
  CURRENT_CONCERNS_OPTIONS,
  PRIMARY_GOAL_OPTIONS,
  SENSITIVITY_TENDENCY_OPTIONS,
  SUNSCREEN_FREQUENCY_OPTIONS,
  ROUTINE_EXPERIENCE_OPTIONS,
  CLIMATE_OPTIONS,
  KNOWN_REACTION_CATEGORIES_OPTIONS,
  PREFERENCE_AVOID_CATEGORIES_OPTIONS,
  ROUTINE_PRODUCT_CATEGORIES_OPTIONS,
  ACTIVE_INGREDIENT_CATEGORIES_OPTIONS,
} from '../../config/questionnaire-options';
import type { SkinProfile } from '../../types/profile';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const api = useAuthenticatedApi();
  const { profile, status, refreshProfile } = useProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Editable state
  const [editForm, setEditForm] = useState<Partial<SkinProfile>>({});

  const startEditing = () => {
    if (!profile) return;
    setEditForm({
      skin_type: profile.skin_type,
      current_concerns: [...profile.current_concerns],
      primary_goal: profile.primary_goal,
      sensitivity_tendency: profile.sensitivity_tendency,
      routine_product_categories: [...profile.routine_product_categories],
      active_ingredient_categories: [...profile.active_ingredient_categories],
      sunscreen_frequency: profile.sunscreen_frequency,
      routine_experience: profile.routine_experience,
      clinician_directed_treatment: profile.clinician_directed_treatment,
      known_reaction_categories: [...profile.known_reaction_categories],
      known_reaction_other_note: profile.known_reaction_other_note || '',
      preference_avoid_categories: [...profile.preference_avoid_categories],
      climate: profile.climate,
    });
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setErrorMsg(null);
  };

  const handleToggleArrayItem = (field: 'current_concerns' | 'routine_product_categories' | 'active_ingredient_categories' | 'known_reaction_categories' | 'preference_avoid_categories', val: string, maxItems?: number) => {
    setEditForm(prev => {
      const current = prev[field] || [];
      const exists = current.includes(val);
      if (exists) {
        return { ...prev, [field]: current.filter(item => item !== val) };
      } else {
        if (maxItems && current.length >= maxItems) {
          return prev;
        }
        return { ...prev, [field]: [...current, val] };
      }
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setIsSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const updatePayload = {
      skin_type: editForm.skin_type,
      current_concerns: editForm.current_concerns,
      primary_goal: editForm.primary_goal,
      sensitivity_tendency: editForm.sensitivity_tendency,
      routine_product_categories: editForm.routine_product_categories,
      active_ingredient_categories: editForm.active_ingredient_categories,
      sunscreen_frequency: editForm.sunscreen_frequency,
      routine_experience: editForm.routine_experience,
      clinician_directed_treatment: editForm.clinician_directed_treatment,
      known_reaction_categories: editForm.known_reaction_categories,
      known_reaction_other_note: editForm.known_reaction_other_note,
      preference_avoid_categories: editForm.preference_avoid_categories,
      climate: editForm.climate,
    };

    try {
      await api.patch('/skin-profile', updatePayload);
      await refreshProfile();
      setIsEditing(false);
      setSuccessMsg('Your skin profile has been updated successfully.');
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update skin profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (status === 'loading') {
    return (
      <Container className="max-w-4xl pt-32 pb-24 text-center">
        <p className="text-[#4C6072] font-light">Loading your clinical skin profile...</p>
      </Container>
    );
  }

  if (status === 'missing' || !profile) {
    return (
      <Container className="max-w-4xl pt-32 pb-24 text-center">
        <Glass variant="deep" className="p-12 rounded-[32px] space-y-6">
          <h2 className="text-3xl font-editorial text-[#26384B]">No Skin Profile Found</h2>
          <p className="text-[#4C6072] max-w-md mx-auto">
            You haven't completed your diagnostic questionnaire yet. Answer a few questions to unlock tailored clinical recommendations.
          </p>
          <Button onClick={() => navigate('/onboarding')} className="rounded-full px-8 py-3">
            Complete Questionnaire Now
          </Button>
        </Glass>
      </Container>
    );
  }

  const getLabel = (val: string | undefined, options: { value: any; label: string }[]) => {
    if (!val) return 'Not Specified';
    const match = options.find(o => o.value === val);
    return match ? match.label : val.replace(/_/g, ' ');
  };

  const getMultiLabels = (vals: string[] | undefined, options: { value: any; label: string }[]) => {
    if (!vals || vals.length === 0) return ['None Specified'];
    return vals.map(v => {
      const match = options.find(o => o.value === v);
      return match ? match.label : v.replace(/_/g, ' ');
    });
  };

  return (
    <PageTransition>
      <Container className="max-w-4xl pt-16 pb-24">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-editorial text-[#26384B] font-bold tracking-tight">
              Clinical Skin Profile
            </h1>
            <p className="text-[#4C6072] text-sm mt-1">
              Your personalized dermatological baseline and diagnostic preferences.
            </p>
          </div>
          {!isEditing && (
            <HoverLift>
              <Button onClick={startEditing} variant="primary" className="rounded-full px-6 py-2.5">
                Edit Profile
              </Button>
            </HoverLift>
          )}
        </div>

        {successMsg && (
          <Fade className="mb-6">
            <Alert variant="success" message={successMsg} />
          </Fade>
        )}

        {errorMsg && (
          <Fade className="mb-6">
            <Alert variant="error" message={errorMsg} />
          </Fade>
        )}

        {isEditing ? (
          <Glass variant="deep" className="p-8 sm:p-12 rounded-[32px] space-y-8">
            <form onSubmit={handleSave} className="space-y-10">
              <div className="flex items-center justify-between border-b border-[#26384B]/10 pb-4">
                <h2 className="text-2xl font-editorial text-[#26384B] font-bold">Edit Skin Identity</h2>
                <button type="button" onClick={cancelEditing} className="text-sm font-bold uppercase tracking-wider text-[#4C6072] hover:text-[#26384B]">
                  Cancel
                </button>
              </div>

              {/* Skin Type */}
              <div className="space-y-3">
                <label className="block text-sm font-bold uppercase tracking-widest text-[#26384B]">
                  Skin Type
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {SKIN_TYPE_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setEditForm(prev => ({ ...prev, skin_type: opt.value }))}
                      className={`p-3.5 rounded-2xl text-left border text-sm transition-all ${
                        editForm.skin_type === opt.value
                          ? 'border-[#26384B] bg-[#26384B] text-white font-bold'
                          : 'border-[#26384B]/20 bg-white/60 text-[#26384B] hover:border-[#26384B]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Primary Goal */}
              <div className="space-y-3">
                <label className="block text-sm font-bold uppercase tracking-widest text-[#26384B]">
                  Primary Clinical Goal
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PRIMARY_GOAL_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setEditForm(prev => ({ ...prev, primary_goal: opt.value }))}
                      className={`p-3.5 rounded-2xl text-left border text-sm transition-all ${
                        editForm.primary_goal === opt.value
                          ? 'border-[#26384B] bg-[#26384B] text-white font-bold'
                          : 'border-[#26384B]/20 bg-white/60 text-[#26384B] hover:border-[#26384B]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Primary Concerns */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-bold uppercase tracking-widest text-[#26384B]">
                    Primary Concerns (Select up to 5)
                  </label>
                  <span className="text-xs text-[#4C6072]">
                    {(editForm.current_concerns || []).length} / 5 selected
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto p-2 bg-white/40 rounded-2xl border border-[#26384B]/10">
                  {CURRENT_CONCERNS_OPTIONS.map(opt => {
                    const isSelected = (editForm.current_concerns || []).includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleToggleArrayItem('current_concerns', opt.value, 5)}
                        className={`p-3 rounded-xl text-left border text-xs sm:text-sm transition-all flex items-center justify-between ${
                          isSelected
                            ? 'border-[#26384B] bg-[#26384B] text-white font-bold'
                            : 'border-[#26384B]/20 bg-white/60 text-[#26384B] hover:border-[#26384B]'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {isSelected && <span>✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sensitivity & Climate */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="block text-sm font-bold uppercase tracking-widest text-[#26384B]">
                    Sensitivity Tendency
                  </label>
                  <select
                    value={editForm.sensitivity_tendency || 'unsure'}
                    onChange={e => setEditForm(prev => ({ ...prev, sensitivity_tendency: e.target.value as any }))}
                    className="w-full p-3.5 rounded-2xl border border-[#26384B]/20 bg-white/80 text-[#26384B] font-medium focus:outline-none"
                  >
                    {SENSITIVITY_TENDENCY_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="block text-sm font-bold uppercase tracking-widest text-[#26384B]">
                    Climate
                  </label>
                  <select
                    value={editForm.climate || 'unsure'}
                    onChange={e => setEditForm(prev => ({ ...prev, climate: e.target.value as any }))}
                    className="w-full p-3.5 rounded-2xl border border-[#26384B]/20 bg-white/80 text-[#26384B] font-medium focus:outline-none"
                  >
                    {CLIMATE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Routine Experience & Sunscreen */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="block text-sm font-bold uppercase tracking-widest text-[#26384B]">
                    Routine Experience
                  </label>
                  <select
                    value={editForm.routine_experience || 'beginner'}
                    onChange={e => setEditForm(prev => ({ ...prev, routine_experience: e.target.value as any }))}
                    className="w-full p-3.5 rounded-2xl border border-[#26384B]/20 bg-white/80 text-[#26384B] font-medium focus:outline-none"
                  >
                    {ROUTINE_EXPERIENCE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="block text-sm font-bold uppercase tracking-widest text-[#26384B]">
                    Sunscreen Frequency
                  </label>
                  <select
                    value={editForm.sunscreen_frequency || 'never'}
                    onChange={e => setEditForm(prev => ({ ...prev, sunscreen_frequency: e.target.value as any }))}
                    className="w-full p-3.5 rounded-2xl border border-[#26384B]/20 bg-white/80 text-[#26384B] font-medium focus:outline-none"
                  >
                    {SUNSCREEN_FREQUENCY_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Clinician Care */}
              <div className="flex items-center justify-between p-4 bg-white/60 rounded-2xl border border-[#26384B]/10">
                <div>
                  <h4 className="font-bold text-[#26384B] text-sm">Clinician Directed Care</h4>
                  <p className="text-xs text-[#4C6072]">Are you currently under a dermatologist or clinician's care?</p>
                </div>
                <input
                  type="checkbox"
                  checked={!!editForm.clinician_directed_treatment}
                  onChange={e => setEditForm(prev => ({ ...prev, clinician_directed_treatment: e.target.checked }))}
                  className="w-5 h-5 rounded border-[#26384B] text-[#26384B] focus:ring-[#26384B]"
                />
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t border-[#26384B]/10">
                <Button type="button" variant="ghost" onClick={cancelEditing} disabled={isSaving}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={isSaving} className="px-8">
                  Save Changes
                </Button>
              </div>
            </form>
          </Glass>
        ) : (
          <div className="space-y-6">
            {/* Skin Identity Card */}
            <Glass variant="deep" className="p-8 sm:p-10 rounded-[32px]">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#26384B]/10">
                <h3 className="text-xl font-editorial font-bold text-[#26384B]">Skin Identity & Goals</h3>
                <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 bg-[#26384B]/5 text-[#26384B] rounded-full">
                  Verified Baseline
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <span className="block text-xs uppercase tracking-widest text-[#4C6072] mb-1">Skin Type</span>
                  <p className="text-lg font-bold text-[#26384B] capitalize">
                    {getLabel(profile.skin_type, SKIN_TYPE_OPTIONS)}
                  </p>
                </div>
                <div>
                  <span className="block text-xs uppercase tracking-widest text-[#4C6072] mb-1">Primary Goal</span>
                  <p className="text-lg font-bold text-[#26384B]">
                    {getLabel(profile.primary_goal, PRIMARY_GOAL_OPTIONS)}
                  </p>
                </div>
                <div>
                  <span className="block text-xs uppercase tracking-widest text-[#4C6072] mb-1">Sensitivity Tendency</span>
                  <p className="text-lg font-bold text-[#26384B] capitalize">
                    {getLabel(profile.sensitivity_tendency, SENSITIVITY_TENDENCY_OPTIONS)}
                  </p>
                </div>
              </div>
            </Glass>

            {/* Concerns Card */}
            <Glass variant="deep" className="p-8 sm:p-10 rounded-[32px]">
              <h3 className="text-xl font-editorial font-bold text-[#26384B] mb-4">Active Skin Concerns</h3>
              <div className="flex flex-wrap gap-2.5">
                {getMultiLabels(profile.current_concerns, CURRENT_CONCERNS_OPTIONS).map((label, idx) => (
                  <span
                    key={idx}
                    className="px-4 py-2 bg-[#26384B] text-white rounded-full text-xs font-bold uppercase tracking-wider"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </Glass>

            {/* Routine & Experience Card */}
            <Glass variant="deep" className="p-8 sm:p-10 rounded-[32px]">
              <h3 className="text-xl font-editorial font-bold text-[#26384B] mb-6 pb-4 border-b border-[#26384B]/10">
                Skincare Routine & Habits
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                <div>
                  <span className="block text-xs uppercase tracking-widest text-[#4C6072] mb-1">Routine Experience</span>
                  <p className="text-base font-bold text-[#26384B]">
                    {getLabel(profile.routine_experience, ROUTINE_EXPERIENCE_OPTIONS)}
                  </p>
                </div>
                <div>
                  <span className="block text-xs uppercase tracking-widest text-[#4C6072] mb-1">Sunscreen Frequency</span>
                  <p className="text-base font-bold text-[#26384B]">
                    {getLabel(profile.sunscreen_frequency, SUNSCREEN_FREQUENCY_OPTIONS)}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <span className="block text-xs uppercase tracking-widest text-[#4C6072] mb-2">Product Categories in Routine</span>
                  <div className="flex flex-wrap gap-2">
                    {getMultiLabels(profile.routine_product_categories, ROUTINE_PRODUCT_CATEGORIES_OPTIONS).map((label, idx) => (
                      <span key={idx} className="px-3 py-1 bg-white/70 border border-[#26384B]/15 text-[#26384B] rounded-lg text-xs font-medium">
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="block text-xs uppercase tracking-widest text-[#4C6072] mb-2">Active Ingredients Used</span>
                  <div className="flex flex-wrap gap-2">
                    {getMultiLabels(profile.active_ingredient_categories, ACTIVE_INGREDIENT_CATEGORIES_OPTIONS).map((label, idx) => (
                      <span key={idx} className="px-3 py-1 bg-white/70 border border-[#26384B]/15 text-[#26384B] rounded-lg text-xs font-medium">
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Glass>

            {/* Reactions & Clinical Care */}
            <Glass variant="deep" className="p-8 sm:p-10 rounded-[32px]">
              <h3 className="text-xl font-editorial font-bold text-[#26384B] mb-6 pb-4 border-b border-[#26384B]/10">
                Safety & Clinical Profile
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <span className="block text-xs uppercase tracking-widest text-[#4C6072] mb-1">Clinician Care</span>
                  <p className="text-base font-bold text-[#26384B]">
                    {profile.clinician_directed_treatment ? 'Yes (Under Clinical Care)' : 'No'}
                  </p>
                </div>
                <div>
                  <span className="block text-xs uppercase tracking-widest text-[#4C6072] mb-1">Known Reactions</span>
                  <p className="text-base font-bold text-[#26384B]">
                    {getMultiLabels(profile.known_reaction_categories, KNOWN_REACTION_CATEGORIES_OPTIONS).join(', ')}
                  </p>
                  {profile.known_reaction_other_note && (
                    <p className="text-xs text-[#4C6072] mt-1 italic">Note: "{profile.known_reaction_other_note}"</p>
                  )}
                </div>
                <div>
                  <span className="block text-xs uppercase tracking-widest text-[#4C6072] mb-1">Avoid Preferences</span>
                  <p className="text-base font-bold text-[#26384B]">
                    {getMultiLabels(profile.preference_avoid_categories, PREFERENCE_AVOID_CATEGORIES_OPTIONS).join(', ')}
                  </p>
                </div>
              </div>
            </Glass>
          </div>
        )}
      </Container>
    </PageTransition>
  );
};
