import React, { useEffect, useState } from "react";
import { Swords, Trash2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import ConfirmPopup from "../components/ConfirmPopup";
import ErrorNotification from "../components/ErrorNotification";
import apiClient from "../utils/apiClient";

export default function ChallengeLanding({ setAlign }) {
  const { code } = useParams();
  const navigate = useNavigate();
  const normalizedCode = String(code || "").trim().toUpperCase();
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [notification, setNotification] = useState({ type: "info", message: "" });
  const currentUserId = JSON.parse(localStorage.getItem("currentUser"))?.user?._id;

  useEffect(() => {
    setAlign(true);
  }, [setAlign]);

  const loadChallenge = async () => {
    try {
      setLoading(true);
      setLoadError("");

      if (!/^[A-Z0-9]{6}$/.test(normalizedCode)) {
        setLoadError("Enter a valid 6 character challenge code.");
        return;
      }

      const response = await apiClient.get(`/api/challenges/${normalizedCode}`);
      setChallenge(response.data);
    } catch (error) {
      const message =
        error?.response?.status === 404
          ? "No challenge was found for this code. Please check the code and try again."
          : error?.response?.data?.error || "Unable to load challenge";

      setLoadError(message);
      setNotification({
        type: "error",
        message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChallenge();
  }, [normalizedCode]);

  const acceptChallenge = async () => {
    try {
      setActionLoading(true);
      await apiClient.post(`/api/challenges/${normalizedCode}/accept`);
      navigate(`/challenge/${normalizedCode}/play`);
    } catch (error) {
      setNotification({
        type: "error",
        message: error?.response?.data?.error || "Unable to accept challenge",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const deleteChallenge = async () => {
    try {
      setActionLoading(true);
      await apiClient.delete(`/api/challenges/${normalizedCode}`);
      setShowDeleteConfirm(false);
      navigate("/info");
    } catch (error) {
      setNotification({
        type: "error",
        message: error?.response?.data?.error || "Unable to delete challenge",
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="app-muted-text py-10 text-center">Loading challenge...</div>;
  }

  if (!challenge) {
    return (
      <div className="mx-auto mt-8 w-full max-w-xl">
        <ErrorNotification
          message={notification.message}
          type={notification.type}
          onHide={() => setNotification({ type: "info", message: "" })}
        />
        <div className="leaderboard-card rounded border p-6 text-center shadow">
          <Swords className="mx-auto mb-3 text-red-600" size={34} />
          <h1 className="app-strong-text text-2xl font-bold">
            Challenge not found
          </h1>
          <p className="app-muted-text mt-3">
            {loadError ||
              "This challenge code is invalid or no longer available."}
          </p>
          <p className="app-muted-text mt-2 text-sm">
            Code entered:{" "}
            <span className="app-strong-text font-semibold tracking-widest">
              {normalizedCode || "-"}
            </span>
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              className="rounded bg-red-600 px-4 py-3 text-white transition hover:bg-red-800"
              type="button"
              onClick={() => navigate("/info")}
            >
              Try Another Code
            </button>
            <button
              className="analysis-outline-button rounded border border-red-600 px-4 py-3 text-red-600 transition"
              type="button"
              onClick={() => navigate("/challenge/create")}
            >
              Create Challenge
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isCreator = challenge.createdBy === currentUserId;
  const isFull = challenge.participantCount >= 2 && !challenge.hasJoined;
  const isClosed = ["COMPLETED", "CANCELLED", "EXPIRED"].includes(challenge.status);
  const hasAnyCompleted = challenge.participants?.some((item) => item.hasCompleted);

  return (
    <div className="mx-auto mt-6 w-full max-w-2xl">
      <ConfirmPopup
        open={showDeleteConfirm}
        title="Delete Challenge?"
        body={`Are you sure you want to delete challenge ${normalizedCode}? This is only allowed before any results are recorded.`}
        confirmText={actionLoading ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        onConfirm={deleteChallenge}
        onCancel={() => setShowDeleteConfirm(false)}
      />
      <ErrorNotification
        message={notification.message}
        type={notification.type}
        onHide={() => setNotification({ type: "info", message: "" })}
      />
      <div className="leaderboard-card rounded border p-6 text-center shadow">
        <Swords className="mx-auto mb-3 text-red-600" size={34} />
        <h1 className="app-strong-text text-2xl font-bold">
          {isCreator
            ? "Your challenge is ready!"
            : `${challenge.creator.name} challenged you!`}
        </h1>
        <div className="mt-5 grid gap-3 text-left sm:grid-cols-2">
          <div className="rounded border p-3">
            <p className="app-muted-text text-sm">Category</p>
            <p className="app-strong-text font-semibold">{challenge.config.categoryName}</p>
          </div>
          <div className="rounded border p-3">
            <p className="app-muted-text text-sm">Difficulty</p>
            <p className="app-strong-text font-semibold capitalize">
              {challenge.config.difficulty}
            </p>
          </div>
          <div className="rounded border p-3">
            <p className="app-muted-text text-sm">Questions</p>
            <p className="app-strong-text font-semibold">
              {challenge.config.questionCount} Questions
            </p>
          </div>
          <div className="rounded border p-3">
            <p className="app-muted-text text-sm">Duration</p>
            <p className="app-strong-text font-semibold">
              {challenge.config.duration} Minutes
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {challenge.hasCompleted ? (
            <button
              className="rounded bg-red-600 px-4 py-3 text-white transition hover:bg-red-800"
              type="button"
              onClick={() => navigate(`/challenge/${normalizedCode}/results`)}
            >
              View Results
            </button>
          ) : isCreator || challenge.hasJoined ? (
            <button
              className="rounded bg-red-600 px-4 py-3 text-white transition hover:bg-red-800"
              type="button"
              onClick={() => navigate(`/challenge/${normalizedCode}/play`)}
              disabled={isClosed}
            >
              Play Challenge
            </button>
          ) : (
            <button
              className="rounded bg-red-600 px-4 py-3 text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
              disabled={actionLoading || isFull || isClosed}
              onClick={acceptChallenge}
            >
              {actionLoading ? "Accepting..." : "Accept Challenge"}
            </button>
          )}
          {isFull && (
            <p className="app-muted-text self-center text-sm">
              This challenge already has an opponent.
            </p>
          )}
          {isClosed && (
            <p className="app-muted-text self-center text-sm">
              This challenge is {challenge.status.toLowerCase()}.
            </p>
          )}
          {isCreator && !hasAnyCompleted && !isClosed && (
            <button
              className="analysis-outline-button inline-flex items-center justify-center gap-2 rounded border border-red-600 px-4 py-3 text-red-600 transition"
              type="button"
              disabled={actionLoading}
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 size={16} />
              Delete Challenge
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
