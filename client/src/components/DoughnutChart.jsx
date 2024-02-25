import React from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip);

export function DoughnutChart({ dataVal, categories }) {
  const colors = [
    "rgba(255, 99, 132, 0.2)",
    "rgba(54, 162, 235, 0.2)",
    "rgba(255, 206, 86, 0.2)",
    "rgba(75, 192, 192, 0.2)",
    "rgba(153, 102, 255, 0.2)",
    "rgba(255, 159, 64, 0.2)",
    "rgba(255, 0, 0, 0.2)",
    "rgba(0, 255, 0, 0.2)",
    "rgba(0, 0, 255, 0.2)",
    "rgba(255, 255, 0, 0.2)",
    "rgba(255, 0, 255, 0.2)",
    "rgba(0, 255, 255, 0.2)",
    "rgba(128, 0, 0, 0.2)",
    "rgba(0, 128, 0, 0.2)",
    "rgba(0, 0, 128, 0.2)",
    "rgba(128, 128, 0, 0.2)",
    "rgba(128, 0, 128, 0.2)",
    "rgba(0, 128, 128, 0.2)",
    "rgba(192, 192, 192, 0.2)",
    "rgba(128, 128, 128, 0.2)",
    "rgba(255, 165, 0, 0.2)",
    "rgba(0, 255, 128, 0.2)",
    "rgba(255, 0, 128, 0.2)",
    "rgba(128, 0, 255, 0.2)",
  ];
  const bColor = [];
  for (let i = 0; i < colors.length; i++) {
    bColor.push(colors[i].replace("0.2", "1"));
  }
  console.log(dataVal, categories);
  const data = {
    labels: categories,
    datasets: [
      {
        label: "Difficulty",
        data: dataVal,
        backgroundColor: colors,
        borderColor: bColor,
        borderWidth: 1,
      },
    ],
  };
  return <Doughnut className="mx-auto" data={data} />;
}
