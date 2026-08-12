const nodemailer = require("nodemailer");

const hasEmailConfig = () =>
  Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
  );

let transporter;
let verificationPromise;

const createTransporter = () => {
  if (transporter) {
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
};

const verifyTransporter = async () => {
  if (!hasEmailConfig()) {
    return false;
  }

  if (!verificationPromise) {
    verificationPromise = createTransporter()
      .verify()
      .then(() => {
        if (process.env.NODE_ENV !== "production") {
          console.log("[email] SMTP configuration verified successfully");
        }
        return true;
      })
      .catch((error) => {
        verificationPromise = null;
        console.error("[email] SMTP verification failed:", error);
        throw error;
      });
  }

  return verificationPromise;
};

const buildPasswordResetEmail = ({ resetUrl }) => {
  const text = [
    "Quiz Playground",
    "",
    "We received a request to reset your Quiz Playground password.",
    "",
    `Reset your password using this link: ${resetUrl}`,
    "",
    "This link expires in 15 minutes.",
    "If you did not request this password reset, you can safely ignore this email.",
  ].join("\n");

  const html = `
    <div style="margin:0;padding:0;background:#f6f7fb;font-family:Arial,Helvetica,sans-serif;color:#111827;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#f6f7fb;padding:24px 0;">
        <tr>
          <td align="center" style="padding:24px 12px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;border-collapse:collapse;background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
              <tr>
                <td style="background:#dc2626;color:#ffffff;padding:20px 24px;">
                  <h1 style="margin:0;font-size:22px;line-height:1.3;">Quiz Playground</h1>
                </td>
              </tr>
              <tr>
                <td style="padding:28px 24px;">
                  <h2 style="margin:0 0 12px;font-size:20px;color:#111827;">Reset your password</h2>
                  <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#374151;">
                    We received a request to reset your Quiz Playground password.
                  </p>
                  <p style="margin:0 0 22px;">
                    <a href="${resetUrl}" style="display:inline-block;background:#dc2626;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:6px;">
                      Reset Password
                    </a>
                  </p>
                  <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#4b5563;">
                    This link expires in 15 minutes.
                  </p>
                  <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#4b5563;">
                    If the button does not work, copy and paste this URL into your browser:
                  </p>
                  <p style="margin:0 0 20px;word-break:break-all;font-size:13px;line-height:1.5;color:#991b1b;">
                    ${resetUrl}
                  </p>
                  <p style="margin:0;font-size:14px;line-height:1.6;color:#6b7280;">
                    If you did not request this password reset, you can safely ignore this email.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;

  return { text, html };
};

const sendPasswordResetEmail = async ({ to, resetUrl }) => {
  if (!hasEmailConfig()) {
    console.log(`[password-reset] Reset URL for ${to}: ${resetUrl}`);
    return { sent: false, fallback: true };
  }

  await verifyTransporter();

  const activeTransporter = createTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const { text, html } = buildPasswordResetEmail({ resetUrl });

  await activeTransporter.sendMail({
    from,
    to,
    subject: "Reset your Quiz Playground password",
    text,
    html,
  });

  return { sent: true, fallback: false };
};

const sendMail = async ({ to, subject, text, html, fallbackMessage }) => {
  if (!hasEmailConfig()) {
    if (fallbackMessage) {
      console.log(fallbackMessage);
    } else {
      console.log(`[email] SMTP is not configured. Email to ${to} was not sent.`);
    }

    return { sent: false, fallback: true };
  }

  await verifyTransporter();

  const activeTransporter = createTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  await activeTransporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });

  return { sent: true, fallback: false };
};

module.exports = {
  hasEmailConfig,
  sendMail,
  sendPasswordResetEmail,
  verifyTransporter,
};
