import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Medal, RefreshCw, Trophy } from "lucide-react";
import apiClient from "../utils/apiClient";

const formatNumber = (value) => new Intl.NumberFormat("en").format(Number(value) || 0);
const formatAccuracy = (value) => `${Number(value || 0).toFixed(1)}%`;
const difficultyMultiplier = {
  easy: 1,
  medium: 1.25,
  hard: 1.5,
};

const calculateLegacyPoints = (attempt) => {
  const multiplier =
    difficultyMultiplier[String(attempt?.difficulty || "").toLowerCase()] || 1;

  return Math.round((Number(attempt?.correctAnswers) || 0) * 10 * multiplier);
};

const normalizeLegacyLeaderboard = (attempts = []) => {
  const grouped = attempts.reduce((acc, attempt) => {
    const userId = attempt.userId || attempt._id;

    if (!userId) {
      return acc;
    }

    if (!acc[userId]) {
      acc[userId] = {
        userId,
        username: attempt.name || "Unknown Player",
        profileImage: attempt.profilePicture || "",
        leaderboardPoints: 0,
        totalQuizzes: 0,
        totalQuestions: 0,
        totalCorrectAnswers: 0,
      };
    }

    acc[userId].leaderboardPoints += calculateLegacyPoints(attempt);
    acc[userId].totalQuizzes += 1;
    acc[userId].totalQuestions += Number(attempt.questionCount) || 0;
    acc[userId].totalCorrectAnswers += Number(attempt.correctAnswers) || 0;

    return acc;
  }, {});

  return Object.values(grouped)
    .map((player) => ({
      ...player,
      accuracy: player.totalQuestions
        ? (player.totalCorrectAnswers / player.totalQuestions) * 100
        : 0,
    }))
    .sort((first, second) => second.leaderboardPoints - first.leaderboardPoints)
    .map((player, index) => ({ ...player, rank: index + 1 }));
};

const normalizeLeaderboardResponse = (data) => {
  if (Array.isArray(data)) {
    const leaders = normalizeLegacyLeaderboard(data);
    const currentUserId = JSON.parse(localStorage.getItem("currentUser") || "{}")
      ?.user?._id;

    return {
      leaders,
      currentUser:
        leaders.find((player) => player.userId === currentUserId) || null,
    };
  }

  return {
    leaders: Array.isArray(data?.leaders) ? data.leaders : [],
    currentUser: data?.currentUser || null,
  };
};

function LeaderboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div className="leaderboard-card rounded border p-5 text-center shadow" key={index}>
            <div className="mx-auto h-20 w-20 animate-pulse rounded-full bg-gray-300 dark:bg-gray-700" />
            <div className="mx-auto mt-4 h-5 w-28 animate-pulse rounded bg-gray-300 dark:bg-gray-700" />
            <div className="mx-auto mt-3 h-4 w-20 animate-pulse rounded bg-gray-300 dark:bg-gray-700" />
          </div>
        ))}
      </div>
      <section className="mt-8 rounded border-2 border-red-200 bg-red-600/10 p-5">
      <div className="h-3 w-20 animate-pulse rounded bg-red-200 dark:bg-red-900/60" />
      <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 shrink-0 animate-pulse rounded-full bg-red-200 dark:bg-red-900/60" />
          <div>
            <div className="h-5 w-32 animate-pulse rounded bg-gray-300 dark:bg-gray-700" />
            <div className="mt-2 h-4 w-24 animate-pulse rounded bg-gray-300 dark:bg-gray-700" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="h-4 w-16 animate-pulse rounded bg-gray-300 dark:bg-gray-700" />
            <div className="mt-2 h-4 w-12 animate-pulse rounded bg-gray-300 dark:bg-gray-700" />
          </div>
          <div>
            <div className="h-4 w-24 animate-pulse rounded bg-gray-300 dark:bg-gray-700" />
            <div className="mt-2 h-4 w-12 animate-pulse rounded bg-gray-300 dark:bg-gray-700" />
          </div>
        </div>
      </div>
    </section>
        
        {Array.from({ length: 5 }).map((_, index) => (
          <div className="flex items-center gap-4 border-b py-4 last:border-b-0" key={index}>
            <div className="h-6 w-8 animate-pulse rounded bg-gray-300 dark:bg-gray-700" />
            <div className="h-10 w-10 animate-pulse rounded-full bg-gray-300 dark:bg-gray-700" />
            <div className="h-4 flex-1 animate-pulse rounded bg-gray-300 dark:bg-gray-700" />
            <div className="h-4 w-20 animate-pulse rounded bg-gray-300 dark:bg-gray-700" />
          </div>
        ))}
      </div>
  );
}

function PlayerAvatar({ player, className = "h-14 w-14" }) {
  return (
    <img
      className={`${className} rounded-full border object-cover shadow-sm`}
      src={player.profileImage || "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg"}
      alt={player.username}
    />
  );
}

function TopPlayerCard({ player, medalLabel }) {
  return (
    <article className="leaderboard-card rounded border p-5 text-center shadow">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-sm font-bold text-white">
        #{player.rank}
      </div>
      <PlayerAvatar player={player} className="mx-auto h-20 w-20" />
      <p className="app-muted-text mt-3 text-xs font-semibold uppercase">{medalLabel}</p>
      <h2 className="app-strong-text mt-1 truncate text-lg font-bold">{player.username}</h2>
      <p className="mt-2 text-2xl font-bold text-red-600">
        {formatNumber(player.leaderboardPoints)} pts
      </p>
      <p className="app-muted-text mt-1 text-sm">
        {formatAccuracy(player.accuracy)} Accuracy
      </p>
    </article>
  );
}

function RankingMobileCard({ player }) {
  return (
    <article className="leaderboard-card rounded border p-4 shadow-sm md:hidden">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-600 text-sm font-bold text-white">
          #{player.rank}
        </div>
        <PlayerAvatar player={player} className="h-12 w-12" />
        <div className="min-w-0 flex-1">
          <h3 className="app-strong-text truncate font-semibold">{player.username}</h3>
          <p className="app-muted-text text-sm">{formatNumber(player.leaderboardPoints)} Points</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="app-muted-text">Accuracy</p>
          <p className="app-strong-text font-semibold">{formatAccuracy(player.accuracy)}</p>
        </div>
        <div>
          <p className="app-muted-text">Quizzes Played</p>
          <p className="app-strong-text font-semibold">{formatNumber(player.totalQuizzes)}</p>
        </div>
      </div>
    </article>
  );
}

function CurrentUserRankCard({ currentUser }) {
  if (!currentUser) {
    return null;
  }

  return (
    <section className="mt-5 rounded border-2 border-red-600 bg-red-600/10 p-5">
      <p className="text-xs font-bold uppercase text-red-600">Your Rank</p>
      <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-red-600 text-xl font-bold text-white">
            #{currentUser.rank}
          </div>
          <div>
            <h2 className="app-strong-text text-lg font-bold">{currentUser.username}</h2>
            <p className="app-muted-text text-sm">
              {formatNumber(currentUser.leaderboardPoints)} Points
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm sm:text-right">
          <div>
            <p className="app-muted-text">Accuracy</p>
            <p className="app-strong-text font-semibold">{formatAccuracy(currentUser.accuracy)}</p>
          </div>
          <div>
            <p className="app-muted-text">Quizzes Played</p>
            <p className="app-strong-text font-semibold">{formatNumber(currentUser.totalQuizzes)}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function GlobalLeaderboard({ setAlign }) {
  const [leaders, setLeaders] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const topThree = useMemo(() => leaders.slice(0, 3), [leaders]);
  const remainingLeaders = useMemo(() => leaders.slice(3), [leaders]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/api/leaderboard");
      const payload = normalizeLeaderboardResponse(response.data);
      setLeaders(payload.leaders);
      setCurrentUser(payload.currentUser);
      setError("");
    } catch (error) {
      setError(error?.response?.data?.error || "Unable to load global leaderboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setAlign(true);
  }, [setAlign]);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="app-strong-text flex items-center gap-2 text-2xl font-bold">
            <Trophy className="text-red-600" size={28} />
            Global Top Performers
          </h1>
          <p className="app-muted-text mt-1">Top players across all quizzes</p>
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 rounded border border-red-600 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
          disabled={loading}
          type="button"
          onClick={loadLeaderboard}
        >
          <RefreshCw className={loading ? "animate-spin" : ""} size={16} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-5 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <LeaderboardSkeleton />
      ) : leaders.length === 0 ? (
        <section className="rounded border p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-600/10 text-red-600">
            <Trophy size={30} />
          </div>
          <h2 className="app-strong-text mt-4 text-xl font-bold">
            The leaderboard is just getting started!
          </h2>
          <p className="app-muted-text mx-auto mt-2 max-w-md">
            Play quizzes and earn points to become one of the first Global Top Performers.
          </p>
          <Link
            className="mt-5 inline-flex items-center gap-2 rounded bg-red-600 px-5 py-3 text-white transition hover:bg-red-800"
            to="/info"
          >
            Play Quiz <ArrowRight size={16} />
          </Link>
        </section>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            {topThree.map((player, index) => (
              <TopPlayerCard
                key={player.userId}
                medalLabel={["Gold", "Silver", "Bronze"][index] || "Top Player"}
                player={player}
              />
            ))}
          </section>
          <CurrentUserRankCard currentUser={currentUser} />

          {remainingLeaders.length > 0 && (
            <section className="mt-5">
              <h2 className="app-strong-text mb-3 flex items-center gap-2 text-lg font-bold">
                <Medal size={20} />
                Rankings
              </h2>
              <div className="space-y-3 md:hidden">
                {remainingLeaders.map((player) => (
                  <RankingMobileCard key={player.userId} player={player} />
                ))}
              </div>
              <div className="hidden overflow-x-auto rounded border md:block">
                <table className="app-table w-full text-left text-sm">
                  <thead className="app-table-head bg-gray-50 text-xs uppercase text-gray-700">
                    <tr>
                      <th className="px-4 py-3">Rank</th>
                      <th className="px-4 py-3">Player</th>
                      <th className="px-4 py-3">Points</th>
                      <th className="px-4 py-3">Accuracy</th>
                      <th className="px-4 py-3">Quizzes Played</th>
                    </tr>
                  </thead>
                  <tbody>
                    {remainingLeaders.map((player) => (
                      <tr className="app-table-row border-b" key={player.userId}>
                        <td className="px-4 py-4 font-bold">#{player.rank}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <PlayerAvatar player={player} className="h-10 w-10" />
                            <span className="app-strong-text font-semibold">
                              {player.username}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">{formatNumber(player.leaderboardPoints)}</td>
                        <td className="px-4 py-4">{formatAccuracy(player.accuracy)}</td>
                        <td className="px-4 py-4">{formatNumber(player.totalQuizzes)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
