import React, { useState, useEffect, useRef } from "react";
import { Loader2, Timer } from "lucide-react";
import QuizOptions from "../components/QuizOptions";
import ConfirmPopup from "./ConfirmPopup";

const QUESTION_TIME_LIMIT = 20;
const defaultOptionStyles = [
  { bgc: "bg-gray-200", fgc: "text-gray-900" },
  { bgc: "bg-gray-200", fgc: "text-gray-900" },
  { bgc: "bg-gray-200", fgc: "text-gray-900" },
  { bgc: "bg-gray-200", fgc: "text-gray-900" },
];

export default function QuizComponent({
  quizData,
  name,
  quitNow,
  score,
  setScore,
  nextQuestion,
  enableTimer,
  showAnswerFeedback = true,
  timerMode,
  totalDuration,
  timePerQuestion,
  quizIndex,
  totalQuestions,
  timeConsumed,
  setTimeConsumed,
  recordAnswer,
  finishQuizWithUnanswered,
}) {
  const [bg, setBg] = useState(defaultOptionStyles);
  const effectiveTimerMode = timerMode || "PER_QUESTION";
  const questionTimeLimit = Number(timePerQuestion || QUESTION_TIME_LIMIT);
  const totalTimeLimit = Number(totalDuration || totalQuestions * questionTimeLimit);
  const initialCounter =
    effectiveTimerMode === "TOTAL" ? totalTimeLimit : questionTimeLimit;
  const [counter, setCounter] = useState(initialCounter);
  const dangerThreshold = Math.min(5, Math.ceil(questionTimeLimit / 2));
  const isTimerDanger =
    enableTimer &&
    effectiveTimerMode === "PER_QUESTION" &&
    counter > 0 &&
    counter <= dangerThreshold;
  const [showConfirm, setShowConfirm] = useState(false);
  const [optionLocked, setOptionLocked] = useState(false);
  const [submittingResult, setSubmittingResult] = useState(false);
  const optionLockedRef = useRef(false);
  const timeoutHandledRef = useRef(false);
  const nextQuestionRef = useRef(nextQuestion);
  const recordAnswerRef = useRef(recordAnswer);
  const finishQuizWithUnansweredRef = useRef(finishQuizWithUnanswered);
  const questionStartedAtRef = useRef(Date.now());

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  };

  useEffect(() => {
    nextQuestionRef.current = nextQuestion;
  }, [nextQuestion]);

  useEffect(() => {
    recordAnswerRef.current = recordAnswer;
  }, [recordAnswer]);

  useEffect(() => {
    finishQuizWithUnansweredRef.current = finishQuizWithUnanswered;
  }, [finishQuizWithUnanswered]);

  const checkAnswer = (item, index) => {
    if (optionLockedRef.current || optionLocked) {
      return;
    }

    optionLockedRef.current = true;
    setOptionLocked(true);
    let updatedBg = [...bg];
    const isCorrect = item === quizData.correct_answer;

    if (isCorrect) {
      setScore((prevScore) => prevScore + 10);
    }

    if (showAnswerFeedback && isCorrect) {
      updatedBg[index] = { bgc: "bg-green-600", fgc: "text-white" };
    } else if (showAnswerFeedback) {
      updatedBg[index] = { bgc: "bg-red-600", fgc: "text-white" };
      const correctIndex = quizData?.correctAnswerIndex;
      updatedBg[correctIndex] = { bgc: "bg-green-600", fgc: "text-white" };
    }

    recordAnswer(item);
    setBg(updatedBg);
    const elapsedSeconds = enableTimer && effectiveTimerMode === "PER_QUESTION"
      ? questionTimeLimit - counter
      : Math.round((Date.now() - questionStartedAtRef.current) / 1000);
    setTimeConsumed((prevstate) => prevstate + elapsedSeconds);
    setTimeout(async () => {
      const isFinalQuestion = quizIndex + 1 >= totalQuestions;

      if (isFinalQuestion) {
        setSubmittingResult(true);
      }

      await nextQuestionRef.current();

      if (isFinalQuestion) {
        return;
      }

      if (effectiveTimerMode === "PER_QUESTION") {
        setCounter(questionTimeLimit);
      }
      setBg(defaultOptionStyles);
      optionLockedRef.current = false;
      setOptionLocked(false);
    }, showAnswerFeedback ? 500 : 150);
  };

  useEffect(() => {
    optionLockedRef.current = false;
    setSubmittingResult(false);
    timeoutHandledRef.current = false;
    questionStartedAtRef.current = Date.now();
    if (effectiveTimerMode === "PER_QUESTION") {
      setCounter(questionTimeLimit);
    }
    setBg(defaultOptionStyles);
    setOptionLocked(false);
  }, [quizIndex, effectiveTimerMode, questionTimeLimit]);

  useEffect(() => {
    if (enableTimer && effectiveTimerMode === "TOTAL") {
      setCounter(totalTimeLimit);
    }
  }, [enableTimer, effectiveTimerMode, totalTimeLimit]);

  useEffect(() => {
    if (!enableTimer || counter <= 0) {
      return undefined;
    }

    const timer = setInterval(() => {
      setCounter((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [counter, enableTimer]);

  useEffect(() => {
    if (
      !enableTimer ||
      counter !== 0 ||
      timeoutHandledRef.current ||
      optionLockedRef.current
    ) {
      return undefined;
    }

    optionLockedRef.current = true;
    timeoutHandledRef.current = true;

    if (effectiveTimerMode === "TOTAL") {
      setSubmittingResult(true);
      finishQuizWithUnansweredRef.current?.(totalTimeLimit);
      return undefined;
    }

    if (showAnswerFeedback) {
      setBg((prevBg) => {
        const updatedBg = [...prevBg];
        let correctIndex = quizData?.correctAnswerIndex;
        updatedBg[correctIndex] = { bgc: "bg-green-600", fgc: "text-white" };
        return updatedBg;
      });
    }
    recordAnswerRef.current("");
    setTimeConsumed((prevstate) => prevstate + questionTimeLimit);

    const timeout = setTimeout(async () => {
      const isFinalQuestion = quizIndex + 1 >= totalQuestions;

      if (isFinalQuestion) {
        setSubmittingResult(true);
      }

      await nextQuestionRef.current();

      if (isFinalQuestion) {
        return;
      }

      optionLockedRef.current = false;
      setOptionLocked(false);
    }, showAnswerFeedback ? 500 : 150);

    return () => clearTimeout(timeout);
  }, [
    counter,
    enableTimer,
    effectiveTimerMode,
    quizData?.correctAnswerIndex,
    questionTimeLimit,
    setTimeConsumed,
    showAnswerFeedback,
    totalTimeLimit,
    quizIndex,
    totalQuestions,
  ]);

  const handleQuitConfirm = () => {
    setShowConfirm(false);
    quitNow();
  };

  return (
    <div>
      <ConfirmPopup
        open={showConfirm}
        title="Quit quiz?"
        body="Are you sure you want to quit the quiz? Your current progress will be reset."
        confirmText="Quit"
        cancelText="Cancel"
        onConfirm={handleQuitConfirm}
        onCancel={() => setShowConfirm(false)}
      />
      {submittingResult ? (
        <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 text-center">
          <Loader2 className="animate-spin text-red-600" size={34} />
          <h1 className="app-strong-text text-xl font-bold">Preparing your result</h1>
          <p className="app-muted-text text-sm">
            Your last answer is saved. Taking you to the result page now.
          </p>
        </div>
      ) : (
        <>
      <div className="flex flex-col items-center gap-2 border-b py-5 text-center sm:flex-row sm:justify-between sm:text-left">
        <span className="font-semibold text-lg">{quizData?.category}</span>
        <h1 className="font-semibold text-lg">{name}</h1>
        <span className="font-semibold text-lg">Score: {score}</span>
      </div>
      <div>
        <div>
          <div className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
            <h1>
              Question {quizIndex + 1} of {totalQuestions}
            </h1>
            {enableTimer && (
              <span className="flex items-center gap-1 font-semibold">
                <Timer size={18} />
                {formatTime(counter)}
              </span>
            )}
          </div>
          <QuizOptions
            quizData={quizData}
            checkAnswer={checkAnswer}
            bg={bg}
            disabled={optionLocked}
            danger={isTimerDanger}
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Total time consumed {timeConsumed} seconds
            </span>
            <div>
              <button
                className="w-full rounded bg-red-600 p-3 text-white transition duration-300 ease-in-out hover:bg-red-800 sm:w-auto"
                onClick={() => setShowConfirm(true)}
              >
                Quit now
              </button>
            </div>
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
}
