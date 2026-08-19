require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");

const db = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const complaintRoutes = require("./routes/complaintRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const { protectUploadedEvidence } = require("./middleware/uploadStaticMiddleware");

const {
  apiLimiter,
  corsOptions,
  configureTrustProxy,
} = require("./middleware/securityMiddleware");

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === "production";

/*
 * Only enable trust proxy when the deployment environment is known.
 * Examples:
 * TRUST_PROXY=1
 * TRUST_PROXY=loopback
 */
configureTrustProxy(app);

/* Hide Express implementation detail. */
app.disable("x-powered-by");

/*
 * Security headers.
 * Helmet's default CSP is kept, but HTTP->HTTPS upgrading is disabled
 * during local development so localhost continues to work over HTTP.
 */
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        "upgrade-insecure-requests": isProduction ? [] : null,
      },
    },
    crossOriginResourcePolicy: {
      policy: "same-origin",
    },
  })
);

/*
 * CORS remains backward-compatible when CORS_ORIGINS is not configured.
 * To restrict cross-origin access in production, set:
 * CORS_ORIGINS=https://your-domain.com,https://www.your-domain.com
 */
app.use(cors(corsOptions));

/*
 * Request body limits protect JSON / URL-encoded endpoints from
 * unnecessarily large payloads. Multer has its own upload limit.
 */
app.use(
  express.json({
    limit: "1mb",
    strict: true,
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "1mb",
    parameterLimit: 100,
  })
);

/* Uploaded evidence gets stricter static-file handling. */
app.use(
  "/uploads",
  protectUploadedEvidence,
  express.static(
    path.join(__dirname, "public", "uploads"),
    {
      dotfiles: "ignore",
      etag: true,
      fallthrough: false,
      index: false,
      maxAge: isProduction ? "1h" : 0,
    }
  )
);

/* Public frontend assets. */
app.use(
  express.static(path.join(__dirname, "public"), {
    dotfiles: "ignore",
    etag: true,
    maxAge: isProduction ? "1h" : 0,
  })
);

/* Global API abuse protection. */
app.use("/api", apiLimiter);

/* API routes. */
app.use("/api/auth", authRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/notifications", notificationRoutes);

app.get("/api/health", async (req, res) => {
  try {
    await db.query("SELECT 1");

    return res.status(200).json({
      success: true,
      message: "Server and database are connected successfully.",
    });
  } catch (error) {
    console.error("Health check error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Database connection failed.",
    });
  }
});

/* JSON 404 for unknown API endpoints. */
app.use("/api", (req, res) => {
  return res.status(404).json({
    success: false,
    message: "API endpoint not found.",
  });
});

app.get("/", (req, res) => {
  res.send("Campus Complaint Management System API is running.");
});

/*
 * Central error handler.
 * Keeps internal stack traces / implementation details out of API responses.
 */
app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error?.code === "CORS_NOT_ALLOWED") {
    return res.status(403).json({
      success: false,
      message: "Cross-origin request is not allowed.",
    });
  }

  if (error?.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      message: "Request payload is too large.",
    });
  }

  if (error?.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON request body.",
    });
  }

  if (error?.name === "MulterError") {
    const multerMessages = {
      LIMIT_FILE_SIZE: "Evidence image must be 5 MB or smaller.",
      LIMIT_FILE_COUNT: "Only one evidence image can be uploaded.",
      LIMIT_UNEXPECTED_FILE:
        error.message ||
        "Only JPG, JPEG, PNG or WEBP evidence images are allowed.",
      LIMIT_FIELD_COUNT:
        "Too many form fields were submitted.",
      LIMIT_FIELD_KEY:
        "A form field name is too long.",
      LIMIT_FIELD_VALUE:
        "A form field value is too large.",
      LIMIT_PART_COUNT:
        "Too many multipart form parts were submitted.",
    };

    return res.status(400).json({
      success: false,
      message:
        multerMessages[error.code] ||
        "Unable to process the uploaded evidence file.",
    });
  }

  console.error("Unhandled server error:", error);

  return res.status(500).json({
    success: false,
    message: "Something went wrong on the server.",
  });
});

app.listen(PORT, async () => {
  try {
    await db.query("SELECT 1");
    console.log("Database connected successfully.");
    console.log(`Server running at http://localhost:${PORT}`);

    if (
      isProduction &&
      !process.env.CORS_ORIGINS
    ) {
      console.warn(
        "Security notice: CORS_ORIGINS is not configured. " +
        "Cross-origin requests remain unrestricted."
      );
    }
  } catch (error) {
    console.error(
      "Database connection failed:",
      error.message
    );
  }
});
