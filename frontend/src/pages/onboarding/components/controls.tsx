import React from 'react';
import { Typography } from '../../../components/ui/Typography';
import { HoverLift } from '../../../components/motion';
import { Check } from 'lucide-react';
import { cn } from '../../../lib/cn';
import type { OptionConfig } from '../../../config/questionnaire-options';

export const SelectionIndicator: React.FC<{ selected: boolean; type: 'radio' | 'checkbox' }> = ({ selected, type }) => (
  <div className={cn(
    "flex-shrink-0 flex items-center justify-center transition-all duration-500",
    type === 'radio' ? "w-5 h-5 rounded-full border border-[#253A4A]/20" : "w-5 h-5 rounded border border-[#253A4A]/20",
    selected ? "bg-[#253A4A] border-[#253A4A] text-[#FCFBF8]" : "bg-[#F8F5F1]"
  )}>
    {selected && <Check className="w-3 h-3" strokeWidth={3} />}
  </div>
);

export const QuestionOptionGrid: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={cn("grid grid-cols-1 sm:grid-cols-2 gap-4", className)}>
    {children}
  </div>
);

interface QuestionOptionProps {
  label: string;
  description?: string;
  selected: boolean;
  type: 'radio' | 'checkbox';
  disabled?: boolean;
}

export const QuestionOption: React.FC<QuestionOptionProps> = ({ label, description, selected, type }) => (
  <div className="flex items-start gap-4">
    <SelectionIndicator selected={selected} type={type} />
    <div className="flex-1 text-left mt-[-2px]">
      <Typography variant="body" className={cn("font-medium transition-colors duration-300", selected ? "text-foreground" : "text-foreground/80")}>
        {label}
      </Typography>
      {description && (
        <Typography variant="caption" className={cn("mt-1 transition-colors duration-300", selected ? "text-foreground/70" : "text-foreground/50")}>
          {description}
        </Typography>
      )}
    </div>
  </div>
);

interface QuestionCardProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected: boolean;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({ selected, className, children, disabled, ...props }) => (
  <HoverLift y={disabled ? 0 : -2} className="w-full h-full">
    <button
      type="button"
      disabled={disabled}
      className={cn(
        "w-full h-full p-6 rounded-3xl border text-left transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]",
        selected 
          ? "bg-[#FCFBF8] border-[#253A4A]/30 shadow-[0_8px_30px_rgba(37,58,74,0.08)]" 
          : "bg-[#F8F5F1]/80 border-[#253A4A]/5 hover:bg-[#FCFBF8] shadow-[0_4px_14px_rgba(37,58,74,0.03)]",
        disabled && !selected && "opacity-50 cursor-not-allowed hover:bg-[#F8F5F1]/80",
        className
      )}
      {...props}
    >
      {children}
    </button>
  </HoverLift>
);

interface QuestionGroupProps {
  name: string;
  options: OptionConfig<any>[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  type?: 'radio' | 'checkbox';
  maxSelections?: number;
  error?: string;
}

export const QuestionGroup: React.FC<QuestionGroupProps> = ({
  options,
  selectedValues,
  onChange,
  type = 'radio',
  maxSelections,
  error
}) => {
  const handleChange = (value: string, checked: boolean) => {
    if (type === 'radio') {
      onChange([value]);
      return;
    }
    if (checked) {
      onChange([...selectedValues, value]);
    } else {
      onChange(selectedValues.filter(v => v !== value));
    }
  };

  return (
    <div className="space-y-4">
      <QuestionOptionGrid>
        {options.map((option) => {
          const selected = selectedValues.includes(option.value);
          const disabled = type === 'checkbox' && maxSelections !== undefined && !selected && selectedValues.length >= maxSelections;
          
          return (
            <QuestionCard
              key={option.value}
              selected={selected}
              disabled={disabled}
              onClick={() => handleChange(option.value, !selected)}
              aria-checked={selected}
              role={type === 'radio' ? 'radio' : 'checkbox'}
            >
              <QuestionOption
                label={option.label}
                description={option.description}
                selected={selected}
                type={type}
                disabled={disabled}
              />
            </QuestionCard>
          );
        })}
      </QuestionOptionGrid>
      {error && (
        <Typography variant="caption" className="text-danger mt-2">
          {error}
        </Typography>
      )}
    </div>
  );
};
