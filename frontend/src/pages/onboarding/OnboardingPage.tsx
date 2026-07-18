import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SubmissionCreate } from '../../types/profile';
import { useProfile } from '../../contexts/ProfileContext';
import { useAuthenticatedApi } from '../../hooks/useAuthenticatedApi';
import { Container } from '../../components/ui/Container';
import { Glass } from '../../components/ui/Glass';
import { Button } from '../../components/ui/Button';
import { Step1SkinPriorities } from './steps/Step1SkinPriorities';
import { Step2CurrentRoutine } from './steps/Step2CurrentRoutine';
import { Step3ImportantContext } from './steps/Step3ImportantContext';
import { Step4Review } from './steps/Step4Review';
import { ProgressHeader, QuestionFooter } from './components';
import { ApiError } from '../../lib/api';

export const OnboardingPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [answers, setAnswers] = useState<Partial<SubmissionCreate>>({});
  const [stepError, setStepError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const api = useAuthenticatedApi();
  const { refreshProfile } = useProfile();

  const handleAnswerChange = (field: keyof SubmissionCreate, value: any) => {
    setAnswers(prev => ({ ...prev, [field]: value }));
    setStepError(null);
    setGlobalError(null);
  };

  const validateStep1 = (): boolean => {
    if (!answers.skin_type || !answers.primary_goal || !answers.sensitivity_tendency) {
      setStepError("Please answer all required single-choice questions.");
      return false;
    }
    if (!answers.current_concerns || answers.current_concerns.length === 0) {
      setStepError("Please select at least one current concern.");
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    if (!answers.routine_product_categories || answers.routine_product_categories.length === 0) {
      setStepError("Please select at least one product category, or 'None'.");
      return false;
    }
    if (!answers.active_ingredient_categories || answers.active_ingredient_categories.length === 0) {
      setStepError("Please select at least one active ingredient category, or 'None'.");
      return false;
    }
    if (!answers.sunscreen_frequency || !answers.routine_experience) {
      setStepError("Please answer all required single-choice questions.");
      return false;
    }
    return true;
  };

  const validateStep3 = (): boolean => {
    if (answers.clinician_directed_treatment === undefined) {
      setStepError("Please indicate if you are under a clinician's care.");
      return false;
    }
    if (!answers.known_reaction_categories || answers.known_reaction_categories.length === 0) {
      setStepError("Please indicate known reactions, or select 'None'.");
      return false;
    }
    if (!answers.preference_avoid_categories || answers.preference_avoid_categories.length === 0) {
      setStepError("Please indicate preferences to avoid, or select 'None'.");
      return false;
    }
    
    if (answers.known_reaction_categories.includes('other_known')) {
      if (!answers.known_reaction_other_note || answers.known_reaction_other_note.trim().length === 0) {
        setStepError("Please specify the other reaction.");
        return false;
      }
      if (answers.known_reaction_other_note.length > 200) {
        setStepError("The reaction note must be 200 characters or less.");
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    setStepError(null);
    if (currentStep === 1) {
      if (validateStep1()) setCurrentStep(2);
    } else if (currentStep === 2) {
      if (validateStep2()) setCurrentStep(3);
    } else if (currentStep === 3) {
      if (validateStep3()) setCurrentStep(4);
    }
  };

  const handleBack = () => {
    setStepError(null);
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setStepError(null);
    setGlobalError(null);
    
    if (!validateStep3()) return;

    const payload = answers as SubmissionCreate;
    
    setIsSubmitting(true);
    try {
      await api.post('/questionnaires/submissions', payload);
      await refreshProfile();
      navigate('/app');
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 422) {
          setGlobalError(`Validation error: ${error.message}`);
        } else {
          setGlobalError("Unable to reach the server. Please check your connection and try again.");
        }
      } else {
        setGlobalError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen py-20 px-6 sm:px-12 lg:px-24">
      <Container className="max-w-4xl pt-32 pb-24 relative z-10">
        <Glass variant="deep" className="p-10 sm:p-16 md:p-24">
          <ProgressHeader currentStep={currentStep} totalSteps={4} />
          
          {globalError && (
            <div className="mb-6 bg-danger/10 text-danger border border-danger/20 p-4 rounded-xl text-sm flex items-center justify-between">
              <span>{globalError}</span>
              {globalError.includes("Unable to reach") && (
                <button 
                  onClick={handleSubmit}
                  className="ml-4 font-medium hover:opacity-80 transition-opacity uppercase tracking-wider"
                >
                  Retry
                </button>
              )}
            </div>
          )}

          {currentStep === 1 && (
            <Step1SkinPriorities answers={answers} onChange={handleAnswerChange} error={stepError || undefined} />
          )}
          
          {currentStep === 2 && (
            <Step2CurrentRoutine answers={answers} onChange={handleAnswerChange} error={stepError || undefined} />
          )}
          
          {currentStep === 3 && (
            <Step3ImportantContext answers={answers} onChange={handleAnswerChange} error={stepError || undefined} />
          )}

          {currentStep === 4 && (
            <Step4Review answers={answers} onEdit={setCurrentStep} />
          )}

          <QuestionFooter>
            {currentStep > 1 && (
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={isSubmitting}
                className="rounded-full px-8 flex-1 sm:flex-none"
              >
                Back
              </Button>
            )}
            
            <Button
              variant="primary"
              onClick={currentStep === 4 ? handleSubmit : handleNext}
              isLoading={isSubmitting}
              className="rounded-full px-12 flex-1 sm:ml-auto"
            >
              {currentStep === 4 ? 'Complete Profile' : 'Continue'}
            </Button>
          </QuestionFooter>
        </Glass>
      </Container>
    </div>
  );
};
