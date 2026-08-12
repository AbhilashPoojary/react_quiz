const EmailTemplate = require("../Modals/EmailTemplate");
const { sendMail } = require("../utils/email");

const DEFAULT_FORGOT_PASSWORD_HTML = `
  <h1>Quiz Playground</h1>
  <h2>Reset your password</h2>
  <p>Hello {{userName}},</p>
  <p>We received a request to reset your Quiz Playground password.</p>
  <p>
    <a href="{{resetLink}}" style="display:inline-block;background:#dc2626;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:6px;">
      Reset Password
    </a>
  </p>
  <p>This link expires in {{expiryMinutes}} minutes.</p>
  <p>If the button does not work, copy and paste this URL into your browser:</p>
  <p>{{resetLink}}</p>
  <p>If you did not request this password reset, you can safely ignore this email.</p>
`;

const DEFAULT_TEMPLATES = [
  {
    templateKey: "FORGOT_PASSWORD",
    templateName: "Forgot Password",
    subject: "Reset your Quiz Playground password",
    htmlBody: DEFAULT_FORGOT_PASSWORD_HTML,
    allowedVariables: ["userName", "resetLink", "expiryMinutes"],
    isActive: true,
  },
];

const sampleVariables = {
  FORGOT_PASSWORD: {
    userName: "Sample User",
    resetLink: "https://example.com/reset-password/sample-token",
    expiryMinutes: 15,
  },
};

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const stripDangerousHtml = (html = "") =>
  String(html)
    .replace(/<\s*(script|style|iframe|object|embed|link|meta)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\s*(script|style|iframe|object|embed|link|meta)[^>]*\/?\s*>/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\s+(href|src)\s*=\s*(['"])\s*javascript:[\s\S]*?\2/gi, ' $1="#"')
    .replace(/\s+(href|src)\s*=\s*javascript:[^\s>]+/gi, ' $1="#"');

const wrapEmailHtml = (body = "") => `
  <div style="margin:0;padding:0;background:#f6f7fb;font-family:Arial,Helvetica,sans-serif;color:#111827;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#f6f7fb;padding:24px 0;">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;border-collapse:collapse;background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
            <tr>
              <td style="background:#dc2626;color:#ffffff;padding:20px 24px;">
                <h1 style="margin:0;font-size:22px;line-height:1.3;">Quiz Playground</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 24px;font-size:15px;line-height:1.6;color:#374151;">
                ${body}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
`;

const getPlaceholders = (value = "") => {
  const placeholders = new Set();
  const pattern = /{{\s*([a-zA-Z0-9_]+)\s*}}/g;
  let match = pattern.exec(String(value));

  while (match) {
    placeholders.add(match[1]);
    match = pattern.exec(String(value));
  }

  return [...placeholders];
};

const validatePlaceholders = ({ subject = "", htmlBody = "", allowedVariables = [] }) => {
  const allowed = new Set(allowedVariables);
  const used = [...new Set([...getPlaceholders(subject), ...getPlaceholders(htmlBody)])];
  const invalid = used.filter((item) => !allowed.has(item));

  if (invalid.length > 0) {
    return `Unknown dynamic variable(s): ${invalid.map((item) => `{{${item}}}`).join(", ")}`;
  }

  return "";
};

const renderTemplateString = (value = "", variables = {}, encodeValues = false) =>
  String(value).replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (match, key) => {
    const replacement = variables[key];

    if (replacement === undefined || replacement === null) {
      return "";
    }

    return encodeValues ? escapeHtml(replacement) : String(replacement);
  });

const htmlToText = (html = "") =>
  String(html)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const sanitizeTemplatePayload = (payload = {}) => ({
  templateName: String(payload.templateName || "").trim(),
  subject: String(payload.subject || "").trim(),
  htmlBody: stripDangerousHtml(payload.htmlBody || ""),
  isActive: payload.isActive !== false,
});

const ensureDefaultTemplates = async () => {
  await Promise.all(
    DEFAULT_TEMPLATES.map((template) =>
      EmailTemplate.findOneAndUpdate(
        { templateKey: template.templateKey },
        { $setOnInsert: template },
        { upsert: true, new: true }
      )
    )
  );
};

const getTemplateById = async (id) => {
  await ensureDefaultTemplates();
  return EmailTemplate.findById(id).lean();
};

const getActiveTemplateByKey = async (templateKey) => {
  await ensureDefaultTemplates();
  return EmailTemplate.findOne({
    templateKey,
    isActive: true,
  }).lean();
};

const listTemplates = async ({ search = "", status = "All" } = {}) => {
  await ensureDefaultTemplates();
  const query = {};

  if (search.trim()) {
    query.$or = [
      { templateName: { $regex: search.trim(), $options: "i" } },
      { templateKey: { $regex: search.trim(), $options: "i" } },
    ];
  }

  if (status === "Active") {
    query.isActive = true;
  } else if (status === "Inactive") {
    query.isActive = false;
  }

  return EmailTemplate.find(query).sort({ templateName: 1 }).lean();
};

const updateTemplate = async ({ id, payload, updatedBy }) => {
  const existing = await EmailTemplate.findById(id);

  if (!existing) {
    return { error: "Email template not found", status: 404 };
  }

  const sanitized = sanitizeTemplatePayload(payload);

  if (!sanitized.templateName || !sanitized.subject || !sanitized.htmlBody) {
    return { error: "Template name, subject, and email content are required", status: 400 };
  }

  const validationError = validatePlaceholders({
    subject: sanitized.subject,
    htmlBody: sanitized.htmlBody,
    allowedVariables: existing.allowedVariables,
  });

  if (validationError) {
    return { error: validationError, status: 400 };
  }

  existing.templateName = sanitized.templateName;
  existing.subject = sanitized.subject;
  existing.htmlBody = sanitized.htmlBody;
  existing.isActive = sanitized.isActive;
  existing.updatedBy = updatedBy;
  await existing.save();

  return { template: existing.toObject() };
};

const renderTemplate = ({ template, variables }) => {
  const validationError = validatePlaceholders({
    subject: template.subject,
    htmlBody: template.htmlBody,
    allowedVariables: template.allowedVariables,
  });

  if (validationError) {
    throw new Error(validationError);
  }

  const usedVariables = [
    ...new Set([
      ...getPlaceholders(template.subject),
      ...getPlaceholders(template.htmlBody),
    ]),
  ];
  const missingVariables = usedVariables.filter(
    (item) => variables[item] === undefined || variables[item] === null
  );

  if (missingVariables.length > 0) {
    throw new Error(`Missing variable(s): ${missingVariables.join(", ")}`);
  }

  const subject = renderTemplateString(template.subject, variables);
  const renderedBody = renderTemplateString(template.htmlBody, variables, true);
  const html = wrapEmailHtml(stripDangerousHtml(renderedBody));

  return {
    subject,
    html,
    text: htmlToText(html),
  };
};

const previewTemplate = async ({ id, payload = {}, variables }) => {
  const template = await getTemplateById(id);

  if (!template) {
    return { error: "Email template not found", status: 404 };
  }

  const previewPayload =
    payload.subject || payload.htmlBody
      ? {
          ...template,
          ...sanitizeTemplatePayload({
            templateName: payload.templateName || template.templateName,
            subject: payload.subject || template.subject,
            htmlBody: payload.htmlBody || template.htmlBody,
            isActive: payload.isActive ?? template.isActive,
          }),
        }
      : template;

  return {
    template: previewPayload,
    rendered: renderTemplate({
      template: previewPayload,
      variables: variables || sampleVariables[template.templateKey] || {},
    }),
  };
};

const sendTemplateEmail = async ({ templateKey, to, variables }) => {
  const template = await getActiveTemplateByKey(templateKey);

  if (!template) {
    throw new Error(`Active email template not found: ${templateKey}`);
  }

  const rendered = renderTemplate({ template, variables });

  return sendMail({
    to,
    subject: rendered.subject,
    text: rendered.text,
    html: rendered.html,
    fallbackMessage:
      templateKey === "FORGOT_PASSWORD"
        ? `[password-reset] Reset URL for ${to}: ${variables.resetLink}`
        : `[email-template] SMTP is not configured. ${templateKey} email to ${to} was not sent.`,
  });
};

const sendTemplateTestEmail = async ({ id, to }) => {
  const template = await getTemplateById(id);

  if (!template) {
    return { error: "Email template not found", status: 404 };
  }

  const variables = sampleVariables[template.templateKey] || {};
  const rendered = renderTemplate({ template, variables });
  const result = await sendMail({
    to,
    subject: `[Test] ${rendered.subject}`,
    text: rendered.text,
    html: rendered.html,
    fallbackMessage: `[email-template-test] SMTP is not configured. Test email to ${to} was not sent.`,
  });

  return {
    message: result.fallback
      ? "SMTP is not configured. Test email was not sent."
      : "Test email sent successfully",
  };
};

module.exports = {
  ensureDefaultTemplates,
  listTemplates,
  getTemplateById,
  updateTemplate,
  previewTemplate,
  sendTemplateEmail,
  sendTemplateTestEmail,
  validatePlaceholders,
};
