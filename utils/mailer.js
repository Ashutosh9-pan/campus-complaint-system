const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  family: 4,

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },

  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 20000,
});

const escapeHtml = (value) =>
  String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const sendPasswordResetOtp = async ({ to, name, otp }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("EMAIL_USER or EMAIL_PASS is missing.");
  }

  const safeName = escapeHtml(name);

  const info = await transporter.sendMail({
    from: `"CampusResolve" <${process.env.EMAIL_USER}>`,
    to,
    subject: "CampusResolve Password Reset OTP",

    text: `
Hello ${name},

Your CampusResolve password reset OTP is: ${otp}

This OTP will expire in 10 minutes.

If you did not request a password reset, you can ignore this email.

CampusResolve
    `.trim(),

    html: `
      <div style="
        font-family: Arial, sans-serif;
        max-width: 520px;
        margin: auto;
        padding: 24px;
      ">
        <h2 style="margin-bottom: 8px;">
          CampusResolve
        </h2>

        <p>Hello ${safeName},</p>

        <p>
          We received a request to reset your
          CampusResolve password.
        </p>

        <p>Your verification code is:</p>

        <div style="
          font-size: 32px;
          font-weight: 700;
          letter-spacing: 8px;
          margin: 24px 0;
        ">
          ${otp}
        </div>

        <p>
          This OTP will expire in
          <strong>10 minutes</strong>.
        </p>

        <p>
          If you did not request a password reset,
          you can safely ignore this email.
        </p>

        <hr style="
          border: 0;
          border-top: 1px solid #ddd;
          margin: 24px 0;
        ">

        <small>
          CampusResolve — Campus Complaint Management System
        </small>
      </div>
    `,
  });

  return info;
};

const verifyEmailTransport = async () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("EMAIL_USER or EMAIL_PASS is missing.");
  }

  await transporter.verify();

  return true;
};

module.exports = {
  sendPasswordResetOtp,
  verifyEmailTransport,
};