import React, { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { Award, Medal, Trophy, Users } from "lucide-react";
import apiClient from "../utils/apiClient";

export default function EventResult({ setAlign }) {
  const location = useLocation();
  const { id } = useParams();
  const [resultData, setResultData] = useState(location.state?.result || null);
  const [loading, setLoading] = useState(!location.state?.result);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setAlign(true);
  }, [setAlign]);

  useEffect(() => {
    const loadResult = async () => {
      try {
        setLoading(!resultData);
        const response = await apiClient.get(`/api/events/${id}/result`);
        setResultData(response.data);
      } catch (error) {
        setMessage(error?.response?.data?.error || "Unable to load result");
      } finally {
        setLoading(false);
      }
    };

    loadResult();
  }, [id]);

  const result = resultData?.result || resultData;
  const event = resultData?.event;
  const leaderboard = resultData?.leaderboard || [];
  const rank = resultData?.rank;
  const participantCount = resultData?.participantCount || leaderboard.length;
  const currentUserEntry = resultData?.currentUserEntry;

  const formatTime = (seconds) => {
    const minutes = Math.floor(Number(seconds || 0) / 60);
    const remaining = Number(seconds || 0) % 60;

    return `${String(minutes).padStart(2, "0")}:${String(remaining).padStart(
      2,
      "0"
    )}`;
  };

  if (loading) {
    return <div className="app-muted-text py-10 text-center">Loading result...</div>;
  }

  return (
    <div className="mx-auto max-w-5xl py-10">
      <div className="mb-6 text-center">
        <h1 className="app-strong-text mb-2 text-2xl font-bold">Event Result</h1>
        {event && (
          <p className="app-muted-text">
            {event.eventName} • {event.categoryName} • {event.difficulty}
          </p>
        )}
      </div>
      {result ? (
        <>
          <p className="app-muted-text mb-6 text-center">
            You answered {result.correctCount} of {result.totalQuestions} correctly.
          </p>

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="profile-stat-card rounded border p-5 text-center">
              <Trophy className="mx-auto mb-2 text-red-600" size={24} />
              <p className="app-muted-text text-sm">Score</p>
              <p className="app-strong-text text-4xl font-bold">{result.score}</p>
            </div>
            <div className="profile-stat-card rounded border p-5 text-center">
              <Award className="mx-auto mb-2 text-red-600" size={24} />
              <p className="app-muted-text text-sm">Your Position</p>
              <p className="app-strong-text text-4xl font-bold">
                {rank ? `#${rank}` : "-"}
              </p>
            </div>
            <div className="profile-stat-card rounded border p-5 text-center">
              <Users className="mx-auto mb-2 text-red-600" size={24} />
              <p className="app-muted-text text-sm">Participants</p>
              <p className="app-strong-text text-4xl font-bold">
                {participantCount}
              </p>
            </div>
          </div>

          <div className="profile-stat-card mb-6 rounded border p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="app-strong-text text-xl font-bold">
                  Top Participants
                </h2>
                <p className="app-muted-text text-sm">
                  Top scorers ranked by score, then fastest submission time.
                </p>
              </div>
              <Medal className="text-red-600" size={24} />
            </div>

            {leaderboard.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="app-table w-full min-w-[560px] border text-left text-sm">
                  <thead className="app-table-head">
                    <tr>
                      <th className="px-4 py-3">Rank</th>
                      <th className="px-4 py-3">Participant</th>
                      <th className="px-4 py-3">Score</th>
                      <th className="px-4 py-3">Correct</th>
                      <th className="px-4 py-3">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((item) => (
                      <tr
                        className={`app-table-row border-t ${
                          item.userId === currentUserEntry?.userId
                            ? "event-result-current-row"
                            : ""
                        }`}
                        key={item._id}
                      >
                        <td className="px-4 py-3 font-semibold">#{item.rank}</td>
                        <td className="px-4 py-3">{item.name}</td>
                        <td className="px-4 py-3">{item.score}</td>
                        <td className="px-4 py-3">
                          {item.correctCount}/{item.totalQuestions}
                        </td>
                        <td className="px-4 py-3">{formatTime(item.totalTime)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="app-muted-text text-sm">No leaderboard entries yet.</p>
            )}

            {currentUserEntry &&
              !leaderboard.some((item) => item.userId === currentUserEntry.userId) && (
                <div className="event-result-rank-note mt-4 rounded border p-3 text-sm">
                  Your rank is #{currentUserEntry.rank} with a score of{" "}
                  {currentUserEntry.score}.
                </div>
              )}
          </div>
        </>
      ) : (
        <p className="mb-6 text-center text-red-600">
          {message || "Result details are available after submitting an event."}
        </p>
      )}
      <Link
        className="mx-auto block w-fit rounded bg-red-600 px-4 py-2 text-white transition hover:bg-red-800"
        to="/events"
      >
        Back to My Events
      </Link>
    </div>
  );
}
