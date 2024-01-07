import React from "react";

export default function SkeletonLoading() {
  return (
    <>
      <div className="border-b py-5 flex justify-between">
        <span className="animate-pulse bg-gray-300 h-4 w-1/5"></span>
        <h1 className="animate-pulse bg-gray-300 h-4 w-1/4"></h1>
        <span className="animate-pulse bg-gray-300 h-4 w-1/5"></span>
      </div>
      <div>
        <div>
          <div className="flex justify-between items-center">
            <h1 className="my-5 animate-pulse bg-gray-300 h-4 w-1/4"></h1>
            <span className="animate-pulse bg-gray-300 h-4 w-1/6"></span>
          </div>
          <div className="border rounded p-5 mb-5">
            <h3 className="m-auto animate-pulse bg-gray-300 h-6 w-1/3"></h3>
            <span className="hidden">Please select an option first</span>
            <div className="grid grid-cols-2 gap-4 my-5 mx-5 m-auto">
              <button className="animate-pulse bg-gray-300 h-8 rounded"></button>
              <button className="animate-pulse bg-gray-300 h-8 rounded"></button>
              <button className="animate-pulse bg-gray-300 h-8 rounded"></button>
              <button className="animate-pulse bg-gray-300 h-8 rounded"></button>
            </div>
          </div>
          <div className="flex justify-around">
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
