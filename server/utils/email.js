const nodemailer = require("nodemailer");

const hasEmailConfig = () =>
  Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
  );

const createTransporter = () =>
  nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

const sendPasswordResetEmail = async ({ to, resetUrl }) => {
  if (!hasEmailConfig()) {
    console.log(`[password-reset] Reset URL for ${to}: ${resetUrl}`);
    return;
  }

  const transporter = createTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  await transporter.sendMail({
    from,
    to,
    subject: "Reset your Quiz Playground password",
    text: `Use this link to reset your password. It expires in 15 minutes:\n\n${resetUrl}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2>Reset your Quiz Playground password</h2>
        <p>Use the link below to reset your password. It expires in 15 minutes.</p>
        <p><a href="${resetUrl}">Reset password</a></p>
        <p>If you did not request this, you can ignore this email.</p>
      </div>
    `,
  });
};

module.exports = { sendPasswordResetEmail };
