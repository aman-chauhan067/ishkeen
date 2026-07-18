import React from 'react';

interface QuestionnaireProgressProps {
  currentStep: number;
  totalSteps: number;
}

export const QuestionnaireProgress: React.FC<QuestionnaireProgressProps> = ({ currentStep, totalSteps }) => {
  const percentage = Math.round((currentStep / totalSteps) * 100);

  return (
    <div className="w-full mb-8">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-widest">
          Step {currentStep} of {totalSteps}
        </span>
        <span className="text-xs text-gray-400">
          {percentage}% completed
        </span>
      </div>
      <div className="h-1 w-full bg-skin-dark rounded-full overflow-hidden">
        <div 
          className="h-full bg-skin-accent transition-all duration-500 ease-in-out" 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
