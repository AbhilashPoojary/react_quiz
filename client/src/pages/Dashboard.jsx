import React, { useEffect } from "react";
import { DoughnutChart } from "../components/DoughnutChart";
import { User, Hash, Dices, Hourglass } from "lucide-react";
import Categories from "../data/Categories";

export default function Dashboard({ setAlign }) {
  useEffect(() => {
    setAlign(true);
  }, []);
  return (
    <div className="dashboard">
      <h1 className="text-center m-4 text-xl">Dashboard</h1>
      <hr />
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="flex min-h-[150px] flex-col items-center justify-center rounded border bg-[#1D5978] p-2 text-white sm:min-h-[180px]">
          <User size={48} />
          <h1 className="text-lg font-semibold">100 Users</h1>
        </div>
        <div className="flex min-h-[150px] flex-col items-center justify-center rounded border bg-[#3AA7BA] p-2 text-white sm:min-h-[180px]">
          <Hash size={48} />
          <h1 className="text-lg font-semibold">350 total quiz</h1>
        </div>
        <div className="flex min-h-[150px] flex-col items-center justify-center rounded border bg-[#F2CA3A] p-2 text-white sm:min-h-[180px]">
          <Dices size={48} />
          <h1 className="text-lg font-semibold">50 Average score</h1>
        </div>
        <div className="flex min-h-[150px] flex-col items-center justify-center rounded border bg-[#64CCC5] p-2 text-white sm:min-h-[180px]">
          <Hourglass size={48} />
          <h1 className="text-lg font-semibold">50 Average time</h1>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="dashboard-chart-card mx-auto w-full overflow-hidden rounded border p-2 text-center">
          <h1 className="app-strong-text mb-2">Difficulty wise report</h1>
          <DoughnutChart
            dataVal={[60, 30, 10]}
            categories={["Easy,Medium,Hard"]}
          />
        </div>
        <div className="dashboard-chart-card mx-auto w-full overflow-hidden rounded border p-2 text-center">
          <h1 className="app-strong-text mb-2">Category wise report</h1>
          <DoughnutChart
            dataVal={Array.from({ length: 24 }, () => 4.1666)}
            categories={Categories.map((item) => item.category).filter(
              (item) => item !== "Select"
            )}
          />
        </div>
      </div>
    </div>
  );
}
