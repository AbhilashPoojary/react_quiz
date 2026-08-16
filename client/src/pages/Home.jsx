import React, { useEffect, useState, useRef } from "react";
import quizMaze from "../assets/homeimage.jpg";
import Categories from "../data/Categories";
import { useNavigate } from "react-router-dom";
import { Popper } from "react-popper";
import QuizDetails from "../components/QuizDetails";
import QuizSetupV2 from "../components/QuizSetupV2";
import LoadingOverlay from "../components/LoadingOverlay";
import apiClient from "../utils/apiClient";
import { validateField } from "../utils/fieldValidation";

const nameRules = { required: true, minLength: 3, maxLength: 50 };
export default function Home({
  requestQuestions,
  loading = false,
  name,
  difficulty,
  questionType,
  questionCount,
  category,
  enableTimer,
  showAnswerFeedback,
  setCategoty,
  setDifficulty,
  setQuestionType,
  setQuestionCount,
  setEnableTimer,
  setShowAnswerFeedback,
  timerMode,
  setTimerMode,
  totalDuration,
  setTotalDuration,
  timePerQuestion,
  setTimePerQuestion,
  setName,
}) {
  const referenceElementRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [challengeCode, setChallengeCode] = useState("");
  const [challengeCodeError, setChallengeCodeError] = useState("");
  const [setupVersion, setSetupVersion] = useState("V1");
  const [setupVersionLoading, setSetupVersionLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const loadSetupVersion = async () => {
      try {
        const response = await apiClient.get("/api/settings/quiz-setup-version");
        setSetupVersion(response.data?.quizSetupVersion === "V2" ? "V2" : "V1");
      } catch (error) {
        setSetupVersion("V1");
      } finally {
        setSetupVersionLoading(false);
      }
    };

    loadSetupVersion();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    setError("");

    const nameError = validateField(name, nameRules, "User Name");
    if (nameError) {
      errors.name = nameError;
    }

    if (category === "") {
      errors.category = "Category is mandatory";
    }

    if (difficulty === "") {
      errors.difficulty = "Difficulty is mandatory";
    }

    if (questionType === "") {
      errors.questionType = "Question Type is mandatory";
    }

    if (!questionCount) {
      errors.questionCount = "Number of Questions is mandatory";
    }

    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      return false;
    }

    const result = await requestQuestions();

    if (!result?.success) {
      setError(
        result?.message ||
          "Unable to load questions. Please try again before starting the quiz."
      );
      return false;
    }

    navigate("/quiz");
  };
  const handleChallenge = () => {
    navigate("/challenge/create");
  };
  const handleJoinChallenge = (event) => {
    event.preventDefault();
    const normalizedCode = challengeCode.trim().toUpperCase();

    if (!normalizedCode) {
      setChallengeCodeError("Challenge code is required");
      return;
    }

    if (!/^[A-Z0-9]{6}$/.test(normalizedCode)) {
      setChallengeCodeError("Enter a valid 6 character challenge code");
      return;
    }

    navigate(`/challenge/${normalizedCode}`);
  };
  const handleTogglePopover = () => {
    setIsOpen(!isOpen);
  };

  if (setupVersionLoading) {
    return (
      <div className="pt-6 sm:pt-8">
        <div className="grid gap-6 rounded border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900 lg:grid-cols-2 lg:p-6">
          <div className="space-y-5">
            <div className="h-7 w-48 animate-pulse rounded bg-gray-300 dark:bg-gray-700" />
            {Array.from({ length: 5 }).map((_, index) => (
              <div className="space-y-2" key={index}>
                <div className="h-4 w-28 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
                <div className="h-12 animate-pulse rounded bg-gray-300 dark:bg-gray-700" />
              </div>
            ))}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="h-12 animate-pulse rounded bg-gray-300 dark:bg-gray-700" />
              <div className="h-12 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="h-full min-h-[22rem] animate-pulse rounded border border-gray-200 bg-gray-200 dark:border-gray-700 dark:bg-gray-800" />
          </div>
        </div>
      </div>
    );
  }

  if (setupVersion === "V2") {
    return (
      <>
        <LoadingOverlay
          show={loading}
          message="Checking OpenTDB and internal question bank..."
        />
        <QuizSetupV2
          requestQuestions={requestQuestions}
          name={name}
          category={category}
          difficulty={difficulty}
          questionType={questionType}
          questionCount={questionCount}
          enableTimer={enableTimer}
          showAnswerFeedback={showAnswerFeedback}
          timerMode={timerMode}
          totalDuration={totalDuration}
          timePerQuestion={timePerQuestion}
          Categories={Categories}
          setName={setName}
          setCategoty={setCategoty}
          setDifficulty={setDifficulty}
          setQuestionType={setQuestionType}
          setQuestionCount={setQuestionCount}
          setEnableTimer={setEnableTimer}
          setShowAnswerFeedback={setShowAnswerFeedback}
          setTimerMode={setTimerMode}
          setTotalDuration={setTotalDuration}
          setTimePerQuestion={setTimePerQuestion}
        />
      </>
    );
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
      <LoadingOverlay
        show={loading}
        message="Checking OpenTDB and internal question bank..."
      />
      <div className="w-full lg:w-1/2">
        {/* <h1 className="font-medium text-2xl">Quiz Settings</h1> */}
        <QuizDetails
          name={name}
          error={error}
          setName={setName}
          formErrors={formErrors}
          nameRules={nameRules}
          setFormErrors={setFormErrors}
          category={category}
          difficulty={difficulty}
          questionType={questionType}
          questionCount={questionCount}
          Categories={Categories}
          setCategoty={setCategoty}
          setDifficulty={setDifficulty}
          setQuestionType={setQuestionType}
          setQuestionCount={setQuestionCount}
          enableTimer={enableTimer}
          showAnswerFeedback={showAnswerFeedback}
          setEnableTimer={setEnableTimer}
          setShowAnswerFeedback={setShowAnswerFeedback}
          Popper={Popper}
          referenceElementRef={referenceElementRef}
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          handleSubmit={handleSubmit}
          onChallenge={handleChallenge}
          handleTogglePopover={handleTogglePopover}
          duration={5000}
          onHide={() => setError("")}
        />
        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="app-muted-text text-xs font-semibold uppercase">
            Have a challenge code?
          </span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>
        <form
          className="mx-auto max-w-md text-center"
          onSubmit={handleJoinChallenge}
        >
          <label className="app-label mb-3 block text-sm font-medium">
            Join Challenge by Code
          </label>
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <input
              className="app-input h-12 w-full rounded border border-gray-300 px-4 text-center text-sm font-semibold uppercase tracking-[0.35em] outline-none sm:flex-1"
              maxLength={6}
              placeholder="AB7K92"
              value={challengeCode}
              onChange={(event) => {
                setChallengeCode(event.target.value.toUpperCase());
                setChallengeCodeError("");
              }}
            />
            <button
              className="h-12 rounded bg-red-600 px-6 text-white transition hover:bg-red-800"
              type="submit"
            >
              Join
            </button>
          </div>
          {challengeCodeError && (
            <p className="mt-2 text-sm text-red-600">{challengeCodeError}</p>
          )}
        </form>
      </div>
      <div className="hidden w-full items-center justify-center lg:flex lg:w-1/2">
        <img className="rounded custom-quiz-image" src={quizMaze} alt="maze" />
      </div>
    </div>
  );
}
