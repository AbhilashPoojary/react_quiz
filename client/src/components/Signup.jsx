import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Util from "./util";
import { registerCall, loading, message } from "../slice/registerSlice";
import { useDispatch, useSelector } from "react-redux";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import InputPassword from "./InputPassword";
import InputText from "./InputText";
import InputFileUpload from "./InputFileUpload";

export default function Signup({ switchToSignIn, setAlign }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmpassword, setConfirmpassword] = useState("");
  const [profilePic, setProfilePic] = useState("");
  const [picLoading, setPicLoading] = useState(false);
  const dispatch = useDispatch();
  const loadState = useSelector(loading);
  const messageState = useSelector(message);
  const picDetails = (file) => {
    Util.uploadImage(file, setPicLoading, toast, setProfilePic);
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (password !== confirmpassword) {
      toast.error("Passwords should match");
      return;
    }
    if (!name || !email || !password || !profilePic) {
      toast.error("All fields mandatory");
      return;
    }
    const userData = {
      name,
      email,
      password,
      profilePicture: profilePic,
    };
    dispatch(registerCall(userData));
    switchToSignIn();
  };
  useEffect(() => {
    setAlign(true);
  }, []);
  return (
    <>
      <div className="form-container">
        <h2 className="my-4 text-center font-semibold text-xl">
          Register for the Quiz
        </h2>
        <form
          className="w-1/2 m-auto border p-10 rounded bg-gray-50"
          onSubmit={handleSubmit}
        >
          <InputText
            name="name"
            label="Name"
            value={name}
            setValue={setName}
            type="text"
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
          <InputPassword
            name="cpassword"
            label="Confirm Password"
            value={confirmpassword}
            setValue={setConfirmpassword}
            placeholder="Please enter the confirm password"
          />
          <InputFileUpload
            label=" Upload profile pic"
            name="file_upload"
            setValue={picDetails}
            picLoading={picLoading}
            type="file"
          />
          <div className="sm:col-span-2 mt-4 flex justify-between items-end">
            <button className="bg-red-600 hover:bg-red-800 transition duration-300 ease-in-out rounded px-3 py-2 text-white">
              Submit
            </button>
            <Link className="underline text-blue-500" onClick={switchToSignIn}>
              Login here
            </Link>
          </div>
        </form>
      </div>
      <ToastContainer />
    </>
  );
}
