import React from "react";

export function CustomCheckbox({
  checked,
  onChange,
  label,
  name,
  disabled = false,
}) {
  return (
    <label
      className={`inline-flex items-center gap-3 ${
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
      }`}
    >
      <input
        type="checkbox"
        name={name}
        checked={Boolean(checked)}
        disabled={disabled}
        className="peer sr-only"
        onChange={(event) => onChange?.(event.target.checked)}
      />
      <span
        className={`relative h-6 w-11 rounded-full border transition dark:border-gray-600 ${
          checked
            ? "border-red-600 bg-red-600"
            : "border-gray-300 bg-gray-200 dark:bg-gray-700"
        }`}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
            checked ? "translate-x-5" : ""
          }`}
        />
      </span>
      {label && <span className="app-strong-text font-semibold">{label}</span>}
    </label>
  );
}

export function CustomRadio({
  checked,
  onChange,
  label,
  name,
  value,
  disabled = false,
}) {
  return (
    <label
      className={`inline-flex items-center gap-2 ${
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
      }`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={Boolean(checked)}
        disabled={disabled}
        className="peer sr-only"
        onChange={() => onChange?.(value)}
      />
      <span
        className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition dark:border-gray-600 ${
          checked ? "border-red-600" : "border-gray-300"
        }`}
      >
        <span
          className={`h-2.5 w-2.5 rounded-full bg-red-600 transition ${
            checked ? "scale-100" : "scale-0"
          }`}
        />
      </span>
      {label && <span className="app-strong-text text-sm font-semibold">{label}</span>}
    </label>
  );
}
