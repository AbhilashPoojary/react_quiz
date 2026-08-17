import React from "react";

export const LoadingSkeleton = () => {
  const skeletonItems = Array.from({ length: 4 }).map((_, index) => (
    <div
      className="leaderboard-card w-full animate-pulse rounded border border-gray-200 bg-white p-4 text-center shadow sm:w-[calc(50%-0.625rem)] xl:w-[calc(25%-0.875rem)]"
      key={index}
    >
      <div className="w-24 h-24 mb-3 bg-gray-300 rounded-full shadow-lg m-auto"></div>
      <div className="flex justify-between mb-2">
        <span className="bg-gray-300 w-10 h-4 inline-block text-center"></span>
        <span className="bg-gray-300 w-10 h-4 inline-block text-center"></span>
      </div>
      <div className="flex justify-between mb-2">
        <span className="bg-gray-300 w-10 h-4 inline-block text-center"></span>
        <span className="bg-gray-300 w-10 h-4 inline-block text-center"></span>
      </div>
      <div className="flex justify-between">
        <span className="bg-gray-300 w-10 h-4 inline-block text-center"></span>
        <span className="bg-gray-300 w-10 h-4 inline-block text-center"></span>
      </div>
    </div>
  ));

  return <>{skeletonItems}</>;
};

export const TableLoadingSkeleton = ({ rows = 5, columns = 8 }) => {
  const skeletonRows = Array.from({ length: rows });
  const skeletonColumns = Array.from({ length: columns });

  return (
    <div className="result-table w-full overflow-x-auto pb-2">
      <table className="app-table w-full min-w-[920px] table-fixed border text-left text-sm">
        <thead className="app-table-head bg-gray-50 text-xs uppercase text-gray-700">
          <tr>
            {skeletonColumns.map((_, index) => (
              <th className="px-3 py-3" key={`header-${index}`}>
                <div className="h-4 w-20 animate-pulse rounded bg-gray-300 dark:bg-gray-700" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {skeletonRows.map((_, rowIndex) => (
            <tr className="app-table-row border-b bg-white" key={`row-${rowIndex}`}>
              {skeletonColumns.map((__, columnIndex) => (
                <td className="px-3 py-4" key={`cell-${rowIndex}-${columnIndex}`}>
                  <div
                    className={`h-4 animate-pulse rounded bg-gray-300 dark:bg-gray-700 ${
                      columnIndex === 0 ? "w-28" : "w-20"
                    }`}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="h-4 w-28 animate-pulse rounded bg-gray-300 dark:bg-gray-700" />
        <div className="flex gap-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <div className="h-7 w-8 animate-pulse rounded border bg-gray-200 dark:bg-gray-800" key={index} />
          ))}
        </div>
      </div>
    </div>
  );
};
