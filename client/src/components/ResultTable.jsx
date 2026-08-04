import React, { useEffect, useMemo, useState } from "react";
import { StepBack, StepForward, ChevronLast, ChevronFirst } from "lucide-react";
import Categories from "../data/Categories";

export default function ResultTable({ data, itemsPerPage, dateSort = "newest" }) {
  const [currentPage, setCurrentPage] = useState(1);

  const sortedData = useMemo(() => {
    const clonedData = [...(data || [])];

    return clonedData.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.updatedAt || 0).getTime();
      const dateB = new Date(b.createdAt || b.updatedAt || 0).getTime();

      if (dateSort === "oldest") {
        return dateA - dateB;
      }

      return dateB - dateA;
    });
  }, [data, dateSort]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / itemsPerPage));
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedData.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };
  const getCategory = (val) => {
    const obj = Categories.find((item) => item.value === val);
    return obj ? obj.category : "Oops error";
  };
  const capitalize = (str) => {
    return str[0].toUpperCase() + str.slice(1);
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
  }, [data, dateSort]);
  return (
    <>
      <div className="result-table">
        <table className="border w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th scope="col" className="px-6 py-3">
                Name
              </th>
              <th scope="col" className="px-6 py-3">
                Category
              </th>
              <th scope="col" className="px-6 py-3">
                Difficulty
              </th>
              <th scope="col" className="px-6 py-3">
                Average time
              </th>
              <th scope="col" className="px-6 py-3">
                Score
              </th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length > 0 ? (
              currentItems?.map((item, index) => {
                return (
                  <tr
                    className="bg-white border-b dark:bg-gray-800 dark:border-gray-700"
                    key={item?._id || `${item?.name}-${item?.score}-${index}`}
                  >
                    <th
                      scope="row"
                      className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                    >
                      {item.name}
                    </th>
                    <td className="px-6 py-4">{getCategory(item.category)}</td>
                    <td className="px-6 py-4">{capitalize(item.difficulty)}</td>
                    <td className="px-6 py-4">{item.totaltime + " secs"}</td>
                    <td className="px-6 py-4">{item.score}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5}>
                  <div className="text-center w-[100%] p-2">
                    No data available
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="pagination flex justify-end gap-2 mt-2 items-center">
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
                    ? "text-gray-400 bg-blue-200 px-2 border w-[25px]"
                    : "px-2 border"
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
    </>
  );
}
