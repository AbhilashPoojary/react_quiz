import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Flame, Trophy } from "lucide-react";
import apiClient from "../utils/apiClient";

const weekDays = ["M", "T", "W", "T", "F", "S", "S"];

const getWeekdayIndexFromDateKey = (dateKey) => {
  if (!dateKey) {
    return null;
  }

  const [year, month, day] = String(dateKey).split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return (new Date(year, month - 1, day).getDay() + 6) % 7;
};

const getActiveStreakIndexes = (streak = {}) => {
  const {
    currentStreak = 0,
    completedToday = false,
    lastCompletedDate = "",
  } = streak || {};
  const todayIndex = (new Date().getDay() + 6) % 7;
  const anchorIndex = completedToday
    ? todayIndex
    : getWeekdayIndexFromDateKey(lastCompletedDate);
  const activeCount = Math.min(7, Number(currentStreak) || 0);

  if (anchorIndex === null || activeCount <= 0) {
    return new Set();
  }

  return new Set(
    Array.from({ length: activeCount }).map((_, offset) =>
      (anchorIndex - offset + 7) % 7
    )
  );
};

export default function GamificationSummary() {
  const [streak, setStreak] = useState(null);
  const [achievements, setAchievements] = useState(null);

  useEffect(() => {
    let mounted = true;

    const loadGamification = async () => {
      try {
        const [streakResponse, achievementResponse] = await Promise.all([
          apiClient.get("/api/users/me/streak"),
          apiClient.get("/api/achievements"),
        ]);

        if (!mounted) {
          return;
        }

        setStreak(streakResponse.data);
        setAchievements(achievementResponse.data);
      } catch (error) {
        if (mounted) {
          setStreak({ currentStreak: 0, longestStreak: 0, completedToday: false });
          setAchievements({ total: 0, unlocked: 0, achievements: [] });
        }
      }
    };

    loadGamification();

    return () => {
      mounted = false;
    };
  }, []);

  const unlockedPreview = (achievements?.achievements || []).slice(0, 8);
  const activeStreakIndexes = getActiveStreakIndexes(streak);

  return (
    <section className="mb-5 grid gap-4 lg:grid-cols-2">
      <div className="leaderboard-card rounded border p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="app-muted-text text-xs font-bold uppercase">Daily Streak</p>
            {streak ? (
              <h2 className="app-strong-text mt-1 flex items-center gap-2 text-xl font-bold">
                <Flame className="text-red-600" size={22} />
                {streak.currentStreak || 0} Day Streak
              </h2>
            ) : (
              <div className="mt-2 h-6 w-36 animate-pulse rounded bg-gray-300 dark:bg-gray-700" />
            )}
          </div>
          <Flame className="text-red-600" />
        </div>
        <div className="mt-4 grid grid-cols-7 gap-2 text-center text-xs">
          {weekDays.map((day, index) => {
            const active = activeStreakIndexes.has(index);

            return (
              <div key={`${day}-${index}`}>
                <p className="app-muted-text font-semibold">{day}</p>
                <div
                  className={`mt-1 flex h-7 items-center justify-center rounded ${
                    active ? "bg-red-600 text-white" : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {active ? "✓" : "•"}
                </div>
              </div>
            );
          })}
        </div>
        <p className="app-muted-text mt-3 text-sm">
          {streak?.completedToday ? "You kept it alive today." : "Play today to keep it going."}
        </p>
      </div>

      <div className="leaderboard-card rounded border p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="app-muted-text text-xs font-bold uppercase">Achievements</p>
            {achievements ? (
              <h2 className="app-strong-text mt-1 text-xl font-bold">
                {achievements.unlocked || 0} / {achievements.total || 0} Unlocked
              </h2>
            ) : (
              <div className="mt-2 h-6 w-36 animate-pulse rounded bg-gray-300 dark:bg-gray-700" />
            )}
          </div>
          <Trophy className="text-red-600" />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {achievements
            ? unlockedPreview.map((achievement) => (
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded border text-lg ${
                    achievement.unlocked ? "bg-red-600/10" : "opacity-40"
                  }`}
                  key={achievement.id}
                  title={achievement.name}
                >
                  {achievement.unlocked ? achievement.icon : "🔒"}
                </span>
              ))
            : Array.from({ length: 8 }).map((_, index) => (
                <span className="h-9 w-9 animate-pulse rounded bg-gray-300 dark:bg-gray-700" key={index} />
              ))}
        </div>
        <Link
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-red-600"
          to="/profile/achievements"
        >
          View All <ArrowRight size={15} />
        </Link>
      </div>
    </section>
  );
}
