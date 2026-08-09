import React, { useEffect, useMemo, useState } from "react";
import { Copy, Swords, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Categories from "../data/Categories";
import Dropdown from "../components/Dropdown";
import ConfirmPopup from "../components/ConfirmPopup";
import ErrorNotification from "../components/ErrorNotification";
import apiClient from "../utils/apiClient";

const difficultyOptions = [
  { category: "Easy", value: "easy" },
  { category: "Medium", value: "medium" },
  { category: "Hard", value: "hard" },
];

const questionOptions = [
  { category: "10", value: 10 },
  { category: "15", value: 15 },
  { category: "20", value: 20 },
  { category: "25", value: 25 },
];

const durationOptions = [
  { category: "5 Minutes", value: 5 },
  { category: "10 Minutes", value: 10 },
  { category: "15 Minutes", value: 15 },
  { category: "20 Minutes", value: 20 },
];

export default function ChallengeCreate({ setAlign }) {
  const navigate = useNavigate();
  const [categoryId, setCategoryId] = useState(null);
  const [difficulty, setDifficulty] = useState("");
  const [questionCount, setQuestionCount] = useState(10);
  const [duration, setDuration] = useState(10);
  const [loading, setLoading] = useState(false);
  const [createdChallenge, setCreatedChallenge] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [notification, setNotification] = useState({ type: "info", message: "" });

  useEffect(() => {
    setAlign(true);
  }, [setAlign]);

  const categoryName = useMemo(
    () => Categories.find((item) => item.value === categoryId)?.category || "",
    [categoryId]
  );

  const copyText = async (value, label) => {
    await navigator.clipboard.writeText(value);
    setNotification({ type: "success", message: `${label} copied` });
  };

  const handleCreate = async (event) => {
    event.preventDefault();

    if (!categoryId || !difficulty || !questionCount || !duration) {
      setNotification({ type: "error", message: "Please fill all challenge settings" });
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.post("/api/challenges", {
        categoryId,
        categoryName,
        difficulty,
        questionCount,
        duration,
      });
      setCreatedChallenge(response.data);
      setNotification({ type: "success", message: "Challenge created" });
    } catch (error) {
      setNotification({
        type: "error",
        message: error?.response?.data?.error || "Unable to create challenge",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteChallenge = async () => {
    try {
      setLoading(true);
      await apiClient.delete(`/api/challenges/${createdChallenge.challengeCode}`);
      setCreatedChallenge(null);
      setShowDeleteConfirm(false);
      setNotification({ type: "success", message: "Challenge deleted successfully" });
    } catch (error) {
      setNotification({
        type: "error",
        message: error?.response?.data?.error || "Unable to delete challenge",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto mt-6 w-full max-w-3xl">
      <ErrorNotification
        message={notification.message}
        type={notification.type}
        onHide={() => setNotification({ type: "info", message: "" })}
      />
      <ConfirmPopup
        open={showDeleteConfirm}
        title="Delete Challenge?"
        body={`Are you sure you want to delete challenge ${createdChallenge?.challengeCode || ""}? This is only allowed before any results are recorded.`}
        confirmText={loading ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        onConfirm={deleteChallenge}
        onCancel={() => setShowDeleteConfirm(false)}
      />
      <div className="mb-5 flex items-center gap-2">
        <Swords className="text-red-600" size={24} />
        <h1 className="app-strong-text text-2xl font-bold">Challenge a Friend</h1>
      </div>

      {!createdChallenge ? (
        <form className="leaderboard-card rounded border p-5 shadow" onSubmit={handleCreate}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="app-label mb-2 block text-sm font-medium">
                Category
              </label>
              <Dropdown
                data={Categories}
                state={categoryId}
                setState={setCategoryId}
                dropdownId="challenge-category"
              />
            </div>
            <div>
              <label className="app-label mb-2 block text-sm font-medium">
                Difficulty
              </label>
              <Dropdown
                data={difficultyOptions}
                state={difficulty}
                setState={setDifficulty}
                dropdownId="challenge-difficulty"
              />
            </div>
            <div>
              <label className="app-label mb-2 block text-sm font-medium">
                Number of Questions
              </label>
              <Dropdown
                data={questionOptions}
                state={questionCount}
                setState={setQuestionCount}
                dropdownId="challenge-question-count"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="app-label mb-2 block text-sm font-medium">
                Timer / Duration
              </label>
              <Dropdown
                data={durationOptions}
                state={duration}
                setState={setDuration}
                dropdownId="challenge-duration"
              />
            </div>
          </div>
          <button
            className="mt-5 w-full rounded bg-red-600 p-3 text-white transition hover:bg-red-800"
            disabled={loading}
            type="submit"
          >
            {loading ? "Creating Challenge..." : "Create Challenge"}
          </button>
        </form>
      ) : (
        <div className="leaderboard-card rounded border p-5 shadow">
          <h2 className="app-strong-text text-xl font-bold">Challenge Created!</h2>
          <div className="mt-4 rounded border p-4">
            <p className="app-muted-text text-sm">Code</p>
            <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="app-strong-text text-2xl font-bold tracking-widest">
                {createdChallenge.challengeCode}
              </p>
              <button
                className="analysis-outline-button inline-flex items-center justify-center gap-2 rounded border border-red-600 px-3 py-2 text-red-600 transition"
                type="button"
                onClick={() => copyText(createdChallenge.challengeCode, "Code")}
              >
                <Copy size={16} />
                Copy Code
              </button>
            </div>
          </div>

          <div className="mt-4 rounded border p-4">
            <p className="app-muted-text text-sm">Share Link</p>
            <p className="app-strong-text mt-1 break-all">
              {createdChallenge.shareUrl}
            </p>
            <button
              className="analysis-outline-button mt-3 inline-flex items-center justify-center gap-2 rounded border border-red-600 px-3 py-2 text-red-600 transition"
              type="button"
              onClick={() => copyText(createdChallenge.shareUrl, "Link")}
            >
              <Copy size={16} />
              Copy Link
            </button>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <button
              className="w-full rounded bg-red-600 p-3 text-white transition hover:bg-red-800"
              type="button"
              onClick={() =>
                navigate(`/challenge/${createdChallenge.challengeCode}/play`)
              }
            >
              Play My Challenge
            </button>
            <button
              className="analysis-outline-button w-full rounded border border-red-600 p-3 text-red-600 transition"
              type="button"
              onClick={() =>
                navigate(`/challenge/${createdChallenge.challengeCode}`)
              }
            >
              Open Challenge Page
            </button>
            <button
              className="analysis-outline-button inline-flex w-full items-center justify-center gap-2 rounded border border-red-600 p-3 text-red-600 transition"
              type="button"
              disabled={loading}
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
