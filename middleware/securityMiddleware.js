const { rateLimit } = require("express-rate-limit");

const FIFTEEN_MINUTES = 15 * 60 * 1000;

const rateLimitHandler = (message) => (req, res) => {
  return res.status(429).json({
    success: false,
    message,
  });
};

/*
 * General API limiter.
 * The built-in memory store is suitable for the current single-process app.
 * If the app later runs on multiple server instances, use a shared store
 * such as Redis so all instances share the same counters.
 */
const apiLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: rateLimitHandler(
    "Too many requests. Please wait a few minutes and try again."
  ),
});

/*
 * Login protection.
 * Successful logins are not counted, so normal use does not consume the
 * failed-attempt budget.
 */
const loginLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: rateLimitHandler(
    "Too many unsuccessful login attempts. Please try again later."
  ),
});

/*
 * Registration is public, so keep a separate, lower creation limit.
 */
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 12,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: rateLimitHandler(
    "Too many account creation requests. Please try again later."
  ),
});

/*
 * Password recovery can send email / OTP messages, so it gets a tighter
 * per-IP limiter to reduce spam and repeated reset requests.
 */
const passwordRecoveryLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: 8,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: rateLimitHandler(
    "Too many password recovery requests. Please wait before trying again."
  ),
});

/*
 * CORS configuration:
 * - No Origin header (same-origin tools, curl, server-to-server): allowed.
 * - If CORS_ORIGINS is empty: preserve the project's current behavior.
 * - If CORS_ORIGINS is set: allow only listed origins.
 */
const configuredOrigins = new Set(
  String(process.env.CORS_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
);

const corsOptions = {
  origin(origin, callback) {
    if (!origin || configuredOrigins.size === 0) {
      return callback(null, true);
    }

    if (configuredOrigins.has(origin)) {
      return callback(null, true);
    }

    const error = new Error("Origin is not allowed by CORS.");
    error.code = "CORS_NOT_ALLOWED";
    return callback(error);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false,
  optionsSuccessStatus: 204,
};

/*
 * Do not blindly set trust proxy.
 * It must match the real reverse-proxy setup.
 *
 * Supported examples:
 * TRUST_PROXY=1
 * TRUST_PROXY=loopback
 * TRUST_PROXY=loopback, linklocal, uniquelocal
 */
const configureTrustProxy = (app) => {
  const value = String(process.env.TRUST_PROXY || "").trim();

  if (!value) return;

  if (/^\d+$/.test(value)) {
    app.set("trust proxy", Number(value));
    return;
  }

  app.set("trust proxy", value);
};

module.exports = {
  apiLimiter,
  loginLimiter,
  registerLimiter,
  passwordRecoveryLimiter,
  corsOptions,
  configureTrustProxy,
};
