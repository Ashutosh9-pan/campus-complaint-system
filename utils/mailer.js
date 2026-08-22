const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

const escapeHtml = (value) =>
  String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const getBrevoConfig = () => {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME || "CampusResolve";

  if (!apiKey) {
    throw new Error("BREVO_API_KEY is missing.");
  }

  if (!senderEmail) {
    throw new Error("BREVO_SENDER_EMAIL is missing.");
  }

  return {
    apiKey,
    senderEmail,
    senderName,
  };
};

const sendPasswordResetOtp = async ({ to, name, otp }) => {
  
  const { apiKey, senderEmail, senderName } = getBrevoConfig();

  if (!to) {
    throw new Error("Recipient email is missing.");
  }

  if (!otp) {
    throw new Error("OTP is missing.");
  }

  const safeName = escapeHtml(name || "User");
  const safeOtp = escapeHtml(otp);

  const payload = {
    sender: {
      name: senderName,
      email: senderEmail,
    },

    to: [
      {
        email: to,
        name: name || "User",
      },
    ],

    subject: "CampusResolve Password Reset OTP",

    textContent: `
Hello ${name || "User"},

Your CampusResolve password reset OTP is: ${otp}

This OTP will expire in 10 minutes.

If you did not request a password reset, you can ignore this email.

CampusResolve
    `.trim(),

    htmlContent: `
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
          ${safeOtp}
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
  };

  let response;

  try {
    response = await fetch(BREVO_API_URL, {
      method: "POST",

      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": apiKey,
      },

      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("Brevo network error:", error.message);
    throw error;
  }


  let responseData = {};

  try {
    responseData = await response.json();
  } catch {
    responseData = {};
  }

  if (!response.ok) {
    console.error("Brevo error response:", responseData);

    const message =
      responseData?.message ||
      `Brevo email request failed with status ${response.status}.`;

    throw new Error(message);
  }


  return responseData;
};

const verifyEmailTransport = async () => {
  getBrevoConfig();


  return true;
};

module.exports = {
  sendPasswordResetOtp,
  verifyEmailTransport,
};