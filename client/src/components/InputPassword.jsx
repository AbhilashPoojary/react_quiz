import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { validateField } from "../utils/fieldValidation";

export default function InputPassword({
  name,
  label,
  value,
  setValue,
  placeholder,
  required,
  rules,
  onValidate,
  error,
}) {
  const [visible, setVisible] = useState(false);
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
    <div className="sm:col-span-2 mb-4 relative">
      <label
        htmlFor={name}
        className="app-label block mb-1 text-sm font-medium text-gray-900"
      >
        {label}
        {required && <span className="text-red-600"> *</span>}
      </label>
      <div className="relative">
        <input
          type={`${visible ? "text" : "password"}`}
          name={name}
          className="app-input block w-full rounded border border-gray-300 p-2.5 pr-10 text-sm text-gray-900 outline-none focus:border-primary-600 focus:ring-primary-600"
          placeholder={placeholder || `Please enter the ${name}`}
          value={value}
          onChange={handleChange}
        />
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
          aria-label={visible ? "Hide password" : "Show password"}
          onClick={() => setVisible(!visible)}
        >
          {visible ? (
            <EyeOff className="cursor-pointer" size={20} />
          ) : (
            <Eye className="cursor-pointer" size={20} />
          )}
        </button>
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
