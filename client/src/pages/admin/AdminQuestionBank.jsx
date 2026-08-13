import React, { useEffect, useMemo, useState } from "react";
import {
  ChevronFirst,
  ChevronLast,
  Eye,
  MoreVertical,
  RefreshCw,
  StepBack,
  StepForward,
  X,
} from "lucide-react";
import apiClient from "../../utils/apiClient";

const ITEMS_PER_PAGE = 15;

const sourceLabels = {
  EVENT: "Event",
  CHALLENGE: "Challenge",
  NORMAL_QUIZ: "Normal Quiz",
};

const formatSource = (sources = []) =>
  (Array.isArray(sources) ? sources : [])
    .map((source) => sourceLabels[source] || source)
    .join(", ") || "-";

function DetailRow({ label, value }) {
  return (
    <div>
      <p className="app-muted-text text-xs uppercase">{label}</p>
      <p className="app-strong-text mt-1 break-words text-sm">{value || "-"}</p>
    </div>
  );
}

function QuestionDetailsModal({ question, onClose }) {
  if (!question) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-3 sm:items-center">
      <div className="admin-card max-h-[90vh] w-full max-w-3xl overflow-auto rounded border p-5 shadow-xl sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="app-muted-text text-xs uppercase">
              {formatSource(question.foundIn)}
            </p>
            <h2 className="app-strong-text mt-1 text-xl font-bold">
              Question Details
            </h2>
          </div>
          <button
            aria-label="Close question details"
            className="rounded p-2 text-gray-500 transition hover:text-red-600"
            type="button"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <DetailRow label="Question" value={question.question} />
          </div>
          <DetailRow label="Source" value={formatSource(question.foundIn)} />
          <DetailRow label="Category" value={question.category} />
          <DetailRow label="Difficulty" value={question.difficulty} />
          <DetailRow label="Type" value={question.type} />
          <DetailRow label="Correct Answer" value={question.correctAnswer} />
          <div className="sm:col-span-2">
            <p className="app-muted-text text-xs uppercase">Options</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(question.options || []).length ? (
                question.options.map((option) => (
                  <span
                    className={`rounded border px-3 py-1 text-sm ${
                      option === question.correctAnswer
                        ? "border-green-600 text-green-700"
                        : "app-strong-text"
                    }`}
                    key={option}
                  >
                    {option}
                  </span>
                ))
              ) : (
                <span className="app-muted-text text-sm">No options found</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="admin-card rounded border p-4">
      <p className="app-muted-text text-sm">{label}</p>
      <p className="app-strong-text mt-2 text-2xl font-bold">{value || 0}</p>
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

function QuestionBankSkeleton() {
  return (
    <>
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div className="admin-card rounded border p-4" key={index}>
            <SkeletonBlock className="h-4 w-28" />
            <SkeletonBlock className="mt-3 h-8 w-14" />
          </div>
        ))}
      </div>
      <section className="admin-card rounded border p-5">
        <div className="overflow-x-auto">
          <table className="app-table w-full min-w-[920px] text-left text-sm">
            <thead className="app-table-head">
              <tr>
                {["Question", "Source", "Category", "Difficulty", "Type", "Action"].map(
                  (heading) => (
                    <th className="px-4 py-3" key={heading}>
                      <SkeletonBlock className="h-4 w-20" />
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: ITEMS_PER_PAGE }).map((_, rowIndex) => (
                <tr className="app-table-row border-b" key={rowIndex}>
                  <td className="px-4 py-4">
                    <SkeletonBlock className="h-4 w-72 max-w-full" />
                    <SkeletonBlock className="mt-2 h-3 w-44 max-w-full" />
                  </td>
                  <td className="px-4 py-4">
                    <SkeletonBlock className="h-4 w-24" />
                  </td>
                  <td className="px-4 py-4">
                    <SkeletonBlock className="h-4 w-32" />
                  </td>
                  <td className="px-4 py-4">
                    <SkeletonBlock className="h-4 w-16" />
                  </td>
                  <td className="px-4 py-4">
                    <SkeletonBlock className="h-4 w-20" />
                  </td>
                  <td className="px-4 py-4">
                    <SkeletonBlock className="ml-auto h-9 w-20" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

export default function AdminQuestionBank() {
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [openFilter, setOpenFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState({});
  const [draftFilters, setDraftFilters] = useState({});

  const fetchQuestionBank = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await apiClient.get("/api/admin/question-bank");
      setPayload(response.data);
    } catch (error) {
      setError(error?.response?.data?.error || "Unable to fetch question bank");
    } finally {
      setLoading(false);
    }
  };

  const questions = payload?.questions || [];
  const columns = useMemo(
    () => [
      {
        key: "question",
        label: "Question",
        getValue: (question) => question.question || "",
      },
      {
        key: "source",
        label: "Source",
        getValue: (question) => formatSource(question.foundIn),
      },
      {
        key: "category",
        label: "Category",
        getValue: (question) => question.category || "",
      },
      {
        key: "difficulty",
        label: "Difficulty",
        getValue: (question) => question.difficulty || "",
      },
      {
        key: "type",
        label: "Type",
        getValue: (question) => question.type || "",
      },
    ],
    []
  );

  const filteredQuestions = useMemo(() => {
    const activeFilters = Object.entries(columnFilters).filter(([, value]) =>
      value?.trim()
    );

    if (activeFilters.length === 0) {
      return questions;
    }

    return questions.filter((question) =>
      activeFilters.every(([key, value]) => {
        const column = columns.find((item) => item.key === key);
        const displayValue = String(column?.getValue(question) || "").toLowerCase();
        const searchValue = value.trim().toLowerCase();

        return displayValue.includes(searchValue);
      })
    );
  }, [columnFilters, columns, questions]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredQuestions.length / ITEMS_PER_PAGE)
  );
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentQuestions = filteredQuestions.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const visibleStart = filteredQuestions.length ? indexOfFirstItem + 1 : 0;
  const visibleEnd = Math.min(indexOfLastItem, filteredQuestions.length);

  const applyFilter = (key) => {
    setColumnFilters((prev) => ({
      ...prev,
      [key]: draftFilters[key] || "",
    }));
    setOpenFilter("");
  };

  const clearFilter = (key) => {
    setDraftFilters((prev) => ({ ...prev, [key]: "" }));
    setColumnFilters((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setOpenFilter("");
  };

  const renderHeader = (column, index) => {
    const isActive = Boolean(columnFilters[column.key]?.trim());
    const dropdownPositionClass = index <= 1 ? "left-0" : "right-0";

    return (
      <th
        className="relative px-4 py-3"
        key={column.key}
        scope="col"
        title={column.label}
      >
        <div className="flex min-w-0 items-center justify-between gap-1">
          <span className="truncate">{column.label}</span>
          <button
            aria-label={`Filter ${column.label}`}
            className={`shrink-0 rounded p-1 transition hover:text-red-600 ${
              isActive ? "text-red-600" : ""
            }`}
            type="button"
            onClick={() => {
              setDraftFilters((prev) => ({
                ...prev,
                [column.key]: prev[column.key] ?? columnFilters[column.key] ?? "",
              }));
              setOpenFilter((prev) => (prev === column.key ? "" : column.key));
            }}
          >
            <MoreVertical size={16} />
          </button>
        </div>
        {openFilter === column.key && (
          <div
            className={`app-dropdown-menu absolute top-10 z-50 w-44 rounded border p-3 text-left normal-case shadow-xl sm:w-56 ${dropdownPositionClass}`}
          >
            <label className="app-label mb-1 block text-xs font-semibold">
              Filter {column.label}
            </label>
            <input
              autoFocus
              className="app-input w-full rounded border border-gray-300 p-2 text-sm outline-none"
              placeholder="Type and press Enter"
              value={draftFilters[column.key] || ""}
              onChange={(event) =>
                setDraftFilters((prev) => ({
                  ...prev,
                  [column.key]: event.target.value,
                }))
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  applyFilter(column.key);
                }

                if (event.key === "Escape") {
                  setOpenFilter("");
                }
              }}
            />
            <div className="mt-2 flex justify-between gap-2">
              <button
                className="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs transition hover:text-red-600"
                type="button"
                onClick={() => clearFilter(column.key)}
              >
                <X size={13} />
                Clear
              </button>
              <button
                className="rounded bg-red-600 px-2 py-1 text-xs text-white transition hover:bg-red-700"
                type="button"
                onClick={() => applyFilter(column.key)}
              >
                Apply
              </button>
            </div>
          </div>
        )}
      </th>
    );
  };

  useEffect(() => {
    fetchQuestionBank();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [columnFilters, payload]);

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="app-strong-text text-2xl font-bold">Question Bank</h1>
          <p className="app-muted-text mt-1 text-sm">
            Unique questions fetched from existing quiz activity.
          </p>
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 rounded bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-800 disabled:cursor-wait disabled:opacity-70"
          disabled={loading}
          type="button"
          onClick={fetchQuestionBank}
        >
          <RefreshCw className={loading ? "animate-spin" : ""} size={16} />
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && (
        <p className="mb-4 rounded border border-red-600/40 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {loading && !payload ? (
        <QuestionBankSkeleton />
      ) : (
        <>
      {payload && (
        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <SummaryCard label="Unique Questions" value={payload.uniqueQuestions} />
          <SummaryCard label="Total Found" value={payload.totalQuestionsFound} />
          <SummaryCard label="Duplicates" value={payload.duplicateQuestions} />
        </div>
      )}

      <section className="admin-card rounded border p-5">
        {!payload ? (
          <div className="app-muted-text rounded border p-8 text-center">
            Loading question bank...
          </div>
        ) : questions.length ? (
          <>
            <div className="overflow-x-auto">
              <table className="app-table w-full min-w-[920px] text-left text-sm">
                <thead className="app-table-head">
                  <tr>
                    {columns.map(renderHeader)}
                    <th className="px-4 py-3 text-right" scope="col">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentQuestions.length ? (
                    currentQuestions.map((question, index) => (
                      <tr
                        className="app-table-row border-b last:border-b-0"
                        key={`${question.question}-${indexOfFirstItem + index}`}
                      >
                        <td className="max-w-[360px] px-4 py-4">
                          <p
                            className="app-strong-text truncate font-semibold"
                            title={question.question}
                          >
                            {question.question}
                          </p>
                          <p
                            className="app-muted-text mt-1 truncate text-xs"
                            title={question.correctAnswer}
                          >
                            Answer: {question.correctAnswer || "-"}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          {formatSource(question.foundIn)}
                        </td>
                        <td className="px-4 py-4">{question.category || "-"}</td>
                        <td className="px-4 py-4 capitalize">
                          {question.difficulty || "-"}
                        </td>
                        <td className="px-4 py-4 capitalize">
                          {question.type || "-"}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <button
                            className="analysis-outline-button inline-flex items-center gap-2 rounded border border-red-600 px-3 py-2 text-red-600"
                            type="button"
                            onClick={() => setSelectedQuestion(question)}
                          >
                            <Eye size={15} />
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr className="app-table-row">
                      <td className="px-4 py-5 text-center" colSpan={6}>
                        No questions match the current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="app-muted-text text-sm">
                Showing {visibleStart}-{visibleEnd} of {filteredQuestions.length}
              </p>
              <div className="pagination flex items-center justify-end gap-2">
                {filteredQuestions.length > ITEMS_PER_PAGE && (
                  <ChevronFirst
                    className={`${
                      currentPage === 1
                        ? "cursor-default text-[#e5e7eb]"
                        : "cursor-pointer text-[#c3c8ce]"
                    } border p-[2px]`}
                    onClick={() => setCurrentPage(1)}
                  />
                )}
                {filteredQuestions.length > ITEMS_PER_PAGE && (
                  <StepBack
                    className={`${
                      currentPage === 1
                        ? "cursor-default text-[#e5e7eb]"
                        : "cursor-pointer text-[#c3c8ce]"
                    } border p-[2px]`}
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                  />
                )}
                {filteredQuestions.length > ITEMS_PER_PAGE &&
                  Array.from({ length: Math.min(3, totalPages) }).map(
                    (_, index) => {
                      let startPageIndex =
                        currentPage - 1 - Math.floor(3 / 2);
                      startPageIndex = Math.max(
                        0,
                        Math.min(startPageIndex, totalPages - 3)
                      );
                      const pageNumber = startPageIndex + index + 1;

                      if (pageNumber > totalPages) {
                        return null;
                      }

                      return (
                        <button
                          className={
                            currentPage === pageNumber
                              ? "min-w-8 rounded border bg-blue-200 px-2 py-0.5 text-gray-700"
                              : "min-w-8 rounded border px-2 py-0.5"
                          }
                          key={`question-bank-page-${pageNumber}`}
                          type="button"
                          onClick={() => setCurrentPage(pageNumber)}
                        >
                          {pageNumber}
                        </button>
                      );
                    }
                  )}
                {filteredQuestions.length > ITEMS_PER_PAGE && (
                  <StepForward
                    className={`${
                      currentPage === totalPages
                        ? "cursor-default text-[#e5e7eb]"
                        : "cursor-pointer text-[#c3c8ce]"
                    } border p-[2px]`}
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                  />
                )}
                {filteredQuestions.length > ITEMS_PER_PAGE && (
                  <ChevronLast
                    className={`${
                      currentPage === totalPages
                        ? "cursor-default text-[#e5e7eb]"
                        : "cursor-pointer text-[#c3c8ce]"
                    } border p-[2px]`}
                    onClick={() => setCurrentPage(totalPages)}
                  />
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="app-muted-text rounded border p-8 text-center">
            No questions found.
          </div>
        )}
      </section>

      <QuestionDetailsModal
        question={selectedQuestion}
        onClose={() => setSelectedQuestion(null)}
      />
        </>
      )}
    </div>
  );
}
