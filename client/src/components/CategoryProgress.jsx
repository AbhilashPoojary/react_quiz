import React from "react";

const clampPercent = (value) => Math.min(100, Math.max(0, Number(value) || 0));

export default function CategoryProgress({ data }) {
  if (!data.length) {
    return <p className="app-muted-text">No category performance yet.</p>;
  }

  return (
    <div className="space-y-4 p-5 rounded border flex justify-between gap-3 items-baseline flex-wrap">
      {data.map((item) => {
        const score = clampPercent(item.avgScore);

        return (
          <div key={item.category} className="w-[calc(50%-0.375rem)]">
            <div className="mb-1 flex items-center justify-between gap-3 text-sm">
              <span className="app-strong-text font-medium">
                {item.categoryName}
              </span>
              <span className="app-strong-text font-semibold">{score}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-red-400 transition-all duration-500"
                style={{ width: `${score}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
