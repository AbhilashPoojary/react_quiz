import React, { useEffect, useState } from "react";
import { Eye, RefreshCw, RotateCcw, Send, Trash2, UserCheck, UserX } from "lucide-react";
import { Link } from "react-router-dom";
import ConfirmPopup from "../../components/ConfirmPopup";
import Dropdown from "../../components/Dropdown";
import apiClient from "../../utils/apiClient";

const statusOptions = [
  { category: "All", value: "All" },
  { category: "Active", value: "Active" },
  { category: "Inactive", value: "Inactive" },
  { category: "Deleted", value: "Deleted" },
];
const roleOptions = [
  { category: "All Roles", value: "" },
  { category: "USER", value: "USER" },
  { category: "ADMIN", value: "ADMIN" },
];
const sortOptions = [
  { category: "Newest", value: "newest" },
  { category: "Oldest", value: "oldest" },
];
const typeOptions = [
  { category: "GENERAL", value: "GENERAL" },
  { category: "ACCOUNT", value: "ACCOUNT" },
  { category: "SYSTEM", value: "SYSTEM" },
  { category: "EVENT", value: "EVENT" },
  { category: "CHALLENGE", value: "CHALLENGE" },
];

const formatDate = (date) =>
  date
    ? new Intl.DateTimeFormat("en", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(date))
    : "-";

const skeletonWidths = ["w-32", "w-48", "w-14", "w-20", "w-24"];

function UserTableSkeleton() {
  return Array.from({ length: 6 }).map((_, rowIndex) => (
    <tr className="app-table-row border-t" key={`user-skeleton-${rowIndex}`}>
      <td className="px-4 py-3">
        <span className="block h-4 w-4 animate-pulse rounded bg-gray-300 dark:bg-gray-600" />
      </td>
      {skeletonWidths.map((width, columnIndex) => (
        <td className="px-4 py-3" key={`${rowIndex}-${width}-${columnIndex}`}>
          <span
            className={`block h-4 animate-pulse rounded bg-gray-300 dark:bg-gray-600 ${width}`}
          />
        </td>
      ))}
      <td className="px-4 py-3">
        <div className="flex gap-2">
          <span className="h-8 w-8 animate-pulse rounded border bg-gray-300 dark:bg-gray-600" />
          <span className="h-8 w-8 animate-pulse rounded border bg-gray-300 dark:bg-gray-600" />
          <span className="h-8 w-8 animate-pulse rounded border bg-gray-300 dark:bg-gray-600" />
        </div>
      </td>
    </tr>
  ));
}

function BulkNotificationModal({ selectedCount, selectedIds, onClose, onSent }) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("GENERAL");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSend = async () => {
    try {
      setLoading(true);
      setError("");
      await apiClient.post("/api/admin/notifications", {
        title,
        message,
        type,
        targetType: "SPECIFIC_USERS",
        userIds: selectedIds,
      });
      onSent();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.error || "Unable to send notification");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="confirm-card w-full max-w-lg rounded border p-5 shadow-xl">
        <h2 className="app-strong-text text-xl font-bold">Send Notification</h2>
        <p className="app-muted-text mt-1 text-sm">Recipients: {selectedCount} users</p>
        {error && <p className="mt-3 rounded border border-red-300 bg-red-50 p-2 text-sm text-red-700">{error}</p>}
        <div className="mt-4 space-y-3">
          <input className="app-input w-full rounded border p-3" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <textarea className="app-input min-h-[120px] w-full rounded border p-3" placeholder="Message" value={message} onChange={(e) => setMessage(e.target.value)} />
          <Dropdown data={typeOptions} state={type} setState={setType} dropdownId="bulk-notification-type" />
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <button className="rounded border px-4 py-2" type="button" onClick={onClose}>Cancel</button>
          <button className="rounded bg-red-600 px-4 py-2 text-white disabled:opacity-60" disabled={loading} type="button" onClick={handleSend}>
            {loading ? "Sending..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [role, setRole] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [softDeleteUser, setSoftDeleteUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "info", text: "" });

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/api/admin/users", {
        params: { search, status, role, sort, page, limit: 10 },
      });
      setUsers(response.data.users || []);
      setTotalPages(response.data.totalPages || 1);
      setMessage({ type: "info", text: "" });
    } catch (error) {
      setMessage({ type: "error", text: error?.response?.data?.error || "Unable to load users" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [status, role, sort, page]);

  const runAction = async (path, successText) => {
    try {
      await apiClient[path.method || "patch"](path.url, path.body);
      setMessage({ type: "success", text: successText });
      setSelectedIds([]);
      await loadUsers();
      return true;
    } catch (error) {
      setMessage({ type: "error", text: error?.response?.data?.error || "Action failed" });
      return false;
    }
  };

  const bulkAction = (action) => {
    if (!selectedIds.length) {
      setMessage({ type: "error", text: "Select at least one user" });
      return;
    }
    runAction(
      { method: "post", url: `/api/admin/users/bulk/${action}`, body: { userIds: selectedIds } },
      "Users updated successfully"
    );
  };

  const toggleSelected = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSoftDelete = async () => {
    if (!softDeleteUser) {
      return;
    }
    const success = await runAction(
      { method: "delete", url: `/api/admin/users/${softDeleteUser._id}` },
      "User soft deleted"
    );
    if (success) {
      setSoftDeleteUser(null);
    }
  };

  return (
    <div>
      <ConfirmPopup
        open={Boolean(softDeleteUser)}
        title="Soft Delete User?"
        body={`Are you sure you want to soft delete "${softDeleteUser?.name || "this user"}"? Their account will be disabled, while quiz history, event records, and challenge data remain preserved.`}
        confirmText="Soft Delete"
        cancelText="Cancel"
        onConfirm={handleSoftDelete}
        onCancel={() => setSoftDeleteUser(null)}
      />
      {showNotificationModal && (
        <BulkNotificationModal
          selectedCount={selectedIds.length}
          selectedIds={selectedIds}
          onClose={() => setShowNotificationModal(false)}
          onSent={() => setMessage({ type: "success", text: "Notification sent successfully" })}
        />
      )}
      <div className="mb-5">
        <h1 className="app-strong-text text-2xl font-bold">Users</h1>
        <p className="app-muted-text text-sm">Search, manage status, and notify users.</p>
      </div>
      <div className="mb-4 grid gap-3 lg:grid-cols-5">
        <input className="app-input rounded border p-3 lg:col-span-2" placeholder="Search by name/email" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && loadUsers()} />
        <Dropdown data={statusOptions} state={status} setState={(value) => { setPage(1); setStatus(value); }} dropdownId="admin-users-status" />
        <Dropdown data={roleOptions} state={role} setState={(value) => { setPage(1); setRole(value); }} dropdownId="admin-users-role" />
        <Dropdown data={sortOptions} state={sort} setState={setSort} dropdownId="admin-users-sort" />
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        <button className="analysis-outline-button inline-flex items-center gap-2 rounded border border-red-600 px-3 py-2 text-red-600" onClick={loadUsers}><RefreshCw size={16} />Search</button>
        <button className="rounded bg-red-600 px-3 py-2 text-white disabled:opacity-60" disabled={!selectedIds.length} onClick={() => bulkAction("activate")}>Bulk Activate</button>
        <button className="rounded bg-red-600 px-3 py-2 text-white disabled:opacity-60" disabled={!selectedIds.length} onClick={() => bulkAction("deactivate")}>Bulk Deactivate</button>
        <button className="analysis-outline-button inline-flex items-center gap-2 rounded border border-red-600 px-3 py-2 text-red-600 disabled:opacity-60" disabled={!selectedIds.length} onClick={() => setShowNotificationModal(true)}><Send size={16} />Send Notification</button>
      </div>
      {message.text && <div className={`mb-4 rounded border p-3 text-sm ${message.type === "error" ? "border-red-300 bg-red-50 text-red-700" : "border-green-300 bg-green-50 text-green-700"}`}>{message.text}</div>}
      <div className="overflow-x-auto">
        <table className="app-table min-w-[980px] w-full border text-left text-sm">
          <thead className="app-table-head">
            <tr>
              <th className="px-4 py-3"><input type="checkbox" checked={users.length > 0 && selectedIds.length === users.length} onChange={(e) => setSelectedIds(e.target.checked ? users.map((u) => u._id) : [])} /></th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Joined Date</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <UserTableSkeleton />
            ) : users.length ? users.map((user) => (
              <tr className="app-table-row border-t" key={user._id}>
                <td className="px-4 py-3"><input type="checkbox" checked={selectedIds.includes(user._id)} onChange={() => toggleSelected(user._id)} /></td>
                <td className="px-4 py-3 font-semibold">{user.name}</td>
                <td className="px-4 py-3">{user.email}</td>
                <td className="px-4 py-3">{user.role}</td>
                <td className="px-4 py-3">{user.status}</td>
                <td className="px-4 py-3">{formatDate(user.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Link className="rounded border p-2 text-gray-500 hover:text-red-600" title="View" to={`/admin/users/${user._id}`}><Eye size={16} /></Link>
                    {user.isDeleted ? (
                      <button className="rounded border p-2 text-gray-500 hover:text-red-600" title="Restore" onClick={() => runAction({ url: `/api/admin/users/${user._id}/restore` }, "User restored")}><RotateCcw size={16} /></button>
                    ) : user.isActive ? (
                      <button className="rounded border p-2 text-gray-500 hover:text-red-600" title="Deactivate" onClick={() => runAction({ url: `/api/admin/users/${user._id}/deactivate` }, "User deactivated")}><UserX size={16} /></button>
                    ) : (
                      <button className="rounded border p-2 text-gray-500 hover:text-red-600" title="Activate" onClick={() => runAction({ url: `/api/admin/users/${user._id}/activate` }, "User activated")}><UserCheck size={16} /></button>
                    )}
                    {!user.isDeleted && <button className="rounded border p-2 text-gray-500 hover:text-red-600" title="Soft Delete" onClick={() => setSoftDeleteUser(user)}><Trash2 size={16} /></button>}
                  </div>
                </td>
              </tr>
            )) : (
              <tr className="app-table-row border-t"><td className="px-4 py-6 text-center" colSpan={7}>No users found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex items-center justify-end gap-2">
        <button className="rounded border px-3 py-1 disabled:opacity-50" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
        <span className="app-muted-text text-sm">Page {page} of {totalPages}</span>
        <button className="rounded border px-3 py-1 disabled:opacity-50" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
      </div>
    </div>
  );
}
