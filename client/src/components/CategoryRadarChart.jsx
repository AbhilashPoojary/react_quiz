import React, { useMemo } from "react";
import {
  Chart as ChartJS,
  Filler,
  LineElement,
  PointElement,
  RadialLinearScale,
  Tooltip,
} from "chart.js";
import { Radar } from "react-chartjs-2";

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip);

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

export default function CategoryRadarChart({ data }) {
  const radarData = useMemo(() => {
    const mostPlayed = [...data]
      .sort((a, b) => b.gamesPlayed - a.gamesPlayed || b.avgScore - a.avgScore)
      .slice(0, 8);

    return mostPlayed.sort((a, b) => b.avgScore - a.avgScore);
  }, [data]);

  const textColor = getThemeColor("--app-text", "#111827");
  const mutedColor = getThemeColor("--app-muted-text", "#4b5563");
  const gridColor = "rgba(156, 163, 175, 0.28)";

  if (!radarData.length) {
    return <p className="app-muted-text">No category performance yet.</p>;
  }

  const chartData = {
    labels: radarData.map((item) => item.categoryName),
    datasets: [
      {
        label: "Accuracy",
        data: radarData.map((item) => clampPercent(item.avgScore)),
        backgroundColor: "rgba(220, 38, 38, 0.18)",
        borderColor: "#dc2626",
        borderWidth: 2,
        pointBackgroundColor: "#dc2626",
        pointBorderColor: "#ffffff",
        pointHoverBackgroundColor: "#ffffff",
        pointHoverBorderColor: "#dc2626",
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
          label: (context) =>
            `${context.label}: ${context.parsed.r || context.raw}%`,
        },
      },
    },
    scales: {
      r: {
        min: 0,
        max: 100,
        angleLines: {
          color: gridColor,
        },
        grid: {
          color: gridColor,
        },
        pointLabels: {
          color: textColor,
          font: {
            size: 12,
          },
        },
        ticks: {
          backdropColor: "transparent",
          color: mutedColor,
          callback: (value) => `${value}%`,
          stepSize: 20,
        },
      },
    },
  };

  return (
    <div className="profile-chart-panel h-[360px] rounded border p-4">
      <Radar data={chartData} options={options} />
    </div>
  );
}
