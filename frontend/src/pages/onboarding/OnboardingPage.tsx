import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SubmissionCreate } from '../../types/profile';
import { useProfile } from '../../contexts/ProfileContext';
import { useAuthenticatedApi } from '../../hooks/useAuthenticatedApi';
import { QuestionnaireFlow } from './QuestionnaireFlow';
import { ApiError } from '../../lib/api';

export const OnboardingPage: React.FC = () => {
  const [answers, setAnswers] = useState<Partial<SubmissionCreate>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const api = useAuthenticatedApi();
  const { refreshProfile } = useProfile();

  const handleAnswerChange = (field: keyof SubmissionCreate, value: any) => {
    setAnswers(prev => ({ ...prev, [field]: value }));
    setGlobalError(null);
  };

  const handleSubmit = async () => {
    setGlobalError(null);
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
    <div className="h-screen w-screen overflow-hidden flex flex-col items-center justify-center p-4 sm:p-8 relative bg-transparent">
      
      {/* Decorative ambient elements (optional, can stay or be removed since AmbientBackground is there) */}
      
      <div className="relative z-10 w-full max-w-2xl flex-1 flex flex-col justify-center max-h-full">
        <QuestionnaireFlow 
          answers={answers}
          onChange={handleAnswerChange}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          globalError={globalError}
        />
      </div>
    </div>
  );
};
