import React from "react";
import { formatDuration } from "../utils/utilFunc";

export default function LeaderBoards({ leaders }) {
  const formatPercent = (value) => `${Math.round(Number(value) || 0)}%`;

  if (!leaders?.length) {
    return (
      <div className="app-muted-text w-full rounded border p-6 text-center">
        No leaders available for this selection yet.
      </div>
    );
  }

  return (
    <>
      {leaders.map((item) => {
        return (
          <div
            className="leaderboard-card w-full rounded border border-gray-200 bg-white p-4 text-center shadow sm:w-[calc(50%-0.625rem)] xl:w-[calc(25%-0.875rem)]"
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
              <p className="font-bold">
                {item.score} / {item.maxScore}
              </p>
            </div>
            <div className="flex justify-between">
              <p>Accuracy:</p>
              <p className="font-bold">{formatPercent(item.accuracy)}</p>
            </div>
            <div className="flex justify-between">
              <p>Questions:</p>
              <p className="font-bold">{item.questionCount}</p>
            </div>
            <div className="flex justify-between">
              <p>Avg time:</p>
              <p className="font-bold">
                {formatDuration(item.averageTimePerQuestion)}
              </p>
            </div>
          </div>
        );
      })}
    </>
  );
}
