import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  loginCall,
  loading,
  message,
  isSuccess,
  alreadyLoggedIn,
  selectUserRole,
} from "../slice/authSlice";
import InputPassword from "./InputPassword";
import InputText from "./InputText";
import ErrorNotification from "./ErrorNotification";
import ConfirmPopup from "./ConfirmPopup";
import AuthLoadingOverlay from "./AuthLoadingOverlay";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const emailRules = {
  required: true,
  pattern: emailPattern,
  patternMessage: "Please enter a valid email",
};

export default function Signin({ switchToSignUp, setAlign }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notification, setNotification] = useState({
    type: "info",
    message: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [hasSubmittedCredentials, setHasSubmittedCredentials] = useState(false);
  const [showSessionPopup, setShowSessionPopup] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const state = useSelector(loading);
  const error = useSelector(message);
  const successState = useSelector(isSuccess);
  const conflictState = useSelector(alreadyLoggedIn);
  const role = useSelector(selectUserRole);
  const dispatch = useDispatch();

  const handleSubmit = function (e) {
    e.preventDefault();

    if (state) {
      return;
    }

    const errors = {};

    if (!email.trim()) {
      errors.email = "Email is mandatory";
    }

    if (!password.trim()) {
      errors.password = "Password is mandatory";
    }

    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      setHasSubmittedCredentials(false);
      return;
    }

    setHasSubmittedCredentials(true);
    const user = {
      email,
      password,
    };
    dispatch(loginCall(user));
  };

  useEffect(() => {
    if (successState) {
      setNotification({
        type: "success",
        message: "Login successful",
      });
      navigate(location.state?.from || (role === "ADMIN" ? "/admin/dashboard" : "/info"));
    }
  }, [successState, navigate, role]);

  useEffect(() => {
    if (error && !state && hasSubmittedCredentials) {
      if (conflictState) {
        setNotification({ type: "info", message: "" });
      } else {
        setNotification({ type: "error", message: error });
      }
    }
  }, [error, state, conflictState, hasSubmittedCredentials]);

  useEffect(() => {
    if (conflictState) {
      setShowSessionPopup(true);
    }
  }, [conflictState]);

  const handleSessionConfirm = () => {
    setShowSessionPopup(false);
    dispatch(loginCall({ email, password, forceLogin: true }));
  };

  const handleSessionCancel = () => {
    setShowSessionPopup(false);
    setNotification({ type: "info", message: "" });
  };

  useEffect(() => {
    setAlign(false);
  }, [setAlign]);

  return (
    <div className="form-container">
      <AuthLoadingOverlay show={state} message="Signing you in..." />
      <ConfirmPopup
        open={showSessionPopup}
        title="Single active session"
        body="You are already logged in on another device. Do you want to logout the previous session and continue?"
        confirmText="Continue"
        cancelText="Cancel"
        onConfirm={handleSessionConfirm}
        onCancel={handleSessionCancel}
      />
      <h2 className="app-strong-text my-4 text-center font-semibold text-xl">
        Sign in to the Quiz
      </h2>
      <form
        className="auth-card mx-auto w-full max-w-md rounded border bg-gray-50 p-5 sm:p-8 lg:p-10"
        onSubmit={handleSubmit}
      >
        <ErrorNotification
          message={notification.message}
          type={notification.type}
          duration={5000}
          onHide={() => setNotification({ type: "info", message: "" })}
        />
        <InputText
          name="email"
          label="Email"
          value={email}
          setValue={(value) => {
            setEmail(value);
            setFormErrors((prev) => ({ ...prev, email: "" }));
            setNotification({ type: "info", message: "" });
            setHasSubmittedCredentials(false);
          }}
          type="text"
          required
          rules={emailRules}
          error={formErrors.email}
          onValidate={(message) =>
            setFormErrors((prev) => ({ ...prev, email: message }))
          }
        />
        <InputPassword
          name="password"
          label="Password"
          value={password}
          setValue={(value) => {
            setPassword(value);
            setFormErrors((prev) => ({ ...prev, password: "" }));
            setNotification({ type: "info", message: "" });
            setHasSubmittedCredentials(false);
          }}
          required
          error={formErrors.password}
        />
        <div className="-mt-2 mb-3 text-right">
          <Link className="auth-link text-sm text-blue-500 underline" to="/forgot-password">
            Forgot Password?
          </Link>
        </div>
        <div className="mt-2 flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-end sm:justify-between">
          <button
            className="rounded bg-red-600 px-3 py-2 text-white transition duration-300 ease-in-out hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={state}
            type="submit"
          >
            Submit
          </button>
          <Link
            className={`auth-link underline text-blue-500 ${
              state ? "pointer-events-none opacity-60" : ""
            }`}
            onClick={switchToSignUp}
          >
            Register here
          </Link>
        </div>
      </form>
    </div>
  );
}
