import React from "react";

export default function LeaderBoards({ leaders }) {
  return (
    <>
      {leaders.map((item) => {
        return (
          <div
            className="w-1/3 p-4 bg-white border border-gray-200 rounded shadow dark:bg-gray-800 dark:border-gray-700 text-center"
            key={item._id}
          >
            <img
              className="w-24 h-24 mb-3 rounded-full shadow-lg m-auto"
              src={item.profilePicture}
              alt="Bonnie image"
            />
            <div className="flex justify-between">
              <p>Name:</p>
              <p className="font-bold">{item.name}</p>
            </div>
            <div className="flex justify-between">
              <p>Score:</p>
              <p className="font-bold">{item.score}</p>
            </div>
            <div className="flex justify-between">
              <p>Time taken:</p>
              <p className="font-bold">{item.totaltime} secs</p>
            </div>
          </div>
        );
      })}
    </>
  );
}
