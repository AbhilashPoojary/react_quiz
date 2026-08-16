import React, { useEffect, useState } from "react";
import Categories from "../data/Categories";
import { useLocation, useNavigate } from "react-router-dom";
import Dropdown from "../components/Dropdown";
import { useDispatch, useSelector } from "react-redux";
import { leaderboardCall } from "../slice/leaderboardSlice";
import { leaderboards, loading } from "../slice/leaderboardSlice";
import { allplayersCall } from "../slice/allplayersSlice";
import { allplayers } from "../slice/allplayersSlice";
import { LoadingSkeleton } from "../components/Skeliton.jsx";
import LeaderBoards from "../components/LeaderBoards";
import ResultTable from "../components/ResultTable.jsx";
import { formatDuration } from "../utils/utilFunc";
import { insertedScore } from "../slice/insertScoreSlice";

export default function Result({
  name,
  score,
  setScore,
  setEnableTimer,
  setTimePerQuestion,
  setQuizData,
  setQuizIndex,
  setAlign,
  category,
  setCategoty,
  difficulty,
  setDifficulty,
  questionCount,
  timeConsumed,
  setTimeConsumed,
}) {
  const [dateSort, setDateSort] = useState("newest");
  const [leaderboardQuestionCountFilter, setLeaderboardQuestionCountFilter] =
    useState("");
  const [tableQuestionCountFilter, setTableQuestionCountFilter] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const redirectHome = () => {
    setAlign(false);
    setScore(0);
    setEnableTimer(true);
    setTimePerQuestion(10);
    setQuizData([]);
    setQuizIndex(0);
    setTimeConsumed(0);
    navigate("/info");
  };
  const dispatch = useDispatch();
  const leaders = useSelector(leaderboards);
  const leadersLoading = useSelector(loading);
  const all = useSelector(allplayers);
  const savedScore = useSelector(insertedScore);
  const attemptId = location.state?.attemptId || savedScore?._id || "";
  const maxScore = questionCount * 10;
  const correctAnswers = Math.round(score / 10);
  const accuracy = questionCount ? (correctAnswers / questionCount) * 100 : 0;

  useEffect(() => {
    setAlign(true);
    dispatch(leaderboardCall({ questionCount: leaderboardQuestionCountFilter }));
  }, [leaderboardQuestionCountFilter]);
  useEffect(() => {
    dispatch(
      allplayersCall({
        category,
        difficulty,
        questionCount: tableQuestionCountFilter,
      })
    );
  }, [category, difficulty, tableQuestionCountFilter]);
  return (
    <div>
      <div className="mt-6 border-b pb-10 text-center">
        <h1 className="app-strong-text text-xl font-semibold">
          Congratulations <span>{name}</span>
        </h1>
        <div className="mt-5 grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="leaderboard-card rounded border border-gray-200 bg-white p-4 text-left shadow">
            <p className="app-muted-text text-sm">Score</p>
            <p className="app-strong-text text-2xl font-bold">
              {score} / {maxScore}
            </p>
          </div>
          <div className="leaderboard-card rounded border border-gray-200 bg-white p-4 text-left shadow">
            <p className="app-muted-text text-sm">Accuracy</p>
            <p className="app-strong-text text-2xl font-bold">
              {Math.round(accuracy)}%
            </p>
          </div>
          <div className="leaderboard-card rounded border border-gray-200 bg-white p-4 text-left shadow">
            <p className="app-muted-text text-sm">Correct</p>
            <p className="app-strong-text text-2xl font-bold">
              {correctAnswers} / {questionCount}
            </p>
          </div>
          <div className="leaderboard-card rounded border border-gray-200 bg-white p-4 text-left shadow">
            <p className="app-muted-text text-sm">Time</p>
            <p className="app-strong-text text-2xl font-bold">
              {formatDuration(timeConsumed)}
            </p>
          </div>
        </div>
      </div>
      <div>
        <h1 className="mt-5 font-bold">Leaderboards</h1>
        <div className="mt-3 max-w-xs">
          <Dropdown
            data={[
              { category: "All", value: "" },
              { category: "10 Questions", value: 10 },
              { category: "15 Questions", value: 15 },
              { category: "20 Questions", value: 20 },
              { category: "25 Questions", value: 25 },
            ]}
            state={leaderboardQuestionCountFilter}
            setState={setLeaderboardQuestionCountFilter}
            dropdownId="leaderboard-question-count"
          />
        </div>
        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:justify-start">
          {leadersLoading ? (
            <LoadingSkeleton />
          ) : (
             <LeaderBoards leaders={leaders} /> 
          )}
        </div>
      </div>
      <div className="border-t mt-10">
        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-5 lg:items-end">
          <h1 className="font-bold text-xl lg:col-span-1 lg:mt-5">Leaderboards</h1>
          <div className="w-full">
            <Dropdown
              data={Categories}
              state={category}
              setState={setCategoty}
              dropdownId="result-category"
            />
          </div>
          <div className="w-full">
            <Dropdown
              data={[
                { category: "Select", value: null },
                { category: "Easy", value: "easy" },
                { category: "Medium", value: "medium" },
                { category: "Hard", value: "hard" },
              ]}
              state={difficulty}
              setState={setDifficulty}
              dropdownId="result-difficulty"
            />
          </div>
          <div className="w-full">
            <Dropdown
              data={[
                { category: "Newest First", value: "newest" },
                { category: "Oldest First", value: "oldest" },
              ]}
              state={dateSort}
              setState={setDateSort}
              dropdownId="result-date-sort"
            />
          </div>
          <div className="w-full">
            <Dropdown
              data={[
                { category: "All", value: "" },
                { category: "10 Questions", value: 10 },
                { category: "15 Questions", value: 15 },
                { category: "20 Questions", value: 20 },
                { category: "25 Questions", value: 25 },
              ]}
              state={tableQuestionCountFilter}
              setState={setTableQuestionCountFilter}
              dropdownId="result-question-count"
            />
          </div>
        </div>

        <div className="relative mt-2 w-full max-w-full overflow-x-auto">
          <ResultTable data={all} itemsPerPage={5} dateSort={dateSort} />
        </div>
      </div>
      <div className="mt-10 flex flex-col justify-stretch gap-3 sm:flex-row sm:justify-end">
        {attemptId && (
          <button
            className="w-full rounded border border-red-600 p-3 text-red-600 transition duration-300 ease-in-out hover:bg-red-50 sm:w-auto"
            onClick={() =>
              navigate(`/quiz-analysis/${attemptId}`, {
                state: { backTo: "/result", backLabel: "Back to Results" },
              })
            }
          >
            Analyze Answers
          </button>
        )}
        <button
          className="w-full rounded bg-red-600 p-3 text-white transition duration-300 ease-in-out hover:bg-red-800 sm:w-auto"
          onClick={redirectHome}
        >
          Back to home
        </button>
      </div>
    </div>
  );
}
