import React, { useState } from "react";
import Signin from "../components/Signin";
import Signup from "../components/Signup";
import ErrorNotification from "../components/ErrorNotification";
import { useNavigate } from "react-router-dom";

export default function AuthPage({ setAlign }) {
  const navigate = useNavigate();
  const [isSignIn, setIsSignIn] = useState(true);
  const [authNotification, setAuthNotification] = useState({
    type: "info",
    message: "",
  });

  const switchToSignIn = (notification) => {
    if (notification?.message) {
      setAuthNotification(notification);
    }
    setIsSignIn(true);
  };

  const switchToSignUp = () => {
    setAuthNotification({ type: "info", message: "" });
    setIsSignIn(false);
  };

  const authenticate = () => {
    navigate("/info");
  };
  return (
    <div className="auth">
      <ErrorNotification
        message={authNotification.message}
        type={authNotification.type}
        duration={5000}
        onHide={() => setAuthNotification({ type: "info", message: "" })}
      />
      <div className="auth-container">
        <div className={`form-container ${isSignIn ? "" : "slide-left"}`}>
          {isSignIn ? (
            <Signin
              switchToSignUp={switchToSignUp}
              authenticate={authenticate}
              setAlign={setAlign}
            />
          ) : (
            <Signup switchToSignIn={switchToSignIn} setAlign={setAlign} />
          )}
        </div>
        <div
          className={`right-bg ${isSignIn ? "slide-right" : "slide-left"}`}
        ></div>
      </div>
    </div>
  );
}
