import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Edit, Eye, Loader2, RotateCcw, Send, Trash2 } from "lucide-react";
import apiClient from "../../utils/apiClient";
import ConfirmPopup from "../../components/ConfirmPopup";

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

const eventSkeletonWidths = ["w-40", "w-28", "w-24", "w-20", "w-16", "w-20", "w-16"];

function EventTableSkeleton() {
  return Array.from({ length: 6 }).map((_, rowIndex) => (
    <tr className="app-table-row border-t" key={`event-skeleton-${rowIndex}`}>
      {eventSkeletonWidths.map((width, columnIndex) => (
        <td className="px-4 py-3" key={`${rowIndex}-${width}-${columnIndex}`}>
          <span
            className={`block h-4 animate-pulse rounded bg-gray-300 dark:bg-gray-600 ${width}`}
          />
        </td>
      ))}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-8 w-8 animate-pulse rounded border bg-gray-300 dark:bg-gray-600" />
          <span className="h-8 w-8 animate-pulse rounded border bg-gray-300 dark:bg-gray-600" />
          <span className="h-8 w-8 animate-pulse rounded border bg-gray-300 dark:bg-gray-600" />
          <span className="h-8 w-8 animate-pulse rounded border bg-gray-300 dark:bg-gray-600" />
        </div>
      </td>
    </tr>
  ));
}

export default function AdminEvents() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [message, setMessage] = useState({ type: "info", text: "" });
  const [eventToDelete, setEventToDelete] = useState(null);
  const [eventToUnpublish, setEventToUnpublish] = useState(null);
  const [unpublishReason, setUnpublishReason] = useState("");

  const loadEvents = async ({ showLoading = true } = {}) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      const response = await apiClient.get("/api/admin/events");
      setEvents(response.data);
      setMessage({ type: "info", text: "" });
    } catch (error) {
      setMessage({
        type: "error",
        text: error?.response?.data?.error || "Unable to load events",
      });
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handlePublish = async (eventId) => {
    try {
      setActionLoading(eventId);
      setMessage({
        type: "info",
        text: "Publishing event and fetching questions. Please wait...",
      });
      await apiClient.post(`/api/admin/events/${eventId}/publish`);
      setMessage({ type: "success", text: "Event published successfully" });
      await loadEvents({ showLoading: false });
    } catch (error) {
      setMessage({
        type: "error",
        text: error?.response?.data?.error || "Unable to publish event",
      });
    } finally {
      setActionLoading("");
    }
  };

  const handleUnpublish = async () => {
    if (!eventToUnpublish || actionLoading === eventToUnpublish._id) {
      return;
    }

    const reason = unpublishReason.trim();

    if (!reason) {
      setMessage({
        type: "error",
        text: "Please enter a reason before unpublishing the event",
      });
      return;
    }

    try {
      setActionLoading(eventToUnpublish._id);
      setMessage({
        type: "info",
        text: "Moving event back to drafts. Please wait...",
      });
      await apiClient.post(`/api/admin/events/${eventToUnpublish._id}/unpublish`, {
        reason,
      });
      setMessage({ type: "success", text: "Event moved back to drafts" });
      setEventToUnpublish(null);
      setUnpublishReason("");
      await loadEvents({ showLoading: false });
    } catch (error) {
      setMessage({
        type: "error",
        text: error?.response?.data?.error || "Unable to unpublish event",
      });
    } finally {
      setActionLoading("");
    }
  };

  const handleDelete = async () => {
    if (!eventToDelete || actionLoading === eventToDelete._id) {
      return;
    }

    try {
      setActionLoading(eventToDelete._id);
      await apiClient.delete(`/api/admin/events/${eventToDelete._id}`);
      setMessage({ type: "success", text: "Event deleted successfully" });
      setEventToDelete(null);
      await loadEvents({ showLoading: false });
    } catch (error) {
      setMessage({
        type: "error",
        text: error?.response?.data?.error || "Unable to delete event",
      });
    } finally {
      setActionLoading("");
    }
  };

  return (
    <div>
      <ConfirmPopup
        open={Boolean(eventToDelete)}
        title="Delete Event?"
        body={`Are you sure you want to delete "${
          eventToDelete?.eventName || "this event"
        }"? This action cannot be undone.`}
        confirmText={actionLoading === eventToDelete?._id ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setEventToDelete(null)}
      />

      {eventToUnpublish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="confirm-card w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <h3 className="app-strong-text mb-2 text-lg font-semibold">
              Unpublish Event?
            </h3>
            <p className="app-muted-text mb-4 text-sm">
              Registered users will be notified with this reason and their
              registrations will be removed.
            </p>
            <div className="unpublish-event-summary mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <p className="font-semibold">{eventToUnpublish.eventName}</p>
              <p>
                {formatDate(eventToUnpublish.eventDate)}{" "}
                {eventToUnpublish.startTime} -{" "}
                {eventToUnpublish.categoryName} - {eventToUnpublish.difficulty}
              </p>
              <p>
                {formatDate(eventToUnpublish.eventDate)}{" "}
                {eventToUnpublish.startTime} · {eventToUnpublish.categoryName} ·{" "}
                {eventToUnpublish.difficulty}
              </p>
            </div>
            <div className="mb-4 rounded border p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="app-strong-text text-sm font-semibold">
                  Registered Users
                </p>
                <span className="app-muted-text text-xs">
                  {eventToUnpublish.registeredUsers?.length || 0} users
                </span>
              </div>
              {eventToUnpublish.registeredUsers?.length > 0 ? (
                <div className="max-h-40 space-y-2 overflow-auto pr-1">
                  {eventToUnpublish.registeredUsers.map((user) => (
                    <div
                      className="flex items-center gap-3 rounded border p-2 text-sm"
                      key={user.userId}
                    >
                      <img
                        alt={user.name}
                        className="h-8 w-8 rounded-full object-cover"
                        src={user.profilePicture}
                      />
                      <div className="min-w-0">
                        <p className="app-strong-text truncate font-medium">
                          {user.name}
                        </p>
                        <p className="app-muted-text truncate text-xs">
                          {user.email || "No email available"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="app-muted-text text-sm">
                  No users are registered for this event.
                </p>
              )}
            </div>
            <label className="app-label mb-1 block text-sm font-medium">
              Reason <span className="text-red-600">*</span>
            </label>
            <textarea
              className="app-input min-h-[110px] w-full rounded border border-gray-300 p-2.5 text-sm outline-none"
              placeholder="Explain why this event is being unpublished"
              value={unpublishReason}
              onChange={(event) => setUnpublishReason(event.target.value)}
            />
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                className="rounded bg-gray-200 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-300"
                disabled={actionLoading === eventToUnpublish._id}
                onClick={() => {
                  setEventToUnpublish(null);
                  setUnpublishReason("");
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-wait disabled:opacity-70"
                disabled={actionLoading === eventToUnpublish._id}
                onClick={handleUnpublish}
              >
                {actionLoading === eventToUnpublish._id && (
                  <Loader2 size={16} className="animate-spin" />
                )}
                {actionLoading === eventToUnpublish._id
                  ? "Unpublishing..."
                  : "Unpublish"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="app-strong-text text-2xl font-bold">Manage Events</h1>
          <p className="app-muted-text text-sm">
            Create, publish, and manage quiz events.
          </p>
        </div>
        <Link
          to="/admin/events/create"
          className="rounded bg-red-600 px-4 py-2 text-center font-medium text-white transition hover:bg-red-800"
        >
          Create Event
        </Link>
      </div>

      {message.text && (
        <div
          className={`mb-4 rounded border p-3 text-sm ${
            message.type === "error"
              ? "border-red-300 bg-red-50 text-red-700"
              : message.type === "info"
              ? "border-blue-300 bg-blue-50 text-blue-700"
              : "border-green-300 bg-green-50 text-green-700"
          }`}
        >
          <span className="inline-flex items-center gap-2">
            {message.type === "info" && actionLoading && (
              <Loader2 size={16} className="animate-spin" />
            )}
            {message.text}
          </span>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="app-table min-w-[920px] w-full border text-left text-sm">
          <thead className="app-table-head">
            <tr>
              <th className="px-4 py-3">Event Name</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Start Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Questions</th>
              <th className="px-4 py-3">Duration</th>
              <th className="px-4 py-3">Participants</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <EventTableSkeleton />
            ) : events.length > 0 ? (
              events.map((event) => {
                const isRowBusy = actionLoading === event._id;
                const canUnpublish =
                  event.status !== "DRAFT" &&
                  !["LIVE", "COMPLETED"].includes(event.effectiveStatus);

                return (
                <tr
                  className={`app-table-row border-t ${
                    isRowBusy ? "opacity-75" : ""
                  }`}
                  key={event._id}
                >
                  <td className="px-4 py-3 font-semibold">{event.eventName}</td>
                  <td className="px-4 py-3">{event.categoryName}</td>
                  <td className="px-4 py-3">{formatDate(event.eventDate)}</td>
                  <td className="px-4 py-3">{event.effectiveStatus}</td>
                  <td className="px-4 py-3">
                    {event.questions?.length || 0}/{event.questionCount}
                  </td>
                  <td className="px-4 py-3">{event.duration} mins</td>
                  <td className="px-4 py-3">{event.participants || 0}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {["LIVE", "COMPLETED"].includes(event.effectiveStatus) ? (
                        <button
                          className="rounded border p-2 text-gray-400 opacity-50"
                          title="Live and completed events cannot be edited"
                          disabled
                        >
                          <Edit size={16} />
                        </button>
                      ) : (
                        <Link
                          className="rounded border p-2 text-gray-500 transition hover:text-red-600"
                          title="Edit"
                          to={`/admin/events/${event._id}/edit`}
                        >
                          <Edit size={16} />
                        </Link>
                      )}
                      {event.effectiveStatus === "DRAFT" && (
                        <button
                          className="inline-flex items-center rounded border p-2 text-gray-500 transition hover:text-red-600 disabled:cursor-wait disabled:opacity-60"
                          title={isRowBusy ? "Publishing..." : "Publish"}
                          disabled={isRowBusy}
                          onClick={() => handlePublish(event._id)}
                        >
                          {isRowBusy ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Send size={16} />
                          )}
                        </button>
                      )}
                      {canUnpublish && (
                        <button
                          className="inline-flex items-center rounded border p-2 text-gray-500 transition hover:text-red-600 disabled:cursor-wait disabled:opacity-60"
                          title={isRowBusy ? "Unpublishing..." : "Unpublish"}
                          disabled={isRowBusy}
                          onClick={() => {
                            setEventToUnpublish(event);
                            setUnpublishReason("");
                          }}
                        >
                          {isRowBusy ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <RotateCcw size={16} />
                          )}
                        </button>
                      )}
                      <button
                        className="rounded border p-2 text-gray-500 transition hover:text-red-600"
                        title="Delete"
                        disabled={isRowBusy}
                        onClick={() => setEventToDelete(event)}
                      >
                        <Trash2 size={16} />
                      </button>
                      <button
                        className="rounded border p-2 text-gray-500 transition hover:text-red-600"
                        title="View"
                        onClick={() => setSelectedEvent(event)}
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
              })
            ) : (
              <tr className="app-table-row border-t">
                <td className="px-4 py-6 text-center" colSpan={8}>
                  No events created yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="admin-card max-h-[90vh] w-full max-w-2xl overflow-auto rounded border p-5 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="app-strong-text text-xl font-bold">
                  {selectedEvent.eventName}
                </h2>
                <p className="app-muted-text text-sm">
                  {selectedEvent.effectiveStatus}
                </p>
              </div>
              <button
                className="text-red-600"
                onClick={() => setSelectedEvent(null)}
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <p><strong>Category:</strong> {selectedEvent.categoryName}</p>
              <p><strong>Difficulty:</strong> {selectedEvent.difficulty}</p>
              <p><strong>Questions:</strong> {selectedEvent.questionCount}</p>
              <p><strong>Type:</strong> {selectedEvent.questionType}</p>
              <p><strong>Duration:</strong> {selectedEvent.duration} mins</p>
              <p>
                <strong>Notify Users:</strong>{" "}
                {selectedEvent.notifyUsers ? "Yes" : "No"}
              </p>
              <p><strong>Start:</strong> {formatDate(selectedEvent.eventDate)} {selectedEvent.startTime}</p>
              <p className="sm:col-span-2">
                <strong>Registration Deadline:</strong>{" "}
                {formatDate(selectedEvent.registrationDeadline)}
              </p>
              <p className="sm:col-span-2">
                <strong>Description:</strong> {selectedEvent.description}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
