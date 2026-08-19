const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const db = require("../config/db");

const {
  sendPasswordResetOtp,
} = require("../utils/mailer");

const RESET_OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;
const TOKEN_ISSUER = "campusresolve";
const TOKEN_AUDIENCE = "campusresolve-web";
const RESET_TOKEN_AUDIENCE = "campusresolve-password-reset";

const normalizeEmail = (email) =>
  String(email || "").trim().toLowerCase();

const generateOtp = () =>
  crypto.randomInt(100000, 1000000).toString();

const genericForgotPasswordResponse = (res) =>
  res.status(200).json({
    success: true,
    message:
      "If an account exists with this email, a password reset OTP has been sent.",
  });

const createAndSendResetOtp = async (user) => {
  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, 12);

  const expiresAt = new Date(
    Date.now() + RESET_OTP_EXPIRY_MINUTES * 60 * 1000
  );

  await db.query(
    `UPDATE password_reset_otps
     SET used = TRUE
     WHERE user_id = ?
       AND used = FALSE`,
    [user.id]
  );

  const [result] = await db.query(
    `INSERT INTO password_reset_otps
     (
       user_id,
       otp_hash,
       expires_at,
       attempts,
       verified,
       used
     )
     VALUES (?, ?, ?, 0, FALSE, FALSE)`,
    [user.id, otpHash, expiresAt]
  );

  try {
    await sendPasswordResetOtp({
      to: user.email,
      name: user.name,
      otp,
    });
  } catch (error) {
    await db.query(
      `UPDATE password_reset_otps
       SET used = TRUE
       WHERE id = ?`,
      [result.insertId]
    );

    throw error;
  }

  return result.insertId;
};

const register = async (req, res) => {
  try {
    const { name, email, password, hostel, roomNumber } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required.",
      });
    }

    if (password.length < 8 || password.length > 128) {
      return res.status(400).json({
        success: false,
        message:
          "Password must contain between 8 and 128 characters.",
      });
    }

    const normalizedEmail = normalizeEmail(email);

    const [existingUsers] = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [normalizedEmail]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [result] = await db.query(
      `INSERT INTO users
       (name, email, password_hash, role, hostel, room_number)
       VALUES (?, ?, ?, 'student', ?, ?)`,
      [
        name.trim(),
        normalizedEmail,
        passwordHash,
        hostel?.trim() || null,
        roomNumber?.trim() || null,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Student account created successfully.",
      userId: result.insertId,
    });
  } catch (error) {
    console.error("Registration error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to create account.",
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const [users] = await db.query(
      `SELECT id, name, email, password_hash, role, hostel, room_number
       FROM users
       WHERE email = ?`,
      [normalizeEmail(email)]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const user = users[0];

    const passwordMatches = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "8h",
        algorithm: "HS256",
        issuer: TOKEN_ISSUER,
        audience: TOKEN_AUDIENCE,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        hostel: user.hostel,
        roomNumber: user.room_number,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to log in.",
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    const [users] = await db.query(
      `SELECT id, name, email
       FROM users
       WHERE email = ?`,
      [email]
    );

    if (users.length === 0) {
      return genericForgotPasswordResponse(res);
    }

    await createAndSendResetOtp(users[0]);

    return genericForgotPasswordResponse(res);
  } catch (error) {
    console.error("Forgot password error:", error.message);

    return res.status(500).json({
      success: false,
      message:
        "Unable to send the password reset OTP right now.",
    });
  }
};

const resendResetOtp = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    const [users] = await db.query(
      `SELECT id, name, email
       FROM users
       WHERE email = ?`,
      [email]
    );

    if (users.length === 0) {
      return res.status(200).json({
        success: true,
        message:
          "If an account exists with this email, a new OTP has been sent.",
      });
    }

    await createAndSendResetOtp(users[0]);

    return res.status(200).json({
      success: true,
      message:
        "If an account exists with this email, a new OTP has been sent.",
    });
  } catch (error) {
    console.error("Resend reset OTP error:", error.message);

    return res.status(500).json({
      success: false,
      message:
        "Unable to resend the password reset OTP right now.",
    });
  }
};

const verifyResetOtp = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const otp = String(req.body.otp || "").trim();

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required.",
      });
    }

    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid 6-digit OTP.",
      });
    }

    const [users] = await db.query(
      `SELECT id
       FROM users
       WHERE email = ?`,
      [email]
    );

    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP.",
      });
    }

    const user = users[0];

    const [otpRows] = await db.query(
      `SELECT id, otp_hash, expires_at, attempts, verified, used
       FROM password_reset_otps
       WHERE user_id = ?
         AND used = FALSE
       ORDER BY created_at DESC
       LIMIT 1`,
      [user.id]
    );

    if (otpRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP.",
      });
    }

    const otpRecord = otpRows[0];

    if (new Date(otpRecord.expires_at).getTime() < Date.now()) {
      await db.query(
        `UPDATE password_reset_otps
         SET used = TRUE
         WHERE id = ?`,
        [otpRecord.id]
      );

      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one.",
      });
    }

    if (Number(otpRecord.attempts) >= MAX_OTP_ATTEMPTS) {
      await db.query(
        `UPDATE password_reset_otps
         SET used = TRUE
         WHERE id = ?`,
        [otpRecord.id]
      );

      return res.status(429).json({
        success: false,
        message:
          "Too many incorrect attempts. Please request a new OTP.",
      });
    }

    const otpMatches = await bcrypt.compare(
      otp,
      otpRecord.otp_hash
    );

    if (!otpMatches) {
      const nextAttempts = Number(otpRecord.attempts) + 1;

      await db.query(
        `UPDATE password_reset_otps
         SET attempts = ?,
             used = ?
         WHERE id = ?`,
        [
          nextAttempts,
          nextAttempts >= MAX_OTP_ATTEMPTS,
          otpRecord.id,
        ]
      );

      return res.status(400).json({
        success: false,
        message:
          nextAttempts >= MAX_OTP_ATTEMPTS
            ? "Too many incorrect attempts. Please request a new OTP."
            : "Incorrect OTP.",
      });
    }

    await db.query(
      `UPDATE password_reset_otps
       SET verified = TRUE
       WHERE id = ?`,
      [otpRecord.id]
    );

    const resetToken = jwt.sign(
      {
        purpose: "password_reset",
        userId: user.id,
        otpId: otpRecord.id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "10m",
        algorithm: "HS256",
        issuer: TOKEN_ISSUER,
        audience: RESET_TOKEN_AUDIENCE,
      }
    );

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully.",
      resetToken,
    });
  } catch (error) {
    console.error("Verify reset OTP error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to verify OTP.",
    });
  }
};

const resetPassword = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const {
      resetToken,
      newPassword,
      confirmPassword,
    } = req.body;

    if (!resetToken || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message:
          "Reset token, new password and confirmation are required.",
      });
    }

    if (
      newPassword.length < 8 ||
      newPassword.length > 128
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Password must contain between 8 and 128 characters.",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match.",
      });
    }

    let payload;

    try {
      payload = jwt.verify(
        resetToken,
        process.env.JWT_SECRET,
        {
          algorithms: ["HS256"],
          issuer: TOKEN_ISSUER,
          audience: RESET_TOKEN_AUDIENCE,
        }
      );
    } catch (error) {
      return res.status(400).json({
        success: false,
        message:
          "Password reset session has expired. Please request a new OTP.",
      });
    }

    if (
      payload.purpose !== "password_reset" ||
      !payload.userId ||
      !payload.otpId
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid password reset session.",
      });
    }

    await connection.beginTransaction();

    const [otpRows] = await connection.query(
      `SELECT id, user_id, expires_at, verified, used
       FROM password_reset_otps
       WHERE id = ?
         AND user_id = ?
       FOR UPDATE`,
      [payload.otpId, payload.userId]
    );

    if (otpRows.length === 0) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: "Invalid password reset session.",
      });
    }

    const otpRecord = otpRows[0];

    if (
      Number(otpRecord.used) === 1 ||
      Number(otpRecord.verified) !== 1 ||
      new Date(otpRecord.expires_at).getTime() < Date.now()
    ) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message:
          "Password reset session has expired. Please request a new OTP.",
      });
    }

    const passwordHash = await bcrypt.hash(
      newPassword,
      12
    );

    await connection.query(
      `UPDATE users
       SET password_hash = ?
       WHERE id = ?`,
      [passwordHash, payload.userId]
    );

    await connection.query(
      `UPDATE password_reset_otps
       SET used = TRUE
       WHERE user_id = ?`,
      [payload.userId]
    );

    await connection.commit();

    return res.status(200).json({
      success: true,
      message:
        "Password reset successfully. You can now log in with your new password.",
    });
  } catch (error) {
    await connection.rollback();

    console.error("Reset password error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to reset password.",
    });
  } finally {
    connection.release();
  }
};

module.exports = {
  register,
  login,
  forgotPassword,
  resendResetOtp,
  verifyResetOtp,
  resetPassword,
};
