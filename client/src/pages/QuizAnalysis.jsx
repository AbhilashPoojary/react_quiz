import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, ChevronDown, XCircle } from "lucide-react";
import he from "he";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Categories from "../data/Categories";
import apiClient from "../utils/apiClient";

const filters = [
  { label: "All", value: "all" },
  { label: "Correct", value: "correct" },
  { label: "Wrong", value: "wrong" },
];

const viewModes = [
  { label: "Summary", value: "summary" },
  { label: "Detailed", value: "detailed" },
];

const difficultyOrder = ["easy", "medium", "hard"];

const optionLetters = ["A", "B", "C", "D", "E", "F"];

const decodeText = (value = "") => he.decode(String(value));

const normalizeAnswerValue = (value = "") => decodeText(value).trim();

const formatDuration = (seconds = 0) => {
  const safeSeconds = Math.max(0, Math.round(Number(seconds) || 0));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
};

const formatSeconds = (seconds = 0) => `${Math.round(Number(seconds) || 0)} sec`;

const getCategoryName = (value) => {
  const category = Categories.find((item) => String(item.value) === String(value));
  return category?.category || value || "Category not available";
};

function SummaryKpiCard({ label, value }) {
  return (
    <div className="leaderboard-card rounded border p-4 text-center">
      <p className="app-muted-text text-sm">{label}</p>
      <p className="app-strong-text mt-2 text-2xl font-bold">{value}</p>
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

function QuizAnalysisSkeleton() {
  return (
    <div className="mt-6">
      <div className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <SkeletonBlock className="h-8 w-44" />
          <SkeletonBlock className="mt-2 h-4 w-56" />
        </div>
        <SkeletonBlock className="h-10 w-36" />
      </div>

      <div className="mt-5 flex justify-center gap-2">
        <SkeletonBlock className="h-10 w-24" />
        <SkeletonBlock className="h-10 w-24" />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            className="leaderboard-card rounded border p-4 text-center"
            key={`quiz-analysis-kpi-skeleton-${index}`}
          >
            <SkeletonBlock className="mx-auto h-4 w-24" />
            <SkeletonBlock className="mx-auto mt-3 h-8 w-20" />
          </div>
        ))}
      </div>

      <section className="leaderboard-card mt-6 rounded border p-5">
        <SkeletonBlock className="mb-5 h-6 w-44" />
        <div className="space-y-5">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={`quiz-analysis-breakdown-skeleton-${index}`}>
              <div className="mb-2 flex items-center justify-between gap-3">
                <SkeletonBlock className="h-4 w-20" />
                <SkeletonBlock className="h-4 w-24" />
              </div>
              <SkeletonBlock className="h-3 w-full rounded-full" />
            </div>
          ))}
        </div>
      </section>

      <section className="leaderboard-card mt-6 rounded border p-5">
        <SkeletonBlock className="mb-5 h-6 w-52" />
        <div className="space-y-5">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={`quiz-analysis-difficulty-skeleton-${index}`}>
              <div className="mb-2 flex items-center justify-between gap-3">
                <SkeletonBlock className="h-4 w-24" />
                <SkeletonBlock className="h-4 w-20" />
              </div>
              <SkeletonBlock className="h-3 w-full rounded-full" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function BreakdownRow({ label, value, total, percentage, tone }) {
  const barClass = tone === "correct" ? "bg-green-600" : "bg-red-600";

  return (
    <div>
      <div className="mb-2 grid grid-cols-[1fr_auto_auto] items-center gap-3 text-sm">
        <span className="app-strong-text font-semibold">{label}</span>
        <span className="app-muted-text">{value} / {total}</span>
        <span className="app-strong-text w-12 text-right font-semibold">
          {percentage}%
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className={`h-full rounded-full ${barClass}`}
          style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }}
        />
      </div>
    </div>
  );
}

function DifficultyRow({ label, correct, total, percentage }) {
  return (
    <div>
      <div className="mb-2 grid grid-cols-[1fr_auto_auto] items-center gap-3 text-sm">
        <span className="app-strong-text font-semibold capitalize">{label}</span>
        <span className="app-muted-text">{correct}/{total}</span>
        <span className="app-strong-text w-12 text-right font-semibold">
          {percentage}%
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className="h-full rounded-full bg-red-600"
          style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }}
        />
      </div>
    </div>
  );
}

function SummaryView({ summary }) {
  return (
    <div className="mt-6 space-y-6">
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryKpiCard label="Score" value={`${summary.score} / ${summary.maxScore}`} />
        <SummaryKpiCard label="Accuracy" value={`${summary.accuracy}%`} />
        <SummaryKpiCard label="Time" value={formatDuration(summary.timeTaken)} />
        <SummaryKpiCard label="Correct" value={summary.correctAnswers} />
        <SummaryKpiCard label="Wrong" value={summary.wrongAnswers} />
        <SummaryKpiCard
          label="Avg / Question"
          value={formatSeconds(summary.averageTimePerQuestion)}
        />
      </section>

      <section className="leaderboard-card rounded border p-5">
        <h2 className="app-strong-text mb-4 text-lg font-bold">Answer Breakdown</h2>
        <div className="space-y-5">
          <BreakdownRow
            label="Correct"
            value={summary.correctAnswers}
            total={summary.questionCount}
            percentage={summary.correctPercentage}
            tone="correct"
          />
          <BreakdownRow
            label="Wrong"
            value={summary.wrongAnswers}
            total={summary.questionCount}
            percentage={summary.wrongPercentage}
            tone="wrong"
          />
        </div>
      </section>

      <section className="leaderboard-card rounded border p-5">
        <h2 className="app-strong-text mb-4 text-lg font-bold">Difficulty Performance</h2>
        {summary.difficultyPerformance.length ? (
          <div className="space-y-5">
            {summary.difficultyPerformance.map((item) => (
              <DifficultyRow
                key={item.difficulty}
                label={item.difficulty}
                correct={item.correct}
                total={item.total}
                percentage={item.percentage}
              />
            ))}
          </div>
        ) : (
          <p className="app-muted-text rounded border p-4 text-center">
            No difficulty data available.
          </p>
        )}
      </section>
    </div>
  );
}

function AnswerCard({ item, index, expanded, onToggle }) {
  const normalizedCorrectAnswer = normalizeAnswerValue(item.correctAnswer);
  const normalizedSelectedAnswer = normalizeAnswerValue(item.selectedAnswer);
  const isWrongSelection = normalizedSelectedAnswer && normalizedSelectedAnswer !== normalizedCorrectAnswer;
  const statusClass = item.isCorrect
    ? "analysis-status-correct"
    : "analysis-status-wrong";
  const questionText = decodeText(item.question);

  return (
    <article className="leaderboard-card overflow-hidden rounded border shadow-sm">
      <button
        type="button"
        className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left"
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="app-muted-text text-xs font-semibold uppercase">
              Question {index + 1}
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${statusClass}`}
            >
              {item.isCorrect ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
              {item.isCorrect ? "Correct" : "Wrong"}
            </span>
          </div>
          <h2 className="app-strong-text mt-1 font-semibold">
            {questionText}
          </h2>
          <p className="app-muted-text mt-1 truncate text-xs">
            {getCategoryName(item.category)} • {item.difficulty || "Difficulty not available"}
          </p>
        </div>
        <ChevronDown
          className={`shrink-0 transition ${expanded ? "rotate-180" : ""}`}
          size={18}
        />
      </button>

      {expanded && (
        <div className="border-t px-4 py-4">
          <div className="space-y-2">
            {(item.options || []).map((option, optionIndex) => {
              const normalizedOption = normalizeAnswerValue(option);
              const isCorrectAnswer = normalizedOption === normalizedCorrectAnswer;
              const isSelectedAnswer = normalizedOption === normalizedSelectedAnswer;
              const optionClass = isCorrectAnswer
                ? "analysis-option-correct"
                : isSelectedAnswer && isWrongSelection
                ? "analysis-option-wrong"
                : "border-gray-200";

              return (
                <div
                  className={`flex flex-col gap-2 rounded border p-3 sm:flex-row sm:items-center sm:justify-between ${optionClass}`}
                  key={`${option}-${optionIndex}`}
                >
                  <span className="app-strong-text">
                    {optionLetters[optionIndex]}. {decodeText(option)}
                  </span>
                  <div className="flex flex-wrap gap-2 text-xs font-semibold">
                    {isCorrectAnswer && (
                      <span className="analysis-text-correct inline-flex items-center gap-1">
                        <CheckCircle2 size={14} />
                        Correct Answer
                      </span>
                    )}
                    {isSelectedAnswer && (
                      <span
                        className={`inline-flex items-center gap-1 ${
                          item.isCorrect
                            ? "analysis-text-correct"
                            : "analysis-text-wrong"
                        }`}
                      >
                        {item.isCorrect ? (
                          <CheckCircle2 size={14} />
                        ) : (
                          <XCircle size={14} />
                        )}
                        Your Answer
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* <div className="mt-4 rounded border p-3">
            <p className="app-muted-text text-xs font-semibold uppercase">
              Your Answer
            </p>
            <p className="app-strong-text mt-1 flex items-center gap-2">
              {normalizedSelectedAnswer ? decodeText(normalizedSelectedAnswer) : "Not answered"}
              {item.isCorrect ? (
                <CheckCircle2 className="analysis-text-correct" size={16} />
              ) : (
                <XCircle className="analysis-text-wrong" size={16} />
              )}
            </p>
          </div> */}

          <p className="app-strong-text mt-4 font-semibold">
            {item.pointsEarned || 0} points
          </p>
        </div>
      )}
    </article>
  );
}

export default function QuizAnalysis({ setAlign }) {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const backTo = location.state?.backTo || "/result";
  const backLabel = location.state?.backLabel || "Back to Results";
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState("summary");
  const [filter, setFilter] = useState("all");
  const [expandedIndex, setExpandedIndex] = useState(0);

  useEffect(() => {
    setAlign(true);
  }, [setAlign]);

  useEffect(() => {
    const loadAttempt = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await apiClient.get(`/api/score/${attemptId}/analysis`);
        setAttempt(response.data);
      } catch (err) {
        setError(err?.response?.data?.error || "Unable to load quiz analysis");
      } finally {
        setLoading(false);
      }
    };

    loadAttempt();
  }, [attemptId]);

  const answers = attempt?.answers || [];
  const summary = useMemo(() => {
    const questionCount = answers.length || attempt?.questionCount || 0;
    const correctAnswers =
      attempt?.correctAnswers ?? answers.filter((item) => item.isCorrect).length;
    const wrongAnswers =
      attempt?.wrongAnswers ?? Math.max(0, questionCount - correctAnswers);
    const score = attempt?.score || 0;
    const maxScore = attempt?.maxScore || questionCount * 10;
    const timeTaken = attempt?.timeTaken || attempt?.totaltime || 0;
    const accuracy = questionCount
      ? Math.round(attempt?.accuracy ?? (correctAnswers / questionCount) * 100)
      : 0;
    const averageTimePerQuestion = questionCount
      ? attempt?.averageTimePerQuestion || timeTaken / questionCount
      : 0;
    const correctPercentage = questionCount
      ? Math.round((correctAnswers / questionCount) * 100)
      : 0;
    const wrongPercentage = questionCount
      ? Math.round((wrongAnswers / questionCount) * 100)
      : 0;
    const difficultyMap = answers.reduce((acc, item) => {
      const difficulty = String(item.difficulty || "").toLowerCase();

      if (!difficulty) {
        return acc;
      }

      if (!acc[difficulty]) {
        acc[difficulty] = { difficulty, correct: 0, total: 0 };
      }

      acc[difficulty].total += 1;
      if (item.isCorrect) {
        acc[difficulty].correct += 1;
      }

      return acc;
    }, {});
    const difficultyPerformance = Object.values(difficultyMap)
      .map((item) => ({
        ...item,
        percentage: item.total ? Math.round((item.correct / item.total) * 100) : 0,
      }))
      .sort((a, b) => {
        const aIndex = difficultyOrder.indexOf(a.difficulty);
        const bIndex = difficultyOrder.indexOf(b.difficulty);
        return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex);
      });

    return {
      score,
      maxScore,
      accuracy,
      timeTaken,
      correctAnswers,
      wrongAnswers,
      questionCount,
      averageTimePerQuestion,
      correctPercentage,
      wrongPercentage,
      difficultyPerformance,
    };
  }, [answers, attempt]);
  const filteredAnswers = useMemo(() => {
    if (filter === "correct") {
      return answers.filter((item) => item.isCorrect);
    }

    if (filter === "wrong") {
      return answers.filter((item) => !item.isCorrect);
    }

    return answers;
  }, [answers, filter]);

  const toggleExpanded = (index) => {
    setExpandedIndex((prev) => (prev === index ? null : index));
  };

  return (
    <div className="mt-6">
      <div className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="app-strong-text text-2xl font-bold">Quiz Analysis</h1>
          {attempt && (
            <p className="app-muted-text mt-1 text-sm">
              Score {attempt.score} / {attempt.maxScore} • Accuracy{" "}
              {Math.round(attempt.accuracy || 0)}%
            </p>
          )}
        </div>
        <button
          className="analysis-outline-button inline-flex items-center justify-center gap-2 rounded border border-red-600 px-4 py-2 text-red-600 transition"
          type="button"
          onClick={() => navigate(backTo)}
        >
          <ArrowLeft size={16} />
          {backLabel}
        </button>
      </div>

      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {viewModes.map((item) => (
          <button
            className={`rounded border px-4 py-2 text-sm font-semibold transition ${
              viewMode === item.value
                ? "border-red-600 bg-red-600 text-white"
                : "app-strong-text hover:border-red-600 hover:text-red-600"
            }`}
            key={item.value}
            type="button"
            onClick={() => setViewMode(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <QuizAnalysisSkeleton />
      ) : error ? (
        <div className="analysis-error mt-6 rounded border p-4">
          {error}
        </div>
      ) : viewMode === "summary" ? (
        <SummaryView summary={summary} />
      ) : filteredAnswers.length > 0 ? (
        <>
          <div className="mt-5 flex flex-wrap gap-2">
            {filters.map((item) => (
              <button
                className={`rounded border px-4 py-2 text-sm font-semibold transition ${
                  filter === item.value
                    ? "border-red-600 bg-red-600 text-white"
                    : "app-strong-text hover:border-red-600 hover:text-red-600"
                }`}
                key={item.value}
                type="button"
                onClick={() => setFilter(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="mt-5 space-y-4">
            {filteredAnswers.map((item) => {
              const originalIndex = answers.indexOf(item);

              return (
                <AnswerCard
                  item={item}
                  index={originalIndex}
                  expanded={expandedIndex === originalIndex}
                  onToggle={() => toggleExpanded(originalIndex)}
                  key={`${originalIndex}-${item.question}`}
                />
              );
            })}
          </div>
        </>
      ) : (
        <div className="app-muted-text py-10 text-center">
          No answers found for this filter.
        </div>
      )}
    </div>
  );
}
