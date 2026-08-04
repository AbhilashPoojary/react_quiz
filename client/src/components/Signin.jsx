import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  loginCall,
  loading,
  message,
  isSuccess,
  alreadyLoggedIn,
} from "../slice/authSlice";
import InputPassword from "./InputPassword";
import InputText from "./InputText";
import ErrorNotification from "./ErrorNotification";
import ConfirmPopup from "./ConfirmPopup";

export default function Signin({ switchToSignUp, setAlign }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notification, setNotification] = useState({
    type: "info",
    message: "",
  });
  const [showSessionPopup, setShowSessionPopup] = useState(false);
  const navigate = useNavigate();
  const state = useSelector(loading);
  const error = useSelector(message);
  const successState = useSelector(isSuccess);
  const conflictState = useSelector(alreadyLoggedIn);
  const dispatch = useDispatch();

  const handleSubmit = function (e) {
    e.preventDefault();
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
      navigate("/info");
    }
  }, [successState, navigate]);

  useEffect(() => {
    if (error && !state) {
      if (conflictState) {
        setNotification({ type: "info", message: "" });
      } else {
        setNotification({ type: "error", message: error });
      }
    }
  }, [error, state, conflictState]);

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
      <ConfirmPopup
        open={showSessionPopup}
        title="Single active session"
        body="You are already logged in on another device. Do you want to logout the previous session and continue?"
        confirmText="Continue"
        cancelText="Cancel"
        onConfirm={handleSessionConfirm}
        onCancel={handleSessionCancel}
      />
      <h2 className="my-4 text-center font-semibold text-xl">
        Sign in to the Quiz
      </h2>
      <form
        className="w-1/2 m-auto border p-10 rounded bg-gray-50"
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
          setValue={setEmail}
          type="text"
        />
        <InputPassword
          name="password"
          label="Password"
          value={password}
          setValue={setPassword}
        />
        <div className="sm:col-span-2 mt-2 flex justify-between items-end">
          <button className="bg-red-600 hover:bg-red-800 transition duration-300 ease-in-out rounded px-3 py-2 text-white">
            Submit
          </button>
          <Link className="underline text-blue-500" onClick={switchToSignUp}>
            Register here
          </Link>
        </div>
      </form>
    </div>
  );
}
