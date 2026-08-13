import React, { useEffect, useMemo, useState } from "react";
import { Copy, Share2, Swords, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ConfirmPopup from "./ConfirmPopup";
import Dropdown from "./Dropdown";
import ErrorNotification from "./ErrorNotification";
import { CustomCheckbox, CustomRadio } from "./CustomSelectionControls";
import apiClient from "../utils/apiClient";
import { validateField } from "../utils/fieldValidation";
import { getChallengeUrl, shareChallenge } from "../utils/shareChallenge";
import quizMaze from "../assets/homeimage.jpg";

const nameRules = { required: true, minLength: 3, maxLength: 50 };

const difficultyOptions = [
  { category: "Easy", value: "easy" },
  { category: "Medium", value: "medium" },
  { category: "Hard", value: "hard" },
];

const questionTypeOptions = [
  { category: "Multiple Choice", value: "multiple" },
  { category: "True / False", value: "boolean" },
];

const questionCountOptions = [10, 15, 20, 25].map((value) => ({
  category: String(value),
  value,
}));

const totalDurationOptions = [5, 10, 15, 20].map((minutes) => ({
  category: `${minutes} minutes`,
  value: minutes * 60,
}));

const perQuestionOptions = [10, 15, 20, 30, 45, 60].map((seconds) => ({
  category: `${seconds} seconds`,
  value: seconds,
}));

const isValidChallengeCode = (code) => /^[A-Z0-9]{6}$/.test(code);

export default function QuizSetupV2({
  requestQuestions,
  name,
  category,
  difficulty,
  questionType,
  questionCount,
  enableTimer,
  timerMode,
  totalDuration,
  timePerQuestion,
  Categories,
  setName,
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
  const [formErrors, setFormErrors] = useState({});
  const [error, setError] = useState("");
  const [challengeCode, setChallengeCode] = useState("");
  const [createdChallenge, setCreatedChallenge] = useState(null);
  const [challengeLoading, setChallengeLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [notice, setNotice] = useState({ type: "error", message: "" });

  useEffect(() => {
    const currentUserName = JSON.parse(localStorage.getItem("currentUser"))
      ?.user?.name;

    if (currentUserName) {
      setName(currentUserName);
    }
  }, [setName]);

  const categoryName = useMemo(
    () => Categories.find((item) => item.value === category)?.category || "",
    [Categories, category]
  );

  const quizConfig = useMemo(
    () => ({
      timedQuiz: Boolean(enableTimer),
      timerMode: enableTimer ? timerMode : "TOTAL",
      totalDuration:
        enableTimer && timerMode === "TOTAL" ? Number(totalDuration) : null,
      timePerQuestion:
        enableTimer && timerMode === "PER_QUESTION"
          ? Number(timePerQuestion)
          : null,
    }),
    [enableTimer, timerMode, totalDuration, timePerQuestion]
  );

  const validate = () => {
    const errors = {};

    const nameError = validateField(name, nameRules, "User Name");
    if (nameError) errors.name = nameError;
    if (!category) errors.category = "Category is mandatory";
    if (!difficulty) errors.difficulty = "Difficulty is mandatory";
    if (!questionType) errors.questionType = "Question Type is mandatory";
    if (!questionCount) errors.questionCount = "Number of Questions is mandatory";

    if (enableTimer && timerMode === "TOTAL" && !totalDuration) {
      errors.totalDuration = "Total quiz time is required";
    }

    if (enableTimer && timerMode === "PER_QUESTION" && !timePerQuestion) {
      errors.timePerQuestion = "Time per question is required";
    }

    return errors;
  };

  const isConfigValid = Object.keys(validate()).length === 0;
  const normalizedChallengeCode = challengeCode.trim().toUpperCase();

  const startQuiz = async (event) => {
    event.preventDefault();
    const errors = validate();
    setFormErrors(errors);
    setError("");

    if (Object.keys(errors).length > 0) {
      return;
    }

    const result = await requestQuestions();

    if (!result?.success) {
      setError(
        result?.message ||
          "Unable to load questions. Please try again before starting the quiz."
      );
      return;
    }

    navigate("/quiz");
  };

  const createChallenge = async () => {
    const errors = validate();
    setFormErrors(errors);
    setError("");

    if (Object.keys(errors).length > 0) {
      return;
    }

    try {
      setChallengeLoading(true);
      const response = await apiClient.post("/api/challenges", {
        categoryId: category,
        categoryName,
        difficulty,
        questionType,
        questionCount,
        duration: quizConfig.totalDuration
          ? Math.ceil(quizConfig.totalDuration / 60)
          : Math.ceil((quizConfig.timePerQuestion || 0) * questionCount / 60) || 10,
        ...quizConfig,
      });
      setCreatedChallenge(response.data);
    } catch (err) {
      setError(err?.response?.data?.error || "Unable to create challenge");
    } finally {
      setChallengeLoading(false);
    }
  };

  const joinChallenge = () => {
    if (!isValidChallengeCode(normalizedChallengeCode)) {
      return;
    }
    navigate(`/challenge/${normalizedChallengeCode}`);
  };

  const copyText = async (value) => {
    await navigator.clipboard.writeText(value);
    setNotice({ type: "success", message: "Copied to clipboard." });
  };

  const handleShareChallenge = async () => {
    try {
      const result = await shareChallenge(createdChallenge.challengeCode);

      if (result.status === "copied") {
        setNotice({
          type: "success",
          message: "Challenge invitation copied to clipboard.",
        });
      } else if (result.status === "shared") {
        setNotice({ type: "success", message: "Challenge shared." });
      }
    } catch (error) {
      setNotice({
        type: "error",
        message: "Unable to share challenge. Please copy the link manually.",
      });
    }
  };

  const deleteChallenge = async () => {
    try {
      setChallengeLoading(true);
      await apiClient.delete(`/api/challenges/${createdChallenge.challengeCode}`);
      setCreatedChallenge(null);
      setShowDeleteConfirm(false);
    } catch (err) {
      setError(err?.response?.data?.error || "Unable to delete challenge");
    } finally {
      setChallengeLoading(false);
    }
  };

  const updateTimerMode = (mode) => {
    setTimerMode(mode);
    setFormErrors((prev) => ({ ...prev, totalDuration: "", timePerQuestion: "" }));
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.85fr)] lg:items-center">
      <form className="mt-3" onSubmit={startQuiz}>
        <ConfirmPopup
          open={showDeleteConfirm}
          title="Delete Challenge?"
          body={`Are you sure you want to delete challenge ${createdChallenge?.challengeCode || ""}? This is only allowed before any results are recorded.`}
          confirmText={challengeLoading ? "Deleting..." : "Delete"}
          cancelText="Cancel"
          onConfirm={deleteChallenge}
          onCancel={() => setShowDeleteConfirm(false)}
        />
        <ErrorNotification
          error={error}
          message={notice.message}
          type={notice.message ? notice.type : "error"}
          duration={5000}
          onHide={() => {
            setError("");
            setNotice({ type: "error", message: "" });
          }}
        />
        <div className="mb-5">
          <p className="app-muted-text text-sm font-medium">Welcome back,</p>
          <h2 className="app-strong-text text-xl font-semibold">{name || "Player"}</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="app-label mb-2 block text-sm font-medium">
              Category <span className="text-red-600">*</span>
            </label>
            <Dropdown
              data={Categories}
              state={category}
              setState={(value) => {
                setCategoty(value);
                setFormErrors((prev) => ({ ...prev, category: "" }));
              }}
              dropdownId="quiz-v2-category"
            />
            {formErrors.category && <p className="mt-1 text-sm text-red-600">{formErrors.category}</p>}
          </div>

          <div>
            <label className="app-label mb-2 block text-sm font-medium">
              Difficulty <span className="text-red-600">*</span>
            </label>
            <Dropdown
              data={difficultyOptions}
              state={difficulty}
              setState={(value) => {
                setDifficulty(value);
                setFormErrors((prev) => ({ ...prev, difficulty: "" }));
              }}
              dropdownId="quiz-v2-difficulty"
            />
            {formErrors.difficulty && <p className="mt-1 text-sm text-red-600">{formErrors.difficulty}</p>}
          </div>

          <div>
            <label className="app-label mb-2 block text-sm font-medium">
              Question Type <span className="text-red-600">*</span>
            </label>
            <Dropdown
              data={questionTypeOptions}
              state={questionType}
              setState={(value) => {
                setQuestionType(value);
                setFormErrors((prev) => ({ ...prev, questionType: "" }));
              }}
              dropdownId="quiz-v2-question-type"
            />
            {formErrors.questionType && <p className="mt-1 text-sm text-red-600">{formErrors.questionType}</p>}
          </div>

          <div className="sm:col-span-2">
            <label className="app-label mb-2 block text-sm font-medium">
              Number of Questions <span className="text-red-600">*</span>
            </label>
            <Dropdown
              data={questionCountOptions}
              state={questionCount}
              setState={(value) => {
                setQuestionCount(value);
                setFormErrors((prev) => ({ ...prev, questionCount: "" }));
              }}
              dropdownId="quiz-v2-question-count"
            />
            {formErrors.questionCount && <p className="mt-1 text-sm text-red-600">{formErrors.questionCount}</p>}
          </div>

          <section className="sm:col-span-2 rounded border p-4">
            <div className="flex items-center justify-between gap-3">
              <CustomCheckbox
                checked={enableTimer}
                label="Timed Quiz"
                name="quiz-v2-timed"
                onChange={setEnableTimer}
              />
            </div>

            {enableTimer && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div
                  className={`rounded border p-3 ${
                    timerMode !== "TOTAL" ? "opacity-60" : ""
                  }`}
                >
                  <div className="mb-3">
                    <CustomRadio
                      checked={timerMode === "TOTAL"}
                      label="Total Quiz Time"
                      name="quiz-v2-timer-mode"
                      value="TOTAL"
                      onChange={updateTimerMode}
                    />
                  </div>
                  <div className={timerMode !== "TOTAL" ? "pointer-events-none" : ""}>
                    <Dropdown
                      data={totalDurationOptions}
                      state={totalDuration}
                      setState={setTotalDuration}
                      dropdownId="quiz-v2-total-duration"
                    />
                  </div>
                  {formErrors.totalDuration && <p className="mt-1 text-sm text-red-600">{formErrors.totalDuration}</p>}
                </div>

                <div
                  className={`rounded border p-3 ${
                    timerMode !== "PER_QUESTION" ? "opacity-60" : ""
                  }`}
                >
                  <div className="mb-3">
                    <CustomRadio
                      checked={timerMode === "PER_QUESTION"}
                      label="Time Per Question"
                      name="quiz-v2-timer-mode"
                      value="PER_QUESTION"
                      onChange={updateTimerMode}
                    />
                  </div>
                  <div className={timerMode !== "PER_QUESTION" ? "pointer-events-none" : ""}>
                    <Dropdown
                      data={perQuestionOptions}
                      state={timePerQuestion}
                      setState={setTimePerQuestion}
                      dropdownId="quiz-v2-per-question"
                    />
                  </div>
                  {formErrors.timePerQuestion && <p className="mt-1 text-sm text-red-600">{formErrors.timePerQuestion}</p>}
                </div>
              </div>
            )}
          </section>

          <button
            type="submit"
            disabled={!isConfigValid}
            className="w-full rounded bg-red-600 p-3 text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Start Quiz
          </button>
          <button
            type="button"
            disabled={!isConfigValid || challengeLoading}
            className="analysis-outline-button w-full rounded border border-red-600 p-3 text-red-600 transition disabled:cursor-not-allowed disabled:opacity-60"
            onClick={createChallenge}
          >
            {challengeLoading ? "Creating..." : "Challenge a Friend"}
          </button>
        </div>

        {createdChallenge && (
          <div className="leaderboard-card mt-5 rounded border p-4">
            <h3 className="app-strong-text font-bold">Challenge Created!</h3>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="app-strong-text text-xl font-bold tracking-widest">
                {createdChallenge.challengeCode}
              </p>
              <button
                type="button"
                className="analysis-outline-button inline-flex items-center justify-center gap-2 rounded border border-red-600 px-3 py-2 text-red-600"
                onClick={() => copyText(createdChallenge.challengeCode)}
              >
                <Copy size={16} />
                Copy Code
              </button>
            </div>
            <p className="app-muted-text mt-3 break-all text-sm">
              {getChallengeUrl(createdChallenge.challengeCode)}
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                className="rounded bg-red-600 px-3 py-2 text-white transition hover:bg-red-800"
                onClick={() => navigate(`/challenge/${createdChallenge.challengeCode}/play`)}
              >
                Play My Challenge
              </button>
              <button
                type="button"
                className="analysis-outline-button inline-flex items-center justify-center gap-2 rounded border border-red-600 px-3 py-2 text-red-600"
                onClick={handleShareChallenge}
              >
                <Share2 size={16} />
                Share Challenge
              </button>
              <button
                type="button"
                className="analysis-outline-button inline-flex items-center justify-center gap-2 rounded border border-red-600 px-3 py-2 text-red-600 sm:col-span-2"
                disabled={challengeLoading}
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 size={16} />
                Delete Challenge
              </button>
            </div>
          </div>
        )}

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="app-muted-text text-xs font-semibold uppercase">
            OR JOIN A CHALLENGE
          </span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <div className="text-center">
          <label className="app-label mb-3 block text-sm font-medium">
            Enter a challenge code shared by a friend
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              className="app-input h-12 w-full rounded border border-gray-300 px-4 text-center text-sm font-semibold uppercase tracking-[0.35em] outline-none"
              maxLength={6}
              placeholder="AB7K92"
              value={challengeCode}
              onChange={(event) => setChallengeCode(event.target.value.trim().toUpperCase())}
            />
            <button
              className="h-12 rounded bg-red-600 px-6 text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!isValidChallengeCode(normalizedChallengeCode)}
              type="button"
              onClick={joinChallenge}
            >
              Join
            </button>
          </div>
        </div>
      </form>

      <aside className="hidden lg:block">
        <img className="custom-quiz-image rounded" src={quizMaze} alt="Quiz maze" />
        <div className="mx-auto mt-4 max-w-sm text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-white">
            <Swords size={20} />
          </div>
          <h3 className="app-strong-text text-lg font-bold">Ready for a challenge?</h3>
          <p className="app-muted-text mt-2 text-sm">
            Test your knowledge or challenge a friend to the same quiz.
          </p>
        </div>
      </aside>
    </div>
  );
}
