import React, { useEffect, useMemo, useState } from "react";
import {
  StepBack,
  StepForward,
  ChevronLast,
  ChevronFirst,
  MoreVertical,
  X,
} from "lucide-react";
import Categories from "../data/Categories";
import { formatDuration } from "../utils/utilFunc";

export default function ResultTable({ data, itemsPerPage, dateSort = "newest" }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [openFilter, setOpenFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState({});
  const [draftFilters, setDraftFilters] = useState({});

  const getCategory = (val) => {
    const obj = Categories.find((item) => item.value === val);
    return obj ? obj.category : "Oops error";
  };

  const capitalize = (str = "") => {
    return str ? str[0].toUpperCase() + str.slice(1) : "";
  };

  const columns = useMemo(
    () => [
      {
        key: "name",
        label: "Name",
        getValue: (item) => item.name || "",
        cellClassName:
          "app-strong-text px-3 py-4 font-medium text-gray-900",
        header: true,
      },
      {
        key: "category",
        label: "Category",
        getValue: (item) => getCategory(item.category),
      },
      {
        key: "difficulty",
        label: "Difficulty",
        getValue: (item) => capitalize(item.difficulty),
      },
      {
        key: "questionCount",
        label: "Questions",
        getValue: (item) => String(item.questionCount || 10),
      },
      {
        key: "accuracy",
        label: "Accuracy",
        getValue: (item) => `${Math.round(Number(item.accuracy) || 0)}%`,
      },
      {
        key: "scorePercentage",
        label: "Score %",
        getValue: (item) =>
          `${Math.round(Number(item.scorePercentage) || 0)}%`,
      },
      {
        key: "averageTimePerQuestion",
        label: "Avg time/question",
        getValue: (item) => formatDuration(item.averageTimePerQuestion),
      },
      {
        key: "score",
        label: "Score",
        getValue: (item) =>
          `${item.score} / ${item.maxScore || (item.questionCount || 10) * 10}`,
      },
    ],
    []
  );

  const filteredData = useMemo(() => {
    const activeFilters = Object.entries(columnFilters).filter(([, value]) =>
      value?.trim()
    );

    if (activeFilters.length === 0) {
      return [...(data || [])];
    }

    return [...(data || [])].filter((item) =>
      activeFilters.every(([key, value]) => {
        const column = columns.find((item) => item.key === key);
        const searchValue = value.trim().toLowerCase();
        const displayValue = String(column?.getValue(item) || "").toLowerCase();

        return displayValue.includes(searchValue);
      })
    );
  }, [columnFilters, columns, data]);

  const sortedData = useMemo(() => {
    const clonedData = [...filteredData];

    return clonedData.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.updatedAt || 0).getTime();
      const dateB = new Date(b.createdAt || b.updatedAt || 0).getTime();

      if (dateSort === "oldest") {
        return dateA - dateB;
      }

      return dateB - dateA;
    });
  }, [filteredData, dateSort]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / itemsPerPage));
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedData.slice(indexOfFirstItem, indexOfLastItem);
  const visibleStart = sortedData.length ? indexOfFirstItem + 1 : 0;
  const visibleEnd = Math.min(indexOfLastItem, sortedData.length);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

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
    const isFirstColumns = index < 2;
    const isLastColumns = index >= columns.length - 2;
    const dropdownPositionClass = isFirstColumns
      ? "left-0"
      : isLastColumns
      ? "right-0"
      : "left-1/2 -translate-x-1/2";

    return (
      <th
        scope="col"
        className="relative px-3 py-3"
        key={column.key}
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
  const handleStepBack = () => {
    if (currentPage !== 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };
  const handleStepNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };
  const handleEnd = () => {
    setCurrentPage(totalPages);
  };
  useEffect(() => {
    if (data) {
      setCurrentPage(1);
    }
  }, [data, dateSort, columnFilters]);
  return (
    <>
      <div className="result-table w-full overflow-x-auto pb-2">
        <table className="app-table w-full min-w-[920px] table-fixed border text-left text-sm text-gray-500">
          <thead className="app-table-head text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              {columns.map(renderHeader)}
            </tr>
          </thead>
          <tbody>
            {currentItems.length > 0 ? (
              currentItems?.map((item, index) => {
                return (
                  <tr
                    className="app-table-row bg-white border-b"
                    key={item?._id || `${item?.name}-${item?.score}-${index}`}
                  >
                    {columns.map((column) =>
                      column.header ? (
                        <th
                          scope="row"
                          className={column.cellClassName}
                          key={column.key}
                          title={column.getValue(item)}
                        >
                          <span className="block truncate">
                            {column.getValue(item)}
                          </span>
                        </th>
                      ) : (
                        <td
                          className="px-3 py-4"
                          key={column.key}
                          title={column.getValue(item)}
                        >
                          <span className="block truncate">
                            {column.getValue(item)}
                          </span>
                        </td>
                      )
                    )}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={columns.length}>
                  <div className="text-center w-[100%] p-2">
                    No data available
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="app-muted-text text-sm">
          Showing {visibleStart}-{visibleEnd} of {sortedData.length}
        </p>
        <div className="pagination flex justify-end gap-2 items-center">
          {sortedData.length > itemsPerPage && (
            <ChevronFirst
              className={`${
                currentPage === 1
                  ? "text-[#e5e7eb] cursor-default"
                  : "text-[#c3c8ce] cursor-pointer"
              } border p-[2px]`}
              onClick={() => setCurrentPage(1)}
            />
          )}
          {sortedData.length > itemsPerPage && (
            <StepBack
              className={`${
                currentPage === 1
                  ? "text-[#e5e7eb] cursor-default"
                  : "text-[#c3c8ce] cursor-pointer"
              } border p-[2px]`}
              onClick={handleStepBack}
            />
          )}
          {sortedData.length > itemsPerPage &&
            Array.from({
              length: Math.min(3, totalPages),
            }).map((_, index) => {
              let startPageIndex = currentPage - 1 - Math.floor(3 / 2);
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
                  key={`page-${pageNumber}`}
                  className={
                    currentPage === pageNumber
                      ? "min-w-8 rounded border bg-blue-200 px-2 py-0.5 text-gray-700"
                      : "min-w-8 rounded border px-2 py-0.5"
                }
                  onClick={() => paginate(pageNumber)}
                >
                  {pageNumber}
                </button>
              );
            })}
          {sortedData.length > itemsPerPage && (
            <StepForward
              className={`${
                currentPage === totalPages
                  ? "text-[#e5e7eb] cursor-default"
                  : "text-[#c3c8ce] cursor-pointer"
              } border p-[2px]`}
              onClick={handleStepNext}
            />
          )}
          {sortedData.length > itemsPerPage && (
            <ChevronLast
              className={`${
                currentPage === totalPages
                  ? "text-[#e5e7eb] cursor-default"
                  : "text-[#c3c8ce] cursor-pointer"
              } border p-[2px]`}
              onClick={handleEnd}
            />
          )}
        </div>
      </div>
    </>
  );
}
