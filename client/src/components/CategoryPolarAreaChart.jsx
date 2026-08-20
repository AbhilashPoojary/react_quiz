import React, { useMemo } from "react";
import {
  ArcElement,
  Chart as ChartJS,
  PolarAreaController,
  RadialLinearScale,
  Tooltip,
} from "chart.js";
import { PolarArea } from "react-chartjs-2";

ChartJS.register(PolarAreaController, RadialLinearScale, ArcElement, Tooltip);

const colors = [
  "rgba(220, 38, 38, 0.7)",
  "rgba(239, 68, 68, 0.62)",
  "rgba(248, 113, 113, 0.58)",
  "rgba(185, 28, 28, 0.62)",
  "rgba(153, 27, 27, 0.58)",
  "rgba(252, 165, 165, 0.72)",
  "rgba(127, 29, 29, 0.56)",
  "rgba(254, 202, 202, 0.78)",
];

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

export default function CategoryPolarAreaChart({ data }) {
  const polarData = useMemo(
    () => [...data].sort((a, b) => b.avgScore - a.avgScore).slice(0, 8),
    [data]
  );

  const textColor = getThemeColor("--app-text", "#111827");
  const mutedColor = getThemeColor("--app-muted-text", "#4b5563");
  const gridColor = "rgba(156, 163, 175, 0.26)";

  if (!polarData.length) {
    return <p className="app-muted-text">No category performance yet.</p>;
  }

  const chartData = {
    labels: polarData.map((item) => item.categoryName),
    datasets: [
      {
        label: "Accuracy",
        data: polarData.map((item) => clampPercent(item.avgScore)),
        backgroundColor: polarData.map((_, index) => colors[index % colors.length]),
        borderColor: "#dc2626",
        borderWidth: 1,
      },
    ],
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
          label: (context) => `${context.label}: ${context.raw}%`,
        },
      },
    },
    scales: {
      r: {
        min: 0,
        max: 100,
        grid: {
          color: gridColor,
        },
        ticks: {
          backdropColor: "transparent",
          color: mutedColor,
          callback: (value) => `${value}%`,
        },
        pointLabels: {
          color: textColor,
        },
      },
    },
  };

  return (
    <div className="profile-chart-panel h-[360px] rounded border p-4">
      <PolarArea data={chartData} options={options} />
    </div>
  );
}
