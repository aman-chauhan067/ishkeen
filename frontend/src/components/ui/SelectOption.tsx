import React from 'react';

interface SelectOptionProps {
  id: string;
  name: string;
  value: string;
  label: string;
  description?: string;
  checked: boolean;
  type?: 'radio' | 'checkbox';
  onChange: (value: string, checked: boolean) => void;
  disabled?: boolean;
}

export const SelectOption: React.FC<SelectOptionProps> = ({
  id,
  name,
  value,
  label,
  description,
  checked,
  type = 'radio',
  onChange,
  disabled = false,
}) => {
  return (
    <div className="relative flex">
      <input
        type={type}
        id={id}
        name={name}
        value={value}
        checked={checked}
        onChange={(e) => onChange(value, e.target.checked)}
        disabled={disabled}
        className="peer sr-only"
        aria-describedby={description ? `${id}-description` : undefined}
      />
      <label
        htmlFor={id}
        className={`
          w-full cursor-pointer rounded-lg border p-4 transition-all duration-200
          peer-focus-visible:ring-2 peer-focus-visible:ring-skin-accent peer-focus-visible:ring-offset-2
          ${checked 
            ? 'border-skin-accent bg-[#fcf9f7] text-gray-900' 
            : 'border-skin-dark bg-white text-gray-700 hover:border-gray-400'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <div className="flex flex-col">
          <span className={`font-medium ${checked ? 'text-gray-900' : 'text-gray-800'}`}>
            {label}
          </span>
          {description && (
            <span id={`${id}-description`} className="text-sm text-gray-500 mt-1">
              {description}
            </span>
          )}
        </div>
      </label>
    </div>
  );
};
