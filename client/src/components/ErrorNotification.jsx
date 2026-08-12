import React, { useEffect } from "react";

const variantStyles = {
  error: {
    container:
      "border-red-300 bg-red-50 text-red-800 dark:bg-gray-800 dark:text-red-400 dark:border-red-800",
    icon: "text-red-800 dark:text-red-400",
  },
  success: {
    container:
      "border-green-300 bg-green-50 text-green-800 dark:bg-gray-800 dark:text-green-400 dark:border-green-800",
    icon: "text-green-800 dark:text-green-400",
  },
  info: {
    container:
      "border-blue-300 bg-blue-50 text-blue-800 dark:bg-gray-800 dark:text-blue-400 dark:border-blue-800",
    icon: "text-blue-800 dark:text-blue-400",
  },
};

export default function ErrorNotification({
  error,
  message,
  type = "error",
  duration = 5000,
  onHide,
}) {
  const notificationText = message || error || "";

  useEffect(() => {
    if (!notificationText) return undefined;

    const timer = setTimeout(() => {
      onHide?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [notificationText, duration, onHide]);

  if (!notificationText) {
    return null;
  }

  const style = variantStyles[type] || variantStyles.error;

  return (
    <div className="error-message show absolute top-2 left-1/2 z-50 w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 transform">
      <div
        className={`flex items-center p-2 text-sm border rounded-lg ${style.container}`}
      >
        <svg
          className={`flex-shrink-0 inline w-3 h-3 ${style.icon}`}
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
        </svg>
        <span className="sr-only">Info</span>
        <div>
          <span className="font-medium pl-2">{notificationText}</span>
        </div>
      </div>
    </div>
  );
}
