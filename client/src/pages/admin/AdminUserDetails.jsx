import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ConfirmPopup from "../../components/ConfirmPopup";
import LoadingOverlay from "../../components/LoadingOverlay";
import apiClient from "../../utils/apiClient";

const formatDate = (date) =>
  date
    ? new Intl.DateTimeFormat("en", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(date))
    : "-";

function InfoCard({ label, value }) {
  return (
    <div className="rounded border p-4">
      <p className="app-muted-text text-sm">{label}</p>
      <p className="app-strong-text mt-1 font-semibold">{value}</p>
    </div>
  );
}

function SkeletonBlock({ className = "" }) {
  return (
    <span
      className={`block animate-pulse rounded bg-gray-300 dark:bg-gray-600 ${className}`}
    />
  );
}

function AdminUserDetailsSkeleton() {
  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <SkeletonBlock className="h-8 w-40" />
          <SkeletonBlock className="mt-2 h-4 w-56 max-w-full" />
        </div>
        <SkeletonBlock className="h-10 w-32" />
      </div>

      <section className="admin-card rounded border p-5">
        <div className="mb-5 flex flex-col items-center gap-4 border-b pb-5 text-center sm:flex-row sm:text-left">
          <SkeletonBlock className="h-24 w-24 rounded-full" />
          <div className="min-w-0">
            <SkeletonBlock className="h-7 w-44 max-w-full" />
            <SkeletonBlock className="mt-2 h-4 w-64 max-w-full" />
            <SkeletonBlock className="mt-3 h-7 w-20" />
          </div>
        </div>
        <SkeletonBlock className="mb-4 h-6 w-44" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div className="rounded border p-4" key={index}>
              <SkeletonBlock className="h-4 w-20" />
              <SkeletonBlock className="mt-2 h-5 w-36 max-w-full" />
            </div>
          ))}
        </div>
      </section>

      <section className="admin-card mt-5 rounded border p-5">
        <SkeletonBlock className="mb-4 h-6 w-36" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div className="rounded border p-4" key={index}>
              <SkeletonBlock className="h-4 w-24" />
              <SkeletonBlock className="mt-2 h-6 w-12" />
            </div>
          ))}
        </div>
      </section>

      <section className="admin-card mt-5 rounded border p-5">
        <SkeletonBlock className="mb-4 h-6 w-36" />
        <div className="flex flex-wrap gap-3">
          <SkeletonBlock className="h-10 w-24" />
          <SkeletonBlock className="h-10 w-28" />
        </div>
      </section>
    </div>
  );
}

export default function AdminUserDetails() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [confirmSoftDelete, setConfirmSoftDelete] = useState(false);
  const [message, setMessage] = useState({ type: "info", text: "" });

  const loadUser = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/api/admin/users/${userId}`);
      setPayload(response.data);
    } catch (error) {
      setMessage({ type: "error", text: error?.response?.data?.error || "Unable to load user" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, [userId]);

  const runAction = async (method, url, text, overlayMessage = "Updating user...") => {
    try {
      setActionLoading(true);
      setActionMessage(overlayMessage);
      await apiClient[method](url);
      setMessage({ type: "success", text });
      await loadUser();
      return true;
    } catch (error) {
      setMessage({ type: "error", text: error?.response?.data?.error || "Action failed" });
      return false;
    } finally {
      setActionLoading(false);
      setActionMessage("");
    }
  };

  if (loading) {
    return <AdminUserDetailsSkeleton />;
  }

  if (!payload) {
    return <div className="py-10 text-center text-red-600">{message.text}</div>;
  }

  const { user, stats } = payload;

  const handleSoftDelete = async () => {
    const success = await runAction(
      "delete",
      `/api/admin/users/${user._id}`,
      "User soft deleted",
      "Soft deleting user..."
    );
    if (success) {
      setConfirmSoftDelete(false);
    }
  };

  return (
    <div>
      <LoadingOverlay show={actionLoading} message={actionMessage} />
      <ConfirmPopup
        open={confirmSoftDelete}
        title="Soft Delete User?"
        body={`Are you sure you want to soft delete "${user.name}"? Their account will be disabled, while quiz history, event records, and challenge data remain preserved.`}
        confirmText={actionLoading ? "Soft Deleting..." : "Soft Delete"}
        cancelText="Cancel"
        onConfirm={handleSoftDelete}
        onCancel={() => setConfirmSoftDelete(false)}
      />
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="app-strong-text text-2xl font-bold">User Details</h1>
          <p className="app-muted-text text-sm">{user.email}</p>
        </div>
        <button className="analysis-outline-button rounded border border-red-600 px-4 py-2 text-red-600" onClick={() => navigate("/admin/users")}>Back to Users</button>
      </div>
      {message.text && <div className={`mb-4 rounded border p-3 text-sm ${message.type === "error" ? "border-red-300 bg-red-50 text-red-700" : "border-green-300 bg-green-50 text-green-700"}`}>{message.text}</div>}
      <section className="admin-card rounded border p-5">
        <div className="mb-5 flex flex-col items-center gap-4 border-b pb-5 text-center sm:flex-row sm:text-left">
          <img
            alt={user.name}
            className="h-24 w-24 rounded-full border object-cover"
            src={user.profilePicture}
          />
          <div className="min-w-0">
            <h2 className="app-strong-text text-xl font-bold">{user.name}</h2>
            <p className="app-muted-text break-all text-sm">{user.email}</p>
            <span className="mt-2 inline-flex rounded-full border border-red-600 px-3 py-1 text-xs font-semibold text-red-600">
              {user.status}
            </span>
          </div>
        </div>
        <h2 className="app-strong-text mb-4 text-lg font-bold">Profile Information</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <InfoCard label="Name" value={user.name} />
          <InfoCard label="Email" value={user.email} />
          <InfoCard label="Role" value={user.role} />
          <InfoCard label="Status" value={user.status} />
          <InfoCard label="Joined Date" value={formatDate(user.createdAt)} />
        </div>
      </section>
      <section className="admin-card mt-5 rounded border p-5">
        <h2 className="app-strong-text mb-4 text-lg font-bold">Quiz Statistics</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <InfoCard label="Games Played" value={stats.gamesPlayed} />
          <InfoCard label="Average Accuracy" value={`${stats.averageAccuracy}%`} />
          <InfoCard label="Highest Score" value={stats.highestScore} />
          <InfoCard label="Events Joined" value={stats.eventsJoined} />
          <InfoCard label="Challenges Played" value={stats.challengesPlayed} />
        </div>
      </section>
      <section className="admin-card mt-5 rounded border p-5">
        <h2 className="app-strong-text mb-4 text-lg font-bold">Account Actions</h2>
        <div className="flex flex-wrap gap-3">
          {user.isDeleted ? (
            <button className="rounded bg-red-600 px-4 py-2 text-white disabled:opacity-60" disabled={actionLoading} onClick={() => runAction("patch", `/api/admin/users/${user._id}/restore`, "User restored", "Restoring user...")}>Restore</button>
          ) : user.isActive ? (
            <button className="rounded bg-red-600 px-4 py-2 text-white disabled:opacity-60" disabled={actionLoading} onClick={() => runAction("patch", `/api/admin/users/${user._id}/deactivate`, "User deactivated", "Deactivating user...")}>Deactivate</button>
          ) : (
            <button className="rounded bg-red-600 px-4 py-2 text-white disabled:opacity-60" disabled={actionLoading} onClick={() => runAction("patch", `/api/admin/users/${user._id}/activate`, "User activated", "Activating user...")}>Activate</button>
          )}
          {!user.isDeleted && (
            <button className="analysis-outline-button rounded border border-red-600 px-4 py-2 text-red-600 disabled:opacity-60" disabled={actionLoading} onClick={() => setConfirmSoftDelete(true)}>Soft Delete</button>
          )}
        </div>
      </section>
    </div>
  );
}
