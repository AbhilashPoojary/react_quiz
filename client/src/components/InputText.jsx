import React from "react";
import { validateField } from "../utils/fieldValidation";

export default function InputText({
  name,
  value,
  setValue,
  label,
  placeholder,
  type,
  disabled,
  required,
  rules,
  onValidate,
  error,
  containerClassName = "sm:col-span-2 mb-3",
}) {
  const validationRules = {
    ...(required ? { required: true } : {}),
    ...(rules || {}),
  };
  const handleChange = (event) => {
    const nextValue = event.target.value;
    setValue(nextValue);

    if (onValidate) {
      onValidate(validateField(nextValue, validationRules, label));
    }
  };

  return (
    <div className={containerClassName}>
      <label
        htmlFor={name}
        className="app-label block mb-1 text-sm font-medium text-gray-900"
      >
        {label}
        {required && <span className="text-red-600"> *</span>}
      </label>
      <input
        type={type}
        name={name}
        className="app-input mb-1 outline-none border border-gray-300 text-gray-900 text-sm rounded focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
        placeholder={placeholder || `Please enter the ${name}`}
        value={value}
        onChange={handleChange}
        disabled={disabled}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
