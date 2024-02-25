import React, { useEffect, useState } from "react";
import Categories from "../data/Categories";
import { useNavigate } from "react-router-dom";
import Dropdown from "../components/Dropdown";
import { useDispatch, useSelector } from "react-redux";
import { leaderboardCall } from "../slice/leaderboardSlice";
import { leaderboards, loading } from "../slice/leaderboardSlice";
import { allplayersCall } from "../slice/allplayersSlice";
import { allplayers } from "../slice/allplayersSlice";
import { LoadingSkeleton } from "../components/Skeliton.jsx";
import LeaderBoards from "../components/LeaderBoards";
import ResultTable from "../components/ResultTable.jsx";

export default function Result({
  name,
  score,
  setScore,
  setEnableTimer,
  setQuizData,
  setQuizIndex,
  setAlign,
  category,
  setCategoty,
  difficulty,
  setDifficulty,
}) {
  const navigate = useNavigate();
  const redirectHome = () => {
    setAlign(false);
    setScore(0);
    setEnableTimer(false);
    setQuizData([]);
    setQuizIndex(0);
    navigate("/info");
  };
  const dispatch = useDispatch();
  const leaders = useSelector(leaderboards);
  const leadersLoading = useSelector(loading);
  const all = useSelector(allplayers);
  useEffect(() => {
    setAlign(true);
    dispatch(leaderboardCall());
  }, []);
  useEffect(() => {
    dispatch(allplayersCall({ category, difficulty }));
  }, [category, difficulty]);
  return (
    <div>
      <h1 className="text-center mt-10 border-b pb-10">
        Congratulations <span className="font-semibold">{name}</span> you have
        score is <span className="font-semibold">{score}</span>
      </h1>
      <div>
        <h1 className="mt-5 font-bold">Leaderboards</h1>
        <div className="flex justify-between gap-5 mt-5">
          {leadersLoading ? (
            <LoadingSkeleton />
          ) : (
            <LeaderBoards leaders={leaders} />
          )}
        </div>
      </div>
      <div className="border-t mt-10">
        <div className="flex justify-between gap-2 mt-3">
          <h1 className="mt-5 w-2/4 font-bold">Leaderboards category wise</h1>
          <div className="w-1/4">
            <Dropdown
              data={Categories}
              state={category}
              setState={setCategoty}
            />
          </div>
          <div className="w-1/4">
            <Dropdown
              data={[
                { category: "Select", value: null },
                { category: "Easy", value: "easy" },
                { category: "Medium", value: "medium" },
                { category: "Hard", value: "hard" },
              ]}
              state={difficulty}
              setState={setDifficulty}
            />
          </div>
        </div>

        <div className="relative overflow-x-auto mt-2">
          <ResultTable data={all} itemsPerPage={5} />
        </div>
      </div>
      <div className="flex justify-end mt-10">
        <button
          className="bg-red-600 hover:bg-red-800 transition duration-300 ease-in-out rounded p-3 text-white"
          onClick={redirectHome}
        >
          Back to home
        </button>
      </div>
    </div>
  );
}
