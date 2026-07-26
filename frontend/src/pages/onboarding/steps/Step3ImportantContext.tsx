import React from 'react';
import type { SubmissionCreate } from '../../../types/profile';
import { 
  CLINICIAN_DIRECTED_TREATMENT_OPTIONS,
  KNOWN_REACTION_CATEGORIES_OPTIONS,
  PREFERENCE_AVOID_CATEGORIES_OPTIONS,
  CLIMATE_OPTIONS
} from '../../../config/questionnaire-options';
import {
  QuestionSection,
  QuestionTitle,
  QuestionDescription,
  QuestionHint,
  QuestionGroup,
  StepDivider,
  QuestionTransition
} from '../components';

interface Step3Props {
  answers: Partial<SubmissionCreate>;
  onChange: (field: keyof SubmissionCreate, value: any) => void;
  error?: string;
}

import { Doodle } from '../../../components/illustrations/Doodle';

export const Step3ImportantContext: React.FC<Step3Props> = ({ answers, onChange, error }) => {
  const handleReactionsChange = (values: string[]) => {
    const prev = answers.known_reaction_categories || [];
    let nextValues = values;

    if (values.includes('none') && !prev.includes('none')) {
      nextValues = ['none'];
    } 
    else if (values.includes('none') && values.length > 1) {
      nextValues = values.filter(v => v !== 'none');
    }

    onChange('known_reaction_categories', nextValues);

    if (!nextValues.includes('other_known')) {
      onChange('known_reaction_other_note', null);
    }
  };

  const handleAvoidChange = (values: string[]) => {
    const prev = answers.preference_avoid_categories || [];
    if (values.includes('none') && !prev.includes('none')) {
      onChange('preference_avoid_categories', ['none']);
    } 
    else if (values.includes('none') && values.length > 1) {
      onChange('preference_avoid_categories', values.filter(v => v !== 'none'));
    }
    else {
      onChange('preference_avoid_categories', values);
    }
  };

  const showOtherNote = answers.known_reaction_categories?.includes('other_known');

  return (
    <QuestionTransition>
      <QuestionSection>
        <div className="relative">
          <Doodle type="arrow" className="absolute -top-6 -right-6 w-12 h-12 text-[#4C6072] opacity-20" delay={0.2} />
          <QuestionTitle>Important context</QuestionTitle>
          <QuestionDescription>Final details to ensure our guidance is perfectly tailored and safe for you.</QuestionDescription>
        </div>

        {error && (
          <div className="bg-danger/10 border border-danger/20 text-danger p-4 rounded-xl text-sm mb-6">
            {error}
          </div>
        )}

        <div>
          <div className="mb-4">
            <p className="text-lg font-bold text-[#26384B] mb-1">Are you currently using prescription skin treatments or under a clinician's care?</p>
          </div>
          <QuestionGroup
            name="clinician_directed_treatment"
            type="radio"
            options={CLINICIAN_DIRECTED_TREATMENT_OPTIONS.map(opt => ({...opt, value: String(opt.value)}))}
            selectedValues={answers.clinician_directed_treatment !== undefined ? [String(answers.clinician_directed_treatment)] : []}
            onChange={(v) => onChange('clinician_directed_treatment', v[0] === 'true')}
          />
        </div>

        <StepDivider />

        <div>
          <div className="mb-4">
            <p className="text-lg font-bold text-[#26384B] mb-1">Have you had known negative reactions to specific ingredients?</p>
          </div>
          <QuestionGroup
            name="known_reaction_categories"
            type="checkbox"
            options={KNOWN_REACTION_CATEGORIES_OPTIONS}
            selectedValues={answers.known_reaction_categories || []}
            onChange={handleReactionsChange}
          />
          
          {showOtherNote && (
            <div className="mt-6 p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <label htmlFor="known_reaction_other_note" className="block text-sm font-medium text-white/80 mb-3">
                Please specify the other reaction (required)
              </label>
              <input
                type="text"
                id="known_reaction_other_note"
                maxLength={200}
                value={answers.known_reaction_other_note || ''}
                onChange={(e) => onChange('known_reaction_other_note', e.target.value)}
                className="w-full bg-transparent border-b border-white/20 focus:border-accent p-2 text-white outline-none transition-colors"
                placeholder="e.g. Lavender oil causes hives"
              />
            </div>
          )}
        </div>

        <StepDivider />

        <div>
          <div className="mb-4">
            <p className="text-lg font-bold text-[#26384B] mb-1">Are there ingredients you personally prefer to avoid?</p>
          </div>
          <QuestionGroup
            name="preference_avoid_categories"
            type="checkbox"
            options={PREFERENCE_AVOID_CATEGORIES_OPTIONS}
            selectedValues={answers.preference_avoid_categories || []}
            onChange={handleAvoidChange}
          />
        </div>

        <StepDivider />

        <div>
          <div className="flex justify-between items-baseline mb-4">
            <p className="text-lg font-bold text-[#26384B] mb-1">How would you describe your climate?</p>
            <QuestionHint>Optional</QuestionHint>
          </div>
          <QuestionGroup
            name="climate"
            type="radio"
            options={CLIMATE_OPTIONS}
            selectedValues={answers.climate ? [answers.climate] : []}
            onChange={(v) => onChange('climate', v[0])}
          />
        </div>
      </QuestionSection>
    </QuestionTransition>
  );
};
