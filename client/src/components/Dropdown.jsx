import React, { useState, useEffect } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

export default function Dropdown({ data, setState, state, dropdownId }) {
  const [active, setActive] = useState(false);
  const [select, setSelect] = useState("Select");

  useEffect(() => {
    const selectedItem = data.find((item) => item.value === state);
    setSelect(selectedItem ? selectedItem.category : "Select");
  }, [data, state]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!event.target.closest(".dropdown")) {
        setActive(false);
      }
    };

    const handleDropdownOpen = (event) => {
      if (event.detail !== dropdownId) {
        setActive(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("dropdown-open", handleDropdownOpen);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("dropdown-open", handleDropdownOpen);
    };
  }, [dropdownId]);

  const handleDropdownToggle = () => {
    const nextState = !active;
    setActive(nextState);

    if (nextState && dropdownId) {
      document.dispatchEvent(
        new CustomEvent("dropdown-open", { detail: dropdownId })
      );
    }
  };

  const handleItemClick = (item) => {
    setSelect(item.category);
    setState(item.value);
    setActive(false);
  };

  return (
    <div className="dropdown app-dropdown cursor-pointer border p-2 rounded relative">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          handleDropdownToggle();
        }}
        className="dropdown-btn flex w-full justify-between text-left"
      >
        <span>{select}</span>
        {active ? (
          <ChevronUp className="pointer-events-none text-gray-500" strokeWidth="1" />
        ) : (
          <ChevronDown className="pointer-events-none text-gray-500" strokeWidth="1" />
        )}
      </button>
      <div
        className="dropdown-content app-dropdown-menu max-h-60 overflow-auto absolute z-50 w-full left-0 top-10 border shadow-lg"
        style={{ display: active ? "block" : "none" }}
      >
        {data.map((item) => (
          <div
            className={`app-dropdown-item p-2 mb-1 ${
              select === item.category ? "bg-gray-100" : ""
            }`}
            key={item.value ?? item.category}
            value={item.value}
            onMouseDown={() => handleItemClick(item)}
          >
            {item.category}
          </div>
        ))}
      </div>
    </div>
  );
}
