import React, { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";

const WEEK_DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_FORMATTER = new Intl.DateTimeFormat("en", {
  month: "long",
  year: "numeric",
});
const DISPLAY_FORMATTER = new Intl.DateTimeFormat("en", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const pad = (value) => String(value).padStart(2, "0");

const toDateValue = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const parseDateValue = (value) => {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
};

const isSameDay = (firstDate, secondDate) =>
  firstDate &&
  secondDate &&
  firstDate.getFullYear() === secondDate.getFullYear() &&
  firstDate.getMonth() === secondDate.getMonth() &&
  firstDate.getDate() === secondDate.getDate();

const isBeforeDay = (firstDate, secondDate) =>
  firstDate &&
  secondDate &&
  new Date(
    firstDate.getFullYear(),
    firstDate.getMonth(),
    firstDate.getDate()
  ) <
    new Date(
      secondDate.getFullYear(),
      secondDate.getMonth(),
      secondDate.getDate()
    );

const buildCalendarDays = (visibleMonth) => {
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const startsOn = firstDay.getDay();
  const gridStart = new Date(year, month, 1 - startsOn);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);

    return {
      date,
      value: toDateValue(date),
      isCurrentMonth: date.getMonth() === month,
    };
  });
};

export default function DatePickerInput({
  name,
  label,
  value,
  setValue,
  required,
  error,
  placeholder = "Select date",
  containerClassName = "mb-3",
  minDate = "",
}) {
  const selectedDate = parseDateValue(value);
  const minSelectableDate = parseDateValue(minDate);
  const [isOpen, setIsOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(selectedDate || new Date());
  const containerRef = useRef(null);

  const calendarDays = useMemo(
    () => buildCalendarDays(visibleMonth),
    [visibleMonth]
  );

  useEffect(() => {
    if (selectedDate) {
      setVisibleMonth(selectedDate);
    }
  }, [value]);

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

  const changeMonth = (offset) => {
    setVisibleMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1)
    );
  };

  const handleSelectDate = (dateValue) => {
    const nextDate = parseDateValue(dateValue);

    if (minSelectableDate && isBeforeDay(nextDate, minSelectableDate)) {
      return;
    }

    setValue(dateValue);
    setIsOpen(false);
  };

  const clearDate = (event) => {
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
          aria-haspopup="dialog"
          className={`app-input flex w-full items-center justify-between rounded border border-gray-300 p-2.5 pr-16 text-left text-sm ${
            error ? "border-red-500" : ""
          }`}
          id={name}
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
        >
          <span className={value ? "app-strong-text" : "app-muted-text"}>
            {selectedDate ? DISPLAY_FORMATTER.format(selectedDate) : placeholder}
          </span>
        </button>
        {value && (
          <button
            aria-label={`Clear ${label}`}
            className="absolute right-9 top-1/2 -translate-y-1/2 rounded p-1 text-gray-500 transition hover:text-red-600"
            type="button"
            onClick={clearDate}
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <CalendarDays className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />

        {isOpen && (
          <div
            className="date-picker-panel absolute left-0 top-12 z-50 w-full min-w-[280px] rounded border p-3 shadow-xl sm:w-[320px]"
            role="dialog"
            aria-label={`${label} calendar`}
          >
            <div className="mb-3 flex items-center justify-between">
              <button
                aria-label="Previous month"
                className="rounded p-2 transition hover:bg-gray-100"
                type="button"
                onClick={() => changeMonth(-1)}
              >
                <ChevronLeft size={18} />
              </button>
              <span className="app-strong-text text-sm font-semibold">
                {MONTH_FORMATTER.format(visibleMonth)}
              </span>
              <button
                aria-label="Next month"
                className="rounded p-2 transition hover:bg-gray-100"
                type="button"
                onClick={() => changeMonth(1)}
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="mb-1 grid grid-cols-7 text-center text-xs font-semibold">
              {WEEK_DAYS.map((day) => (
                <span className="app-muted-text py-1" key={day}>
                  {day}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((item) => {
                const isSelected = isSameDay(item.date, selectedDate);
                const isToday = isSameDay(item.date, new Date());
                const isDisabled =
                  minSelectableDate && isBeforeDay(item.date, minSelectableDate);

                return (
                  <button
                    className={`date-picker-day rounded p-2 text-sm transition ${
                      item.isCurrentMonth ? "" : "date-picker-muted-day"
                    } ${isToday ? "date-picker-today" : ""} ${
                      isSelected ? "date-picker-selected-day" : ""
                    } ${
                      isDisabled
                        ? "cursor-not-allowed opacity-40 hover:bg-transparent"
                        : ""
                    }`}
                    disabled={isDisabled}
                    key={item.value}
                    type="button"
                    onClick={() => handleSelectDate(item.value)}
                  >
                    {item.date.getDate()}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
