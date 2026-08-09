import React, { useMemo } from "react";

const getHeatColor = (score) => {
  if (score >= 85) return "bg-red-700";
  if (score >= 70) return "bg-red-600";
  if (score >= 55) return "bg-red-500";
  if (score >= 40) return "bg-red-400";
  if (score >= 25) return "bg-red-300";
  return "bg-red-200";
};

export default function CategoryHeatmap({ data }) {
  const sortedData = useMemo(
    () => [...data].sort((a, b) => b.avgScore - a.avgScore),
    [data]
  );

  if (!sortedData.length) {
    return <p className="app-muted-text">No category performance yet.</p>;
  }

  return (
    <div className="profile-chart-panel rounded border p-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {sortedData.map((item) => {
          const score = Number(item.avgScore) || 0;
          return (
            <div
              className={`${getHeatColor(
                score
              )} min-h-[92px] rounded p-3 text-white shadow-sm transition duration-300 hover:scale-[1.02]`}
              key={item.category}
              title={`${item.categoryName}: ${score}%`}
            >
              <p className="text-sm font-semibold leading-snug">
                {item.categoryName}
              </p>
              <p className="mt-2 text-2xl font-bold">{score}%</p>
              <p className="text-xs opacity-90">{item.gamesPlayed} played</p>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex items-center justify-end gap-2 text-xs">
        <span className="app-muted-text">Low</span>
        <span className="h-3 w-8 rounded bg-red-200" />
        <span className="h-3 w-8 rounded bg-red-400" />
        <span className="h-3 w-8 rounded bg-red-600" />
        <span className="h-3 w-8 rounded bg-red-700" />
        <span className="app-muted-text">High</span>
      </div>
    </div>
  );
}
