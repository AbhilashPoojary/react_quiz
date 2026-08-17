import React, { useEffect, useState } from "react";
import { ArrowLeft, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import apiClient from "../utils/apiClient";

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("en", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(value))
    : "";

function ProgressBar({ progress, target }) {
  const percentage = target ? Math.min(100, (progress / target) * 100) : 0;

  return (
    <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200">
      <div className="h-full rounded-full bg-red-600" style={{ width: `${percentage}%` }} />
    </div>
  );
}

export default function Achievements({ setAlign }) {
  const navigate = useNavigate();
  const [payload, setPayload] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setAlign(true);
  }, [setAlign]);

  useEffect(() => {
    const loadAchievements = async () => {
      try {
        const response = await apiClient.get("/api/achievements");
        setPayload(response.data);
      } catch (error) {
        setError(error?.response?.data?.error || "Unable to load achievements");
      }
    };

    loadAchievements();
  }, []);

  return (
    <div className="pt-4 sm:pt-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="app-strong-text flex items-center gap-2 text-2xl font-bold">
            <Trophy className="text-red-600" />
            Achievements
          </h1>
          <p className="app-muted-text mt-1">
            {payload ? `${payload.unlocked} / ${payload.total} Unlocked` : "Loading achievements..."}
          </p>
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 rounded border border-red-600 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
          type="button"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={16} />
          Back
        </button>
      </div>

      {error && <div className="mb-4 rounded border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}

      {!payload ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div className="leaderboard-card rounded border p-4" key={index}>
              <div className="h-8 w-8 animate-pulse rounded bg-gray-300" />
              <div className="mt-3 h-5 w-40 animate-pulse rounded bg-gray-300" />
              <div className="mt-2 h-4 w-full animate-pulse rounded bg-gray-300" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {payload.achievements.map((achievement) => (
            <article className="leaderboard-card rounded border p-4" key={achievement.id}>
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-red-600/10 text-2xl">
                  {achievement.unlocked ? achievement.icon : "🔒"}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="app-strong-text font-bold">{achievement.name}</h2>
                  <p className="app-muted-text mt-1 text-sm">{achievement.description}</p>
                  {achievement.unlocked ? (
                    <p className="mt-3 text-sm font-semibold text-green-600">
                      ✓ Unlocked {formatDate(achievement.unlockedAt)}
                    </p>
                  ) : (
                    <>
                      <ProgressBar progress={achievement.progress} target={achievement.target} />
                      <p className="app-muted-text mt-2 text-sm">
                        {achievement.progress} / {achievement.target}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
