import React, { useEffect, useRef, useState } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowLeft,
  Bold,
  Eye,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Mail,
  Save,
  Underline,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import apiClient from "../../utils/apiClient";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const sampleVariables = {
  userName: "Sample User",
  resetLink: "https://example.com/reset-password/sample-token",
  expiryMinutes: 15,
};

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

const toolbarButtons = [
  { icon: Bold, command: "bold", label: "Bold" },
  { icon: Italic, command: "italic", label: "Italic" },
  { icon: Underline, command: "underline", label: "Underline" },
  { icon: List, command: "insertUnorderedList", label: "Bullet list" },
  { icon: ListOrdered, command: "insertOrderedList", label: "Numbered list" },
  { icon: AlignLeft, command: "justifyLeft", label: "Align left" },
  { icon: AlignCenter, command: "justifyCenter", label: "Align center" },
  { icon: AlignRight, command: "justifyRight", label: "Align right" },
];

function TemplatePreview({ html }) {
  return (
    <iframe
      className="h-[460px] w-full rounded border bg-white"
      sandbox=""
      srcDoc={html || "<p>Preview will appear here.</p>"}
      title="Email preview"
    />
  );
}

export default function AdminEmailTemplateDetails({ mode = "view" }) {
  const { templateId } = useParams();
  const navigate = useNavigate();
  const editorRef = useRef(null);
  const subjectInputRef = useRef(null);
  const [template, setTemplate] = useState(null);
  const [form, setForm] = useState({
    templateName: "",
    subject: "",
    htmlBody: "",
    isActive: true,
  });
  const [preview, setPreview] = useState(null);
  const [testEmail, setTestEmail] = useState("");
  const [activeField, setActiveField] = useState("body");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [notice, setNotice] = useState({ type: "info", text: "" });

  const isEdit = mode === "edit";

  const loadTemplate = async () => {
    try {
      setLoading(true);
      setNotice({ type: "info", text: "" });
      const response = await apiClient.get(
        `/api/admin/email-templates/${templateId}`
      );
      const data = response.data;
      setTemplate(data);
      setForm({
        templateName: data.templateName || "",
        subject: data.subject || "",
        htmlBody: data.htmlBody || "",
        isActive: data.isActive !== false,
      });
    } catch (error) {
      setNotice({
        type: "error",
        text: error?.response?.data?.error || "Unable to load template",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplate();
  }, [templateId]);

  useEffect(() => {
    if (editorRef.current && isEdit) {
      editorRef.current.innerHTML = form.htmlBody;
    }
  }, [isEdit, template?._id]);

  const runCommand = (command, value = null) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    setForm((prev) => ({ ...prev, htmlBody: editorRef.current.innerHTML }));
  };

  const applyBlock = (tag) => runCommand("formatBlock", tag);

  const insertLink = () => {
    const url = window.prompt("Enter link URL", "{{resetLink}}");

    if (url) {
      runCommand("createLink", url);
    }
  };

  const insertVariable = (variable) => {
    const token = `{{${variable}}}`;

    if (activeField === "subject") {
      const input = subjectInputRef.current;
      const start = input?.selectionStart ?? form.subject.length;
      const end = input?.selectionEnd ?? form.subject.length;
      const nextSubject =
        form.subject.slice(0, start) + token + form.subject.slice(end);
      setForm((prev) => ({ ...prev, subject: nextSubject }));
      window.setTimeout(() => {
        input?.focus();
        input?.setSelectionRange(start + token.length, start + token.length);
      }, 0);
      return;
    }

    editorRef.current?.focus();
    document.execCommand("insertText", false, token);
    setForm((prev) => ({ ...prev, htmlBody: editorRef.current.innerHTML }));
  };

  const generatePreview = async () => {
    try {
      setPreviewLoading(true);
      setNotice({ type: "info", text: "" });
      const response = await apiClient.post(
        `/api/admin/email-templates/${templateId}/preview`,
        {
          ...form,
          htmlBody: editorRef.current?.innerHTML || form.htmlBody,
          variables: sampleVariables,
        }
      );
      setPreview(response.data.rendered);
    } catch (error) {
      setNotice({
        type: "error",
        text: error?.response?.data?.error || "Unable to preview template",
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  const saveTemplate = async () => {
    try {
      setSaving(true);
      setNotice({ type: "info", text: "" });
      const htmlBody = editorRef.current?.innerHTML || form.htmlBody;
      const response = await apiClient.put(
        `/api/admin/email-templates/${templateId}`,
        {
          ...form,
          htmlBody,
        }
      );
      setTemplate(response.data);
      setForm({
        templateName: response.data.templateName || "",
        subject: response.data.subject || "",
        htmlBody: response.data.htmlBody || "",
        isActive: response.data.isActive !== false,
      });
      setNotice({ type: "success", text: "Email template saved successfully" });
    } catch (error) {
      setNotice({
        type: "error",
        text: error?.response?.data?.error || "Unable to save template",
      });
    } finally {
      setSaving(false);
    }
  };

  const sendTest = async () => {
    if (!emailPattern.test(testEmail.trim())) {
      setNotice({ type: "error", text: "Enter a valid test email" });
      return;
    }

    try {
      setTestLoading(true);
      setNotice({ type: "info", text: "" });
      await apiClient.post(`/api/admin/email-templates/${templateId}/test`, {
        email: testEmail.trim(),
      });
      setNotice({ type: "success", text: "Test email sent successfully" });
    } catch (error) {
      setNotice({
        type: "error",
        text: error?.response?.data?.error || "Unable to send test email",
      });
    } finally {
      setTestLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <span className="block h-8 w-52 animate-pulse rounded bg-gray-300 dark:bg-gray-600" />
        <span className="block h-80 w-full animate-pulse rounded bg-gray-300 dark:bg-gray-600" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="rounded border p-6 text-center">
        {notice.text || "Email template not found"}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <button
            className="analysis-outline-button mb-3 inline-flex items-center gap-2 rounded border px-3 py-2 text-sm"
            type="button"
            onClick={() => navigate("/admin/email-templates")}
          >
            <ArrowLeft size={16} />
            Back to Templates
          </button>
          <h1 className="app-strong-text text-2xl font-bold">
            {isEdit ? "Edit Email Template" : "View Email Template"}
          </h1>
          <p className="app-muted-text mt-1 text-sm">
            {template.templateName} - {template.templateKey}
          </p>
        </div>
        {!isEdit && (
          <button
            className="rounded bg-red-600 px-4 py-2 text-white"
            type="button"
            onClick={() => navigate(`/admin/email-templates/${templateId}/edit`)}
          >
            Edit
          </button>
        )}
      </div>

      {notice.text && (
        <div
          className={`mb-4 rounded border p-3 text-sm ${
            notice.type === "error"
              ? "border-red-300 bg-red-50 text-red-700"
              : notice.type === "success"
              ? "border-green-300 bg-green-50 text-green-700"
              : "app-muted-text"
          }`}
        >
          {notice.text}
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="admin-card rounded border p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="app-label mb-2 block text-sm font-medium">
                Template Name
              </label>
              <input
                className="app-input w-full rounded border p-3"
                disabled={!isEdit}
                value={form.templateName}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    templateName: event.target.value,
                  }))
                }
              />
            </div>
            <div>
              <label className="app-label mb-2 block text-sm font-medium">
                Template Key
              </label>
              <input
                className="app-input w-full rounded border p-3"
                disabled
                value={template.templateKey}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="app-label mb-2 block text-sm font-medium">
                Subject
              </label>
              <input
                ref={subjectInputRef}
                className="app-input w-full rounded border p-3"
                disabled={!isEdit}
                value={form.subject}
                onFocus={() => setActiveField("subject")}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, subject: event.target.value }))
                }
              />
            </div>
          </div>

          <div className="mt-5">
            <p className="app-label mb-2 text-sm font-medium">
              Available Dynamic Keys
            </p>
            <div className="flex flex-wrap gap-2">
              {(template.allowedVariables || []).map((variable) => (
                <button
                  className="rounded border border-red-600 px-3 py-1 text-sm font-semibold text-red-600 disabled:cursor-default disabled:opacity-70"
                  disabled={!isEdit}
                  key={variable}
                  type="button"
                  onClick={() => insertVariable(variable)}
                >
                  {`{{${variable}}}`}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <label className="app-label mb-2 block text-sm font-medium">
              Email Content
            </label>
            {isEdit && (
              <div className="mb-2 flex flex-wrap gap-2 rounded border p-2">
                <button className="rounded border px-2 py-1 text-sm" type="button" onClick={() => applyBlock("h2")}>H2</button>
                <button className="rounded border px-2 py-1 text-sm" type="button" onClick={() => applyBlock("p")}>P</button>
                {toolbarButtons.map(({ icon: Icon, command, label }) => (
                  <button
                    className="rounded border p-2"
                    key={command}
                    title={label}
                    type="button"
                    onClick={() => runCommand(command)}
                  >
                    <Icon size={16} />
                  </button>
                ))}
                <button
                  className="inline-flex items-center gap-1 rounded border px-2 py-1 text-sm"
                  type="button"
                  onClick={insertLink}
                >
                  <LinkIcon size={16} />
                  Link
                </button>
              </div>
            )}
            {isEdit ? (
              <div
                ref={editorRef}
                className="app-input min-h-[300px] overflow-auto rounded border p-4"
                contentEditable
                suppressContentEditableWarning
                onFocus={() => setActiveField("body")}
                onInput={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    htmlBody: event.currentTarget.innerHTML,
                  }))
                }
              />
            ) : (
              <div
                className="app-input min-h-[240px] rounded border p-4"
                dangerouslySetInnerHTML={{ __html: form.htmlBody }}
              />
            )}
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="app-label inline-flex items-center gap-2 text-sm font-semibold">
              <input
                checked={form.isActive}
                disabled={!isEdit}
                type="checkbox"
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    isActive: event.target.checked,
                  }))
                }
              />
              Active
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                className="analysis-outline-button inline-flex items-center justify-center gap-2 rounded border border-red-600 px-4 py-2 text-red-600"
                disabled={previewLoading}
                type="button"
                onClick={generatePreview}
              >
                <Eye size={16} />
                {previewLoading ? "Previewing..." : "Preview"}
              </button>
              {isEdit && (
                <button
                  className="inline-flex items-center justify-center gap-2 rounded bg-red-600 px-4 py-2 text-white disabled:opacity-60"
                  disabled={saving}
                  type="button"
                  onClick={saveTemplate}
                >
                  <Save size={16} />
                  {saving ? "Saving..." : "Save"}
                </button>
              )}
            </div>
          </div>

          <div className="app-muted-text mt-4 text-sm">
            Last updated: {formatDate(template.updatedAt)}
          </div>
        </section>

        <aside className="space-y-5">
          <section className="admin-card rounded border p-5">
            <h2 className="app-strong-text mb-3 text-lg font-bold">
              Preview Email
            </h2>
            <TemplatePreview html={preview?.html} />
          </section>

          <section className="admin-card rounded border p-5">
            <h2 className="app-strong-text mb-3 text-lg font-bold">
              Send Test Email
            </h2>
            <div className="flex flex-col gap-3">
              <input
                className="app-input rounded border p-3"
                placeholder="admin@example.com"
                value={testEmail}
                onChange={(event) => setTestEmail(event.target.value)}
              />
              <button
                className="inline-flex items-center justify-center gap-2 rounded bg-red-600 px-4 py-2 text-white disabled:opacity-60"
                disabled={testLoading}
                type="button"
                onClick={sendTest}
              >
                <Mail size={16} />
                {testLoading ? "Sending..." : "Send Test"}
              </button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
