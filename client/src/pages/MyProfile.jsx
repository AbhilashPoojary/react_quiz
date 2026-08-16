import React, { useEffect, useRef, useState } from "react";
import { Edit3, KeyRound, Trash2, UserCircle, X } from "lucide-react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import apiClient from "../utils/apiClient";
import CategoryBarChart from "../components/CategoryBarChart";
import CategoryBubbleChart from "../components/CategoryBubbleChart";
import CategoryHeatmap from "../components/CategoryHeatmap";
import CategoryPolarAreaChart from "../components/CategoryPolarAreaChart";
import CategoryProgress from "../components/CategoryProgress";
import CategoryRadarChart from "../components/CategoryRadarChart";
import ConfirmPopup from "../components/ConfirmPopup";
import Dropdown from "../components/Dropdown";
import ErrorNotification from "../components/ErrorNotification";
import InputFileUpload from "../components/InputFileUpload";
import InputPassword from "../components/InputPassword";
import InputText from "../components/InputText";
import ProfileImageEditor from "../components/ProfileImageEditor";
import Util from "../components/util";
import { UPDATE_CURRENT_USER, UPDATE_PASSWORD_EXPIRY } from "../slice/authSlice";
import { validateField, validateFile } from "../utils/fieldValidation";

const emptyProfile = {
  user: {},
  stats: {
    gamesPlayed: 0,
    highestScore: 0,
    avgScore: 0,
    accuracy: 0,
  },
  performanceByCategory: [],
  recentHistory: [],
  challengeHistory: [],
};

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

const formatDate = (date) => {
  if (!date) {
    return "-";
  }

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
};

function MyProfileSkeleton() {
  return (
    <div className="profile-page mx-auto w-full max-w-5xl">
      <div className="border-b pb-5 text-center">
        <div className="mx-auto mb-3 h-16 w-16 animate-pulse rounded-full bg-gray-300" />
        <div className="mx-auto h-7 w-40 animate-pulse rounded bg-gray-300" />
      </div>

      <div className="grid grid-cols-1 gap-4 border-b py-5 sm:grid-cols-2">
        <div>
          <div className="mb-2 h-4 w-14 animate-pulse rounded bg-gray-300" />
          <div className="h-5 w-40 animate-pulse rounded bg-gray-300" />
        </div>
        <div>
          <div className="mb-2 h-4 w-14 animate-pulse rounded bg-gray-300" />
          <div className="h-5 w-56 max-w-full animate-pulse rounded bg-gray-300" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 border-b py-5 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div className="profile-stat-card rounded border p-4" key={index}>
            <div className="mx-auto mb-3 h-4 w-20 animate-pulse rounded bg-gray-300" />
            <div className="mx-auto h-8 w-12 animate-pulse rounded bg-gray-300" />
          </div>
        ))}
      </div>

      <section className="border-b py-5">
        <div className="mb-5 h-6 w-56 animate-pulse rounded bg-gray-300" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index}>
              <div className="mb-2 flex justify-between gap-3">
                <div className="h-4 w-40 animate-pulse rounded bg-gray-300" />
                <div className="h-4 w-10 animate-pulse rounded bg-gray-300" />
              </div>
              <div className="h-3 w-full animate-pulse rounded-full bg-gray-300" />
            </div>
          ))}
        </div>
      </section>

      <section className="py-5">
        <div className="mb-4 h-6 w-44 animate-pulse rounded bg-gray-300" />
        <div className="overflow-hidden rounded border">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              className="grid grid-cols-5 gap-3 border-b p-4 last:border-b-0"
              key={index}
            >
              {Array.from({ length: 5 }).map((__, cellIndex) => (
                <div
                  className="h-4 animate-pulse rounded bg-gray-300"
                  key={cellIndex}
                />
              ))}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function MyProfile({ setAlign }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [profile, setProfile] = useState(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [categoryView, setCategoryView] = useState("progress");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    profilePicture: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    password: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [picLoading, setPicLoading] = useState(false);
  const [deletingChallenge, setDeletingChallenge] = useState(false);
  const [challengeToDelete, setChallengeToDelete] = useState(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState("");
  const [notification, setNotification] = useState({
    type: "info",
    message: "",
  });
  const [emailAvailability, setEmailAvailability] = useState({
    status: "idle",
    email: "",
  });
  const selectedImageUrlRef = useRef("");
  const emailAvailabilityCacheRef = useRef({});
  const emailCheckRequestRef = useRef(0);

  useEffect(() => {
    setAlign(true);
  }, [setAlign]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get("/api/profile");
        setProfile(response.data);
        setError("");
      } catch (error) {
        setError(error?.response?.data?.error || "Unable to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const startEditing = () => {
    setEditForm({
      name: profile.user?.name || "",
      email: profile.user?.email || "",
      profilePicture: profile.user?.profilePicture || "",
    });
    setFormErrors({});
    setEmailAvailability({ status: "idle", email: "" });
    setIsEditing(true);
  };

  const revokeSelectedImageUrl = () => {
    if (selectedImageUrlRef.current) {
      URL.revokeObjectURL(selectedImageUrlRef.current);
      selectedImageUrlRef.current = "";
    }
    setSelectedImageUrl("");
  };

  const cancelEditing = () => {
    revokeSelectedImageUrl();
    setFormErrors({});
    setEmailAvailability({ status: "idle", email: "" });
    setIsEditing(false);
  };

  const updateEditField = (key, value) => {
    setEditForm((prev) => ({ ...prev, [key]: value }));
    setFormErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const updatePasswordField = (key, value) => {
    setPasswordForm((prev) => ({ ...prev, [key]: value }));
    setPasswordErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const closePasswordReset = () => {
    setPasswordForm({
      currentPassword: "",
      password: "",
      confirmPassword: "",
    });
    setPasswordErrors({});
    setIsResettingPassword(false);
  };

  const handleDeleteChallenge = async () => {
    if (!challengeToDelete) {
      return;
    }

    try {
      setDeletingChallenge(true);
      await apiClient.delete(`/api/challenges/${challengeToDelete.challengeCode}`);
      setProfile((prev) => ({
        ...prev,
        challengeHistory: (prev.challengeHistory || []).filter(
          (item) => item._id !== challengeToDelete._id
        ),
      }));
      setNotification({
        type: "success",
        message: "Challenge deleted successfully",
      });
      setChallengeToDelete(null);
    } catch (error) {
      setNotification({
        type: "error",
        message: error?.response?.data?.error || "Unable to delete challenge",
      });
    } finally {
      setDeletingChallenge(false);
    }
  };

  const handleProfileImageSelect = async (file) => {
    setFormErrors((prev) => ({ ...prev, profilePicture: "" }));

    if (!file) {
      revokeSelectedImageUrl();
      setEditForm((prev) => ({
        ...prev,
        profilePicture: profile.user?.profilePicture || "",
      }));
      return;
    }

    const profilePicError = validateFile(file, profilePicRules, "Profile pic");
    if (profilePicError) {
      setFormErrors((prev) => ({ ...prev, profilePicture: profilePicError }));
      setNotification({ type: "error", message: profilePicError });
      return;
    }

    revokeSelectedImageUrl();
    const nextImageUrl = URL.createObjectURL(file);
    selectedImageUrlRef.current = nextImageUrl;
    setSelectedImageUrl(nextImageUrl);
  };

  const uploadEditedProfileImage = async (file) => {
    await Util.uploadImage(
      file,
      setPicLoading,
      (url) => updateEditField("profilePicture", url),
      () => {},
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

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    const errors = {};
    const name = editForm.name.trim();
    const email = editForm.email.trim().toLowerCase();

    const nameError = validateField(name, nameRules, "Name");
    if (nameError) {
      errors.name = nameError;
    }

    if (!email) {
      errors.email = "Email is mandatory";
    } else if (!emailPattern.test(email)) {
      errors.email = "Please enter a valid email";
    } else if (emailAvailability.status === "checking") {
      errors.email = "Please wait while we check this email";
    } else if (
      emailAvailability.status === "unavailable" &&
      emailAvailability.email === email
    ) {
      errors.email = "Email is already registered";
    }

    const profilePicError = validateFile(
      editForm.profilePicture,
      profilePicRules,
      "Profile pic"
    );
    if (profilePicError) {
      errors.profilePicture = profilePicError;
    }

    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    try {
      setSavingProfile(true);
      const response = await apiClient.patch("/api/profile", {
        name,
        email,
        profilePicture: editForm.profilePicture,
      });
      const updatedUser = response.data.user;

      setProfile((prev) => ({
        ...prev,
        user: updatedUser,
      }));
      dispatch(UPDATE_CURRENT_USER(updatedUser));
      setIsEditing(false);
      setEmailAvailability({ status: "idle", email: "" });
      setNotification({
        type: "success",
        message: "Profile updated successfully",
      });
    } catch (error) {
      setNotification({
        type: "error",
        message: error?.response?.data?.error || "Unable to update profile",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    const errors = {};

    if (!passwordForm.currentPassword.trim()) {
      errors.currentPassword = "Current Password is mandatory";
    }

    const passwordError = validateField(
      passwordForm.password,
      passwordRules,
      "New Password"
    );
    if (passwordError) {
      errors.password = passwordError;
    }

    if (!passwordForm.confirmPassword.trim()) {
      errors.confirmPassword = "Confirm Password is mandatory";
    } else if (passwordForm.password !== passwordForm.confirmPassword) {
      errors.confirmPassword = "Passwords should match";
    }

    setPasswordErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    try {
      setSavingPassword(true);
      const response = await apiClient.post("/auth/change-password", {
        currentPassword: passwordForm.currentPassword,
        password: passwordForm.password,
        confirmPassword: passwordForm.confirmPassword,
      });

      dispatch(UPDATE_PASSWORD_EXPIRY(response.data?.passwordExpiry));
      closePasswordReset();
      setNotification({
        type: "success",
        message: response.data?.message || "Password reset successfully.",
      });
    } catch (error) {
      setNotification({
        type: "error",
        message: error?.response?.data?.error || "Unable to reset password",
      });
    } finally {
      setSavingPassword(false);
    }
  };

  useEffect(
    () => () => {
      revokeSelectedImageUrl();
    },
    []
  );

  useEffect(() => {
    if (!isEditing) {
      return undefined;
    }

    const normalizedEmail = editForm.email.trim().toLowerCase();
    const currentEmail = String(profile.user?.email || "").trim().toLowerCase();

    if (!normalizedEmail || !emailPattern.test(normalizedEmail)) {
      setEmailAvailability({ status: "idle", email: normalizedEmail });
      return undefined;
    }

    if (normalizedEmail === currentEmail) {
      setEmailAvailability({ status: "current", email: normalizedEmail });
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
  }, [editForm.email, isEditing, profile.user?.email]);

  if (loading) {
    return <MyProfileSkeleton />;
  }

  if (error) {
    return <div className="py-10 text-center text-red-600">{error}</div>;
  }

  const {
    user,
    stats,
    performanceByCategory,
    recentHistory,
    challengeHistory = [],
  } = profile;
  const categoryViewOptions = [
    { category: "Progress", value: "progress" },
    { category: "Bar Chart", value: "bar" },
    { category: "Radar Chart", value: "radar" },
    { category: "Heatmap", value: "heatmap" },
    { category: "Bubble Chart", value: "bubble" },
    { category: "Polar Area Chart", value: "polar" },
  ];

  const renderCategoryPerformance = () => {
    if (categoryView === "bar") {
      return <CategoryBarChart data={performanceByCategory} />;
    }

    if (categoryView === "radar") {
      return <CategoryRadarChart data={performanceByCategory} />;
    }

    if (categoryView === "heatmap") {
      return <CategoryHeatmap data={performanceByCategory} />;
    }

    if (categoryView === "bubble") {
      return <CategoryBubbleChart data={performanceByCategory} />;
    }

    if (categoryView === "polar") {
      return <CategoryPolarAreaChart data={performanceByCategory} />;
    }

    return <CategoryProgress data={performanceByCategory} />;
  };

  return (
    <div className="profile-page mx-auto w-full max-w-5xl">
      <ErrorNotification
        message={notification.message}
        type={notification.type}
        duration={3500}
        onHide={() => setNotification({ type: "info", message: "" })}
      />
      <ConfirmPopup
        open={Boolean(challengeToDelete)}
        title="Delete Challenge?"
        body={`Are you sure you want to delete challenge ${
          challengeToDelete?.challengeCode || ""
        }? This is only available before another user joins.`}
        confirmText={deletingChallenge ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        onConfirm={handleDeleteChallenge}
        onCancel={() => setChallengeToDelete(null)}
      />
      <div className="border-b pb-3 mt-3">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:justify-between sm:text-left">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-gray-200">
              {user.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={user.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <UserCircle size={52} />
              )}
            </div>
            <div>
              <h1 className="app-strong-text text-2xl font-bold">My Profile</h1>
              <p className="app-muted-text mt-1 text-sm">
                Manage your account details
              </p>
            </div>
          </div>
          {!isEditing && (
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                className="inline-flex items-center gap-2 rounded bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-800"
                type="button"
                onClick={startEditing}
              >
                <Edit3 size={16} />
                Edit Profile
              </button>
              <button
                className="analysis-outline-button inline-flex items-center gap-2 rounded border border-red-600 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                type="button"
                onClick={() => setIsResettingPassword(true)}
              >
                <KeyRound size={16} />
                Reset Password
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 border-b py-5 sm:grid-cols-2">
        <div>
          <p className="app-muted-text text-sm">Name</p>
          <p className="app-strong-text break-words font-semibold">
            {user.name}
          </p>
        </div>
        <div>
          <p className="app-muted-text text-sm">Email</p>
          <p className="app-strong-text break-words font-semibold">
            {user.email}
          </p>
        </div>
      </div>

      {isEditing && (
        <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/50 p-3 sm:items-center">
          <form
            className="confirm-card w-full max-w-2xl rounded border p-5 shadow-xl sm:p-6"
            onSubmit={handleSaveProfile}
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 className="app-strong-text text-xl font-bold">
                  Edit Profile
                </h2>
                <p className="app-muted-text mt-1 text-sm">
                  Update your account details
                </p>
              </div>
              <button
                aria-label="Close edit profile"
                className="rounded p-2 text-gray-500 transition hover:text-red-600"
                disabled={savingProfile || picLoading}
                type="button"
                onClick={cancelEditing}
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InputText
                name="name"
                label="Name"
                value={editForm.name}
                setValue={(value) => updateEditField("name", value)}
                type="text"
                required
                rules={nameRules}
                error={formErrors.name}
                onValidate={(message) =>
                  setFormErrors((prev) => ({ ...prev, name: message }))
                }
                containerClassName="mb-0"
              />
              <InputText
                name="email"
                label="Email"
                value={editForm.email}
                setValue={(value) => updateEditField("email", value)}
                type="text"
                required
                rules={emailRules}
                error={formErrors.email}
                onValidate={(message) =>
                  setFormErrors((prev) => ({ ...prev, email: message }))
                }
                containerClassName="mb-0"
              />
              {editForm.email.trim() &&
                emailPattern.test(editForm.email.trim().toLowerCase()) && (
                  <div className="-mt-2 sm:col-start-2 text-sm">
                    {emailAvailability.status === "checking" && (
                      <span className="app-muted-text">Checking email...</span>
                    )}
                    {emailAvailability.status === "available" && (
                      <span className="text-green-600">Email available</span>
                    )}
                    {emailAvailability.status === "current" && (
                      <span className="app-muted-text">
                        Current email address
                      </span>
                    )}
                    {emailAvailability.status === "unavailable" && (
                      <span className="text-red-600">
                        Email is already registered
                      </span>
                    )}
                  </div>
                )}
              <div className="sm:col-span-2">
                <InputFileUpload
                  label="Profile pic"
                  name="profile_file_upload"
                  value={editForm.profilePicture}
                  setValue={handleProfileImageSelect}
                  picLoading={picLoading}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  required
                  error={formErrors.profilePicture}
                  previewUrl={editForm.profilePicture}
                  rules={profilePicRules}
                  onValidate={(message) =>
                    setFormErrors((prev) => ({
                      ...prev,
                      profilePicture: message,
                    }))
                  }
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:justify-end">
              <button
                className="rounded border border-red-600 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={savingProfile || picLoading}
                type="button"
                onClick={cancelEditing}
              >
                Cancel
              </button>
              <button
                className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-800 disabled:cursor-wait disabled:opacity-60"
                disabled={
                  savingProfile ||
                  picLoading ||
                  emailAvailability.status === "checking" ||
                  emailAvailability.status === "unavailable"
                }
                type="submit"
              >
                {savingProfile ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}

      {selectedImageUrl && (
        <ProfileImageEditor
          imageSrc={selectedImageUrl}
          onApply={uploadEditedProfileImage}
          onCancel={revokeSelectedImageUrl}
          onReplaceImage={handleProfileImageSelect}
        />
      )}

      {isResettingPassword && (
        <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/50 p-3 sm:items-center">
          <form
            className="confirm-card w-full max-w-lg rounded border p-5 shadow-xl sm:p-6"
            onSubmit={handleResetPassword}
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 className="app-strong-text text-xl font-bold">
                  Reset Password
                </h2>
                <p className="app-muted-text mt-1 text-sm">
                  Update your account password
                </p>
              </div>
              <button
                aria-label="Close reset password"
                className="rounded p-2 text-gray-500 transition hover:text-red-600"
                disabled={savingPassword}
                type="button"
                onClick={closePasswordReset}
              >
                <X size={20} />
              </button>
            </div>

            <InputPassword
              name="profile current password"
              label="Current Password"
              value={passwordForm.currentPassword}
              setValue={(value) => updatePasswordField("currentPassword", value)}
              required
              error={passwordErrors.currentPassword}
            />
            <InputPassword
              name="profile new password"
              label="New Password"
              value={passwordForm.password}
              setValue={(value) => updatePasswordField("password", value)}
              required
              rules={passwordRules}
              error={passwordErrors.password}
              onValidate={(message) =>
                setPasswordErrors((prev) => ({ ...prev, password: message }))
              }
            />
            <InputPassword
              name="profile confirm password"
              label="Confirm Password"
              value={passwordForm.confirmPassword}
              setValue={(value) =>
                updatePasswordField("confirmPassword", value)
              }
              required
              error={passwordErrors.confirmPassword}
            />

            <div className="mt-6 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:justify-end">
              <button
                className="rounded border border-red-600 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={savingPassword}
                type="button"
                onClick={closePasswordReset}
              >
                Cancel
              </button>
              <button
                className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-800 disabled:cursor-wait disabled:opacity-60"
                disabled={savingPassword}
                type="submit"
              >
                {savingPassword ? "Resetting..." : "Reset Password"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 py-5 md:grid-cols-4">
        <div className="profile-stat-card rounded border p-4 text-center">
          <p className="app-muted-text text-sm">Games Played</p>
          <p className="app-strong-text text-2xl font-bold">{stats.gamesPlayed}</p>
        </div>
        <div className="profile-stat-card rounded border p-4 text-center">
          <p className="app-muted-text text-sm">Highest Score</p>
          <p className="app-strong-text text-2xl font-bold">{stats.highestScore}</p>
        </div>
        <div className="profile-stat-card rounded border p-4 text-center">
          <p className="app-muted-text text-sm">Avg Score</p>
          <p className="app-strong-text text-2xl font-bold">{stats.avgScore}</p>
        </div>
        <div className="profile-stat-card rounded border p-4 text-center">
          <p className="app-muted-text text-sm">Accuracy</p>
          <p className="app-strong-text text-2xl font-bold">{stats.accuracy}%</p>
        </div>
      </div>

      <section className="border p-5 rounded">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="app-strong-text text-lg font-bold">
            Performance by Category
          </h2>
          <div className="w-full sm:w-56">
            <Dropdown
              data={categoryViewOptions}
              state={categoryView}
              setState={setCategoryView}
              dropdownId="profile-category-view"
            />
          </div>
        </div>
        <div className="profile-performance-view" key={categoryView}>
          {renderCategoryPerformance()}
        </div>
      </section>

      <section className="py-5">
        <h2 className="app-strong-text mb-4 text-lg font-bold">
          Recent Quiz History
        </h2>
        <div className="overflow-x-auto">
          <table className="app-table min-w-[620px] w-full border text-left text-sm">
            <thead className="app-table-head">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Difficulty</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Analysis</th>
              </tr>
            </thead>
            <tbody>
              {recentHistory.length > 0 ? (
                recentHistory.map((item) => (
                  <tr className="app-table-row border-t" key={item._id}>
                    <td className="px-4 py-3">{formatDate(item.createdAt)}</td>
                    <td className="px-4 py-3">{item.categoryName}</td>
                    <td className="px-4 py-3 capitalize">{item.difficulty}</td>
                    <td className="px-4 py-3">{item.score}</td>
                    <td className="px-4 py-3">{item.totalTime} secs</td>
                    <td className="px-4 py-3">
                      <button
                        className="rounded border border-red-600 px-3 py-1 text-sm text-red-600 transition hover:bg-red-50"
                        type="button"
                        onClick={() =>
                          navigate(`/quiz-analysis/${item._id}`, {
                            state: {
                              backTo: "/profile",
                              backLabel: "Back to Profile",
                            },
                          })
                        }
                      >
                        Analyze
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="app-table-row border-t">
                  <td className="px-4 py-4 text-center" colSpan={6}>
                    No recent quiz history.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="border-t py-5">
        <h2 className="app-strong-text mb-4 text-lg font-bold">
          Challenge History
        </h2>
        <div className="overflow-x-auto">
          <table className="app-table min-w-[760px] w-full border text-left text-sm">
            <thead className="app-table-head">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Difficulty</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {challengeHistory.length > 0 ? (
                challengeHistory.map((item) => {
                  const canPlay =
                    !item.hasCompleted &&
                    !["COMPLETED", "CANCELLED", "EXPIRED"].includes(
                      item.status
                    );
                  const canDelete =
                    item.canDelete ||
                    (item.status === "OPEN" &&
                      Number(item.participantCount || 0) <= 1 &&
                      Number(item.completedCount || 0) === 0);

                  return (
                    <tr className="app-table-row border-t" key={item._id}>
                      <td className="px-4 py-3">{formatDate(item.createdAt)}</td>
                      <td className="px-4 py-3 font-semibold">
                        {item.challengeCode}
                      </td>
                      <td className="px-4 py-3">{item.categoryName}</td>
                      <td className="px-4 py-3 capitalize">
                        {item.difficulty}
                      </td>
                      <td className="px-4 py-3">
                        {item.status} ({item.completedCount}/
                        {Math.max(2, item.participantCount)})
                      </td>
                      <td className="px-4 py-3">
                        {item.hasCompleted
                          ? `${item.score} / ${item.maxScore}`
                          : "-"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            className={
                              canPlay
                                ? "rounded bg-red-600 px-3 py-1 text-sm text-white transition hover:bg-red-800"
                                : "analysis-outline-button rounded border border-red-600 px-3 py-1 text-sm text-red-600 transition"
                            }
                            type="button"
                            onClick={() =>
                              navigate(
                                canPlay
                                  ? `/challenge/${item.challengeCode}/play`
                                  : `/challenge/${item.challengeCode}/results`
                              )
                            }
                          >
                            {canPlay ? "Play" : "View Results"}
                          </button>
                          {canDelete && (
                            <button
                              className="analysis-outline-button inline-flex items-center gap-1 rounded border border-red-600 px-3 py-1 text-sm text-red-600 transition"
                              disabled={deletingChallenge}
                              type="button"
                              onClick={() => setChallengeToDelete(item)}
                            >
                              <Trash2 size={14} />
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr className="app-table-row border-t">
                  <td className="px-4 py-4 text-center" colSpan={7}>
                    No challenge history yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
