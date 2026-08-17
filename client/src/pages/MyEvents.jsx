import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, RefreshCw, Trophy } from "lucide-react";
import apiClient from "../utils/apiClient";

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

const getEventStatusMessage = (event) => {
  if (event.hasSubmitted) {
    return `Completed with score ${event.result?.score}`;
  }

  if (event.effectiveStatus === "COMPLETED") {
    return "Event expired. You did not participate before the event ended.";
  }

  if (event.effectiveStatus === "UPCOMING") {
    return "You are registered. Participation opens when the event goes live.";
  }

  if (event.effectiveStatus === "CANCELLED") {
    return "This event was cancelled.";
  }

  return "";
};

const getDisabledActionLabel = (event) => {
  if (event.effectiveStatus === "COMPLETED") {
    return "Event Expired";
  }

  if (event.effectiveStatus === "UPCOMING") {
    return "Not Live Yet";
  }

  if (event.effectiveStatus === "CANCELLED") {
    return "Cancelled";
  }

  return "Not Live";
};

const formatTimer = (event) => {
  if (event?.timerMode === "PER_QUESTION") {
    return `${event.timePerQuestion || 0} sec/question`;
  }

  if (event?.totalDuration) {
    return `${Math.ceil(Number(event.totalDuration) / 60)} mins`;
  }

  return `${event?.duration || 0} mins`;
};

export default function MyEvents({ setAlign }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setAlign(true);
  }, [setAlign]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/api/events/registered");
      setEvents(response.data);
      setMessage("");
    } catch (error) {
      setMessage(error?.response?.data?.error || "Unable to load events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="app-strong-text text-2xl font-bold">App Events</h1>
        <button
          className="mt-4 inline-flex items-center justify-center gap-2 rounded border border-red-600 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60"
          disabled={loading}
          type="button"
          onClick={loadEvents}
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {message && <div className="mb-4 text-red-600">{message}</div>}

      <section className="leaderboard-card mb-5 rounded border border-red-200 p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-600/10 text-red-600">
              <Trophy size={24} />
            </div>
            <div>
              <h2 className="app-strong-text text-lg font-bold">
                Global Top Performers
              </h2>
              <p className="app-muted-text mt-1 text-sm">
                See who's leading across all quizzes
              </p>
            </div>
          </div>
          <Link
            className="inline-flex items-center justify-center gap-2 rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800"
            to="/leaderboard"
          >
            View Leaderboard <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div className="admin-card rounded border p-4" key={index}>
              <div className="mb-3 h-5 w-56 animate-pulse rounded bg-gray-300" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-gray-300" />
            </div>
          ))}
        </div>
      ) : events.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {events.map((event) => {
            const statusMessage = getEventStatusMessage(event);

            return (
            <div className="admin-card rounded border p-4" key={event._id}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="app-strong-text text-lg font-semibold">
                    {event.eventName}
                  </h2>
                  <p className="app-muted-text mt-1 text-sm">
                    {event.categoryName} • {event.difficulty} •{" "}
                    {formatTimer(event)}
                  </p>
                  <p className="app-muted-text mt-1 text-sm">
                    {formatDate(event.eventDate)} {event.startTime}
                  </p>
                  <p className="mt-2 text-sm font-semibold">
                    Status: {event.effectiveStatus}
                  </p>
                  {statusMessage && (
                    <p
                      className={`mt-1 text-sm ${
                        event.hasSubmitted ? "text-green-600" : "app-muted-text"
                      }`}
                    >
                      {statusMessage}
                    </p>
                  )}
                </div>

                {event.hasSubmitted ? (
                  <Link
                    className="rounded border border-red-600 px-4 py-2 text-center text-red-600 transition hover:bg-red-50"
                    to={`/events/${event._id}/result`}
                  >
                    View Result
                  </Link>
                ) : event.effectiveStatus === "LIVE" ? (
                  <Link
                    className="rounded bg-red-600 px-4 py-2 text-center text-white transition hover:bg-red-800"
                    to={`/events/${event._id}/play`}
                  >
                    Participate
                  </Link>
                ) : (
                  <button
                    className="rounded border px-4 py-2 opacity-60"
                    disabled
                  >
                    {getDisabledActionLabel(event)}
                  </button>
                )}
              </div>
            </div>
          );
          })}
        </div>
      ) : (
        <div className="app-muted-text rounded border p-6 text-center">
          You have not registered for any events yet.
        </div>
      )}
    </div>
  );
}
