import React from 'react';
import type { SubmissionCreate } from '../../../types/profile';
import {
  QuestionSection,
  QuestionTitle,
  QuestionDescription,
  QuestionTransition,
  ReviewCard,
  QuestionSummary
} from '../components';
import { 
  SKIN_TYPE_OPTIONS,
  PRIMARY_GOAL_OPTIONS,
  ROUTINE_EXPERIENCE_OPTIONS
} from '../../../config/questionnaire-options';

interface Step4Props {
  answers: Partial<SubmissionCreate>;
  onEdit: (step: number) => void;
}

const getLabel = (options: any[], value: any) => {
  return options.find(o => String(o.value) === String(value))?.label || value;
};

import { Doodle } from '../../../components/illustrations/Doodle';

export const Step4Review: React.FC<Step4Props> = ({ answers, onEdit }) => {
  return (
    <QuestionTransition>
      <QuestionSection>
        <div className="relative">
          <Doodle type="stars" className="absolute -top-6 -right-6 w-12 h-12 text-[#5C7E9A] opacity-20" delay={0.2} />
          <QuestionTitle>Review Consultation</QuestionTitle>
          <QuestionDescription>Please review your profile before completing the onboarding process.</QuestionDescription>
        </div>

        <div className="space-y-6">
          <ReviewCard title="Skin Profile" onEdit={() => onEdit(1)}>
            <QuestionSummary label="Skin Type" value={getLabel(SKIN_TYPE_OPTIONS, answers.skin_type)} />
            <QuestionSummary label="Primary Goal" value={getLabel(PRIMARY_GOAL_OPTIONS, answers.primary_goal)} />
            <QuestionSummary label="Concerns" value={answers.current_concerns?.join(', ') || 'None'} />
          </ReviewCard>

          <ReviewCard title="Current Routine" onEdit={() => onEdit(2)}>
            <QuestionSummary label="Products Used" value={answers.routine_product_categories?.join(', ') || 'None'} />
            <QuestionSummary label="Experience" value={getLabel(ROUTINE_EXPERIENCE_OPTIONS, answers.routine_experience)} />
          </ReviewCard>

          <ReviewCard title="Important Context" onEdit={() => onEdit(3)}>
            <QuestionSummary label="Clinician Care" value={answers.clinician_directed_treatment ? 'Yes' : 'No'} />
            <QuestionSummary label="Known Reactions" value={answers.known_reaction_categories?.join(', ') || 'None'} />
          </ReviewCard>
        </div>
      </QuestionSection>
    </QuestionTransition>
  );
};
