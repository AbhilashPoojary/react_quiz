import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function InputPassword({
  name,
  label,
  value,
  setValue,
  placeholder,
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="sm:col-span-2 mb-4 relative">
      <label
        htmlFor={name}
        className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
      >
        {label}
      </label>
      <input
        type={`${visible ? "text" : "password"}`}
        name={name}
        className="outline-none border border-gray-300 text-gray-900 text-sm rounded focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
        placeholder={placeholder || `Please enter the ${name}`}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <div className="info-icon">
        {visible ? (
          <EyeOff
            onClick={() => setVisible(!visible)}
            className="text-gray-400 cursor-pointer"
          />
        ) : (
          <Eye
            onClick={() => setVisible(!visible)}
            className="text-gray-400 cursor-pointer"
          />
        )}
      </div>
    </div>
  );
}
