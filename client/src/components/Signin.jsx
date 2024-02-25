import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  loginCall,
  selectUserInfo,
  loading,
  message,
  isReady,
  isSuccess,
} from "../slice/authSlice";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import InputPassword from "./InputPassword";
import InputText from "./InputText";

export default function Signin({ switchToSignUp, authenticate, setAlign }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const user = useSelector(selectUserInfo);
  const state = useSelector(loading);
  const changeNav = useSelector(isReady);
  const errorState = useSelector(isSuccess);
  const error = useSelector(message);
  const dispatch = useDispatch();
  const handleSubmit = function (e) {
    e.preventDefault();
    const user = {
      email,
      password,
    };
    dispatch(loginCall(user));
  };
  const successState = useSelector(isSuccess);
  useEffect(() => {
    if (successState) {
      navigate("/info");
    }
  }, [successState]);
  useEffect(() => {
    if (error && !state) {
      toast.error(error);
    }
  }, [error, state]);
  useEffect(() => {
    setAlign(false);
  }, []);
  return (
    <div className="form-container">
      <h2 className="my-4 text-center font-semibold text-xl">
        Sign in to the Quiz
      </h2>
      <form
        className="w-1/2 m-auto border p-10 rounded bg-gray-50"
        onSubmit={handleSubmit}
      >
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
      <ToastContainer />
    </div>
  );
}
