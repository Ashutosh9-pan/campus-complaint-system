const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const escapeHtml = (value) =>
  String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const sendPasswordResetOtp = async ({ to, name, otp }) => {
  const safeName = escapeHtml(name);

  const { data, error } = await resend.emails.send({
    // Testing sender provided by Resend.
    // Later we'll replace this with your verified CampusResolve domain.
    from: "CampusResolve <onboarding@resend.dev>",

    to: [to],

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

  if (error) {
    throw new Error(
      error.message || "Failed to send password reset email."
    );
  }

  return data;
};

// Kept so existing imports don't break.
const verifyEmailTransport = async () => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is missing.");
  }

  return true;
};

module.exports = {
  sendPasswordResetOtp,
  verifyEmailTransport,
};