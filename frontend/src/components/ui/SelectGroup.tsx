import React from 'react';
import type { OptionConfig } from '../../config/questionnaire-options';
import { SelectOption } from './SelectOption';

interface SelectGroupProps {
  name: string;
  options: OptionConfig<any>[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  type?: 'radio' | 'checkbox';
  maxSelections?: number;
  error?: string;
  'aria-describedby'?: string;
}

export const SelectGroup: React.FC<SelectGroupProps> = ({
  name,
  options,
  selectedValues,
  onChange,
  type = 'radio',
  maxSelections,
  error,
  'aria-describedby': ariaDescribedBy,
}) => {
  const handleChange = (value: string, checked: boolean) => {
    if (type === 'radio') {
      onChange([value]);
      return;
    }

    // Checkbox logic
    if (checked) {
      onChange([...selectedValues, value]);
    } else {
      onChange(selectedValues.filter(v => v !== value));
    }
  };

  return (
    <div className="space-y-3" role="group" aria-describedby={ariaDescribedBy}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((option) => (
          <SelectOption
            key={option.value}
            id={`${name}-${option.value}`}
            name={name}
            value={option.value}
            label={option.label}
            description={option.description}
            type={type}
            checked={selectedValues.includes(option.value)}
            onChange={handleChange}
            disabled={
              type === 'checkbox' && 
              maxSelections !== undefined && 
              !selectedValues.includes(option.value) && 
              selectedValues.length >= maxSelections
            }
          />
        ))}
      </div>
      {error && (
        <p className="text-red-600 text-sm mt-2" id={`${name}-error`}>
          {error}
        </p>
      )}
    </div>
  );
};
