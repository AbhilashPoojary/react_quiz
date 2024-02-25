import React, { useEffect, useState } from "react";
import { StepBack, StepForward, ChevronLast, ChevronFirst } from "lucide-react";
import Categories from "../data/Categories";

export default function ResultTable({ data, itemsPerPage }) {
  const [currentPage, setCurrentPage] = useState(1);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = data.slice(indexOfFirstItem, indexOfLastItem);
  console.log(currentPage, indexOfLastItem, indexOfFirstItem, currentItems);

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
    if (currentPage < data.length / itemsPerPage) {
      setCurrentPage((prev) => prev + 1);
    }
  };
  const handleEnd = () => {
    const endPageIndx = Math.ceil(data.length / itemsPerPage);
    setCurrentPage(endPageIndx);
  };
  useEffect(() => {
    if (data) {
      setCurrentPage(1);
    }
  }, [data]);
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
              currentItems?.map((item) => {
                return (
                  <tr
                    className="bg-white border-b dark:bg-gray-800 dark:border-gray-700"
                    key={item?._id}
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
        {data.length > itemsPerPage && (
          <ChevronFirst
            className={`${
              currentPage === 1
                ? "text-[#e5e7eb] cursor-default"
                : "text-[#c3c8ce] cursor-pointer"
            } border p-[2px]`}
            onClick={() => setCurrentPage(1)}
          />
        )}
        {data.length > itemsPerPage && (
          <StepBack
            className={`${
              currentPage === 1
                ? "text-[#e5e7eb] cursor-default"
                : "text-[#c3c8ce] cursor-pointer"
            } border p-[2px]`}
            onClick={handleStepBack}
          />
        )}
        {data.length > itemsPerPage &&
          Array.from({
            length: Math.min(3, Math.ceil(data.length / itemsPerPage)),
          }).map((_, index) => {
            const totalPageCount = Math.ceil(data.length / itemsPerPage);
            let startPageIndex = currentPage - 1 - Math.floor(3 / 2);
            startPageIndex = Math.max(
              0,
              Math.min(startPageIndex, totalPageCount - 3)
            );
            const endPageIndex = Math.min(
              startPageIndex + 2,
              totalPageCount - 1
            );
            return (
              <>
                <button
                  key={index}
                  className={
                    currentPage === startPageIndex + index + 1
                      ? "text-gray-400 bg-blue-200 px-2 border w-[25px]"
                      : "px-2 border"
                  }
                  onClick={() => paginate(startPageIndex + index + 1)}
                >
                  {startPageIndex + index + 1}
                </button>
              </>
            );
          })}
        {data.length > itemsPerPage && (
          <StepForward
            className={`${
              currentPage === Math.ceil(data.length / itemsPerPage)
                ? "text-[#e5e7eb] cursor-default"
                : "text-[#c3c8ce] cursor-pointer"
            } border p-[2px]`}
            onClick={handleStepNext}
          />
        )}
        {data.length > itemsPerPage && (
          <ChevronLast
            className={`${
              currentPage === Math.ceil(data.length / itemsPerPage)
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
