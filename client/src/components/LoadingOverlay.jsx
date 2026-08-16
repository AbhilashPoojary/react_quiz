import React from "react";
import { Loader2 } from "lucide-react";

export default function LoadingOverlay({ show, message }) {
  if (!show) {
    return null;
  }

  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm"
      role="status"
    >
      <div className="auth-card flex w-full max-w-xs flex-col items-center rounded border p-6 text-center shadow-2xl">
        <Loader2 className="mb-3 animate-spin text-red-600" size={34} />
        <p className="app-strong-text text-base font-semibold">
          {message || "Please wait..."}
        </p>
      </div>
    </div>
  );
}
