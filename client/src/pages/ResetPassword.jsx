import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ErrorNotification from "../components/ErrorNotification";
import InputPassword from "../components/InputPassword";
import apiClient from "../utils/apiClient";

export default function ResetPassword({ setAlign }) {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [notification, setNotification] = useState({ type: "info", message: "" });
  const [loading, setLoading] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);

  useEffect(() => {
    setAlign(false);
  }, [setAlign]);

  const validate = () => {
    const errors = {};

    if (!password.trim()) {
      errors.password = "New Password is mandatory";
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
      const response = await apiClient.post(`/api/auth/reset-password/${token}`, {
        password,
        confirmPassword,
      });
      setResetComplete(true);
      setNotification({
        type: "success",
        message:
          response.data?.message ||
          "Password reset successful. Please login with your new password.",
      });
      window.setTimeout(() => navigate("/login"), 1800);
    } catch (error) {
      setNotification({
        type: "error",
        message:
          error?.response?.data?.error ||
          "Password reset link is invalid or has expired",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2 className="app-strong-text my-4 text-center text-xl font-semibold">
        Reset Password
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
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            className="rounded bg-red-600 px-3 py-2 text-white transition duration-300 ease-in-out hover:bg-red-800 disabled:opacity-70"
            disabled={loading || resetComplete}
          >
            {loading ? "Resetting..." : "Reset password"}
          </button>
          <Link className="auth-link text-blue-500 underline" to="/">
            Back to login
          </Link>
        </div>
      </form>
    </div>
  );
}
