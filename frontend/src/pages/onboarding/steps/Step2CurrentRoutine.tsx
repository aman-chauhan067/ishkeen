import React from 'react';
import type { SubmissionCreate } from '../../../types/profile';
import { 
  ROUTINE_PRODUCT_CATEGORIES_OPTIONS, 
  ACTIVE_INGREDIENT_CATEGORIES_OPTIONS,
  SUNSCREEN_FREQUENCY_OPTIONS,
  ROUTINE_EXPERIENCE_OPTIONS
} from '../../../config/questionnaire-options';
import {
  QuestionSection,
  QuestionTitle,
  QuestionDescription,
  QuestionGroup,
  StepDivider,
  QuestionTransition
} from '../components';

interface Step2Props {
  answers: Partial<SubmissionCreate>;
  onChange: (field: keyof SubmissionCreate, value: any) => void;
  error?: string;
}

import { Doodle } from '../../../components/illustrations/Doodle';

export const Step2CurrentRoutine: React.FC<Step2Props> = ({ answers, onChange, error }) => {
  const handleProductsChange = (values: string[]) => {
    const prev = answers.routine_product_categories || [];
    if (values.includes('none') && !prev.includes('none')) {
      onChange('routine_product_categories', ['none']);
    } 
    else if (values.includes('none') && values.length > 1) {
      onChange('routine_product_categories', values.filter(v => v !== 'none'));
    }
    else {
      onChange('routine_product_categories', values);
    }
  };

  const handleActivesChange = (values: string[]) => {
    const prev = answers.active_ingredient_categories || [];
    if (values.includes('none') && !prev.includes('none')) {
      onChange('active_ingredient_categories', ['none']);
    } 
    else if (values.includes('none') && values.length > 1) {
      onChange('active_ingredient_categories', values.filter(v => v !== 'none'));
    }
    else {
      onChange('active_ingredient_categories', values);
    }
  };

  return (
    <QuestionTransition>
      <QuestionSection>
        <div className="relative">
          <Doodle type="leaf" className="absolute -top-6 -right-6 w-12 h-12 text-[#5C7E9A] opacity-20" delay={0.2} />
          <QuestionTitle>Your current routine</QuestionTitle>
          <QuestionDescription>Tell us what you're using today to help us understand your starting point.</QuestionDescription>
        </div>

        {error && (
          <div className="bg-danger/10 border border-danger/20 text-danger p-4 rounded-xl text-sm mb-6">
            {error}
          </div>
        )}

        <div>
          <div className="mb-4">
            <p className="text-lg font-bold text-[#253A4A] mb-1">Which types of products are currently part of your routine?</p>
          </div>
          <QuestionGroup
            name="routine_product_categories"
            type="checkbox"
            options={ROUTINE_PRODUCT_CATEGORIES_OPTIONS}
            selectedValues={answers.routine_product_categories || []}
            onChange={handleProductsChange}
          />
        </div>

        <StepDivider />

        <div>
          <div className="mb-4">
            <p className="text-lg font-bold text-[#253A4A] mb-1">Are you currently using any active ingredients?</p>
          </div>
          <QuestionGroup
            name="active_ingredient_categories"
            type="checkbox"
            options={ACTIVE_INGREDIENT_CATEGORIES_OPTIONS}
            selectedValues={answers.active_ingredient_categories || []}
            onChange={handleActivesChange}
          />
        </div>

        <StepDivider />

        <div>
          <div className="mb-4">
            <p className="text-lg font-bold text-[#253A4A] mb-1">How often do you apply sunscreen?</p>
          </div>
          <QuestionGroup
            name="sunscreen_frequency"
            type="radio"
            options={SUNSCREEN_FREQUENCY_OPTIONS}
            selectedValues={answers.sunscreen_frequency ? [answers.sunscreen_frequency] : []}
            onChange={(v) => onChange('sunscreen_frequency', v[0])}
          />
        </div>

        <StepDivider />

        <div>
          <div className="mb-4">
            <p className="text-lg font-bold text-[#253A4A] mb-1">How familiar are you with skincare ingredients?</p>
          </div>
          <QuestionGroup
            name="routine_experience"
            type="radio"
            options={ROUTINE_EXPERIENCE_OPTIONS}
            selectedValues={answers.routine_experience ? [answers.routine_experience] : []}
            onChange={(v) => onChange('routine_experience', v[0])}
          />
        </div>
      </QuestionSection>
    </QuestionTransition>
  );
};
