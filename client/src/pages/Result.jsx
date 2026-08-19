import React, { useEffect, useState } from "react";
import Categories from "../data/Categories";
import { useLocation, useNavigate } from "react-router-dom";
import Dropdown from "../components/Dropdown";
import { useDispatch, useSelector } from "react-redux";
import { leaderboardCall } from "../slice/leaderboardSlice";
import { leaderboards, loading, leaderboardError } from "../slice/leaderboardSlice";
import { allplayersCall } from "../slice/allplayersSlice";
import { allplayers, allplayersLoading, allplayersError } from "../slice/allplayersSlice";
import { LoadingSkeleton, TableLoadingSkeleton } from "../components/Skeliton.jsx";
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
  gamification,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [dateSort, setDateSort] = useState("newest");
  const [leaderboardQuestionCountFilter, setLeaderboardQuestionCountFilter] =
    useState("");
  const [tableCategoryFilter, setTableCategoryFilter] = useState(
    location.state?.category ?? category ?? ""
  );
  const [tableDifficultyFilter, setTableDifficultyFilter] = useState(
    location.state?.difficulty ?? difficulty ?? ""
  );
  const [tableQuestionCountFilter, setTableQuestionCountFilter] = useState("");
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
  const leadersError = useSelector(leaderboardError);
  const all = useSelector(allplayers);
  const allLoading = useSelector(allplayersLoading);
  const allError = useSelector(allplayersError);
  const savedScore = useSelector(insertedScore);
  const attemptId = location.state?.attemptId || savedScore?._id || "";
  const resultQuestionCount = Number(location.state?.questionCount || questionCount || 0);
  const maxScore = resultQuestionCount * 10;
  const safeScore = Math.min(Number(score || 0), maxScore || Number(score || 0));
  const correctAnswers = Math.min(
    resultQuestionCount,
    Math.round(safeScore / 10)
  );
  const accuracy = resultQuestionCount ? (correctAnswers / resultQuestionCount) * 100 : 0;
  const streak = gamification?.streak;
  const newAchievements = gamification?.newAchievements || [];

  useEffect(() => {
    setAlign(true);
    dispatch(leaderboardCall({ questionCount: leaderboardQuestionCountFilter }));
  }, [dispatch, leaderboardQuestionCountFilter, setAlign]);
  useEffect(() => {
    dispatch(
      allplayersCall({
        category: tableCategoryFilter,
        difficulty: tableDifficultyFilter,
        questionCount: tableQuestionCountFilter,
      })
    );
  }, [dispatch, tableCategoryFilter, tableDifficultyFilter, tableQuestionCountFilter]);
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
              {safeScore} / {maxScore}
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
              {correctAnswers} / {resultQuestionCount}
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
        {(streak || newAchievements.length > 0) && (
          <section className="mt-6 grid gap-4 lg:grid-cols-2">
            {streak && (
              <div className="leaderboard-card rounded border border-red-200 bg-red-600/10 p-5 text-center">
                <p className="text-sm font-bold uppercase text-red-600">Daily Streak</p>
                <h2 className="app-strong-text mt-2 text-2xl font-bold">
                  🔥 {streak.currentStreak} Day Streak
                </h2>
                <p className="app-muted-text mt-2 text-sm">
                  {streak.advancedToday
                    ? "You kept your streak alive!"
                    : "You already completed a quiz today."}
                </p>
              </div>
            )}
            {newAchievements.length > 0 && (
              <div className="leaderboard-card rounded border border-red-200 bg-red-600/10 p-5 text-center">
                <p className="text-sm font-bold uppercase text-red-600">
                  Achievement Unlocked!
                </p>
                <div className="mt-3 flex flex-wrap justify-center gap-3">
                  {newAchievements.map((achievement) => (
                    <div className="rounded border bg-white p-3 shadow-sm" key={achievement.id}>
                      <div className="text-3xl">{achievement.icon}</div>
                      <p className="app-strong-text mt-2 font-bold">{achievement.name}</p>
                      <p className="app-muted-text text-xs">{achievement.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
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
          ) : leadersError ? (
            <div className="w-full rounded border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700">
              Unable to load leaderboards. Please refresh the page.
            </div>
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
              state={tableCategoryFilter}
              setState={setTableCategoryFilter}
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
              state={tableDifficultyFilter}
              setState={setTableDifficultyFilter}
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
          {allLoading ? (
            <TableLoadingSkeleton />
          ) : allError ? (
            <div className="rounded border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700">
              Unable to load leaderboard grid. Please refresh the page.
            </div>
          ) : (
            <ResultTable data={all} itemsPerPage={5} dateSort={dateSort} />
          )}
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
