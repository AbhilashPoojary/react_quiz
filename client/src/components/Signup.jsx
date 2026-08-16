import React, { useEffect, useRef, useState } from "react";
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
import AuthLoadingOverlay from "./AuthLoadingOverlay";
import ProfileImageEditor from "./ProfileImageEditor";
import { validateField, validateFile } from "../utils/fieldValidation";

const allowedProfileImageTypes = ["image/jpeg", "image/png", "image/webp"];
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const nameRules = { required: true, minLength: 3, maxLength: 50 };
const emailRules = {
  required: true,
  pattern: emailPattern,
  patternMessage: "Please enter a valid email",
};
const passwordRules = {
  required: true,
  minLength: 8,
  uppercase: true,
  lowercase: true,
  number: true,
  special: true,
};
const profilePicRules = {
  required: true,
  accept: allowedProfileImageTypes,
  acceptMessage: "Please select a JPEG, PNG, or WebP image",
  maxSizeMb: 5,
};

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
  const [selectedImageUrl, setSelectedImageUrl] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [emailAvailability, setEmailAvailability] = useState({
    status: "idle",
    email: "",
  });
  const emailAvailabilityCacheRef = useRef({});
  const emailCheckRequestRef = useRef(0);
  const dispatch = useDispatch();
  const loadState = useSelector(loading);
  const messageState = useSelector(message);
  const errorState = useSelector(error);
  const successState = useSelector(success);

  const revokeSelectedImageUrl = () => {
    if (selectedImageUrl) {
      URL.revokeObjectURL(selectedImageUrl);
      setSelectedImageUrl("");
    }
  };

  const picDetails = async (file) => {
    setFormErrors((prev) => ({ ...prev, profilePic: "" }));

    if (!file) {
      revokeSelectedImageUrl();
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

    const profilePicError = validateFile(file, profilePicRules, "Profile pic");
    if (profilePicError) {
      setFormErrors((prev) => ({ ...prev, profilePic: profilePicError }));
      setNotification({ type: "error", message: profilePicError });
      return;
    }

    revokeSelectedImageUrl();
    setSelectedImageUrl(URL.createObjectURL(file));
  };

  const uploadEditedProfileImage = async (file) => {
    await Util.uploadImage(
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
    revokeSelectedImageUrl();
  };

  const cancelProfileImageEdit = () => {
    revokeSelectedImageUrl();
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (loadState || picLoading) {
      return;
    }

    const errors = {};
    const normalizedEmail = email.trim().toLowerCase();

    const nameError = validateField(name, nameRules, "Name");
    if (nameError) {
      errors.name = nameError;
    }

    if (!normalizedEmail) {
      errors.email = "Email is mandatory";
    } else if (!emailPattern.test(normalizedEmail)) {
      errors.email = "Please enter a valid email";
    } else if (emailAvailability.status === "checking") {
      errors.email = "Please wait while we check this email";
    } else if (
      emailAvailability.status === "unavailable" &&
      emailAvailability.email === normalizedEmail
    ) {
      errors.email = "Email is already registered";
    }

    const passwordError = validateField(password, passwordRules, "Password");
    if (passwordError) {
      errors.password = passwordError;
    }

    if (!confirmpassword.trim()) {
      errors.confirmpassword = "Confirm Password is mandatory";
    }

    const profilePicError = validateFile(profilePic, profilePicRules, "Profile pic");
    if (profilePicError) {
      errors.profilePic = profilePicError;
    }

    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    if (password !== confirmpassword) {
      setNotification({ type: "error", message: "Passwords should match" });
      return;
    }

    const userData = {
      name,
      email: normalizedEmail,
      password,
      profilePicture: profilePic,
    };
    dispatch(registerCall(userData));
  };

  useEffect(() => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !emailPattern.test(normalizedEmail)) {
      setEmailAvailability({ status: "idle", email: normalizedEmail });
      return undefined;
    }

    if (emailAvailabilityCacheRef.current[normalizedEmail] !== undefined) {
      setEmailAvailability({
        status: emailAvailabilityCacheRef.current[normalizedEmail]
          ? "available"
          : "unavailable",
        email: normalizedEmail,
      });
      return undefined;
    }

    setEmailAvailability({ status: "checking", email: normalizedEmail });
    const requestId = emailCheckRequestRef.current + 1;
    emailCheckRequestRef.current = requestId;

    const timeout = window.setTimeout(async () => {
      try {
        const response = await apiClient.get("/api/auth/check-email", {
          params: { email: normalizedEmail },
        });

        if (emailCheckRequestRef.current !== requestId) {
          return;
        }

        const available = Boolean(response.data?.available);
        emailAvailabilityCacheRef.current[normalizedEmail] = available;
        setEmailAvailability({
          status: available ? "available" : "unavailable",
          email: normalizedEmail,
        });
      } catch (error) {
        if (emailCheckRequestRef.current === requestId) {
          setEmailAvailability({ status: "idle", email: normalizedEmail });
        }
      }
    }, 500);

    return () => window.clearTimeout(timeout);
  }, [email]);

  useEffect(() => {
    if (successState) {
      setNotification({
        type: "success",
        message: messageState || "Registration successful",
      });
      switchToSignIn({
        type: "success",
        message: messageState || "Registration successful",
      });
    }
  }, [successState, messageState, switchToSignIn]);

  useEffect(() => {
    if (errorState) {
      setNotification({ type: "info", message: "" });
    }
  }, [errorState]);

  useEffect(() => {
    setAlign(true);
  }, [setAlign]);

  useEffect(
    () => () => {
      if (selectedImageUrl) {
        URL.revokeObjectURL(selectedImageUrl);
      }
    },
    [selectedImageUrl]
  );

  return (
    <div className="form-container">
      <AuthLoadingOverlay
        show={loadState || picLoading}
        message={picLoading ? "Preparing profile image..." : "Creating your account..."}
      />
      <h2 className="app-strong-text my-4 text-center font-semibold text-xl">
        Register for the Quiz
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
          name="name"
          label="Name"
          value={name}
          setValue={(value) => {
            setName(value);
            setFormErrors((prev) => ({ ...prev, name: "" }));
          }}
          type="text"
          required
          rules={nameRules}
          error={formErrors.name}
          onValidate={(message) =>
            setFormErrors((prev) => ({ ...prev, name: message }))
          }
        />
        <InputText
          name="email"
          label="Email"
          value={email}
          setValue={(value) => {
            setEmail(value);
            setFormErrors((prev) => ({ ...prev, email: "" }));
          }}
          type="text"
          required
          rules={emailRules}
          error={formErrors.email}
          onValidate={(message) =>
            setFormErrors((prev) => ({ ...prev, email: message }))
          }
        />
        {email.trim() && emailPattern.test(email.trim().toLowerCase()) && (
          <div className="-mt-3 mb-4 text-sm">
            {emailAvailability.status === "checking" && (
              <span className="app-muted-text">Checking email...</span>
            )}
            {emailAvailability.status === "available" && (
              <span className="text-green-600">✓ Email available</span>
            )}
            {emailAvailability.status === "unavailable" && (
              <span className="text-red-600">Email is already registered</span>
            )}
          </div>
        )}
        <InputPassword
          name="password"
          label="Password"
          value={password}
          setValue={(value) => {
            setPassword(value);
            setFormErrors((prev) => ({ ...prev, password: "" }));
          }}
          required
          rules={passwordRules}
          error={formErrors.password}
          onValidate={(message) =>
            setFormErrors((prev) => ({ ...prev, password: message }))
          }
        />
        <InputPassword
          name="cpassword"
          label="Confirm Password"
          value={confirmpassword}
          setValue={(value) => {
            setConfirmpassword(value);
            setFormErrors((prev) => ({ ...prev, confirmpassword: "" }));
          }}
          placeholder="Please enter the confirm password"
          required
          error={formErrors.confirmpassword}
        />
        <InputFileUpload
          label="Upload profile pic"
          name="file_upload"
          value={profilePic}
          setValue={picDetails}
          picLoading={picLoading}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          required
          error={formErrors.profilePic}
          rules={profilePicRules}
          onValidate={(message) =>
            setFormErrors((prev) => ({ ...prev, profilePic: message }))
          }
        />
        {selectedImageUrl && (
          <ProfileImageEditor
            imageSrc={selectedImageUrl}
            onApply={uploadEditedProfileImage}
            onCancel={cancelProfileImageEdit}
            onReplaceImage={picDetails}
          />
        )}
        <div className="mt-4 flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-end sm:justify-between">
          <button
            className="rounded bg-red-600 px-3 py-2 text-white transition duration-300 ease-in-out hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={
              loadState ||
              picLoading ||
              emailAvailability.status === "checking" ||
              emailAvailability.status === "unavailable"
            }
            type="submit"
          >
            Submit
          </button>
          <Link
            className={`auth-link underline text-blue-500 ${
              loadState || picLoading ? "pointer-events-none opacity-60" : ""
            }`}
            onClick={switchToSignIn}
          >
            Login here
          </Link>
        </div>
      </form>
    </div>
  );
}
