import React from "react";

export default function InputCheckbox({
  name,
  value,
  setValue,
  label,
  Popper,
  handleTogglePopover,
  referenceElementRef,
  isOpen,
  Tooltip,
  message,
}) {
  return (
    <div className="flex items-start">
      <label
        className="relative inline-flex items-center cursor-pointer"
        htmlFor={name}
      >
        <input
          type="checkbox"
          name={name}
          id={name}
          value={value}
          onChange={() => setValue(!value)}
          className="sr-only peer"
        />
        <div className="cursor-pointer w-11 h-6 bg-gray-200 rounded-full peer dark:peer-focus:ring-red-800 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-red-600" />
      </label>
      <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">
        {label}
      </span>
      <Tooltip
        Popper={Popper}
        handleTogglePopover={handleTogglePopover}
        referenceElementRef={referenceElementRef}
        isOpen={isOpen}
        message={message}
      />
    </div>
  );
}
