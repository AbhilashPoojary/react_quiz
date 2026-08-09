import React from "react";

export const LoadingSkeleton = () => {
  const skeletonItems = Array.from({ length: 4 }).map((_, index) => (
    <div
      className="leaderboard-card w-full rounded border border-gray-200 bg-white p-4 text-center shadow animate-puls sm:w-[calc(50%-0.625rem)] xl:w-[calc(25%-0.875rem)]"
      key={index}
    >
      <div className="w-24 h-24 mb-3 animate-pulse bg-gray-300 rounded-full shadow-lg m-auto"></div>
      <div className="flex justify-between mb-2">
        <span className="animate-pulse bg-gray-300 w-10 h-4 inline-block text-center"></span>
        <span className="animate-pulse bg-gray-300 w-10 h-4 inline-block text-center"></span>
      </div>
      <div className="flex justify-between mb-2">
        <span className="animate-pulse bg-gray-300 w-10 h-4 inline-block text-center"></span>
        <span className="animate-pulse bg-gray-300 w-10 h-4 inline-block text-center"></span>
      </div>
      <div className="flex justify-between">
        <span className="animate-pulse bg-gray-300 w-10 h-4 inline-block text-center"></span>
        <span className="animate-pulse bg-gray-300 w-10 h-4 inline-block text-center"></span>
      </div>
    </div>
  ));

  return <>{skeletonItems}</>;
};
