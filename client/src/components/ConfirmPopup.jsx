import React from "react";

export default function ConfirmPopup({
  open,
  title = "Confirm Action",
  body = "Are you sure you want to continue?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h3 className="mb-3 text-lg font-semibold text-gray-900">{title}</h3>
        <p className="mb-5 text-sm text-gray-700">{body}</p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            className="rounded bg-gray-200 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-300"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
