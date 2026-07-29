import React, { useState } from 'react';
import type { SubmissionCreate } from '../../types/profile';
import { Button } from '../../components/ui/Button';
import { PageTransition, Fade } from '../../components/motion';
import { Check, ChevronRight, ChevronLeft } from 'lucide-react';
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

type QuestionType = 'single' | 'multi' | 'boolean' | 'text';

interface QuestionConfig {
  id: keyof SubmissionCreate;
  title: string;
  description?: string;
  type: QuestionType;
  options?: any[];
  maxSelections?: number;
  dependsOn?: { field: keyof SubmissionCreate; value: any };
}

const QUESTIONS: QuestionConfig[] = [
  { id: 'skin_type', title: 'How does your skin usually feel?', type: 'single', options: SKIN_TYPE_OPTIONS },
  { id: 'primary_goal', title: 'What is your primary goal?', type: 'single', options: PRIMARY_GOAL_OPTIONS },
  { id: 'current_concerns', title: 'Which of these are you currently experiencing?', description: 'Select up to 5', type: 'multi', options: CURRENT_CONCERNS_OPTIONS, maxSelections: 5 },
  { id: 'sensitivity_tendency', title: 'How sensitive is your skin to new products?', type: 'single', options: SENSITIVITY_TENDENCY_OPTIONS },
  { id: 'climate', title: 'What is your primary climate?', type: 'single', options: CLIMATE_OPTIONS },
  { id: 'routine_experience', title: 'How experienced are you with skincare routines?', type: 'single', options: ROUTINE_EXPERIENCE_OPTIONS },
  { id: 'sunscreen_frequency', title: 'How often do you apply sunscreen?', type: 'single', options: SUNSCREEN_FREQUENCY_OPTIONS },
  { id: 'routine_product_categories', title: 'What products are currently in your routine?', type: 'multi', options: ROUTINE_PRODUCT_CATEGORIES_OPTIONS },
  { id: 'active_ingredient_categories', title: 'Which active ingredients are you currently using?', type: 'multi', options: ACTIVE_INGREDIENT_CATEGORIES_OPTIONS },
  { id: 'clinician_directed_treatment', title: 'Are you currently under a clinician\'s care for your skin?', type: 'boolean', options: [{ value: true, label: 'Yes' }, { value: false, label: 'No' }] },
  { id: 'known_reaction_categories', title: 'Do you have any known reactions to ingredients?', type: 'multi', options: KNOWN_REACTION_CATEGORIES_OPTIONS },
  { id: 'known_reaction_other_note', title: 'Please specify the other reaction', type: 'text', dependsOn: { field: 'known_reaction_categories', value: 'other_known' } },
  { id: 'preference_avoid_categories', title: 'Are there any ingredients you prefer to avoid?', type: 'multi', options: PREFERENCE_AVOID_CATEGORIES_OPTIONS },
];

interface QuestionnaireFlowProps {
  answers: Partial<SubmissionCreate>;
  onChange: (field: keyof SubmissionCreate, value: any) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  globalError: string | null;
}

export const QuestionnaireFlow: React.FC<QuestionnaireFlowProps> = ({ answers, onChange, onSubmit, isSubmitting, globalError }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Filter out questions that shouldn't be shown based on dependencies
  const visibleQuestions = QUESTIONS.filter(q => {
    if (q.dependsOn) {
      const val = answers[q.dependsOn.field];
      if (Array.isArray(val)) {
        return val.includes(q.dependsOn.value);
      }
      return val === q.dependsOn.value;
    }
    return true;
  });

  const currentQuestion = visibleQuestions[currentIndex];
  const isLastQuestion = currentIndex === visibleQuestions.length - 1;

  const handleNext = () => {
    // Validate current question
    const val = answers[currentQuestion.id];
    if (val === undefined || val === null || (Array.isArray(val) && val.length === 0) || (typeof val === 'string' && val.trim() === '')) {
      setError('Please answer this question to continue.');
      return;
    }
    setError(null);
    if (isLastQuestion) {
      onSubmit();
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setError(null);
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleOptionClick = (optionValue: any) => {
    setError(null);
    if (currentQuestion.type === 'single' || currentQuestion.type === 'boolean') {
      onChange(currentQuestion.id, optionValue);
      // Auto-advance for single choice after a short delay
      setTimeout(() => {
        if (!isLastQuestion) setCurrentIndex(prev => prev + 1);
      }, 300);
    } else if (currentQuestion.type === 'multi') {
      const currentSelections = (answers[currentQuestion.id] as any[]) || [];
      if (currentSelections.includes(optionValue)) {
        onChange(currentQuestion.id, currentSelections.filter(v => v !== optionValue));
      } else {
        if (currentQuestion.maxSelections && currentSelections.length >= currentQuestion.maxSelections) {
          setError(`Maximum ${currentQuestion.maxSelections} selections allowed.`);
          return;
        }
        // If 'none' is selected, clear others. If others are selected, clear 'none'
        if (optionValue === 'none') {
           onChange(currentQuestion.id, ['none']);
        } else {
           onChange(currentQuestion.id, [...currentSelections.filter(v => v !== 'none'), optionValue]);
        }
      }
    }
  };

  const progressPercentage = ((currentIndex + 1) / visibleQuestions.length) * 100;

  return (
    <div className="flex flex-col h-full w-full max-w-2xl mx-auto overflow-visible px-4 min-h-0">
      
      {/* Progress Bar */}
      <div className="w-full shrink-0 mb-6 sm:mb-8 pt-4">
        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-[#26384B]/60 mb-2">
          <span>Question {currentIndex + 1} of {visibleQuestions.length}</span>
          <span>{Math.round(progressPercentage)}%</span>
        </div>
        <div className="h-1 bg-[#26384B]/10 rounded-full overflow-hidden border border-[#26384B]/5">
          <div 
            className="h-full bg-blue-500 transition-all duration-700 ease-[var(--luxury-ease)] shadow-[0_0_10px_rgba(59,130,246,0.5)]"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      <PageTransition className="w-full flex-1 flex flex-col overflow-visible pb-10 min-h-0" key={currentQuestion.id}>
        {/* We keep the card taking flex-1 so it can grow, but min-h-0 and max-h-full handle overflow */}
        <div className="w-full h-full flex flex-col p-6 sm:p-10 rounded-[32px] bg-white/40 backdrop-blur-[40px] border border-white/60 shadow-[0_0_50px_rgba(59,130,246,0.15)] ring-1 ring-inset ring-white/50 relative overflow-hidden min-h-0">
          
          {/* Subtle internal blue ambient glow */}
          <div className="absolute inset-0 pointer-events-none rounded-[32px] shadow-[inset_0_0_100px_rgba(59,130,246,0.05)]" />
          
          {globalError && (
             <div className="mb-6 bg-red-50 text-red-600 border border-red-200 p-4 rounded-xl text-sm font-medium">
               {globalError}
             </div>
          )}

          <Fade className="shrink-0 relative z-10">
            <h2 className="text-3xl sm:text-4xl font-serif text-[#26384B] mb-3 leading-[1.1] !tracking-normal !font-normal">{currentQuestion.title}</h2>
            {currentQuestion.description && (
              <p className="text-blue-400/80 text-[11px] font-bold uppercase tracking-widest mb-6">{currentQuestion.description}</p>
            )}
            {!currentQuestion.description && <div className="mb-6" />}
          </Fade>

          {error && (
            <Fade>
              <div className="text-red-500 text-sm font-bold mb-4">{error}</div>
            </Fade>
          )}

          <div className="flex-1 overflow-y-auto pr-3 custom-scrollbar relative z-10 pb-4 min-h-0 grid grid-cols-1 sm:grid-cols-2 gap-3 items-start content-start">
            {currentQuestion.type === 'text' ? (
              <div className="col-span-1 sm:col-span-2 h-full">
                <textarea
                  value={(answers[currentQuestion.id] as string) || ''}
                onChange={(e) => {
                  setError(null);
                  onChange(currentQuestion.id, e.target.value);
                }}
                className="w-full p-5 rounded-2xl border border-white/60 bg-white/50 backdrop-blur-md shadow-inner focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 resize-none h-40 text-[#26384B] placeholder:text-[#4C6072]/50 transition-all"
                placeholder="Type your answer here..."
              />
              </div>
            ) : (
              currentQuestion.options?.map((opt, index) => {
                const isSelected = currentQuestion.type === 'multi' 
                  ? ((answers[currentQuestion.id] as any[]) || []).includes(opt.value)
                  : answers[currentQuestion.id] === opt.value;
                
                const isLastOdd = currentQuestion.options && currentQuestion.options.length % 2 !== 0 && index === currentQuestion.options.length - 1;

                return (
                  <div key={opt.value} className={`relative group h-full ${isLastOdd ? 'sm:col-span-2' : ''}`}>
                    <button
                      onClick={() => handleOptionClick(opt.value)}
                      className={`relative w-full h-full p-3 sm:p-4 rounded-2xl text-left border transition-all duration-300 flex items-center justify-between shadow-sm transform-gpu group-hover:-translate-y-0.5 ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50 text-[#26384B] shadow-[0_4px_15px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/20' 
                          : 'border-white/60 bg-white/60 text-[#26384B]/80 hover:border-blue-300 hover:bg-white hover:text-[#26384B] hover:shadow-md'
                      }`}
                    >
                      <div>
                        <span className="font-medium text-[15px] block leading-snug">{opt.label}</span>
                        {opt.description && (
                          <span className={`text-[11px] mt-1.5 block leading-tight ${isSelected ? 'text-blue-700' : 'text-[#4C6072]'}`}>
                            {opt.description}
                          </span>
                        )}
                      </div>
                      {isSelected && (
                        <div className="shrink-0 ml-4 flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 shadow-[0_2px_8px_rgba(59,130,246,0.4)]">
                          <Check size={14} className="text-white" strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <div className="shrink-0 mt-6 flex items-center justify-between border-t border-[#26384B]/10 pt-5 relative z-10">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentIndex === 0 || isSubmitting}
              className={`rounded-full flex items-center gap-2 text-[#4C6072] hover:text-[#26384B] hover:bg-white/50 ${currentIndex === 0 ? 'opacity-0 pointer-events-none' : ''}`}
            >
              <ChevronLeft size={16} /> Back
            </Button>
            
            <Button
              variant="primary"
              onClick={handleNext}
              isLoading={isSubmitting}
              className="rounded-full px-8 flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white border-none shadow-[0_4px_15px_rgba(59,130,246,0.3)]"
            >
              {isLastQuestion ? 'Complete Profile' : 'Next'} {!isLastQuestion && <ChevronRight size={16} />}
            </Button>
          </div>

        </div>
      </PageTransition>
    </div>
  );
};
