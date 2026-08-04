import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Util from "./util";
import apiClient from "../utils/apiClient";
import {
  registerCall,
  loading,
  message,
  error,
  success,
} from "../slice/registerSlice";
import { useDispatch, useSelector } from "react-redux";
import InputPassword from "./InputPassword";
import InputText from "./InputText";
import InputFileUpload from "./InputFileUpload";
import ErrorNotification from "./ErrorNotification";

export default function Signup({ switchToSignIn, setAlign }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmpassword, setConfirmpassword] = useState("");
  const [profilePic, setProfilePic] = useState("");
  const [profilePicPublicId, setProfilePicPublicId] = useState("");
  const [picLoading, setPicLoading] = useState(false);
  const [notification, setNotification] = useState({
    type: "info",
    message: "",
  });
  const dispatch = useDispatch();
  const loadState = useSelector(loading);
  const messageState = useSelector(message);
  const errorState = useSelector(error);
  const successState = useSelector(success);

  const picDetails = async (file) => {
    if (!file) {
      if (profilePicPublicId) {
        try {
          await apiClient.post("/auth/delete-profile-picture", {
            publicId: profilePicPublicId,
          });
          setNotification({
            type: "success",
            message: "Profile pic removed successfully",
          });
        } catch (error) {
          setNotification({
            type: "error",
            message: "Unable to remove profile pic",
          });
        }
      }

      setProfilePic("");
      setProfilePicPublicId("");
      setPicLoading(false);
      return;
    }

    Util.uploadImage(
      file,
      setPicLoading,
      setProfilePic,
      setProfilePicPublicId,
      () => {
        setNotification({
          type: "success",
          message: "Profile pic uploaded successfully",
        });
      },
      (message) => {
        setNotification({ type: "error", message });
      }
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password !== confirmpassword) {
      setNotification({ type: "error", message: "Passwords should match" });
      return;
    }
    if (!name || !email || !password || !profilePic) {
      setNotification({ type: "error", message: "All fields mandatory" });
      return;
    }
    const userData = {
      name,
      email,
      password,
      profilePicture: profilePic,
    };
    dispatch(registerCall(userData));
  };

  useEffect(() => {
    if (successState) {
      setNotification({
        type: "success",
        message: messageState || "Registration successful",
      });
      switchToSignIn();
    }
  }, [successState, messageState, switchToSignIn]);

  useEffect(() => {
    if (errorState) {
      setNotification({ type: "error", message: errorState });
    }
  }, [errorState]);

  useEffect(() => {
    setAlign(true);
  }, [setAlign]);

  return (
    <div className="form-container">
      <h2 className="my-4 text-center font-semibold text-xl">
        Register for the Quiz
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
          value={profilePic}
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
  );
}
