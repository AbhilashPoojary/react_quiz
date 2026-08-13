import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ErrorNotification from "../components/ErrorNotification";
import InputText from "../components/InputText";
import apiClient from "../utils/apiClient";

const successMessage =
  "If an account exists for this email, a password reset link has been sent.";
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const emailRules = {
  required: true,
  pattern: emailPattern,
  patternMessage: "Please enter a valid email",
};

export default function ForgotPassword({ setAlign }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [notification, setNotification] = useState({ type: "info", message: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setAlign(false);
  }, [setAlign]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      setError("Email is mandatory");
      return;
    }

    if (!emailPattern.test(trimmedEmail)) {
      setError("Please enter a valid email");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await apiClient.post("/api/auth/forgot-password", { email: trimmedEmail });
      setNotification({ type: "success", message: successMessage });
    } catch (error) {
      setNotification({
        type: "success",
        message: successMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2 className="app-strong-text my-4 text-center text-xl font-semibold">
        Forgot Password
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
        <p className="app-muted-text mb-4 text-sm">
          Enter your email and we will send a reset link if an account exists.
        </p>
        <InputText
          name="email"
          label="Email"
          value={email}
          setValue={(value) => {
            setEmail(value);
            setError("");
          }}
          type="text"
          required
          rules={emailRules}
          error={error}
          onValidate={setError}
        />
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            className="rounded bg-red-600 px-3 py-2 text-white transition duration-300 ease-in-out hover:bg-red-800 disabled:opacity-70"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send reset link"}
          </button>
          <Link className="auth-link text-blue-500 underline" to="/">
            Back to login
          </Link>
        </div>
      </form>
    </div>
  );
}
