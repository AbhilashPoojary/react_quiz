import React, { useEffect, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  Swords,
  Trophy,
  XCircle,
} from "lucide-react";
import he from "he";
import { useNavigate, useParams } from "react-router-dom";
import apiClient from "../utils/apiClient";
import { formatDuration } from "../utils/utilFunc";

const decodeText = (value = "") => he.decode(String(value));

function StatBlock({ label, value }) {
  return (
    <div className="rounded border p-3 text-center">
      <p className="app-muted-text text-sm">{label}</p>
      <p className="app-strong-text text-xl font-bold">{value}</p>
    </div>
  );
}

function SkeletonBlock({ className = "" }) {
  return (
    <span
      className={`block animate-pulse rounded bg-gray-300 dark:bg-gray-600 ${className}`}
    />
  );
}

function ChallengeResultSkeleton() {
  return (
    <div className="mt-6">
      <div className="border-b pb-5 text-center">
        <SkeletonBlock className="mx-auto mb-3 h-8 w-8 rounded-full" />
        <SkeletonBlock className="mx-auto h-7 w-48" />
        <SkeletonBlock className="mx-auto mt-2 h-4 w-56" />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, cardIndex) => (
          <div
            className="leaderboard-card rounded border p-5 text-center shadow"
            key={`challenge-result-card-skeleton-${cardIndex}`}
          >
            <SkeletonBlock className="mx-auto h-6 w-36" />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((__, statIndex) => (
                <div
                  className="rounded border p-3"
                  key={`challenge-result-stat-skeleton-${cardIndex}-${statIndex}`}
                >
                  <SkeletonBlock className="mx-auto h-4 w-16" />
                  <SkeletonBlock className="mx-auto mt-2 h-6 w-20" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 text-center">
        <SkeletonBlock className="mx-auto h-8 w-44" />
      </div>

      <section className="mt-8">
        <SkeletonBlock className="mb-4 h-6 w-36" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              className="leaderboard-card rounded border p-4 shadow-sm"
              key={`challenge-answer-skeleton-${index}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <SkeletonBlock className="h-5 w-28" />
                  <SkeletonBlock className="mt-2 h-4 w-3/4" />
                </div>
                <SkeletonBlock className="h-5 w-5 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-8 flex justify-end">
        <SkeletonBlock className="h-10 w-28" />
      </div>
    </div>
  );
}

function PlayerAnswerCard({ attempt, answer, isCurrentUser }) {
  if (!answer) {
    return null;
  }

  return (
    <article className="rounded border p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="app-strong-text font-semibold">
            {isCurrentUser ? "You" : attempt.user.name}
          </h3>
          <p className="app-muted-text text-xs">
            {answer.pointsEarned || 0} points
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${
            answer.isCorrect ? "analysis-status-correct" : "analysis-status-wrong"
          }`}
        >
          {answer.isCorrect ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
          {answer.isCorrect ? "Correct" : "Wrong"}
        </span>
      </div>
      <div className="grid gap-2">
        {(answer.options || []).map((option, optionIndex) => {
          const isCorrectAnswer = option === answer.correctAnswer;
          const isSelectedAnswer = option === answer.selectedAnswer;

          return (
            <div
              className={`rounded border p-2 ${
                isCorrectAnswer
                  ? "analysis-option-correct"
                  : isSelectedAnswer && !answer.isCorrect
                  ? "analysis-option-wrong"
                  : ""
              }`}
              key={`${option}-${optionIndex}`}
            >
              <div className="flex flex-col gap-1">
                <span className="app-strong-text">{decodeText(option)}</span>
                <span className="flex flex-wrap gap-2 text-xs font-semibold">
                  {isCorrectAnswer && (
                    <span className="analysis-text-correct">Correct Answer</span>
                  )}
                  {isSelectedAnswer && (
                    <span
                      className={
                        answer.isCorrect
                          ? "analysis-text-correct"
                          : "analysis-text-wrong"
                      }
                    >
                      Your Answer
                    </span>
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}

function QuestionComparison({ attempts, index, currentUserId, isOpen, onToggle }) {
  const question = attempts[0]?.answers?.[index]?.question;

  if (!question) {
    return null;
  }

  return (
    <section className="leaderboard-card overflow-hidden rounded border shadow-sm">
      <button
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        type="button"
        onClick={onToggle}
      >
        <div className="min-w-0">
          <h2 className="app-strong-text text-lg font-bold">
            Question {index + 1}
          </h2>
          <p className="app-muted-text mt-1 truncate text-sm">
            {decodeText(question)}
          </p>
        </div>
        <ChevronDown
          className={`shrink-0 transition ${isOpen ? "rotate-180" : ""}`}
          size={20}
        />
      </button>
      {isOpen && (
        <div className="border-t p-4">
          <p className="app-strong-text mb-4 font-medium">
            {decodeText(question)}
          </p>
          <div className="grid gap-4 lg:grid-cols-2">
            {attempts.map((attempt) => (
              <PlayerAnswerCard
                attempt={attempt}
                answer={attempt.answers?.[index]}
                isCurrentUser={attempt.userId === currentUserId}
                key={`${attempt._id}-${index}`}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export default function ChallengeResult({ setAlign }) {
  const { code } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openQuestionIndex, setOpenQuestionIndex] = useState(null);

  useEffect(() => {
    setAlign(true);
  }, [setAlign]);

  useEffect(() => {
    const loadResults = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/api/challenges/${code}/results`);
        setResult(response.data);
        setOpenQuestionIndex(null);
      } catch (err) {
        setError(err?.response?.data?.error || "Unable to load challenge results");
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, [code]);

  if (loading) {
    return <ChallengeResultSkeleton />;
  }

  if (error) {
    return <div className="py-10 text-center text-red-600">{error}</div>;
  }

  const currentAttempt = result.currentUserAttempt;
  const attempts = result.attempts || [];
  const orderedAttempts = [...attempts].sort((a, b) => {
    if (a.userId === currentAttempt?.userId) return -1;
    if (b.userId === currentAttempt?.userId) return 1;
    return 0;
  });
  const winnerName =
    result.winner?.type === "WINNER"
      ? attempts.find((item) => item.userId === result.winner.userId)?.user?.name
      : "";

  return (
    <div className="mt-6">
      <div className="border-b pb-5 text-center">
        <Swords className="mx-auto mb-2 text-red-600" size={30} />
        <h1 className="app-strong-text text-2xl font-bold">Challenge Result</h1>
        <p className="app-muted-text mt-1">
          {result.challenge.config.categoryName} - {result.challenge.config.difficulty}
        </p>
      </div>

      {!result.bothCompleted && currentAttempt ? (
        <div className="mx-auto mt-6 max-w-2xl">
          <h2 className="app-strong-text text-center text-xl font-bold">
            Challenge Completed!
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <StatBlock
              label="Your Score"
              value={`${currentAttempt.score} / ${currentAttempt.maxScore}`}
            />
            <StatBlock
              label="Accuracy"
              value={`${Math.round(currentAttempt.accuracy || 0)}%`}
            />
            <StatBlock label="Time" value={formatDuration(currentAttempt.timeTaken)} />
          </div>
          <p className="app-muted-text mt-6 text-center">
            Waiting for your opponent to complete the challenge...
          </p>
        </div>
      ) : (
        <div className="mt-6">
          <div className="grid gap-4 md:grid-cols-2">
            {orderedAttempts.map((attempt) => (
              <div className="leaderboard-card rounded border p-5 text-center shadow" key={attempt._id}>
                <h2 className="app-strong-text text-xl font-bold">{attempt.user.name}</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <StatBlock label="Score" value={`${attempt.score} / ${attempt.maxScore}`} />
                  <StatBlock label="Accuracy" value={`${Math.round(attempt.accuracy || 0)}%`} />
                  <StatBlock label="Correct" value={`${attempt.correctAnswers} Correct`} />
                  <StatBlock label="Time" value={formatDuration(attempt.timeTaken)} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 text-center">
            {result.winner?.type === "DRAW" ? (
              <h2 className="app-strong-text text-2xl font-bold">Draw!</h2>
            ) : (
              <h2 className="app-strong-text inline-flex items-center justify-center gap-2 text-2xl font-bold">
                <Trophy className="text-yellow-500" size={28} />
                {winnerName} Wins!
              </h2>
            )}
          </div>
        </div>
      )}

      {result.canShowAnalysis && orderedAttempts.length > 0 && (
        <section className="mt-8">
          <h2 className="app-strong-text mb-4 text-lg font-bold">
            Answer Analysis
          </h2>
          <div className="space-y-4">
            {orderedAttempts[0]?.answers?.map((answer, index) => (
              <QuestionComparison
                attempts={orderedAttempts}
                index={index}
                currentUserId={currentAttempt?.userId}
                isOpen={openQuestionIndex === index}
                onToggle={() =>
                  setOpenQuestionIndex((prev) =>
                    prev === index ? null : index
                  )
                }
                key={`${index}-${answer.question}`}
              />
            ))}
          </div>
        </section>
      )}

      <div className="mt-8 text-right">
        <button
          className="analysis-outline-button rounded border border-red-600 px-4 py-2 text-red-600 transition"
          type="button"
          onClick={() => navigate("/info")}
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}
