import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  RefreshCw,
  ShieldAlert,
  Swords,
} from "lucide-react";
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

const getEventActionState = (item) => {
  if (!item.event) {
    return { canRegister: false, label: "" };
  }

  const status = item.event.effectiveStatus || item.event.computedStatus;

  if (item.isRegistered) {
    return { canRegister: false, label: "Registered" };
  }

  if (status === "COMPLETED") {
    return { canRegister: false, label: "Event completed" };
  }

  if (status === "CANCELLED") {
    return { canRegister: false, label: "Event cancelled" };
  }

  if (status === "DRAFT") {
    return { canRegister: false, label: "Registration unavailable" };
  }

  if (status !== "UPCOMING" && status !== "LIVE") {
    return { canRegister: false, label: "Registration closed" };
  }

  return { canRegister: true, label: "Register" };
};

export default function Notifications({ setAlign }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [message, setMessage] = useState({ type: "info", text: "" });

  useEffect(() => {
    setAlign(true);
  }, [setAlign]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/api/notifications");
      setNotifications(response.data);
      setMessage({ type: "info", text: "" });
    } catch (error) {
      setMessage({
        type: "error",
        text: error?.response?.data?.error || "Unable to load notifications",
      });
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (id) => {
    try {
      await apiClient.patch(`/api/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((item) =>
          item._id === id ? { ...item, isRead: true, read: true } : item
        )
      );
      window.dispatchEvent(new Event("notifications-updated"));
    } catch (error) {
      setMessage({
        type: "error",
        text: error?.response?.data?.error || "Unable to mark notification read",
      });
    }
  };

  const markAllRead = async () => {
    try {
      await apiClient.patch("/api/notifications/read-all");
      setNotifications((prev) =>
        prev.map((item) => ({ ...item, isRead: true, read: true }))
      );
      window.dispatchEvent(new Event("notifications-updated"));
    } catch (error) {
      setMessage({
        type: "error",
        text: error?.response?.data?.error || "Unable to mark all notifications read",
      });
    }
  };

  const getTypeIcon = (type) => {
    if (type === "ACCOUNT") return <ShieldAlert size={18} />;
    if (type === "CHALLENGE") return <Swords size={18} />;
    if (type === "EVENT") return <CalendarDays size={18} />;
    return <Bell size={18} />;
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleRegister = async (eventId) => {
    try {
      setActionLoading(eventId);
      await apiClient.post(`/api/events/${eventId}/register`);
      setMessage({ type: "success", text: "Registered successfully" });
      await loadNotifications();
    } catch (error) {
      setMessage({
        type: "error",
        text: error?.response?.data?.error || "Unable to register event",
      });
    } finally {
      setActionLoading("");
    }
  };

  return (
    <div className="pt-5">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <h1 className="app-strong-text text-2xl font-bold">Notifications</h1>
        <div className="flex flex-wrap gap-2 sm:pt-1">
          <button
            className="inline-flex items-center justify-center gap-2 rounded border border-red-600 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60"
            disabled={loading}
            type="button"
            onClick={loadNotifications}
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            className="inline-flex items-center justify-center gap-2 rounded bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-800"
            type="button"
            onClick={markAllRead}
          >
            <CheckCircle2 size={16} />
            Mark all read
          </button>
        </div>
      </div>

      {message.text && (
        <div
          className={`mb-4 rounded border p-3 text-sm ${
            message.type === "error"
              ? "border-red-300 bg-red-50 text-red-700"
              : "border-green-300 bg-green-50 text-green-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div className="admin-card rounded border p-4" key={index}>
              <div className="mb-3 h-5 w-48 animate-pulse rounded bg-gray-300" />
              <div className="mb-2 h-4 w-full animate-pulse rounded bg-gray-300" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-gray-300" />
            </div>
          ))}
        </div>
      ) : notifications.length > 0 ? (
        <div className="space-y-4">
          {notifications.map((item) => {
            const eventAction = getEventActionState(item);

            return (
              <div
                className={`admin-card rounded border p-4 ${
                  item.isRead || item.read ? "" : "ring-1 ring-red-500"
                }`}
                key={item._id}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-red-600">{getTypeIcon(item.type)}</span>
                      <h2 className="app-strong-text font-semibold">
                        {item.title}
                      </h2>
                      {!(item.isRead || item.read) && (
                        <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs text-white">
                          New
                        </span>
                      )}
                    </div>
                    <p className="app-muted-text mt-1 text-sm">{item.message}</p>
                    <p className="app-muted-text mt-2 text-xs">{item.type || "GENERAL"}</p>
                    {item.event && (
                      <div className="app-muted-text mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm">
                        <span className="flex items-center gap-1">
                          <CalendarDays size={15} />
                          {formatDate(item.event.eventDate)} {item.event.startTime}
                        </span>
                        <span>{item.event.categoryName}</span>
                        <span className="capitalize">{item.event.difficulty}</span>
                        <span>{item.event.duration} mins</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                  {item.hasSubmitted ? (
                    <Link
                      className="rounded border border-red-600 px-4 py-2 text-center text-red-600 transition hover:bg-red-50"
                      to={`/events/${item.eventId}/result`}
                    >
                      View Result
                    </Link>
                  ) : item.event &&
                    item.isRegistered &&
                    item.event.effectiveStatus === "LIVE" ? (
                    <Link
                      className="rounded bg-red-600 px-4 py-2 text-center text-white transition hover:bg-red-800"
                      to={`/events/${item.eventId}/play`}
                    >
                      Participate
                    </Link>
                  ) : item.event ? (
                    <button
                      className="rounded bg-red-600 px-4 py-2 text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={!eventAction.canRegister || actionLoading === item.eventId}
                      onClick={() => handleRegister(item.eventId)}
                    >
                      {actionLoading === item.eventId
                        ? "Registering..."
                        : eventAction.label}
                    </button>
                  ) : null}
                  {!(item.isRead || item.read) && (
                    <button
                      className="analysis-outline-button rounded border border-red-600 px-4 py-2 text-red-600"
                      type="button"
                      onClick={() => markRead(item._id)}
                    >
                      Mark read
                    </button>
                  )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="app-muted-text rounded border p-6 text-center">
          No notifications yet.
        </div>
      )}
    </div>
  );
}
