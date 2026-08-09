import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../utils/apiClient";
import Dropdown from "./Dropdown";
import InputCheckbox from "./InputCheckbox";
import DatePickerInput from "./DatePickerInput";
import TimePickerInput from "./TimePickerInput";
import InputText from "./InputText";

const initialFormState = {
  eventName: "",
  description: "",
  categoryId: "",
  categoryName: "",
  difficulty: "",
  questionCount: "",
  questionType: "",
  duration: "",
  eventDate: "",
  startTime: "",
  registrationDeadline: "",
  notifyUsers: false,
};

const difficultyOptions = [
  { category: "Select", value: "" },
  { category: "Easy", value: "easy" },
  { category: "Medium", value: "medium" },
  { category: "Hard", value: "hard" },
];

const questionTypeOptions = [
  { category: "Select", value: "" },
  { category: "Multiple Choice", value: "multiple" },
  { category: "True / False", value: "boolean" },
];

const pad = (value) => String(value).padStart(2, "0");

const getTodayValue = () => {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
    now.getDate()
  )}`;
};

const getCurrentTimeValue = () => {
  const now = new Date();
  return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
};

const toMinutes = (value) => {
  if (!value) {
    return null;
  }

  const [hours, minutes] = value.split(":").map(Number);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }

  return hours * 60 + minutes;
};

const buildErrors = (formState) => {
  const errors = {};
  const todayValue = getTodayValue();
  const labels = {
    eventName: "Event Name",
    description: "Description",
    categoryId: "Category",
    difficulty: "Difficulty",
    questionCount: "Question Count",
    questionType: "Question Type",
    duration: "Duration",
    eventDate: "Event Date",
    startTime: "Start Time",
    registrationDeadline: "Registration Deadline",
  };

  Object.entries(labels).forEach(([field, label]) => {
    if (
      formState[field] === undefined ||
      formState[field] === null ||
      formState[field] === ""
    ) {
      errors[field] = `${label} is mandatory`;
    }
  });

  if (formState.eventDate && formState.eventDate < todayValue) {
    errors.eventDate = "Event Date cannot be in the past";
  }

  if (
    formState.eventDate === todayValue &&
    formState.startTime &&
    toMinutes(formState.startTime) <= toMinutes(getCurrentTimeValue())
  ) {
    errors.startTime = "Start Time must be in the future";
  }

  if (
    formState.registrationDeadline &&
    formState.registrationDeadline < todayValue
  ) {
    errors.registrationDeadline = "Registration Deadline cannot be in the past";
  }

  return errors;
};

export default function EventForm({ eventId }) {
  const navigate = useNavigate();
  const [formState, setFormState] = useState(initialFormState);
  const [categories, setCategories] = useState([{ category: "Select", value: "" }]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(Boolean(eventId));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "info", text: "" });
  const [effectiveStatus, setEffectiveStatus] = useState("");
  const todayValue = getTodayValue();
  const minStartTime =
    formState.eventDate === todayValue ? getCurrentTimeValue() : "";

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch("https://opentdb.com/api_category.php");
        const payload = await response.json();
        const mappedCategories = (payload.trivia_categories || []).map((item) => ({
          category: item.name,
          value: item.id,
        }));
        setCategories([{ category: "Select", value: "" }, ...mappedCategories]);
      } catch (error) {
        setMessage({
          type: "error",
          text: "Unable to load OpenTDB categories",
        });
      }
    };

    loadCategories();
  }, []);

  useEffect(() => {
    const loadEvent = async () => {
      if (!eventId) {
        return;
      }

      try {
        setLoading(true);
        const response = await apiClient.get(`/api/admin/events/${eventId}`);
        const event = response.data;
        setEffectiveStatus(event.effectiveStatus || event.status || "");
        setFormState({
          eventName: event.eventName || "",
          description: event.description || "",
          categoryId: event.categoryId || "",
          categoryName: event.categoryName || "",
          difficulty: event.difficulty || "",
          questionCount: event.questionCount || "",
          questionType: event.questionType || "",
          duration: event.duration || "",
          eventDate: event.eventDate ? event.eventDate.slice(0, 10) : "",
          startTime: event.startTime || "",
          registrationDeadline: event.registrationDeadline
            ? event.registrationDeadline.slice(0, 10)
            : "",
          notifyUsers: Boolean(event.notifyUsers),
        });
      } catch (error) {
        setMessage({
          type: "error",
          text: error?.response?.data?.error || "Unable to load event",
        });
      } finally {
        setLoading(false);
      }
    };

    loadEvent();
  }, [eventId]);

  const updateField = (field, value) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
    setMessage({ type: "info", text: "" });
  };

  const handleEventDateChange = (value) => {
    setFormState((prev) => {
      const nextState = { ...prev, eventDate: value };
      const minTime = value === todayValue ? getCurrentTimeValue() : "";

      if (
        minTime &&
        nextState.startTime &&
        toMinutes(nextState.startTime) <= toMinutes(minTime)
      ) {
        nextState.startTime = "";
      }

      return nextState;
    });
    setErrors((prev) => ({ ...prev, eventDate: "", startTime: "" }));
    setMessage({ type: "info", text: "" });
  };

  const handleCategoryChange = (value) => {
    const selectedCategory = categories.find((item) => item.value === value);
    setFormState((prev) => ({
      ...prev,
      categoryId: value,
      categoryName: selectedCategory?.category || "",
    }));
    setErrors((prev) => ({ ...prev, categoryId: "" }));
  };

  const saveEvent = async () => {
    const validationErrors = buildErrors(formState);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return null;
    }

    const payload = {
      ...formState,
      categoryId: Number(formState.categoryId),
      questionCount: Number(formState.questionCount),
      duration: Number(formState.duration),
    };

    if (eventId) {
      const response = await apiClient.put(`/api/admin/events/${eventId}`, payload);
      return response.data;
    }

    const response = await apiClient.post("/api/admin/events", payload);
    return response.data;
  };

  const handleSaveDraft = async () => {
    try {
      setSaving(true);
      const savedEvent = await saveEvent();

      if (!savedEvent) {
        return;
      }

      setMessage({ type: "success", text: "Event draft saved successfully" });
      navigate("/admin/events");
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error?.response?.data?.error ||
          "Unable to save event draft",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    try {
      setSaving(true);
      const savedEvent = await saveEvent();

      if (!savedEvent) {
        return;
      }

      await apiClient.post(`/api/admin/events/${savedEvent._id}/publish`);
      setMessage({ type: "success", text: "Event published successfully" });
      navigate("/admin/events");
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error?.response?.data?.error ||
          "Unable to publish event",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="app-muted-text py-8">Loading event...</div>;
  }

  if (["LIVE", "COMPLETED"].includes(effectiveStatus)) {
    return (
      <div className="admin-card rounded border p-6 text-center">
        <h2 className="app-strong-text mb-2 text-xl font-bold">
          Event cannot be edited
        </h2>
        <p className="app-muted-text mb-5 text-sm">
          Live and completed events are locked to protect participant results.
        </p>
        <Link
          className="inline-block rounded bg-red-600 px-4 py-2 text-white transition hover:bg-red-800"
          to="/admin/events"
        >
          Back to Manage Events
        </Link>
      </div>
    );
  }

  return (
    <div className="admin-card rounded border p-4 sm:p-6">
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <InputText
          name="eventName"
          label="Event Name"
          value={formState.eventName}
          setValue={(value) => updateField("eventName", value)}
          type="text"
          required
          error={errors.eventName}
          containerClassName="mb-3"
        />

        <div className="sm:col-span-2 md:col-span-1">
          <label className="app-label mb-1 block text-sm font-medium">
            Category <span className="text-red-600">*</span>
          </label>
          <Dropdown
            data={categories}
            state={formState.categoryId}
            setState={handleCategoryChange}
            dropdownId="admin-event-category"
          />
          {errors.categoryId && (
            <p className="mt-1 text-sm text-red-600">{errors.categoryId}</p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label className="app-label mb-1 block text-sm font-medium">
            Description <span className="text-red-600">*</span>
          </label>
          <textarea
            className="app-input min-h-[100px] w-full rounded border border-gray-300 p-2.5 text-sm outline-none"
            value={formState.description}
            onChange={(event) => updateField("description", event.target.value)}
            placeholder="Describe this quiz event"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
          )}
        </div>

        <div>
          <label className="app-label mb-1 block text-sm font-medium">
            Difficulty <span className="text-red-600">*</span>
          </label>
          <Dropdown
            data={difficultyOptions}
            state={formState.difficulty}
            setState={(value) => updateField("difficulty", value)}
            dropdownId="admin-event-difficulty"
          />
          {errors.difficulty && (
            <p className="mt-1 text-sm text-red-600">{errors.difficulty}</p>
          )}
        </div>

        <InputText
          name="questionCount"
          label="Question Count"
          value={formState.questionCount}
          setValue={(value) => updateField("questionCount", value)}
          type="number"
          required
          error={errors.questionCount}
          containerClassName="mb-3"
        />

        <div>
          <label className="app-label mb-1 block text-sm font-medium">
            Question Type <span className="text-red-600">*</span>
          </label>
          <Dropdown
            data={questionTypeOptions}
            state={formState.questionType}
            setState={(value) => updateField("questionType", value)}
            dropdownId="admin-event-question-type"
          />
          {errors.questionType && (
            <p className="mt-1 text-sm text-red-600">{errors.questionType}</p>
          )}
        </div>

        <InputText
          name="duration"
          label="Duration"
          value={formState.duration}
          setValue={(value) => updateField("duration", value)}
          type="number"
          required
          error={errors.duration}
          containerClassName="mb-3"
        />

        <DatePickerInput
          name="eventDate"
          label="Event Date"
          value={formState.eventDate}
          setValue={handleEventDateChange}
          required
          error={errors.eventDate}
          containerClassName="mb-3"
          minDate={todayValue}
        />

        <TimePickerInput
          name="startTime"
          label="Start Time"
          value={formState.startTime}
          setValue={(value) => updateField("startTime", value)}
          required
          error={errors.startTime}
          containerClassName="mb-3"
          minTime={minStartTime}
        />

        <DatePickerInput
          name="registrationDeadline"
          label="Registration Deadline"
          value={formState.registrationDeadline}
          setValue={(value) => updateField("registrationDeadline", value)}
          required
          error={errors.registrationDeadline}
          containerClassName="mb-3"
          minDate={todayValue}
        />

        <div className="sm:col-span-2">
          <InputCheckbox
            value={formState.notifyUsers}
            setValue={(value) => updateField("notifyUsers", value)}
            label="Notify Users"
            name="notifyUsers"
            Tooltip={() => null}
          />
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          className="rounded border border-red-600 px-4 py-2 font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60"
          disabled={saving}
          onClick={handleSaveDraft}
        >
          {saving ? "Saving..." : "Save Draft"}
        </button>
        <button
          type="button"
          className="rounded bg-red-600 px-4 py-2 font-medium text-white transition hover:bg-red-800 disabled:opacity-60"
          disabled={saving}
          onClick={handlePublish}
        >
          {saving ? "Publishing..." : "Publish Event"}
        </button>
      </div>
    </div>
  );
}
