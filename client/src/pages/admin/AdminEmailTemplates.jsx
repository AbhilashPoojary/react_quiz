import React, { useEffect, useMemo, useState } from "react";
import { Eye, Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Dropdown from "../../components/Dropdown";
import apiClient from "../../utils/apiClient";

const statusOptions = ["All", "Active", "Inactive"].map((value) => ({
  category: value,
  value,
}));

const formatDate = (date) =>
  date
    ? new Intl.DateTimeFormat("en", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(date))
    : "-";

function TemplateGridSkeleton() {
  return Array.from({ length: 4 }).map((_, rowIndex) => (
    <tr className="app-table-row border-t" key={`template-skeleton-${rowIndex}`}>
      {["w-40", "w-36", "w-20", "w-32", "w-24"].map((width, columnIndex) => (
        <td className="px-4 py-3" key={`${rowIndex}-${columnIndex}`}>
          <span
            className={`block h-4 animate-pulse rounded bg-gray-300 dark:bg-gray-600 ${width}`}
          />
        </td>
      ))}
    </tr>
  ));
}

export default function AdminEmailTemplates() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await apiClient.get("/api/admin/email-templates", {
        params: { search, status },
      });
      setTemplates(response.data || []);
    } catch (err) {
      setError(err?.response?.data?.error || "Unable to load email templates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const filteredTemplates = useMemo(() => templates, [templates]);

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="app-strong-text text-2xl font-bold">
            Email Templates
          </h1>
          <p className="app-muted-text mt-1 text-sm">
            Manage database-backed transactional email content.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="admin-card mb-5 grid gap-3 rounded border p-4 md:grid-cols-[1fr_220px_auto]">
        <input
          className="app-input rounded border p-3"
          placeholder="Search by template name or key"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && loadTemplates()}
        />
        <Dropdown
          data={statusOptions}
          state={status}
          setState={setStatus}
          dropdownId="email-template-status"
        />
        <button
          className="rounded bg-red-600 px-4 py-3 text-white transition hover:bg-red-800"
          type="button"
          onClick={loadTemplates}
        >
          Search
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="app-table w-full min-w-[760px] border text-left text-sm">
          <thead className="app-table-head">
            <tr>
              <th className="px-4 py-3">Template Name</th>
              <th className="px-4 py-3">Template Key</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Last Updated</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TemplateGridSkeleton />
            ) : filteredTemplates.length ? (
              filteredTemplates.map((template) => (
                <tr className="app-table-row border-t" key={template._id}>
                  <td className="px-4 py-3 font-semibold">
                    {template.templateName}
                  </td>
                  <td className="px-4 py-3">{template.templateKey}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-semibold ${
                        template.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {template.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">{formatDate(template.updatedAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        className="analysis-outline-button inline-flex items-center gap-1 rounded border px-3 py-2 text-xs"
                        type="button"
                        onClick={() =>
                          navigate(`/admin/email-templates/${template._id}`)
                        }
                      >
                        <Eye size={14} />
                        View
                      </button>
                      <button
                        className="inline-flex items-center gap-1 rounded bg-red-600 px-3 py-2 text-xs text-white"
                        type="button"
                        onClick={() =>
                          navigate(`/admin/email-templates/${template._id}/edit`)
                        }
                      >
                        <Pencil size={14} />
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr className="app-table-row border-t">
                <td className="px-4 py-8 text-center" colSpan={5}>
                  No email templates found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
