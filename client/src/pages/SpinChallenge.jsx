import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Copy,
  HelpCircle,
  Loader2,
  RotateCcw,
  Share2,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Categories from "../data/Categories";
import ErrorNotification from "../components/ErrorNotification";
import ConfirmPopup from "../components/ConfirmPopup";
import apiClient from "../utils/apiClient";
import { getChallengeUrl, shareChallenge } from "../utils/shareChallenge";

const difficultyOptions = [
  { label: "Easy", value: "easy" },
  { label: "Medium", value: "medium" },
  { label: "Hard", value: "hard" },
];

const questionCountOptions = [10, 15, 20, 25].map((value) => ({
  label: String(value),
  value,
}));

const spinOrder = ["category", "difficulty", "questionCount"];
const spinLabels = {
  category: "Category",
  difficulty: "Difficulty",
  questionCount: "Questions",
};

const getRandomItem = (items) => items[Math.floor(Math.random() * items.length)];

function Wheel({ label, icon: Icon, value, spinning, stopped, onStop }) {
  return (
    <button
      className="spin-wheel-item"
      disabled={!spinning}
      type="button"
      onClick={onStop}
    >
      <span className={`spin-wheel ${spinning ? "spin-wheel-active" : ""}`}>
        <span className="spin-wheel-pointer" />
        <span className="spin-wheel-center" />
      </span>
      <span className="mt-3 flex items-center justify-center gap-1 text-xs font-bold uppercase">
        <Icon size={16} />
        {label}
      </span>
      <span className="app-strong-text mt-1 block min-h-[22px] text-sm font-semibold">
        {value || (spinning ? "Spinning..." : stopped ? "Stopped" : "Ready")}
      </span>
    </button>
  );
}

export default function SpinChallenge({
  requestQuestions,
  setAlign,
  setCategoty,
  setDifficulty,
  setQuestionType,
  setQuestionCount,
  setEnableTimer,
  setTimerMode,
  setTotalDuration,
  setTimePerQuestion,
}) {
  const navigate = useNavigate();
  const timersRef = useRef([]);
  const categories = useMemo(
    () => Categories.filter((item) => item.value),
    []
  );
  const [step, setStep] = useState(1);
  const [spinning, setSpinning] = useState(false);
  const [starting, setStarting] = useState(false);
  const [challengeLoading, setChallengeLoading] = useState(false);
  const [createdChallenge, setCreatedChallenge] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [stopped, setStopped] = useState({
    category: false,
    difficulty: false,
    questionCount: false,
  });
  const [picks, setPicks] = useState({
    category: null,
    difficulty: null,
    questionCount: null,
  });
  const [error, setError] = useState("");

  useEffect(() => {
    setAlign(true);
    return () => timersRef.current.forEach((timer) => window.clearTimeout(timer));
  }, [setAlign]);

  const clearTimers = () => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
  };

  const resolveWheel = (key) => {
    setPicks((prev) => {
      if (prev[key]) {
        return prev;
      }

      if (key === "category") {
        const category = getRandomItem(categories);
        return { ...prev, category };
      }

      if (key === "difficulty") {
        return { ...prev, difficulty: getRandomItem(difficultyOptions) };
      }

      return { ...prev, questionCount: getRandomItem(questionCountOptions) };
    });
    setStopped((prev) => ({ ...prev, [key]: true }));
  };

  const spinAll = () => {
    if (!categories.length || spinning || starting) {
      return;
    }

    clearTimers();
    setError("");
    setCreatedChallenge(null);
    setStep(2);
    setSpinning(true);
    setPicks({ category: null, difficulty: null, questionCount: null });
    setStopped({ category: false, difficulty: false, questionCount: false });

    spinOrder.forEach((key, index) => {
      const timer = window.setTimeout(() => {
        resolveWheel(key);
      }, 1200 + index * 650);
      timersRef.current.push(timer);
    });

    const doneTimer = window.setTimeout(() => {
      setSpinning(false);
      setStep(3);
    }, 3400);
    timersRef.current.push(doneTimer);
  };

  const stopWheel = (key) => {
    if (!spinning || stopped[key]) {
      return;
    }

    resolveWheel(key);
  };

  useEffect(() => {
    if (!spinning) {
      return;
    }

    if (spinOrder.every((key) => stopped[key])) {
      clearTimers();
      const timer = window.setTimeout(() => {
        setSpinning(false);
        setStep(3);
      }, 350);
      timersRef.current.push(timer);
    }
  }, [spinning, stopped]);

  const getDisplayValue = (key) => {
    if (key === "category") return picks.category?.category || "";
    if (key === "difficulty") return picks.difficulty?.label || "";
    return picks.questionCount?.label || "";
  };

  const canStart =
    Boolean(picks.category?.value) &&
    Boolean(picks.difficulty?.value) &&
    Boolean(picks.questionCount?.value) &&
    !spinning &&
    !starting;

  const startQuiz = async () => {
    if (!canStart) {
      setError("Please spin all wheels before starting the quiz.");
      return;
    }

    const selectedSettings = {
      category: picks.category.value,
      difficulty: picks.difficulty.value,
      questionType: "multiple",
      questionCount: picks.questionCount.value,
      quizType: "SPIN",
      requireExactCount: true,
    };

    try {
      setStarting(true);
      setError("");
      const result = await requestQuestions(selectedSettings);

      if (!result?.success) {
        setError(
          result?.message ||
            "Unable to load questions for these spin results. Please spin again."
        );
        return;
      }

      if (result.count < selectedSettings.questionCount) {
        setError(
          `Only ${result.count} questions were found for this spin, but the wheel picked ${selectedSettings.questionCount}. Please spin again or try another setup.`
        );
        return;
      }

      setCategoty(selectedSettings.category);
      setDifficulty(selectedSettings.difficulty);
      setQuestionType(selectedSettings.questionType);
      setQuestionCount(selectedSettings.questionCount);
      setEnableTimer(true);
      setTimerMode("PER_QUESTION");
      setTotalDuration(null);
      setTimePerQuestion(10);

      navigate("/quiz");
    } finally {
      setStarting(false);
    }
  };

  const createSpinChallenge = async () => {
    if (!canStart) {
      setError("Please spin all wheels before creating a challenge.");
      return;
    }

    try {
      setChallengeLoading(true);
      setError("");
      const response = await apiClient.post("/api/challenges", {
        categoryId: picks.category.value,
        categoryName: picks.category.category,
        difficulty: picks.difficulty.value,
        questionType: "multiple",
        questionCount: picks.questionCount.value,
        duration: Math.ceil((10 * picks.questionCount.value) / 60) || 1,
        timedQuiz: true,
        showAnswerFeedback: true,
        timerMode: "PER_QUESTION",
        totalDuration: null,
        timePerQuestion: 10,
      });

      setCreatedChallenge(response.data);
      setError("");
    } catch (error) {
      setError(error?.response?.data?.error || "Unable to create challenge.");
    } finally {
      setChallengeLoading(false);
    }
  };

  const copyText = async (value, label = "Challenge") => {
    try {
      await navigator.clipboard.writeText(value);
      setError(`${label} copied to clipboard.`);
    } catch (error) {
      setError("Unable to copy. Please copy it manually.");
    }
  };

  const handleShareChallenge = async () => {
    if (!createdChallenge?.challengeCode) {
      return;
    }

    try {
      const result = await shareChallenge(createdChallenge.challengeCode);

      if (result.status === "copied") {
        setError("Challenge invitation copied to clipboard.");
      } else if (result.status === "shared") {
        setError("Challenge shared.");
      }
    } catch (error) {
      setError("Unable to share challenge. Please copy the link manually.");
    }
  };

  const deleteChallenge = async () => {
    try {
      setChallengeLoading(true);
      await apiClient.delete(`/api/challenges/${createdChallenge.challengeCode}`);
      setCreatedChallenge(null);
      setShowDeleteConfirm(false);
      setError("Challenge deleted successfully.");
    } catch (error) {
      setError(error?.response?.data?.error || "Unable to delete challenge.");
    } finally {
      setChallengeLoading(false);
    }
  };

  const stepLabel =
    step === 1 ? "Spin the Wheels" : step === 2 ? "Wheels are Spinning..." : "Your Challenge is Ready!";

  return (
    <div className="mx-auto w-full max-w-5xl">
      <ErrorNotification
        message={error}
        type={error.includes("copied") || error.includes("shared") || error.includes("deleted") ? "success" : "error"}
        duration={5000}
        onHide={() => setError("")}
      />
      <ConfirmPopup
        open={showDeleteConfirm}
        title="Delete Challenge?"
        body={`Are you sure you want to delete challenge ${createdChallenge?.challengeCode || ""}? This is only allowed before any results are recorded.`}
        confirmText={challengeLoading ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        onConfirm={deleteChallenge}
        onCancel={() => setShowDeleteConfirm(false)}
      />
      <div className="mb-4 flex items-center justify-between gap-3 border-b pb-4">
        <button
          className="analysis-outline-button inline-flex items-center gap-2 rounded border px-3 py-2 text-sm"
          disabled={starting}
          type="button"
          onClick={() => navigate("/info")}
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <div className="text-center">
          <h1 className="app-strong-text text-xl font-bold">Spin Challenge</h1>
          <p className="mt-1 text-xs font-semibold text-red-600">
            Step {step} of 3
          </p>
        </div>
        <div className="hidden w-20 sm:block" />
      </div>

      <section className="admin-card rounded border p-5 text-center shadow-sm">
        <div className="mx-auto mb-4 max-w-xl">
          <h2 className="app-strong-text text-2xl font-bold">{stepLabel}</h2>
          <p className="app-muted-text mt-2 text-sm">
            {step === 1
              ? "Let the wheels pick your category, difficulty, and question count."
              : step === 2
              ? "Tap any spinning wheel to stop it early."
              : "Here are your lucky picks. Start the quiz or spin again."}
          </p>
        </div>

        <div className="mb-5 flex justify-center">
          <div className="rounded border p-3 text-left text-xs">
            <div className="flex items-start gap-2">
              <HelpCircle className="mt-0.5 text-red-600" size={16} />
              <p className="app-muted-text">
                You can stop each wheel individually while spinning.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <Wheel
            icon={Sparkles}
            label="Category"
            spinning={spinning && !stopped.category}
            stopped={stopped.category}
            value={getDisplayValue("category")}
            onStop={() => stopWheel("category")}
          />
          <Wheel
            icon={BarChart3}
            label="Difficulty"
            spinning={spinning && !stopped.difficulty}
            stopped={stopped.difficulty}
            value={getDisplayValue("difficulty")}
            onStop={() => stopWheel("difficulty")}
          />
          <Wheel
            icon={HelpCircle}
            label="Questions"
            spinning={spinning && !stopped.questionCount}
            stopped={stopped.questionCount}
            value={getDisplayValue("questionCount")}
            onStop={() => stopWheel("questionCount")}
          />
        </div>

        {step === 3 && (
          <div className="mx-auto mt-6 grid max-w-3xl gap-3 sm:grid-cols-3">
            <div className="rounded border p-4">
              <p className="app-muted-text text-xs font-bold uppercase">Category</p>
              <p className="app-strong-text mt-1 font-semibold">
                {picks.category?.category}
              </p>
            </div>
            <div className="rounded border p-4">
              <p className="app-muted-text text-xs font-bold uppercase">Difficulty</p>
              <p className="app-strong-text mt-1 font-semibold">
                {picks.difficulty?.label}
              </p>
            </div>
            <div className="rounded border p-4">
              <p className="app-muted-text text-xs font-bold uppercase">Questions</p>
              <p className="app-strong-text mt-1 font-semibold">
                {picks.questionCount?.label}
              </p>
            </div>
          </div>
        )}

        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          {step === 3 ? (
            <>
              <button
                className="inline-flex items-center justify-center gap-2 rounded bg-red-600 px-8 py-3 font-semibold text-white transition hover:bg-red-800 disabled:cursor-wait disabled:opacity-70"
                disabled={!canStart || challengeLoading}
                type="button"
                onClick={startQuiz}
              >
                {starting ? <Loader2 className="animate-spin" size={18} /> : null}
                {starting ? "Loading Quiz..." : "Start Quiz"}
                {!starting && <ArrowRight size={18} />}
              </button>
              <button
                className="analysis-outline-button inline-flex items-center justify-center gap-2 rounded border border-red-600 px-8 py-3 font-semibold text-red-600 disabled:cursor-wait disabled:opacity-60"
                disabled={!canStart || starting || challengeLoading}
                type="button"
                onClick={createSpinChallenge}
              >
                {challengeLoading && !createdChallenge ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Share2 size={18} />
                )}
                {challengeLoading && !createdChallenge
                  ? "Creating..."
                  : "Create Challenge"}
              </button>
              <button
                className="analysis-outline-button inline-flex items-center justify-center gap-2 rounded border border-red-600 px-8 py-3 font-semibold text-red-600"
                disabled={starting || challengeLoading}
                type="button"
                onClick={spinAll}
              >
                <RotateCcw size={18} />
                Spin Again
              </button>
            </>
          ) : (
            <button
              className="inline-flex items-center justify-center gap-2 rounded bg-red-600 px-8 py-3 font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={spinning || starting || !categories.length}
              type="button"
              onClick={spinAll}
            >
              {spinning ? <Loader2 className="animate-spin" size={18} /> : null}
              {spinning ? "Spinning..." : "Spin All"}
            </button>
          )}
        </div>

        {createdChallenge && (
          <div className="mx-auto mt-6 max-w-3xl rounded border p-4 text-left">
            <h3 className="app-strong-text text-lg font-bold">Spin Challenge Created!</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div className="rounded border p-3">
                <p className="app-muted-text text-xs font-bold uppercase">Code</p>
                <p className="app-strong-text mt-1 text-xl font-bold tracking-widest">
                  {createdChallenge.challengeCode}
                </p>
              </div>
              <div className="rounded border p-3">
                <p className="app-muted-text text-xs font-bold uppercase">Questions</p>
                <p className="app-strong-text mt-1 font-semibold">
                  {createdChallenge.config?.questionCount || picks.questionCount?.value}
                </p>
              </div>
              <div className="rounded border p-3">
                <p className="app-muted-text text-xs font-bold uppercase">Timer</p>
                <p className="app-strong-text mt-1 font-semibold">10 sec/question</p>
              </div>
            </div>
            <p className="app-muted-text mt-3 break-all text-sm">
              {getChallengeUrl(createdChallenge.challengeCode)}
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <button
                className="analysis-outline-button inline-flex items-center justify-center gap-2 rounded border border-red-600 px-3 py-2 text-red-600"
                type="button"
                onClick={() => copyText(createdChallenge.challengeCode, "Code")}
              >
                <Copy size={16} />
                Copy Code
              </button>
              <button
                className="analysis-outline-button inline-flex items-center justify-center gap-2 rounded border border-red-600 px-3 py-2 text-red-600"
                type="button"
                onClick={handleShareChallenge}
              >
                <Share2 size={16} />
                Share
              </button>
              <button
                className="rounded bg-red-600 px-3 py-2 text-white transition hover:bg-red-800"
                type="button"
                onClick={() =>
                  navigate(`/challenge/${createdChallenge.challengeCode}/play`)
                }
              >
                Play
              </button>
              <button
                className="analysis-outline-button inline-flex items-center justify-center gap-2 rounded border border-red-600 px-3 py-2 text-red-600 disabled:cursor-wait disabled:opacity-60"
                disabled={challengeLoading}
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
