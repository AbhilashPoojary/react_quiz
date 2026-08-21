import React, { useEffect, useRef, useState } from "react";
import he from "he";
import { Loader2, Timer } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import apiClient from "../utils/apiClient";
import { formatDuration } from "../utils/utilFunc";

const defaultOptionStyles = [
  { bgc: "bg-gray-200", fgc: "text-gray-900" },
  { bgc: "bg-gray-200", fgc: "text-gray-900" },
  { bgc: "bg-gray-200", fgc: "text-gray-900" },
  { bgc: "bg-gray-200", fgc: "text-gray-900" },
];

const TIMER_POLICY_VERSION = 2;

const getTotalDurationSeconds = (config = {}) => {
  if (config.timedQuiz === false) {
    return 0;
  }

  if (config.timerMode === "PER_QUESTION") {
    return Number(config.questionCount || 0) * Number(config.timePerQuestion || 0);
  }

  return Number(config.totalDuration || config.duration * 60 || 0);
};

const getApiErrorMessage = (error, fallback) => {
  const serverMessage = error?.response?.data?.error || error?.response?.data?.message;
  const status = error?.response?.status;

  if (serverMessage) {
    return serverMessage;
  }

  if (status) {
    return `${fallback} (${status})`;
  }

  return fallback;
};

const getApiUrl = (path) => {
  const baseUrl = import.meta.env.VITE_API_URL || "/";
  return `${baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
};

export default function ChallengePlay({ setAlign }) {
  const { code } = useParams();
  const navigate = useNavigate();
  const [payload, setPayload] = useState(null);
  const [remainingQuestions, setRemainingQuestions] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [pendingAnswer, setPendingAnswer] = useState("");
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [pageActive, setPageActive] = useState(
    () => typeof document === "undefined" || document.visibilityState === "visible"
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const completedRef = useRef(false);
  const payloadRef = useRef(null);
  const remainingSecondsRef = useRef(0);

  useEffect(() => {
    setAlign(true);
  }, [setAlign]);

  const hydrateAttempt = (data) => {
    if (
      data.status === "IN_PROGRESS" &&
      Number(data.timerPolicyVersion) !== TIMER_POLICY_VERSION
    ) {
      throw new Error(
        "The challenge timer backend is outdated. Restart the backend before continuing."
      );
    }

    if (data.status === "COMPLETED") {
      completedRef.current = true;
      navigate(`/challenge/${code}/results`);
      return;
    }

    setPayload(data);
    setRemainingQuestions(data.questions || []);
    const nextRemainingSeconds = Number(data.remainingSeconds || 0);
    remainingSecondsRef.current = nextRemainingSeconds;
    setRemainingSeconds(nextRemainingSeconds);
    setFeedback(null);
    setPendingAnswer("");
  };

  useEffect(() => {
    payloadRef.current = payload;
  }, [payload]);

  useEffect(() => {
    remainingSecondsRef.current = remainingSeconds;
  }, [remainingSeconds]);

  useEffect(() => {
    const loadAttempt = async () => {
      try {
        setLoading(true);
        setError("");
        const attemptResponse = await apiClient.get(`/api/challenges/${code}/attempt`);
        const attempt = attemptResponse.data;

        if (attempt.status === "COMPLETED" || attempt.status === "IN_PROGRESS") {
          hydrateAttempt(attempt);
          return;
        }

        const startedResponse = await apiClient.post(`/api/challenges/${code}/attempt`);
        hydrateAttempt(startedResponse.data);
      } catch (err) {
        setError(
          err?.message?.startsWith("The challenge timer backend is outdated")
            ? err.message
            : getApiErrorMessage(err, "Unable to load challenge attempt")
        );
      } finally {
        setLoading(false);
      }
    };

    loadAttempt();
  }, [code]);

  const config = payload?.config || {};
  const timedQuiz = config.timedQuiz !== false;
  const totalQuestions = payload?.totalQuestions || 0;
  const currentQuestion = remainingQuestions[0];
  const currentQuestionIndex = Number(payload?.currentQuestionIndex || 0);
  const timeUsed = timedQuiz
    ? Math.max(0, getTotalDurationSeconds(config) - remainingSeconds)
    : 0;
  const dangerThreshold = Math.min(10, Math.ceil(getTotalDurationSeconds(config) / 5));
  const isTimerDanger =
    timedQuiz &&
    remainingSeconds > 0 &&
    remainingSeconds <= Math.max(5, dangerThreshold);

  const completeDueToTimeout = async () => {
    if (completedRef.current || !payload?.attemptId) {
      return;
    }

    try {
      completedRef.current = true;
      setSaving(true);
      await apiClient.post(`/api/challenges/${code}/submit`, {
        answers: [],
        timeTaken: timeUsed,
        remainingSeconds: 0,
      });
      navigate(`/challenge/${code}/results`);
    } catch (err) {
      completedRef.current = false;
      setError(getApiErrorMessage(err, "Unable to submit challenge"));
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!payload || !timedQuiz || !pageActive || completedRef.current) {
      return undefined;
    }

    if (remainingSeconds <= 0) {
      completeDueToTimeout();
      return undefined;
    }

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (document.visibilityState !== "visible") {
          return prev;
        }

        const nextRemainingSeconds = Math.max(0, prev - 1);
        remainingSecondsRef.current = nextRemainingSeconds;
        return nextRemainingSeconds;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [payload, timedQuiz, remainingSeconds, pageActive]);

  const persistRemainingTime = () => {
    const activePayload = payloadRef.current;
    const nextRemainingSeconds = Number(remainingSecondsRef.current);

    if (
      completedRef.current ||
      !activePayload?.attemptId ||
      activePayload.status !== "IN_PROGRESS" ||
      !Number.isFinite(nextRemainingSeconds)
    ) {
      return;
    }

    const normalizedRemainingSeconds = Math.max(0, Math.floor(nextRemainingSeconds));
    const token = localStorage.getItem("jwtToken");
    window
      .fetch(
        getApiUrl(`/api/challenges/${code}/attempts/${activePayload.attemptId}/time`),
        {
          body: JSON.stringify({ remainingSeconds: normalizedRemainingSeconds }),
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          keepalive: true,
          method: "POST",
        }
      )
      .catch(() => {});
  };

  useEffect(() => {
    const savePausedTime = () => {
      persistRemainingTime();
    };

    const handleVisibilityChange = () => {
      const visible = document.visibilityState === "visible";

      if (!visible) {
        savePausedTime();
      }

      setPageActive(visible);
    };

    window.addEventListener("pagehide", savePausedTime);
    window.addEventListener("beforeunload", savePausedTime);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      savePausedTime();
      window.removeEventListener("pagehide", savePausedTime);
      window.removeEventListener("beforeunload", savePausedTime);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [code]);

  const saveAnswer = async (answer, index) => {
    if (!payload?.attemptId || !currentQuestion || saving || feedback) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      setPendingAnswer(answer);
      const response = await apiClient.post(
        `/api/challenges/${code}/attempts/${payload.attemptId}/answer`,
        {
          questionId: currentQuestion.questionId,
          selectedAnswer: answer,
          questionIndex: currentQuestionIndex,
          timeTaken: timeUsed,
          remainingSeconds,
        }
      );
      const nextFeedback = response.data.feedback || null;
      setFeedback(nextFeedback);

      if (response.data.status === "COMPLETED") {
        window.setTimeout(() => {
          completedRef.current = true;
          navigate(`/challenge/${code}/results`);
        }, 650);
        return;
      }

      window.setTimeout(() => hydrateAttempt(response.data), 650);
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to save answer"));
      setPendingAnswer("");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="app-muted-text py-10 text-center">Loading challenge...</div>;
  }

  if (error && !payload) {
    return <div className="py-10 text-center text-red-600">{error}</div>;
  }

  if (!currentQuestion) {
    return <div className="app-muted-text py-10 text-center">Preparing challenge...</div>;
  }

  return (
    <div className="mt-6">
      <div className="flex flex-col gap-2 border-b py-5 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
        <span className="font-semibold text-lg">{config.categoryName}</span>
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
          Question {currentQuestionIndex + 1} of {totalQuestions}
        </h2>
        <span className="app-muted-text text-sm">
          Time used {formatDuration(timeUsed)}
        </span>
      </div>

      {error && <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-red-700">{error}</div>}

      <div
        className={`quiz-options-panel mb-5 rounded border p-5 ${
          isTimerDanger ? "quiz-options-danger" : ""
        }`}
      >
        <h3 className="app-strong-text text-center">
          {he.decode(currentQuestion.question || "")}
        </h3>
        <div className="my-5 grid grid-cols-1 gap-4 sm:mx-5 md:grid-cols-2">
          {(currentQuestion.answers || []).map((answer, index) => {
            const isCorrectAnswer = feedback?.correctAnswer === answer;
            const isSelectedWrong =
              feedback && feedback.selectedAnswer === answer && !feedback.isCorrect;
            const isPendingAnswer = !feedback && pendingAnswer === answer;
            const style = isCorrectAnswer
              ? { bgc: "bg-green-600", fgc: "text-white" }
              : isSelectedWrong
              ? { bgc: "bg-red-600", fgc: "text-white" }
              : isPendingAnswer
              ? { bgc: "bg-gray-100", fgc: "text-gray-900" }
              : defaultOptionStyles[index] || defaultOptionStyles[0];

            return (
              <button
                className={`${style.bgc} ${style.fgc} quiz-option-btn btn rounded p-2 ${
                  isPendingAnswer ? "ring-2 ring-red-300" : ""
                }`}
                disabled={saving || Boolean(feedback)}
                key={index}
                onClick={() => saveAnswer(answer, index)}
                type="button"
              >
                {he.decode(answer || "")}
              </button>
            );
          })}
        </div>
      </div>

      {saving && (
        <p className="inline-flex items-center gap-2 text-sm font-semibold text-red-600">
          <Loader2 className="animate-spin" size={18} />
          Saving answer...
        </p>
      )}
    </div>
  );
}
