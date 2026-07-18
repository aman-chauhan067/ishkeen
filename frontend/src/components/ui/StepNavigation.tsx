import React from 'react';
import { Button } from './Button';

interface StepNavigationProps {
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  isNextDisabled?: boolean;
  isLoading?: boolean;
}

export const StepNavigation: React.FC<StepNavigationProps> = ({
  onBack,
  onNext,
  nextLabel = 'Continue',
  isNextDisabled = false,
  isLoading = false,
}) => {
  return (
    <div className="mt-8 pt-6 border-t border-skin-dark flex flex-col sm:flex-row gap-4 items-center justify-between sticky bottom-0 bg-skin-light pb-6 sm:static sm:pb-0 sm:bg-transparent">
      {onBack ? (
        <Button variant="ghost" onClick={onBack} disabled={isLoading} className="w-full sm:w-auto order-2 sm:order-1">
          Back
        </Button>
      ) : (
        <div className="hidden sm:block order-1" /> // Spacer
      )}
      
      <Button 
        onClick={onNext} 
        disabled={isNextDisabled || isLoading} 
        isLoading={isLoading}
        className="w-full sm:w-auto order-1 sm:order-2 px-8"
      >
        {nextLabel}
      </Button>
    </div>
  );
};
