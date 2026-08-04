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
    <div className="dropdown cursor-pointer border p-2 rounded relative">
      <div
        tabIndex="0"
        onMouseDown={handleDropdownToggle}
        className="dropdown-btn flex justify-between"
      >
        <span>{select}</span>
        {active ? (
          <ChevronUp color="gray" strokeWidth="1" />
        ) : (
          <ChevronDown color="gray" strokeWidth="1" />
        )}
      </div>
      <div
        className="dropdown-content  max-h-60 overflow-auto absolute z-50 w-full left-0 top-10 bg-white border shadow-lg"
        style={{ display: active ? "block" : "none" }}
      >
        {data.map((item) => (
          <div
            className={`p-2 mb-1 hover:bg-gray-100 ${
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
