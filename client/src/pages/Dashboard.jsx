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
      <div className="flex gap-12 mt-4">
        <div className="border rounded p-2 bg-[#1D5978] text-white w-1/4 h-[200px] flex flex-col justify-center items-center align-middle">
          <User size={48} />
          <h1 className="text-lg font-semibold">100 Users</h1>
        </div>
        <div className="border rounded p-2 bg-[#3AA7BA] text-white w-1/4 h-[200px] flex flex-col justify-center items-center">
          <Hash size={48} />
          <h1 className="text-lg font-semibold">350 total quiz</h1>
        </div>
        <div className="border rounded p-2 bg-[#F2CA3A] text-white w-1/4 h-[200px] flex flex-col justify-center items-center">
          <Dices size={48} />
          <h1 className="text-lg font-semibold">50 Average score</h1>
        </div>
        <div className="border rounded p-2 bg-[#64CCC5] text-white w-1/4 h-[200px] flex flex-col justify-center items-center">
          <Hourglass size={48} />
          <h1 className="text-lg font-semibold">50 Average time</h1>
        </div>
      </div>

      <div className="flex mt-4 justify-between gap-2">
        <div className="w-1/2 overflow-hidden text-center mx-auto border rounded p-2">
          <h1 className="mb-2">Difficulty wise report</h1>
          <DoughnutChart
            dataVal={[60, 30, 10]}
            categories={["Easy,Medium,Hard"]}
          />
        </div>
        <div className="w-1/2 overflow-hidden text-center mx-auto border rounded p-2">
          <h1 className="mb-2">Category wise report</h1>
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
