import React, { useEffect, useState } from "react";
import { UserCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import apiClient from "../utils/apiClient";
import CategoryBarChart from "../components/CategoryBarChart";
import CategoryBubbleChart from "../components/CategoryBubbleChart";
import CategoryHeatmap from "../components/CategoryHeatmap";
import CategoryPolarAreaChart from "../components/CategoryPolarAreaChart";
import CategoryProgress from "../components/CategoryProgress";
import CategoryRadarChart from "../components/CategoryRadarChart";
import Dropdown from "../components/Dropdown";

const emptyProfile = {
  user: {},
  stats: {
    gamesPlayed: 0,
    highestScore: 0,
    avgScore: 0,
    accuracy: 0,
  },
  performanceByCategory: [],
  recentHistory: [],
  challengeHistory: [],
};

const formatDate = (date) => {
  if (!date) {
    return "-";
  }

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
};

function MyProfileSkeleton() {
  return (
    <div className="profile-page mx-auto w-full max-w-5xl">
      <div className="border-b pb-5 text-center">
        <div className="mx-auto mb-3 h-16 w-16 animate-pulse rounded-full bg-gray-300" />
        <div className="mx-auto h-7 w-40 animate-pulse rounded bg-gray-300" />
      </div>

      <div className="grid grid-cols-1 gap-4 border-b py-5 sm:grid-cols-2">
        <div>
          <div className="mb-2 h-4 w-14 animate-pulse rounded bg-gray-300" />
          <div className="h-5 w-40 animate-pulse rounded bg-gray-300" />
        </div>
        <div>
          <div className="mb-2 h-4 w-14 animate-pulse rounded bg-gray-300" />
          <div className="h-5 w-56 max-w-full animate-pulse rounded bg-gray-300" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 border-b py-5 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div className="profile-stat-card rounded border p-4" key={index}>
            <div className="mx-auto mb-3 h-4 w-20 animate-pulse rounded bg-gray-300" />
            <div className="mx-auto h-8 w-12 animate-pulse rounded bg-gray-300" />
          </div>
        ))}
      </div>

      <section className="border-b py-5">
        <div className="mb-5 h-6 w-56 animate-pulse rounded bg-gray-300" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index}>
              <div className="mb-2 flex justify-between gap-3">
                <div className="h-4 w-40 animate-pulse rounded bg-gray-300" />
                <div className="h-4 w-10 animate-pulse rounded bg-gray-300" />
              </div>
              <div className="h-3 w-full animate-pulse rounded-full bg-gray-300" />
            </div>
          ))}
        </div>
      </section>

      <section className="py-5">
        <div className="mb-4 h-6 w-44 animate-pulse rounded bg-gray-300" />
        <div className="overflow-hidden rounded border">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              className="grid grid-cols-5 gap-3 border-b p-4 last:border-b-0"
              key={index}
            >
              {Array.from({ length: 5 }).map((__, cellIndex) => (
                <div
                  className="h-4 animate-pulse rounded bg-gray-300"
                  key={cellIndex}
                />
              ))}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function MyProfile({ setAlign }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [categoryView, setCategoryView] = useState("progress");

  useEffect(() => {
    setAlign(true);
  }, [setAlign]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get("/api/profile");
        setProfile(response.data);
        setError("");
      } catch (error) {
        setError(error?.response?.data?.error || "Unable to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return <MyProfileSkeleton />;
  }

  if (error) {
    return <div className="py-10 text-center text-red-600">{error}</div>;
  }

  const {
    user,
    stats,
    performanceByCategory,
    recentHistory,
    challengeHistory = [],
  } = profile;
  const categoryViewOptions = [
    { category: "Progress", value: "progress" },
    { category: "Bar Chart", value: "bar" },
    { category: "Radar Chart", value: "radar" },
    { category: "Heatmap", value: "heatmap" },
    { category: "Bubble Chart", value: "bubble" },
    { category: "Polar Area Chart", value: "polar" },
  ];

  const renderCategoryPerformance = () => {
    if (categoryView === "bar") {
      return <CategoryBarChart data={performanceByCategory} />;
    }

    if (categoryView === "radar") {
      return <CategoryRadarChart data={performanceByCategory} />;
    }

    if (categoryView === "heatmap") {
      return <CategoryHeatmap data={performanceByCategory} />;
    }

    if (categoryView === "bubble") {
      return <CategoryBubbleChart data={performanceByCategory} />;
    }

    if (categoryView === "polar") {
      return <CategoryPolarAreaChart data={performanceByCategory} />;
    }

    return <CategoryProgress data={performanceByCategory} />;
  };

  return (
    <div className="profile-page mx-auto w-full max-w-5xl">
      <div className="border-b pb-5 text-center">
        <div className="mx-auto my-4 flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-gray-200">
          {user.profilePicture ? (
            <img
              src={user.profilePicture}
              alt={user.name}
              className="h-full w-full object-cover mt-1"
            />
          ) : (
            <UserCircle size={48} />
          )}
        </div>
        <h1 className="app-strong-text text-2xl font-bold">My Profile</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 border-b py-5 sm:grid-cols-2">
        <div>
          <p className="app-muted-text text-sm">Name</p>
          <p className="app-strong-text break-words font-semibold">{user.name}</p>
        </div>
        <div>
          <p className="app-muted-text text-sm">Email</p>
          <p className="app-strong-text break-words font-semibold">{user.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 py-5 md:grid-cols-4">
        <div className="profile-stat-card rounded border p-4 text-center">
          <p className="app-muted-text text-sm">Games Played</p>
          <p className="app-strong-text text-2xl font-bold">{stats.gamesPlayed}</p>
        </div>
        <div className="profile-stat-card rounded border p-4 text-center">
          <p className="app-muted-text text-sm">Highest Score</p>
          <p className="app-strong-text text-2xl font-bold">{stats.highestScore}</p>
        </div>
        <div className="profile-stat-card rounded border p-4 text-center">
          <p className="app-muted-text text-sm">Avg Score</p>
          <p className="app-strong-text text-2xl font-bold">{stats.avgScore}</p>
        </div>
        <div className="profile-stat-card rounded border p-4 text-center">
          <p className="app-muted-text text-sm">Accuracy</p>
          <p className="app-strong-text text-2xl font-bold">{stats.accuracy}%</p>
        </div>
      </div>

      <section className="border p-5 rounded">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="app-strong-text text-lg font-bold">
            Performance by Category
          </h2>
          <div className="w-full sm:w-56">
            <Dropdown
              data={categoryViewOptions}
              state={categoryView}
              setState={setCategoryView}
              dropdownId="profile-category-view"
            />
          </div>
        </div>
        <div className="profile-performance-view" key={categoryView}>
          {renderCategoryPerformance()}
        </div>
      </section>

      <section className="py-5">
        <h2 className="app-strong-text mb-4 text-lg font-bold">
          Recent Quiz History
        </h2>
        <div className="overflow-x-auto">
          <table className="app-table min-w-[620px] w-full border text-left text-sm">
            <thead className="app-table-head">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Difficulty</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Analysis</th>
              </tr>
            </thead>
            <tbody>
              {recentHistory.length > 0 ? (
                recentHistory.map((item) => (
                  <tr className="app-table-row border-t" key={item._id}>
                    <td className="px-4 py-3">{formatDate(item.createdAt)}</td>
                    <td className="px-4 py-3">{item.categoryName}</td>
                    <td className="px-4 py-3 capitalize">{item.difficulty}</td>
                    <td className="px-4 py-3">{item.score}</td>
                    <td className="px-4 py-3">{item.totalTime} secs</td>
                    <td className="px-4 py-3">
                      <button
                        className="rounded border border-red-600 px-3 py-1 text-sm text-red-600 transition hover:bg-red-50"
                        type="button"
                        onClick={() =>
                          navigate(`/quiz-analysis/${item._id}`, {
                            state: {
                              backTo: "/profile",
                              backLabel: "Back to Profile",
                            },
                          })
                        }
                      >
                        Analyze
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="app-table-row border-t">
                  <td className="px-4 py-4 text-center" colSpan={6}>
                    No recent quiz history.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="border-t py-5">
        <h2 className="app-strong-text mb-4 text-lg font-bold">
          Challenge History
        </h2>
        <div className="overflow-x-auto">
          <table className="app-table min-w-[760px] w-full border text-left text-sm">
            <thead className="app-table-head">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Difficulty</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {challengeHistory.length > 0 ? (
                challengeHistory.map((item) => {
                  const canPlay =
                    !item.hasCompleted &&
                    !["COMPLETED", "CANCELLED", "EXPIRED"].includes(
                      item.status
                    );

                  return (
                    <tr className="app-table-row border-t" key={item._id}>
                      <td className="px-4 py-3">{formatDate(item.createdAt)}</td>
                      <td className="px-4 py-3 font-semibold">
                        {item.challengeCode}
                      </td>
                      <td className="px-4 py-3">{item.categoryName}</td>
                      <td className="px-4 py-3 capitalize">
                        {item.difficulty}
                      </td>
                      <td className="px-4 py-3">
                        {item.status} ({item.completedCount}/
                        {Math.max(2, item.participantCount)})
                      </td>
                      <td className="px-4 py-3">
                        {item.hasCompleted
                          ? `${item.score} / ${item.maxScore}`
                          : "-"}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          className={
                            canPlay
                              ? "rounded bg-red-600 px-3 py-1 text-sm text-white transition hover:bg-red-800"
                              : "analysis-outline-button rounded border border-red-600 px-3 py-1 text-sm text-red-600 transition"
                          }
                          type="button"
                          onClick={() =>
                            navigate(
                              canPlay
                                ? `/challenge/${item.challengeCode}/play`
                                : `/challenge/${item.challengeCode}/results`
                            )
                          }
                        >
                          {canPlay ? "Play" : "View Results"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr className="app-table-row border-t">
                  <td className="px-4 py-4 text-center" colSpan={7}>
                    No challenge history yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
