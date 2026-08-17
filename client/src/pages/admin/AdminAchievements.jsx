import React, { useEffect, useMemo, useState } from "react";
import { Edit, Plus, Trophy } from "lucide-react";
import apiClient from "../../utils/apiClient";
import LoadingOverlay from "../../components/LoadingOverlay";

const conditionOptions = [
  "QUIZ_COUNT",
  "STREAK",
  "ACCURACY",
  "DIFFICULTY_ACCURACY_COUNT",
  "QUIZ_TYPE_COUNT",
  "CHALLENGE_WIN_COUNT",
  "GLOBAL_RANK",
];

const emptyForm = {
  name: "",
  code: "",
  description: "",
  icon: "🏅",
  conditionType: "QUIZ_COUNT",
  target: 1,
  threshold: "",
  difficulty: "",
  quizType: "",
  minimumQuestions: "",
  displayOrder: 0,
  active: true,
};

const needsThreshold = (type) => ["ACCURACY", "DIFFICULTY_ACCURACY_COUNT"].includes(type);

function AchievementForm({ editing, loading, errors, onClose, onSubmit }) {
  const [form, setForm] = useState(editing || emptyForm);
  const type = form.conditionType;

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        className="admin-card max-h-[90vh] w-full max-w-2xl overflow-auto rounded border p-5 shadow-xl"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(form);
        }}
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="app-strong-text text-xl font-bold">
            {editing?._id ? "Edit Achievement" : "Add Achievement"}
          </h2>
          <button className="text-red-600" type="button" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Achievement Name" error={errors.name}>
            <input className="app-input w-full rounded border p-2" value={form.name} onChange={(e) => update("name", e.target.value)} />
          </Field>
          <Field label="Code" error={errors.code}>
            <input className="app-input w-full rounded border p-2 uppercase" value={form.code} onChange={(e) => update("code", e.target.value.toUpperCase())} />
          </Field>
          <Field label="Icon / Emoji">
            <input className="app-input w-full rounded border p-2" value={form.icon} onChange={(e) => update("icon", e.target.value)} />
          </Field>
          <Field label="Condition Type" error={errors.conditionType}>
            <select className="app-input w-full rounded border p-2" value={type} onChange={(e) => update("conditionType", e.target.value)}>
              {conditionOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
          </Field>
          <Field label="Description" error={errors.description} className="sm:col-span-2">
            <textarea className="app-input min-h-[90px] w-full rounded border p-2" value={form.description} onChange={(e) => update("description", e.target.value)} />
          </Field>
          <Field label={type === "STREAK" ? "Target Days" : "Target Count"} error={errors.target}>
            <input className="app-input w-full rounded border p-2" type="number" min="1" value={form.target} onChange={(e) => update("target", e.target.value)} />
          </Field>
          {needsThreshold(type) && (
            <Field label="Accuracy Threshold" error={errors.threshold}>
              <input className="app-input w-full rounded border p-2" type="number" min="0" max="100" value={form.threshold} onChange={(e) => update("threshold", e.target.value)} />
            </Field>
          )}
          {type === "DIFFICULTY_ACCURACY_COUNT" && (
            <Field label="Difficulty" error={errors.difficulty}>
              <select className="app-input w-full rounded border p-2" value={form.difficulty || ""} onChange={(e) => update("difficulty", e.target.value)}>
                <option value="">Select</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </Field>
          )}
          {type === "QUIZ_TYPE_COUNT" && (
            <Field label="Quiz Type" error={errors.quizType}>
              <select className="app-input w-full rounded border p-2" value={form.quizType || ""} onChange={(e) => update("quizType", e.target.value)}>
                <option value="">Select</option>
                <option value="NORMAL">Normal</option>
                <option value="SPIN">Spin</option>
                <option value="CHALLENGE">Challenge</option>
                <option value="EVENT">Event</option>
              </select>
            </Field>
          )}
          {type === "ACCURACY" && (
            <Field label="Minimum Questions" error={errors.minimumQuestions}>
              <input className="app-input w-full rounded border p-2" type="number" min="1" value={form.minimumQuestions} onChange={(e) => update("minimumQuestions", e.target.value)} />
            </Field>
          )}
          <Field label="Display Order">
            <input className="app-input w-full rounded border p-2" type="number" value={form.displayOrder} onChange={(e) => update("displayOrder", e.target.value)} />
          </Field>
          <Field label="Status">
            <select className="app-input w-full rounded border p-2" value={form.active ? "ACTIVE" : "INACTIVE"} onChange={(e) => update("active", e.target.value === "ACTIVE")}>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </Field>
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button className="rounded border px-4 py-2" type="button" onClick={onClose}>Cancel</button>
          <button className="rounded bg-red-600 px-4 py-2 text-white disabled:opacity-60" disabled={loading} type="submit">
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, error, className = "", children }) {
  return (
    <label className={className}>
      <span className="app-label mb-1 block text-sm font-medium">{label}</span>
      {children}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </label>
  );
}

export default function AdminAchievements() {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [errors, setErrors] = useState({});
  const sortedAchievements = useMemo(
    () => [...achievements].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)),
    [achievements]
  );

  const loadAchievements = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/api/admin/achievements");
      setAchievements(response.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAchievements();
  }, []);

  const saveAchievement = async (form) => {
    try {
      setSaving(true);
      setErrors({});
      if (form._id) {
        await apiClient.put(`/api/admin/achievements/${form._id}`, form);
      } else {
        await apiClient.post("/api/admin/achievements", form);
      }
      setEditing(null);
      await loadAchievements();
    } catch (error) {
      setErrors(error?.response?.data?.errors || { form: "Unable to save achievement" });
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (achievement) => {
    await apiClient.patch(`/api/admin/achievements/${achievement._id}/status`, {
      active: !achievement.active,
    });
    await loadAchievements();
  };

  return (
    <div>
      <LoadingOverlay show={saving} message="Saving achievement..." />
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="app-strong-text flex items-center gap-2 text-2xl font-bold">
            <Trophy className="text-red-600" />
            Achievements
          </h1>
          <p className="app-muted-text mt-1">Configure backend-driven badges and progress rules.</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded bg-red-600 px-4 py-2 text-white" onClick={() => setEditing(emptyForm)} type="button">
          <Plus size={16} />
          Add Achievement
        </button>
      </div>

      <div className="overflow-x-auto rounded border">
        <table className="app-table w-full min-w-[900px] text-left text-sm">
          <thead className="app-table-head bg-gray-50 text-xs uppercase">
            <tr>
              <th className="px-4 py-3">Achievement</th>
              <th className="px-4 py-3">Condition</th>
              <th className="px-4 py-3">Target</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <tr className="app-table-row border-t" key={index}>
                  <td className="px-4 py-4"><div className="h-4 w-40 animate-pulse rounded bg-gray-300" /></td>
                  <td className="px-4 py-4"><div className="h-4 w-32 animate-pulse rounded bg-gray-300" /></td>
                  <td className="px-4 py-4"><div className="h-4 w-12 animate-pulse rounded bg-gray-300" /></td>
                  <td className="px-4 py-4"><div className="h-4 w-16 animate-pulse rounded bg-gray-300" /></td>
                  <td className="px-4 py-4"><div className="h-4 w-8 animate-pulse rounded bg-gray-300" /></td>
                  <td className="px-4 py-4"><div className="h-8 w-20 animate-pulse rounded bg-gray-300" /></td>
                </tr>
              ))
            ) : sortedAchievements.map((achievement) => (
              <tr className="app-table-row border-t" key={achievement._id}>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{achievement.icon}</span>
                    <div>
                      <p className="app-strong-text font-semibold">{achievement.name}</p>
                      <p className="app-muted-text text-xs">{achievement.code}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">{achievement.conditionType}</td>
                <td className="px-4 py-4">{achievement.target}</td>
                <td className="px-4 py-4">
                  <button className={`rounded px-3 py-1 text-xs font-semibold ${achievement.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`} onClick={() => toggleStatus(achievement)} type="button">
                    {achievement.active ? "ACTIVE" : "INACTIVE"}
                  </button>
                </td>
                <td className="px-4 py-4">{achievement.displayOrder}</td>
                <td className="px-4 py-4">
                  <button className="inline-flex items-center gap-1 rounded border px-3 py-2 text-red-600" onClick={() => setEditing(achievement)} type="button">
                    <Edit size={15} />
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <AchievementForm
          editing={editing}
          errors={errors}
          loading={saving}
          onClose={() => {
            setEditing(null);
            setErrors({});
          }}
          onSubmit={saveAchievement}
        />
      )}
    </div>
  );
}
