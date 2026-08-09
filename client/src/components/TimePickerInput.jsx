import React, { useEffect, useMemo, useRef, useState } from "react";
import { Clock, X } from "lucide-react";

const pad = (value) => String(value).padStart(2, "0");

const buildOptions = (stepMinutes = 30) => {
  const options = [];

  for (let minutes = 0; minutes < 24 * 60; minutes += stepMinutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const value = `${pad(hours)}:${pad(mins)}`;
    const displayHour = hours % 12 || 12;
    const period = hours >= 12 ? "PM" : "AM";

    options.push({
      value,
      label: `${pad(displayHour)}:${pad(mins)} ${period}`,
    });
  }

  return options;
};

const formatDisplayTime = (value) => {
  if (!value) {
    return "";
  }

  const [hours, minutes] = value.split(":").map(Number);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return value;
  }

  const displayHour = hours % 12 || 12;
  const period = hours >= 12 ? "PM" : "AM";

  return `${pad(displayHour)}:${pad(minutes)} ${period}`;
};

const toMinutes = (value) => {
  if (!value) {
    return null;
  }

  const [hours, minutes] = value.split(":").map(Number);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }

  return hours * 60 + minutes;
};

export default function TimePickerInput({
  name,
  label,
  value,
  setValue,
  required,
  error,
  placeholder = "Select time",
  containerClassName = "mb-3",
  stepMinutes = 30,
  minTime = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const selectedOptionRef = useRef(null);
  const options = useMemo(() => buildOptions(stepMinutes), [stepMinutes]);
  const minTimeMinutes = toMinutes(minTime);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (isOpen && selectedOptionRef.current) {
      selectedOptionRef.current.scrollIntoView({ block: "nearest" });
    }
  }, [isOpen]);

  const handleSelectTime = (timeValue) => {
    const selectedMinutes = toMinutes(timeValue);

    if (
      minTimeMinutes !== null &&
      selectedMinutes !== null &&
      selectedMinutes <= minTimeMinutes
    ) {
      return;
    }

    setValue(timeValue);
    setIsOpen(false);
  };

  const clearTime = (event) => {
    event.stopPropagation();
    setValue("");
    setIsOpen(false);
  };

  return (
    <div className={containerClassName} ref={containerRef}>
      <label
        className="app-label mb-1 block text-sm font-medium"
        htmlFor={name}
      >
        {label}
        {required && <span className="text-red-600"> *</span>}
      </label>
      <div className="relative">
        <button
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          className={`app-input flex w-full items-center justify-between rounded border border-gray-300 p-2.5 pr-16 text-left text-sm ${
            error ? "border-red-500" : ""
          }`}
          id={name}
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
        >
          <span className={value ? "app-strong-text" : "app-muted-text"}>
            {value ? formatDisplayTime(value) : placeholder}
          </span>
        </button>
        {value && (
          <button
            aria-label={`Clear ${label}`}
            className="absolute right-9 top-1/2 -translate-y-1/2 rounded p-1 text-gray-500 transition hover:text-red-600"
            type="button"
            onClick={clearTime}
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <Clock className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />

        {isOpen && (
          <div
            className="time-picker-panel absolute left-0 top-12 z-50 max-h-64 w-full overflow-auto rounded border p-2 shadow-xl"
            role="listbox"
            aria-label={`${label} options`}
          >
            {options.map((option) => {
              const isSelected = option.value === value;
              const optionMinutes = toMinutes(option.value);
              const isDisabled =
                minTimeMinutes !== null &&
                optionMinutes !== null &&
                optionMinutes <= minTimeMinutes;

              return (
                <button
                  aria-selected={isSelected}
                  className={`time-picker-option flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm transition ${
                    isSelected ? "time-picker-selected-option" : ""
                  } ${
                    isDisabled
                      ? "cursor-not-allowed opacity-40 hover:bg-transparent"
                      : ""
                  }`}
                  disabled={isDisabled}
                  key={option.value}
                  ref={isSelected ? selectedOptionRef : null}
                  role="option"
                  type="button"
                  onClick={() => handleSelectTime(option.value)}
                >
                  <span>{option.label}</span>
                  <span className="app-muted-text text-xs">{option.value}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
