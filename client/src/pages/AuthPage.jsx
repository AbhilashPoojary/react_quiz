import React, { useState } from "react";
import Signin from "../components/Signin";
import Signup from "../components/Signup";
import { useNavigate } from "react-router-dom";

export default function AuthPage({ setAlign }) {
  const navigate = useNavigate();
  const [isSignIn, setIsSignIn] = useState(true);

  const switchToSignIn = () => {
    setIsSignIn(true);
  };

  const switchToSignUp = () => {
    setIsSignIn(false);
  };

  const authenticate = () => {
    navigate("/info");
  };
  return (
    <div className="auth">
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
