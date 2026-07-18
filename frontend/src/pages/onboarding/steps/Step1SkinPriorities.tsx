import React, { useState } from 'react';
import type { SubmissionCreate } from '../../../types/profile';
import { 
  SKIN_TYPE_OPTIONS, 
  CURRENT_CONCERNS_OPTIONS, 
  PRIMARY_GOAL_OPTIONS, 
  SENSITIVITY_TENDENCY_OPTIONS 
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

interface Step1Props {
  answers: Partial<SubmissionCreate>;
  onChange: (field: keyof SubmissionCreate, value: any) => void;
  error?: string;
}

import { Doodle } from '../../../components/illustrations/Doodle';

export const Step1SkinPriorities: React.FC<Step1Props> = ({ answers, onChange, error }) => {
  const [localError, setLocalError] = useState<string | null>(null);

  const handleConcernsChange = (values: string[]) => {
    if (values.length > 3) {
      setLocalError("Maximum 3 selections allowed");
    } else {
      setLocalError(null);
      onChange('current_concerns', values);
    }
  };

  return (
    <QuestionTransition>
      <QuestionSection>
        <div className="relative">
          <Doodle type="sparkles" className="absolute -top-6 -right-6 w-12 h-12 text-[#5C7E9A] opacity-20" delay={0.2} />
          <QuestionTitle>Let's understand your skin</QuestionTitle>
          <QuestionDescription>We'll use this to build your personalized profile and track changes over time.</QuestionDescription>
        </div>

        {error && (
          <div className="bg-danger/10 border border-danger/20 text-danger p-4 rounded-xl text-sm mb-6">
            {error}
          </div>
        )}

        <div>
          <div className="mb-4">
            <p className="text-lg font-bold text-[#253A4A] mb-1">How does your skin usually feel?</p>
          </div>
          <QuestionGroup
            name="skin_type"
            type="radio"
            options={SKIN_TYPE_OPTIONS}
            selectedValues={answers.skin_type ? [answers.skin_type] : []}
            onChange={(v) => onChange('skin_type', v[0])}
          />
        </div>

        <StepDivider />

        <div>
          <div className="flex justify-between items-baseline mb-4">
            <p className="text-lg font-bold text-[#253A4A] mb-1">Which of these are you currently experiencing?</p>
            <QuestionHint>Up to 3</QuestionHint>
          </div>
          <QuestionGroup
            name="current_concerns"
            type="checkbox"
            options={CURRENT_CONCERNS_OPTIONS}
            selectedValues={answers.current_concerns || []}
            onChange={handleConcernsChange}
            maxSelections={3}
            error={localError || undefined}
          />
        </div>

        <StepDivider />

        <div>
          <div className="mb-4">
            <p className="text-lg font-bold text-[#253A4A] mb-1">What is your primary goal?</p>
          </div>
          <QuestionGroup
            name="primary_goal"
            type="radio"
            options={PRIMARY_GOAL_OPTIONS}
            selectedValues={answers.primary_goal ? [answers.primary_goal] : []}
            onChange={(v) => onChange('primary_goal', v[0])}
          />
        </div>

        <StepDivider />

        <div>
          <div className="mb-4">
            <p className="text-lg font-bold text-[#253A4A] mb-1">How sensitive is your skin to new products?</p>
          </div>
          <QuestionGroup
            name="sensitivity_tendency"
            type="radio"
            options={SENSITIVITY_TENDENCY_OPTIONS}
            selectedValues={answers.sensitivity_tendency ? [answers.sensitivity_tendency] : []}
            onChange={(v) => onChange('sensitivity_tendency', v[0])}
          />
        </div>
      </QuestionSection>
    </QuestionTransition>
  );
};
