const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const escapeHtml = (value) =>
  String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const sendPasswordResetOtp = async ({ to, name, otp }) => {
  const safeName = escapeHtml(name);

  await transporter.sendMail({
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
        <h2>CampusResolve</h2>

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