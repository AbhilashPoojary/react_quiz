import React, { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import Dropdown from "../../components/Dropdown";
import LoadingOverlay from "../../components/LoadingOverlay";
import apiClient from "../../utils/apiClient";

const typeOptions = ["GENERAL", "EVENT", "ACCOUNT", "CHALLENGE", "SYSTEM"].map((value) => ({ category: value, value }));
const targetOptions = [
  { category: "All Active Users", value: "ALL_ACTIVE_USERS" },
  { category: "Specific Users", value: "SPECIFIC_USERS" },
  { category: "Event Registered Users", value: "EVENT_REGISTERED_USERS" },
];

const formatDate = (date) =>
  date ? new Intl.DateTimeFormat("en", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(date)) : "-";

const notificationHistorySkeletonWidths = ["w-24", "w-44", "w-24", "w-36", "w-16"];

function NotificationHistorySkeleton() {
  return Array.from({ length: 5 }).map((_, rowIndex) => (
    <tr className="app-table-row border-t" key={`notification-history-skeleton-${rowIndex}`}>
      {notificationHistorySkeletonWidths.map((width, columnIndex) => (
        <td className="px-4 py-3" key={`${rowIndex}-${width}-${columnIndex}`}>
          <span
            className={`block h-4 animate-pulse rounded bg-gray-300 dark:bg-gray-600 ${width}`}
          />
        </td>
      ))}
    </tr>
  ));
}

export default function AdminNotifications() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("GENERAL");
  const [targetType, setTargetType] = useState("ALL_ACTIVE_USERS");
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [events, setEvents] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [eventId, setEventId] = useState("");
  const [history, setHistory] = useState([]);
  const [notice, setNotice] = useState({ type: "info", text: "" });
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadData = async () => {
    const [usersResponse, eventsResponse, historyResponse] = await Promise.all([
      apiClient.get("/api/admin/users", { params: { status: "Active", limit: 50 } }),
      apiClient.get("/api/admin/events"),
      apiClient.get("/api/admin/notifications"),
    ]);
    setUsers(usersResponse.data.users || []);
    setEvents(eventsResponse.data || []);
    setHistory(historyResponse.data || []);
  };

  useEffect(() => {
    setDataLoading(true);
    loadData()
      .catch(() => setNotice({ type: "error", text: "Unable to load notification data" }))
      .finally(() => setDataLoading(false));
  }, []);

  const validateForm = () => {
    const errors = {};
    const trimmedTitle = title.trim();
    const trimmedMessage = message.trim();

    if (!trimmedTitle) {
      errors.title = "Title is required";
    } else if (trimmedTitle.length < 3) {
      errors.title = "Title should be at least 3 characters";
    }

    if (!trimmedMessage) {
      errors.message = "Message is required";
    } else if (trimmedMessage.length < 5) {
      errors.message = "Message should be at least 5 characters";
    }

    if (!type) {
      errors.type = "Notification type is required";
    }

    if (!targetType) {
      errors.targetType = "Target audience is required";
    }

    if (targetType === "SPECIFIC_USERS" && selectedUsers.length === 0) {
      errors.selectedUsers = "Select at least one user";
    }

    if (targetType === "EVENT_REGISTERED_USERS" && !eventId) {
      errors.eventId = "Select an event";
    }

    return errors;
  };

  const sendNotification = async (event) => {
    event.preventDefault();
    const errors = validateForm();
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      setNotice({ type: "error", text: "Please fix the highlighted fields" });
      return;
    }

    const trimmedTitle = title.trim();
    const trimmedMessage = message.trim();

    try {
      setLoading(true);
      await apiClient.post("/api/admin/notifications", {
        title: trimmedTitle,
        message: trimmedMessage,
        type,
        targetType,
        userIds: selectedUsers,
        eventId,
      });
      setNotice({ type: "success", text: "Notification sent successfully" });
      setTitle("");
      setMessage("");
      setSelectedUsers([]);
      setEventId("");
      setFormErrors({});
      setShowCreateModal(false);
      await loadData();
    } catch (error) {
      setNotice({ type: "error", text: error?.response?.data?.error || "Unable to send notification" });
    } finally {
      setLoading(false);
    }
  };

  const closeCreateModal = () => {
    if (loading) {
      return;
    }

    setShowCreateModal(false);
    setFormErrors({});
    setUserSearch("");
  };

  const eventOptions = [
    { category: "Select Event", value: "" },
    ...events.map((event) => ({ category: event.eventName, value: event._id })),
  ];
  const filteredUsers = users.filter((user) => {
    const query = userSearch.trim().toLowerCase();
    return (
      !query ||
      String(user.name || "").toLowerCase().includes(query) ||
      String(user.email || "").toLowerCase().includes(query)
    );
  });

  return (
    <div>
      <LoadingOverlay show={loading} message="Sending notification..." />
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="app-strong-text text-2xl font-bold">Admin Notifications</h1>
          <p className="app-muted-text text-sm">Create notifications and review delivery history.</p>
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 rounded bg-red-600 px-4 py-2 font-medium text-white transition hover:bg-red-800"
          type="button"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus size={16} />
          Create Notification
        </button>
      </div>
      {notice.text && <div className={`mb-4 rounded border p-3 text-sm ${notice.type === "error" ? "border-red-300 bg-red-50 text-red-700" : "border-green-300 bg-green-50 text-green-700"}`}>{notice.text}</div>}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-3 sm:items-center">
          <form
            className="admin-card w-full max-w-2xl rounded border p-5 shadow-xl"
            onSubmit={sendNotification}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="app-strong-text text-lg font-bold">Create Notification</h2>
                <p className="app-muted-text mt-1 text-sm">Send a message to users or event registrants.</p>
              </div>
              <button
                aria-label="Close create notification"
                className="rounded p-2 text-gray-500 transition hover:text-red-600 disabled:opacity-60"
                disabled={loading}
                type="button"
                onClick={closeCreateModal}
              >
                <X size={20} />
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <input
                  className={`app-input w-full rounded border p-3 ${formErrors.title ? "border-red-500" : ""}`}
                  placeholder="Title"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setFormErrors((prev) => ({ ...prev, title: "" }));
                  }}
                />
                {formErrors.title && <p className="mt-1 text-sm text-red-600">{formErrors.title}</p>}
              </div>
              <div className="sm:col-span-2">
                <textarea
                  className={`app-input min-h-[120px] w-full rounded border p-3 ${formErrors.message ? "border-red-500" : ""}`}
                  placeholder="Message"
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    setFormErrors((prev) => ({ ...prev, message: "" }));
                  }}
                />
                {formErrors.message && <p className="mt-1 text-sm text-red-600">{formErrors.message}</p>}
              </div>
              <div>
                <Dropdown
                  data={typeOptions}
                  state={type}
                  setState={(value) => {
                    setType(value);
                    setFormErrors((prev) => ({ ...prev, type: "" }));
                  }}
                  dropdownId="admin-notification-type"
                />
                {formErrors.type && <p className="mt-1 text-sm text-red-600">{formErrors.type}</p>}
              </div>
              <div>
                <Dropdown
                  data={targetOptions}
                  state={targetType}
                  setState={(value) => {
                    setTargetType(value);
                    setFormErrors((prev) => ({
                      ...prev,
                      targetType: "",
                      selectedUsers: "",
                      eventId: "",
                    }));
                  }}
                  dropdownId="admin-notification-target"
                />
                {formErrors.targetType && <p className="mt-1 text-sm text-red-600">{formErrors.targetType}</p>}
              </div>
              {targetType === "SPECIFIC_USERS" && (
                <div className="sm:col-span-2 rounded border p-3">
                  <p className="app-label mb-2 text-sm font-medium">Specific Users</p>
                  <input
                    className="app-input mb-3 w-full rounded border p-2 text-sm"
                    placeholder="Search users by name or email"
                    value={userSearch}
                    onChange={(event) => setUserSearch(event.target.value)}
                  />
                  <div className="grid max-h-52 gap-2 overflow-auto sm:grid-cols-2">
                    {filteredUsers.map((user) => (
                      <label className="flex items-center gap-2 text-sm" key={user._id}>
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user._id)}
                          onChange={(e) => {
                            setSelectedUsers((prev) => e.target.checked ? [...prev, user._id] : prev.filter((id) => id !== user._id));
                            setFormErrors((prev) => ({ ...prev, selectedUsers: "" }));
                          }}
                        />
                        <span>{user.name} - {user.email}</span>
                      </label>
                    ))}
                    {!filteredUsers.length && (
                      <p className="app-muted-text text-sm sm:col-span-2">No active users found.</p>
                    )}
                  </div>
                  {formErrors.selectedUsers && <p className="mt-2 text-sm text-red-600">{formErrors.selectedUsers}</p>}
                </div>
              )}
              {targetType === "EVENT_REGISTERED_USERS" && (
                <div className="sm:col-span-2">
                  <Dropdown
                    data={eventOptions}
                    state={eventId}
                    setState={(value) => {
                      setEventId(value);
                      setFormErrors((prev) => ({ ...prev, eventId: "" }));
                    }}
                    dropdownId="admin-notification-event"
                  />
                  {formErrors.eventId && <p className="mt-1 text-sm text-red-600">{formErrors.eventId}</p>}
                </div>
              )}
            </div>
            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                className="rounded border px-4 py-2 disabled:opacity-60"
                disabled={loading}
                type="button"
                onClick={closeCreateModal}
              >
                Cancel
              </button>
              <button
                className="rounded bg-red-600 px-4 py-2 text-white disabled:opacity-60"
                disabled={loading}
                type="submit"
              >
                Send Notification
              </button>
            </div>
          </form>
        </div>
      )}
      <section className="mt-6">
        <h2 className="app-strong-text mb-4 text-lg font-bold">Notification History</h2>
        <div className="overflow-x-auto">
          <table className="app-table min-w-[760px] w-full border text-left text-sm">
            <thead className="app-table-head">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">Recipients</th>
              </tr>
            </thead>
            <tbody>
              {dataLoading ? (
                <NotificationHistorySkeleton />
              ) : history.length ? history.map((item) => (
                <tr className="app-table-row border-t" key={item._id}>
                  <td className="px-4 py-3">{formatDate(item.createdAt)}</td>
                  <td className="px-4 py-3 font-semibold">{item.title}</td>
                  <td className="px-4 py-3">{item.type}</td>
                  <td className="px-4 py-3">{item.targetType}</td>
                  <td className="px-4 py-3">{item.recipientCount}</td>
                </tr>
              )) : (
                <tr className="app-table-row border-t"><td className="px-4 py-6 text-center" colSpan={5}>No notifications sent yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
