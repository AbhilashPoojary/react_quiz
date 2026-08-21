import React, { useEffect, useMemo, useRef, useState } from "react";
import { Timer } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import QuizOptions from "../components/QuizOptions";
import apiClient from "../utils/apiClient";
import { formatDuration } from "../utils/utilFunc";

const defaultOptionStyles = [
  { bgc: "bg-gray-200", fgc: "text-gray-900" },
  { bgc: "bg-gray-200", fgc: "text-gray-900" },
  { bgc: "bg-gray-200", fgc: "text-gray-900" },
  { bgc: "bg-gray-200", fgc: "text-gray-900" },
];

export default function ChallengePlay({ setAlign }) {
  const { code } = useParams();
  const navigate = useNavigate();
  const [payload, setPayload] = useState(null);
  const [quizIndex, setQuizIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [bg, setBg] = useState(defaultOptionStyles);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [optionLocked, setOptionLocked] = useState(false);
  const startedAtRef = useRef(Date.now());
  const answersRef = useRef([]);
  const submittedRef = useRef(false);

  useEffect(() => {
    setAlign(true);
  }, [setAlign]);

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/api/challenges/${code}/questions`);
        setPayload(response.data);
        const config = response.data.config || {};
        const initialSeconds = config.timedQuiz === false
          ? 0
          : config.timerMode === "PER_QUESTION"
          ? Number(config.timePerQuestion || 0)
          : Number(config.totalDuration || config.duration * 60 || 0);
        setRemainingSeconds(initialSeconds);
        startedAtRef.current = Date.now();
      } catch (err) {
        setError(err?.response?.data?.error || "Unable to load challenge questions");
      } finally {
        setLoading(false);
      }
    };

    loadQuestions();
  }, [code]);

  const questions = payload?.questions || [];
  const currentQuestion = questions[quizIndex];
  const timerConfig = payload?.config || {};
  const timedQuiz = timerConfig.timedQuiz !== false;
  const showAnswerFeedback = timerConfig.showAnswerFeedback !== false;
  const timerMode = timerConfig.timerMode || "TOTAL";
  const questionTimeLimit = Number(timerConfig.timePerQuestion || 0);
  const dangerThreshold = Math.min(5, Math.ceil(questionTimeLimit / 2));
  const isTimerDanger =
    timedQuiz &&
    timerMode === "PER_QUESTION" &&
    remainingSeconds > 0 &&
    remainingSeconds <= dangerThreshold;
  const timeTaken = useMemo(
    () => Math.round((Date.now() - startedAtRef.current) / 1000),
    [remainingSeconds]
  );

  const submitChallenge = async (finalAnswers = answersRef.current) => {
    if (submittedRef.current) {
      return;
    }

    try {
      submittedRef.current = true;
      setSubmitting(true);
      await apiClient.post(`/api/challenges/${code}/submit`, {
        answers: finalAnswers,
        timeTaken: Math.round((Date.now() - startedAtRef.current) / 1000),
      });
      navigate(`/challenge/${code}/results`);
    } catch (err) {
      submittedRef.current = false;
      setError(err?.response?.data?.error || "Unable to submit challenge");
    } finally {
      setSubmitting(false);
    }
  };

  const moveToNextQuestion = (nextAnswers) => {
    if (quizIndex + 1 < questions.length) {
      setQuizIndex((prev) => prev + 1);
      setBg(defaultOptionStyles);
      setOptionLocked(false);
      if (timedQuiz && timerMode === "PER_QUESTION") {
        setRemainingSeconds(Number(timerConfig.timePerQuestion || 0));
      }
    } else {
      submitChallenge(nextAnswers);
    }
  };

  const recordAnswer = (selectedAnswer = "", optionIndex) => {
    if (optionLocked || submittedRef.current) {
      return;
    }

    if (!currentQuestion) {
      return;
    }

    setOptionLocked(true);
    const nextAnswers = [
      ...answersRef.current,
      {
        questionOrder: currentQuestion.questionOrder,
        selectedAnswer,
      },
    ];

    answersRef.current = nextAnswers;
    setAnswers(nextAnswers);

    if (showAnswerFeedback) {
      setBg((prevBg) => {
        const updatedBg = [...prevBg];
        const correctIndex = currentQuestion.answers?.findIndex(
          (answer) => answer === currentQuestion.correctAnswer
        );
        const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

        if (isCorrect && optionIndex !== undefined) {
          updatedBg[optionIndex] = { bgc: "bg-green-600", fgc: "text-white" };
        } else {
          if (optionIndex !== undefined) {
            updatedBg[optionIndex] = { bgc: "bg-red-600", fgc: "text-white" };
          }

          if (correctIndex >= 0) {
            updatedBg[correctIndex] = { bgc: "bg-green-600", fgc: "text-white" };
          }
        }

        return updatedBg;
      });
      setTimeout(() => moveToNextQuestion(nextAnswers), 500);
    } else {
      setTimeout(() => moveToNextQuestion(nextAnswers), 150);
    }
  };

  useEffect(() => {
    setBg(defaultOptionStyles);
    setOptionLocked(false);
  }, [quizIndex]);

  const completeRemainingAnswers = () => {
    const answeredOrders = new Set(
      answersRef.current.map((item) => item.questionOrder)
    );
    const unanswered = questions
      .filter((item) => !answeredOrders.has(item.questionOrder))
      .map((item) => ({
        questionOrder: item.questionOrder,
        selectedAnswer: "",
      }));
    submitChallenge([...answersRef.current, ...unanswered]);
  };

  const handleTimerExpired = () => {
    if (timerMode === "PER_QUESTION") {
      if (showAnswerFeedback) {
        setBg((prevBg) => {
          const updatedBg = [...prevBg];
          const correctIndex = currentQuestion?.answers?.findIndex(
            (answer) => answer === currentQuestion?.correctAnswer
          );

          if (correctIndex >= 0) {
            updatedBg[correctIndex] = { bgc: "bg-green-600", fgc: "text-white" };
          }

          return updatedBg;
        });
      }
      recordAnswer("");
    } else {
      completeRemainingAnswers();
    }
  };

  useEffect(() => {
    if (!payload || !timedQuiz || remainingSeconds <= 0 || submittedRef.current) {
      if (payload && timedQuiz && remainingSeconds <= 0) {
        handleTimerExpired();
      }
      return undefined;
    }

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [payload, remainingSeconds, timedQuiz, timerMode, questions]);

  if (loading) {
    return <div className="app-muted-text py-10 text-center">Loading challenge...</div>;
  }

  if (error) {
    return <div className="py-10 text-center text-red-600">{error}</div>;
  }
  console.log(currentQuestion.correctAnswer);
  return (
    <div className="mt-6">
      <div className="flex flex-col gap-2 border-b py-5 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
        <span className="font-semibold text-lg">{payload.config.categoryName}</span>
        <h1 className="font-semibold text-lg">Challenge {code}</h1>
        {timedQuiz ? (
          <span className="flex items-center justify-center gap-1 font-semibold">
            <Timer size={18} />
            {formatDuration(remainingSeconds)}
          </span>
        ) : (
          <span className="app-muted-text font-semibold">Untimed</span>
        )}
      </div>
      <div className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
        <h2>
          Question {quizIndex + 1} of {questions.length}
        </h2>
        <span className="app-muted-text text-sm">
          Time used {formatDuration(timeTaken)}
        </span>
      </div>
      <QuizOptions
        quizData={currentQuestion}
        checkAnswer={(answer, index) => recordAnswer(answer, index)}
        bg={bg}
        disabled={optionLocked || submitting}
        danger={isTimerDanger}
      />
      <button
        className="analysis-outline-button w-full rounded border border-red-600 p-3 text-red-600 transition sm:w-auto"
        disabled={submitting}
        type="button"
        onClick={() => submitChallenge(answersRef.current)}
      >
        {submitting ? "Submitting..." : "Submit Challenge"}
      </button>
    </div>
  );
}
