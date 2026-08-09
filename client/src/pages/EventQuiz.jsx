import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { Timer } from "lucide-react";
import he from "he";
import apiClient from "../utils/apiClient";
import ConfirmPopup from "../components/ConfirmPopup";
import { selectUserInfo } from "../slice/authSlice";

export default function EventQuiz({ setAlign }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const userName = useSelector(selectUserInfo);
  const startedAtRef = useRef(Date.now());
  const submitInProgressRef = useRef(false);
  const [event, setEvent] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setAlign(true);
  }, [setAlign]);

  useEffect(() => {
    const loadEvent = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/api/events/${id}/play`);
        setEvent(response.data);
        setRemainingSeconds(Number(response.data.duration || 0) * 60);
        startedAtRef.current = Date.now();
      } catch (error) {
        setMessage(error?.response?.data?.error || "Unable to load event");
      } finally {
        setLoading(false);
      }
    };

    loadEvent();
  }, [id]);

  const currentQuestion = event?.questions?.[currentIndex];
  const isLastQuestion = currentIndex + 1 === event?.questions?.length;
  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remaining = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(remaining).padStart(
      2,
      "0"
    )}`;
  };

  const submitEvent = async (answerState = answers) => {
    if (submitInProgressRef.current) {
      return;
    }

    try {
      submitInProgressRef.current = true;
      setSubmitting(true);
      const payload = {
        totalTime: Math.round((Date.now() - startedAtRef.current) / 1000),
        answers: Object.entries(answerState).map(
          ([questionOrder, answer]) => ({
            questionOrder: Number(questionOrder),
            selectedAnswer: answer,
          })
        ),
      };
      const response = await apiClient.post(`/api/events/${id}/submit`, payload);
      navigate(`/events/${id}/result`, { state: { result: response.data } });
    } catch (error) {
      submitInProgressRef.current = false;
      setMessage(error?.response?.data?.error || "Unable to submit event");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!event || submitting || remainingSeconds <= 0) {
      return undefined;
    }

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [event, remainingSeconds, submitting]);

  useEffect(() => {
    if (event && remainingSeconds === 0 && !submitting) {
      submitEvent();
    }
  }, [event, remainingSeconds, submitting]);

  const handleAnswer = (answer) => {
    if (!currentQuestion || selectedAnswer || submitting) {
      return;
    }

    const nextAnswers = {
      ...answers,
      [currentQuestion.questionOrder]: answer,
    };
    setSelectedAnswer(answer);
    setAnswers(nextAnswers);

    window.setTimeout(() => {
      setSelectedAnswer("");

      if (isLastQuestion) {
        submitEvent(nextAnswers);
      } else {
        setCurrentIndex((prev) => prev + 1);
      }
    }, 450);
  };

  const quitNow = () => {
    setShowConfirm(false);
    navigate("/events");
  };

  if (loading) {
    return <div className="app-muted-text py-8 text-center">Loading event...</div>;
  }

  if (message && !event) {
    return <div className="py-8 text-center text-red-600">{message}</div>;
  }

  if (!currentQuestion) {
    return (
      <div className="app-muted-text py-8 text-center">
        No questions available.
      </div>
    );
  }

  return (
    <div>
      <ConfirmPopup
        open={showConfirm}
        title="Quit event?"
        body="Are you sure you want to quit this event? Your event progress will not be submitted."
        confirmText="Quit"
        cancelText="Cancel"
        onConfirm={quitNow}
        onCancel={() => setShowConfirm(false)}
      />

      <div className="flex flex-col items-center gap-2 border-b py-5 text-center sm:flex-row sm:justify-between sm:text-left">
        <span className="font-semibold text-lg">{event.eventName}</span>
        <h1 className="font-semibold text-lg">{userName}</h1>
        <span className="flex items-center gap-1 font-semibold text-lg">
          <Timer size={18} />
          {formatTime(remainingSeconds)}
        </span>
      </div>

      {message && <div className="mt-4 text-red-600">{message}</div>}

      <div className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
        <h1>
          Question {currentIndex + 1} of {event.questions.length}
        </h1>
        <span className="app-muted-text text-sm">
          Answered {answeredCount}/{event.questions.length}
        </span>
      </div>

      <div className="quiz-options-panel rounded border p-5">
        <h2 className="app-strong-text text-center text-lg font-semibold">
          {he.decode(currentQuestion.question)}
        </h2>
        <div className="my-5 grid grid-cols-1 gap-4 sm:mx-5 md:grid-cols-2">
          {currentQuestion.answers.map((answer) => {
            const isSelected = selectedAnswer === answer.answer;

            return (
              <button
                className={`rounded p-3 text-left transition ${
                  isSelected
                    ? "bg-red-600 text-white"
                    : "quiz-option-btn bg-gray-200 text-gray-900"
                }`}
                disabled={Boolean(selectedAnswer) || submitting}
                key={answer.answerOrder}
                onClick={() => handleAnswer(answer.answer)}
              >
                {he.decode(answer.answer)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="app-muted-text text-sm">
          {submitting ? "Submitting your event result..." : "Select an answer to continue"}
        </span>
        <button
          className="w-full rounded bg-red-600 p-3 text-white transition duration-300 ease-in-out hover:bg-red-800 sm:w-auto"
          onClick={() => setShowConfirm(true)}
        >
          Quit now
        </button>
      </div>
    </div>
  );
}
