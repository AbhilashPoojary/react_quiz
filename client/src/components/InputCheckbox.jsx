import React from "react";
import { CustomCheckbox } from "./CustomSelectionControls";

export default function InputCheckbox({
  name,
  value,
  setValue,
  label,
  Popper,
  handleTogglePopover,
  referenceElementRef,
  isOpen,
  setIsOpen,
  Tooltip,
  message,
}) {
  return (
    <div className="flex items-start">
      <CustomCheckbox
        name={name}
        checked={Boolean(value)}
        onChange={(checked) => setValue(checked)}
      />
      <span className="app-label ml-3 text-sm font-medium text-gray-900">
        {label}
      </span>
      <Tooltip
        Popper={Popper}
        handleTogglePopover={handleTogglePopover}
        referenceElementRef={referenceElementRef}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        message={message}
      />
    </div>
  );
}
