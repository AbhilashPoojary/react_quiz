import React, { useMemo } from "react";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  LinearScale,
  Tooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip);

const getThemeColor = (name, fallback) => {
  if (typeof window === "undefined") {
    return fallback;
  }

  return (
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() ||
    fallback
  );
};

export default function CategoryBarChart({ data }) {
  const sortedData = useMemo(
    () => [...data].sort((a, b) => b.avgScore - a.avgScore),
    [data]
  );

  const textColor = getThemeColor("--app-text", "#111827");
  const mutedColor = getThemeColor("--app-muted-text", "#4b5563");
  const gridColor = "rgba(156, 163, 175, 0.22)";

  if (!sortedData.length) {
    return <p className="app-muted-text">No category performance yet.</p>;
  }

  const chartData = {
    labels: sortedData.map((item) => item.categoryName),
    datasets: [
      {
        label: "Accuracy",
        data: sortedData.map((item) => item.avgScore),
        backgroundColor: "rgba(220, 38, 38, 0.78)",
        borderColor: "#dc2626",
        borderRadius: 6,
        borderWidth: 1,
      },
    ],
  };

  const options = {
    animation: {
      duration: 450,
    },
    indexAxis: "y",
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      tooltip: {
        callbacks: {
          label: (context) => `${context.label}: ${context.parsed.x}%`,
        },
      },
    },
    scales: {
      x: {
        min: 0,
        max: 100,
        grid: {
          color: gridColor,
        },
        ticks: {
          color: mutedColor,
          callback: (value) => `${value}%`,
        },
      },
      y: {
        grid: {
          display: false,
        },
        ticks: {
          color: textColor,
        },
      },
    },
  };

  return (
    <div className="profile-chart-panel h-[320px] rounded border p-4">
      <Bar data={chartData} options={options} />
    </div>
  );
}
