import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../slice/authSlice";

const getDismissKey = (currentUser, passwordExpiry) =>
  `password-expiry-alert:${currentUser?.user?._id || "user"}:${
    currentUser?.sessionId || currentUser?.token || "session"
  }:${passwordExpiry?.expiresAt || "unknown"}`;

export default function PasswordExpiryAlert() {
  const currentUser = useSelector(selectCurrentUser);
  const navigate = useNavigate();
  const location = useLocation();
  const passwordExpiry = currentUser?.passwordExpiry;
  const [dismissed, setDismissed] = useState(false);
  const [expiredMessage, setExpiredMessage] = useState("");

  const dismissKey = useMemo(
    () => getDismissKey(currentUser, passwordExpiry),
    [currentUser, passwordExpiry]
  );

  useEffect(() => {
    setDismissed(sessionStorage.getItem(dismissKey) === "dismissed");
  }, [dismissKey]);

  useEffect(() => {
    const savedMessage = localStorage.getItem("passwordExpiredMessage") || "";
    if (savedMessage) {
      setExpiredMessage(savedMessage);
    }

    const handleExpired = (event) => {
      setExpiredMessage(event?.detail?.message || "Your password has expired.");
    };

    window.addEventListener("password-expired", handleExpired);
    return () => window.removeEventListener("password-expired", handleExpired);
  }, []);

  useEffect(() => {
    if (passwordExpiry?.expired && location.pathname !== "/change-password") {
      navigate("/change-password", { replace: true });
    }
  }, [location.pathname, navigate, passwordExpiry?.expired]);

  if (!currentUser?.token || !passwordExpiry) {
    return null;
  }

  if (location.pathname === "/change-password") {
    return null;
  }

  const shouldShowWarning = passwordExpiry.shouldWarn && !dismissed;
  const shouldShowExpired = passwordExpiry.expired;

  if (!shouldShowWarning && !shouldShowExpired) {
    return null;
  }

  const handleIgnore = () => {
    sessionStorage.setItem(dismissKey, "dismissed");
    setDismissed(true);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="confirm-card w-full max-w-md rounded-lg border p-6 shadow-xl">
        <h3 className="app-strong-text mb-3 text-lg font-semibold">
          Password Expiry Alert
        </h3>
        <p className="app-muted-text mb-5 text-sm">
          {shouldShowExpired
            ? expiredMessage || "Your password has expired. Please update it now."
            : `Your password will expire in ${passwordExpiry.daysRemaining} ${
                passwordExpiry.daysRemaining === 1 ? "day" : "days"
              }. Please update your password soon.`}
        </p>
        <div className="flex justify-end gap-3">
          {!shouldShowExpired && (
            <button
              type="button"
              className="rounded bg-gray-200 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-300"
              onClick={handleIgnore}
            >
              Ignore
            </button>
          )}
          <button
            type="button"
            className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            onClick={() => navigate("/change-password")}
          >
            Reset Password
          </button>
        </div>
      </div>
    </div>
  );
}
