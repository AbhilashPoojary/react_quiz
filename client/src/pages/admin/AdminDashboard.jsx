import React, { useEffect, useMemo, useState } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import { CustomRadio } from "../../components/CustomSelectionControls";
import apiClient from "../../utils/apiClient";

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const topCards = [
  { label: "Total Users", key: "totalUsers" },
  { label: "Active Users", key: "activeUsers" },
  { label: "Quiz Attempts", key: "quizAttempts" },
  { label: "Total Challenges", key: "totalChallenges" },
];

const secondaryCards = [
  { label: "Avg Quiz Accuracy", key: "averageQuizAccuracy", suffix: "%" },
  { label: "Avg Challenge Accuracy", key: "averageChallengeAccuracy", suffix: "%" },
  { label: "Completed Events", key: "completedEvents" },
  { label: "Completed Challenges", key: "completedChallenges" },
];

const chartColors = ["#dc2626", "#2563eb", "#16a34a", "#f59e0b", "#7c3aed"];

const formatDateTime = (value) => {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

const getTimeUntil = (value) => {
  if (!value) return "-";
  const diff = new Date(value).getTime() - Date.now();
  if (diff <= 0) return "Starting soon";
  const minutes = Math.floor(diff / 60000);
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const remainingMinutes = minutes % 60;
  if (days) return `${days}d ${hours}h`;
  if (hours) return `${hours}h ${remainingMinutes}m`;
  return `${remainingMinutes}m`;
};

const getShortCategoryLabel = (label) => {
  if (!label) return "";
  const normalized = String(label).replace(/^Entertainment:\s*/i, "").trim();
  const [firstPart] = normalized.split(/[:/-]/);
  return firstPart.trim().split(/\s+/)[0] || normalized;
};

function SummaryCard({ label, value, loading, suffix = "" }) {
  return (
    <div className="admin-card rounded border p-5">
      <p className="app-muted-text text-sm">{label}</p>
      {loading ? (
        <div className="mt-3 h-9 w-20 animate-pulse rounded bg-gray-300 dark:bg-gray-600" />
      ) : (
        <p className="app-strong-text mt-3 text-3xl font-bold">
          {`${value || 0}${suffix}`}
        </p>
      )}
    </div>
  );
}

function SkeletonBlock({ className = "", ...props }) {
  return (
    <span
      className={`block animate-pulse rounded bg-gray-300 dark:bg-gray-600 ${className}`}
      {...props}
    />
  );
}

function ChartPanel({ title, children }) {
  return (
    <section className="admin-card rounded border p-5">
      <h2 className="app-strong-text mb-4 text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

function UpcomingEventsSkeleton() {
  return (
    <div className="grid gap-3 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div className="rounded border p-4" key={`upcoming-event-skeleton-${index}`}>
          <SkeletonBlock className="h-5 w-3/4" />
          <SkeletonBlock className="mt-2 h-4 w-1/2" />
          <div className="mt-4 space-y-2">
            <SkeletonBlock className="h-4 w-full" />
            <SkeletonBlock className="h-4 w-2/3" />
            <SkeletonBlock className="h-4 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function DonutSkeleton() {
  return (
    <div className="flex h-72 items-center justify-center">
      <div className="relative h-48 w-48 animate-pulse rounded-full bg-gray-300 dark:bg-gray-600">
        <div className="absolute inset-10 rounded-full bg-white dark:bg-gray-800" />
      </div>
    </div>
  );
}

function BarChartSkeleton() {
  return (
    <div className="h-80 space-y-4 pt-2">
      {Array.from({ length: 7 }).map((_, index) => (
        <div className="flex items-center gap-3" key={`bar-chart-skeleton-${index}`}>
          <SkeletonBlock className="h-4 w-24 shrink-0" />
          <SkeletonBlock
            className="h-5"
            style={{ width: `${90 - index * 8}%` }}
          />
        </div>
      ))}
    </div>
  );
}

function AccuracySkeleton() {
  return (
    <div className="flex flex-wrap gap-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <div className="w-full sm:w-[calc(50%-0.5rem)]" key={`accuracy-skeleton-${index}`}>
          <div className="mb-2 flex justify-between gap-3">
            <SkeletonBlock className="h-4 w-36" />
            <SkeletonBlock className="h-4 w-10" />
          </div>
          <SkeletonBlock className="h-3 w-full rounded-full" />
        </div>
      ))}
    </div>
  );
}

function RecentActivitySkeleton() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead>
          <tr className="app-table-header border-b">
            {["Activity", "Type", "User", "Date", "Action"].map((heading) => (
              <th className="px-4 py-3" key={heading}>
                <SkeletonBlock className="h-4 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, index) => (
            <tr
              className="app-table-row border-b"
              key={`recent-activity-skeleton-${index}`}
            >
              <td className="px-4 py-4">
                <SkeletonBlock className="h-4 w-48" />
                <SkeletonBlock className="mt-2 h-3 w-64" />
              </td>
              <td className="px-4 py-4"><SkeletonBlock className="h-4 w-24" /></td>
              <td className="px-4 py-4"><SkeletonBlock className="h-4 w-32" /></td>
              <td className="px-4 py-4"><SkeletonBlock className="h-4 w-36" /></td>
              <td className="px-4 py-4"><SkeletonBlock className="h-8 w-16" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DetailRow({ label, value }) {
  if (value === undefined || value === null || value === "") return null;

  return (
    <div>
      <p className="app-muted-text text-xs uppercase">{label}</p>
      <p className="app-strong-text mt-1 break-words text-sm">{value}</p>
    </div>
  );
}

function ActivityDetailsModal({ activity, onClose }) {
  if (!activity) return null;

  const event = activity.event || {};
  const metadata = activity.metadata || {};
  const isEventActivity = activity.type === "EVENT" || activity.type === "REGISTRATION";
  const title = isEventActivity
    ? event.eventName || activity.detail
    : activity.detail || activity.label;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="admin-card max-h-[90vh] w-full max-w-2xl overflow-auto rounded border p-5 shadow-xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="app-muted-text text-xs uppercase">{activity.type}</p>
            <h2 className="app-strong-text mt-1 text-xl font-bold">{title}</h2>
            <p className="app-muted-text mt-1 text-sm">{activity.label}</p>
          </div>
          <button className="text-red-600" type="button" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DetailRow label="User" value={activity.user?.name} />
          <DetailRow label="Email" value={activity.user?.email} />
          <DetailRow label="Activity Date" value={formatDateTime(activity.createdAt)} />

          {isEventActivity ? (
            <>
              <DetailRow label="Category" value={event.categoryName} />
              <DetailRow label="Difficulty" value={event.difficulty} />
              <DetailRow label="Status" value={event.status} />
              <DetailRow label="Questions" value={event.questionCount} />
              <DetailRow label="Type" value={event.questionType} />
              <DetailRow label="Duration" value={event.duration ? `${event.duration} mins` : ""} />
              <DetailRow label="Registered Users" value={event.registeredUsers} />
              <DetailRow label="Start" value={formatDateTime(event.startAt)} />
              <DetailRow label="End" value={formatDateTime(event.endAt)} />
              <DetailRow
                label="Registration Deadline"
                value={formatDateTime(event.registrationDeadline)}
              />
              <div className="sm:col-span-2">
                <DetailRow label="Description" value={event.description} />
              </div>
            </>
          ) : activity.type === "CHALLENGE" ? (
            <>
              <DetailRow label="Challenge Code" value={metadata.challengeCode} />
              <DetailRow label="Status" value={metadata.status} />
              <DetailRow label="Category" value={metadata.categoryName} />
              <DetailRow label="Difficulty" value={metadata.difficulty} />
              <DetailRow label="Questions" value={metadata.questionCount} />
              <DetailRow label="Duration" value={metadata.duration ? `${metadata.duration} mins` : ""} />
              <DetailRow label="Correct" value={metadata.correctAnswers} />
              <DetailRow label="Wrong" value={metadata.wrongAnswers} />
            </>
          ) : (
            <>
              <DetailRow label="Category" value={metadata.category} />
              <DetailRow label="Difficulty" value={metadata.difficulty} />
              <DetailRow
                label="Score"
                value={
                  metadata.score !== undefined
                    ? `${metadata.score} / ${metadata.maxScore || 0}`
                    : ""
                }
              />
              <DetailRow label="Accuracy" value={metadata.accuracy !== undefined ? `${metadata.accuracy}%` : ""} />
              <DetailRow
                label="Correct"
                value={
                  metadata.correctAnswers !== undefined
                    ? `${metadata.correctAnswers} / ${metadata.questionCount || 0}`
                    : ""
                }
              />
              <DetailRow label="Wrong" value={metadata.wrongAnswers} />
              <DetailRow label="Time Taken" value={metadata.timeTaken ? `${metadata.timeTaken}s` : ""} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function DonutWithTotal({ data, options, total }) {
  return (
    <div className="flex h-72 justify-center">
      <div className="relative h-full w-full max-w-[320px]">
        <Doughnut data={data} options={options} />
        <div className="pointer-events-none absolute left-1/2 top-[43%] -translate-x-1/2 -translate-y-1/2">
        <div className="text-center">
          <p className="app-strong-text text-3xl font-bold">{total}</p>
          <p className="app-muted-text text-xs">Total</p>
        </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    completedEvents: 0,
    quizAttempts: 0,
    averageQuizAccuracy: 0,
    quizActivityByCategory: [],
    categoryAccuracy: [],
    upcomingEventCards: [],
    recentActivity: [],
    totalChallenges: 0,
    completedChallenges: 0,
    averageChallengeAccuracy: 0,
    charts: { events: [], challenges: [] },
  });
  const [loading, setLoading] = useState(true);
  const [setupVersion, setSetupVersion] = useState("V1");
  const [setupSaving, setSetupSaving] = useState(false);
  const [setupMessage, setSetupMessage] = useState("");
  const [selectedActivity, setSelectedActivity] = useState(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [dashboardResponse, settingResponse] = await Promise.all([
          apiClient.get("/api/admin/dashboard"),
          apiClient.get("/api/settings/quiz-setup-version"),
        ]);
        setStats(dashboardResponse.data);
        setSetupVersion(
          settingResponse.data?.quizSetupVersion === "V2" ? "V2" : "V1"
        );
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const updateSetupVersion = async (version) => {
    if (version === setupVersion || setupSaving) {
      return;
    }

    try {
      setSetupSaving(true);
      setSetupMessage("");
      const response = await apiClient.patch("/api/admin/settings/quiz-setup-version", {
        quizSetupVersion: version,
      });
      setSetupVersion(response.data?.quizSetupVersion || version);
      setSetupMessage("Quiz setup version updated");
    } catch (error) {
      setSetupMessage(error?.response?.data?.error || "Unable to update setup version");
    } finally {
      setSetupSaving(false);
    }
  };

  const eventTotal = (stats.charts?.events || []).reduce(
    (sum, item) => sum + Number(item.value || 0),
    0
  );
  const challengeTotal = (stats.charts?.challenges || []).reduce(
    (sum, item) => sum + Number(item.value || 0),
    0
  );
  const eventChartData = useMemo(
    () => ({
      labels: (stats.charts?.events || []).map((item) => item.label),
      datasets: [
        {
          data: (stats.charts?.events || []).map((item) => item.value),
          backgroundColor: chartColors,
          borderWidth: 0,
        },
      ],
    }),
    [stats]
  );
  const challengeChartData = useMemo(
    () => ({
      labels: (stats.charts?.challenges || []).map((item) => item.label),
      datasets: [
        {
          data: (stats.charts?.challenges || []).map((item) => item.value),
          backgroundColor: chartColors,
          borderWidth: 0,
        },
      ],
    }),
    [stats]
  );
  const activityChartData = useMemo(
    () => ({
      labels: (stats.quizActivityByCategory || []).map((item) => item.category),
      datasets: [
        {
          label: "Attempts",
          data: (stats.quizActivityByCategory || []).map((item) => item.attempts),
          backgroundColor: "#dc2626",
          borderRadius: 4,
        },
      ],
    }),
    [stats]
  );
  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "68%",
    plugins: {
      legend: { position: "bottom" },
    },
  };
  const horizontalBarOptions = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: (items) => items?.[0]?.label || "",
        },
      },
    },
    scales: {
      x: { beginAtZero: true },
      y: {
        ticks: {
          callback(value) {
            const label = this.getLabelForValue(value);
            return getShortCategoryLabel(label);
          },
        },
      },
    },
  };

  return (
    <div>
      <h1 className="app-strong-text mb-5 text-2xl font-bold">
        Admin Dashboard
      </h1>

      <section className="admin-card mb-6 rounded border p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="app-strong-text text-lg font-bold">Quiz Setup Version</h2>
            <p className="app-muted-text text-sm">
              Choose which quiz setup experience regular users receive.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {["V1", "V2"].map((version) => (
              <div
                className={`rounded border px-4 py-3 transition ${
                  setupVersion === version
                    ? "border-red-600 bg-red-600/10"
                    : "analysis-outline-button border-red-600"
                }`}
                key={version}
              >
                <CustomRadio
                  checked={setupVersion === version}
                  disabled={setupSaving}
                  label={version === "V1" ? "V1 - Classic" : "V2 - Enhanced"}
                  name="admin-quiz-setup-version"
                  value={version}
                  onChange={updateSetupVersion}
                />
              </div>
            ))}
          </div>
        </div>
        {setupSaving ? (
          <SkeletonBlock className="mt-3 h-4 w-48" />
        ) : setupMessage && (
          <p className="app-muted-text mt-3 text-sm">{setupMessage}</p>
        )}
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {topCards.map((card) => (
          <SummaryCard
            key={card.key}
            label={card.label}
            value={stats[card.key]}
            loading={loading}
          />
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {secondaryCards.map((card) => (
          <SummaryCard
            key={card.key}
            label={card.label}
            value={stats[card.key]}
            suffix={card.suffix}
            loading={loading}
          />
        ))}
      </div>

      <section className="admin-card mt-6 rounded border p-5">
        <h2 className="app-strong-text mb-4 text-lg font-bold">Upcoming Events</h2>
        {loading ? (
          <UpcomingEventsSkeleton />
        ) : stats.upcomingEventCards?.length ? (
          <div className="grid gap-3 lg:grid-cols-3">
            {stats.upcomingEventCards.map((event) => (
              <div className="rounded border p-4" key={event._id}>
                <h3 className="app-strong-text truncate font-semibold">
                  {event.eventName}
                </h3>
                <p className="app-muted-text mt-1 text-sm">{event.categoryName}</p>
                <div className="mt-3 space-y-1 text-sm">
                  <p>
                    <span className="app-muted-text">Start:</span>{" "}
                    {formatDateTime(event.startAt)}
                  </p>
                  <p>
                    <span className="app-muted-text">Registered:</span>{" "}
                    {event.registeredUsers}
                  </p>
                  <p>
                    <span className="app-muted-text">Starts in:</span>{" "}
                    {getTimeUntil(event.startAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="app-muted-text rounded border p-4 text-center">
            No upcoming events
          </p>
        )}
      </section>

      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <ChartPanel title="Event Status">
          {loading ? (
            <DonutSkeleton />
          ) : (
            <DonutWithTotal
              data={eventChartData}
              options={donutOptions}
              total={eventTotal}
            />
          )}
        </ChartPanel>
        <ChartPanel title="Challenge Status">
          {loading ? (
            <DonutSkeleton />
          ) : (
            <DonutWithTotal
              data={challengeChartData}
              options={donutOptions}
              total={challengeTotal}
            />
          )}
        </ChartPanel>
      </div>

      <div className="mt-6">
        <ChartPanel title="Quiz Activity by Category">
          {loading ? (
            <BarChartSkeleton />
          ) : (
            <div className="h-80">
              <Bar data={activityChartData} options={horizontalBarOptions} />
            </div>
          )}
        </ChartPanel>
      </div>

      <section className="admin-card mt-6 rounded border p-5">
        <h2 className="app-strong-text text-lg font-bold">
          Category Accuracy
        </h2>
        {loading ? (
          <div className="mt-4">
            <AccuracySkeleton />
          </div>
        ) : stats.categoryAccuracy?.length ? (
          <div className="space-y-4 flex flex-wrap gap-1 items-baseline">
            {stats.categoryAccuracy.map((item) => (
              <div key={item.category} className="w-[calc(50%-0.125rem)]">
                <div className="mb-1 flex justify-between gap-3 text-sm">
                  <span className="app-strong-text truncate font-medium">
                    {item.category}
                  </span>
                  <span className="app-muted-text shrink-0">
                    {item.averageAccuracy}%
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full bg-red-600"
                    style={{
                      width: `${Math.max(
                        0,
                        Math.min(100, item.averageAccuracy || 0)
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="app-muted-text rounded border p-4 text-center">
            No category accuracy data yet.
          </p>
        )}
      </section>

      <section className="admin-card mt-6 rounded border p-5">
        <h2 className="app-strong-text mb-4 text-lg font-bold">Recent Activity</h2>
        {loading ? (
          <RecentActivitySkeleton />
        ) : stats.recentActivity?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="app-table-header border-b">
                  <th className="px-4 py-3">Activity</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentActivity.map((item, index) => (
                  <tr
                    className="app-table-row border-b last:border-b-0"
                    key={`${item.type}-${item.createdAt}-${index}`}
                  >
                    <td className="max-w-[280px] px-4 py-4">
                      <p className="app-strong-text truncate font-semibold" title={item.label}>
                        {item.label}
                      </p>
                      <p className="app-muted-text mt-1 truncate" title={item.detail}>
                        {item.detail}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded-full border border-red-600/30 px-2.5 py-1 text-xs font-semibold text-red-600">
                        {item.type}
                      </span>
                    </td>
                    <td className="max-w-[180px] px-4 py-4">
                      <p className="app-strong-text truncate" title={item.user?.name || "Unknown User"}>
                        {item.user?.name || "Unknown User"}
                      </p>
                      {item.user?.email && (
                        <p className="app-muted-text truncate text-xs" title={item.user.email}>
                          {item.user.email}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {formatDateTime(item.createdAt)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        className="analysis-outline-button rounded border border-red-600 px-3 py-2 text-red-600"
                        type="button"
                        onClick={() => setSelectedActivity(item)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="app-muted-text rounded border p-4 text-center">
            No recent activity
          </p>
        )}
      </section>

      <ActivityDetailsModal
        activity={selectedActivity}
        onClose={() => setSelectedActivity(null)}
      />
    </div>
  );
}
