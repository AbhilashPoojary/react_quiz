import React from "react";

export default function SkeletonLoading() {
  return (
    <>
      <div className="flex flex-col gap-3 border-b py-5 sm:flex-row sm:justify-between">
        <span className="animate-pulse bg-gray-300 h-4 w-1/5"></span>
        <h1 className="animate-pulse bg-gray-300 h-4 w-1/4"></h1>
        <span className="animate-pulse bg-gray-300 h-4 w-1/5"></span>
      </div>
      <div>
        <div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="my-5 animate-pulse bg-gray-300 h-4 w-1/4"></h1>
            <span className="animate-pulse bg-gray-300 h-4 w-1/6"></span>
          </div>
          <div className="border rounded p-5 mb-5">
            <h3 className="m-auto animate-pulse bg-gray-300 h-6 w-1/3"></h3>
            <span className="hidden">Please select an option first</span>
            <div className="my-5 grid grid-cols-1 gap-4 sm:mx-5 md:grid-cols-2">
              <button className="animate-pulse bg-gray-300 h-8 rounded"></button>
              <button className="animate-pulse bg-gray-300 h-8 rounded"></button>
              <button className="animate-pulse bg-gray-300 h-8 rounded"></button>
              <button className="animate-pulse bg-gray-300 h-8 rounded"></button>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-around">
            <div>
              <button className="animate-pulse bg-gray-300 w-20 h-8 rounded"></button>
            </div>
            <div>
              <button className="animate-pulse bg-gray-300 w-20 h-8 rounded"></button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
