// frontend/web/src/modules/shared/components/ui/SmartDropdown.tsx

import React, { useState, useEffect } from "react";

interface SmartDropdownOption {
  value: string | number;
  label: string;
}

interface SmartDropdownProps {
  label: string;
  value: string | number;
  onChange: (value: string | number) => void;
  options: SmartDropdownOption[];
  placeholder?: string;
  required?: boolean;
  allowOther?: boolean;
  otherLabel?: string;
  className?: string;
  inputClassName?: string;
}

export function SmartDropdown({
  label,
  value,
  onChange,
  options,
  placeholder = "Select...",
  required = false,
  allowOther = true,
  otherLabel = "Other (manual input)",
  className = "",
  inputClassName = "",
}: SmartDropdownProps) {
  const [isOther, setIsOther] = useState(false);
  const [otherValue, setOtherValue] = useState("");

  // Check if current value is in options
  useEffect(() => {
    if (value) {
      const isInOptions = options.some(
        (opt) => String(opt.value) === String(value)
      );
      if (!isInOptions && allowOther) {
        setIsOther(true);
        setOtherValue(String(value));
      } else {
        setIsOther(false);
      }
    }
  }, [value, options, allowOther]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    if (selectedValue === "__other__") {
      setIsOther(true);
      setOtherValue("");
      onChange("");
    } else {
      setIsOther(false);
      // Try to preserve number type if the original option was a number
      const option = options.find((opt) => String(opt.value) === selectedValue);
      if (option) {
        onChange(option.value);
      } else {
        onChange(selectedValue);
      }
    }
  };

  const handleOtherChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setOtherValue(newValue);
    // Try to parse as number if it looks like one
    const numValue = Number(newValue);
    if (!isNaN(numValue) && newValue.trim() !== "") {
      onChange(numValue);
    } else {
      onChange(newValue);
    }
  };

  const handleBackToSelect = () => {
    setIsOther(false);
    setOtherValue("");
    onChange("");
  };

  const baseInputClass =
    inputClassName ||
    "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all";

  return (
    <div className={className}>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {isOther ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={otherValue}
            onChange={handleOtherChange}
            placeholder={`Enter ${label.toLowerCase()}...`}
            required={required}
            className={`${baseInputClass} flex-1`}
          />
          <button
            type="button"
            onClick={handleBackToSelect}
            className="px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
            title="Back to dropdown"
          >
            ↩
          </button>
        </div>
      ) : (
        <select
          value={String(value)}
          onChange={handleSelectChange}
          required={required}
          className={baseInputClass}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={String(option.value)} value={String(option.value)}>
              {option.label}
            </option>
          ))}
          {allowOther && (
            <option value="__other__" className="text-blue-600 font-medium">
              ➕ {otherLabel}
            </option>
          )}
        </select>
      )}
    </div>
  );
}

export default SmartDropdown;

