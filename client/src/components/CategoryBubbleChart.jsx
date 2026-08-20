import React, { useMemo } from "react";
import {
  BubbleController,
  Chart as ChartJS,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";
import { Bubble } from "react-chartjs-2";

ChartJS.register(BubbleController, LinearScale, PointElement, Tooltip);

const getThemeColor = (name, fallback) => {
  if (typeof window === "undefined") {
    return fallback;
  }

  return (
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() ||
    fallback
  );
};

const clampPercent = (value) => Math.min(100, Math.max(0, Number(value) || 0));

export default function CategoryBubbleChart({ data }) {
  const sortedData = useMemo(
    () => [...data].sort((a, b) => b.avgScore - a.avgScore),
    [data]
  );

  const textColor = getThemeColor("--app-text", "#111827");
  const mutedColor = getThemeColor("--app-muted-text", "#4b5563");
  const gridColor = "rgba(156, 163, 175, 0.22)";
  const maxGamesPlayed = Math.max(
    1,
    ...sortedData.map((item) => Number(item.gamesPlayed) || 0)
  );

  if (!sortedData.length) {
    return <p className="app-muted-text">No category performance yet.</p>;
  }

  const chartData = {
    datasets: sortedData.map((item, index) => {
      const gamesPlayed = Number(item.gamesPlayed) || 0;
      const radius = 8 + (gamesPlayed / maxGamesPlayed) * 18;

      return {
        label: item.categoryName,
        data: [
          {
            x: index + 1,
            y: clampPercent(item.avgScore),
            r: radius,
            gamesPlayed,
          },
        ],
        backgroundColor: "rgba(220, 38, 38, 0.38)",
        borderColor: "#dc2626",
        borderWidth: 1,
      };
    }),
  };

  const options = {
    animation: {
      duration: 450,
    },
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      tooltip: {
        callbacks: {
          label: (context) => {
            const point = context.raw;
            return `${context.dataset.label}: ${point.y}% (${point.gamesPlayed} played)`;
          },
        },
      },
    },
    scales: {
      x: {
        min: 0,
        max: sortedData.length + 1,
        grid: {
          color: gridColor,
        },
        ticks: {
          color: mutedColor,
          stepSize: 1,
          callback: (value) => {
            const item = sortedData[value - 1];
            return item ? item.categoryName.split(" ")[0] : "";
          },
        },
        title: {
          color: textColor,
          display: true,
          text: "Categories",
        },
      },
      y: {
        min: 0,
        max: 100,
        grid: {
          color: gridColor,
        },
        ticks: {
          color: mutedColor,
          callback: (value) => `${value}%`,
        },
        title: {
          color: textColor,
          display: true,
          text: "Accuracy",
        },
      },
    },
  };

  return (
    <div className="profile-chart-panel h-[360px] rounded border p-4">
      <Bubble data={chartData} options={options} />
    </div>
  );
}
