import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import ErrorNotification from "../components/ErrorNotification";
import InputPassword from "../components/InputPassword";
import { selectCurrentUser, UPDATE_PASSWORD_EXPIRY } from "../slice/authSlice";
import apiClient from "../utils/apiClient";
import { validatePasswordStrength } from "../utils/passwordValidation";

export default function ChangePassword({ setAlign }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [notification, setNotification] = useState({ type: "info", message: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setAlign(false);
  }, [setAlign]);

  useEffect(() => {
    const savedMessage = localStorage.getItem("passwordExpiredMessage");
    if (savedMessage) {
      setNotification({ type: "error", message: savedMessage });
      localStorage.removeItem("passwordExpiredMessage");
    }
  }, []);

  const validate = () => {
    const errors = {};

    if (!currentPassword.trim()) {
      errors.currentPassword = "Current Password is mandatory";
    }

    if (!password.trim()) {
      errors.password = "New Password is mandatory";
    } else {
      const passwordError = validatePasswordStrength(password);
      if (passwordError) {
        errors.password = passwordError;
      }
    }

    if (!confirmPassword.trim()) {
      errors.confirmPassword = "Confirm Password is mandatory";
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords should match";
    }

    return errors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const errors = validate();
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.post("/auth/change-password", {
        currentPassword,
        password,
        confirmPassword,
      });
      dispatch(UPDATE_PASSWORD_EXPIRY(response.data?.passwordExpiry));
      setNotification({
        type: "success",
        message: response.data?.message || "Password changed successfully.",
      });
      window.setTimeout(() => {
        navigate(currentUser?.user?.role === "ADMIN" ? "/admin/dashboard" : "/info", {
          replace: true,
        });
      }, 1200);
    } catch (error) {
      setNotification({
        type: "error",
        message: error?.response?.data?.error || "Unable to change password",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2 className="app-strong-text my-4 text-center text-xl font-semibold">
        Change Password
      </h2>
      <form
        className="auth-card mx-auto w-full max-w-md rounded border bg-gray-50 p-5 sm:p-8 lg:p-10"
        onSubmit={handleSubmit}
      >
        <ErrorNotification
          message={notification.message}
          type={notification.type}
          duration={6000}
          onHide={() => setNotification({ type: "info", message: "" })}
        />
        <InputPassword
          name="current password"
          label="Current Password"
          value={currentPassword}
          setValue={(value) => {
            setCurrentPassword(value);
            setFormErrors((prev) => ({ ...prev, currentPassword: "" }));
          }}
          required
          error={formErrors.currentPassword}
        />
        <InputPassword
          name="new password"
          label="New Password"
          value={password}
          setValue={(value) => {
            setPassword(value);
            setFormErrors((prev) => ({ ...prev, password: "" }));
          }}
          required
          error={formErrors.password}
        />
        <InputPassword
          name="confirm password"
          label="Confirm Password"
          value={confirmPassword}
          setValue={(value) => {
            setConfirmPassword(value);
            setFormErrors((prev) => ({ ...prev, confirmPassword: "" }));
          }}
          required
          error={formErrors.confirmPassword}
        />
        <div className="mt-4 flex justify-end">
          <button
            className="rounded bg-red-600 px-3 py-2 text-white transition duration-300 ease-in-out hover:bg-red-800 disabled:opacity-70"
            disabled={loading}
          >
            {loading ? "Updating..." : "Update password"}
          </button>
        </div>
      </form>
    </div>
  );
}
