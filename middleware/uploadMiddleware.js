const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const uploadDirectory = path.join(
  __dirname,
  "..",
  "public",
  "uploads"
);

fs.mkdirSync(uploadDirectory, {
  recursive: true,
  mode: 0o755,
});

/*
 * Keep the file type allow-list deliberately small.
 * We validate MIME type and extension together.
 */
const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const allowedExtensions = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
]);

const normalizeExtension = (filename) =>
  path.extname(String(filename || ""))
    .toLowerCase();

const hasSuspiciousFilename = (filename) => {
  const raw = String(filename || "");

  if (!raw || raw.length > 180) {
    return true;
  }

  /*
   * Reject hidden / traversal-like / control-character filenames.
   * Multer normally strips paths, but this is defense-in-depth.
   */
  if (
    raw.includes("..") ||
    raw.includes("/") ||
    raw.includes("\\") ||
    /[\u0000-\u001F\u007F]/.test(raw)
  ) {
    return true;
  }

  /*
   * Reject obvious double extensions such as:
   * evidence.jpg.exe
   * image.png.php
   *
   * Dots in normal names are still allowed when the final extension
   * is the only executable-looking suffix.
   */
  const parts = raw.split(".").filter(Boolean);

  if (parts.length >= 3) {
    const dangerousSuffixes = new Set([
      "exe",
      "dll",
      "bat",
      "cmd",
      "com",
      "msi",
      "ps1",
      "sh",
      "php",
      "phtml",
      "jsp",
      "asp",
      "aspx",
      "js",
      "mjs",
      "cjs",
      "html",
      "htm",
      "svg",
    ]);

    const intermediateParts =
      parts.slice(1, -1).map((part) => part.toLowerCase());

    if (
      intermediateParts.some((part) =>
        dangerousSuffixes.has(part)
      )
    ) {
      return true;
    }
  }

  return false;
};

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, uploadDirectory);
  },

  filename: (req, file, callback) => {
    const extension =
      normalizeExtension(file.originalname);

    /*
     * Never reuse the user's original filename on disk.
     * A random id avoids collisions and reduces filename leakage.
     */
    const randomId = crypto.randomBytes(16).toString("hex");

    const userId =
      Number.isInteger(Number(req.user?.id))
        ? String(req.user.id)
        : "user";

    const safeFilename = [
      "complaint",
      userId,
      Date.now(),
      randomId,
    ].join("-");

    callback(null, `${safeFilename}${extension}`);
  },
});

const fileFilter = (req, file, callback) => {
  const extension =
    normalizeExtension(file.originalname);

  if (hasSuspiciousFilename(file.originalname)) {
    const error = new multer.MulterError(
      "LIMIT_UNEXPECTED_FILE",
      "evidence"
    );

    error.message =
      "Suspicious evidence filename is not allowed.";

    return callback(error);
  }

  if (
    !allowedMimeTypes.has(file.mimetype) ||
    !allowedExtensions.has(extension)
  ) {
    const error = new multer.MulterError(
      "LIMIT_UNEXPECTED_FILE",
      "evidence"
    );

    error.message =
      "Only JPG, JPEG, PNG or WEBP evidence images are allowed.";

    return callback(error);
  }

  return callback(null, true);
};

const uploadEvidence = multer({
  storage,
  fileFilter,
  limits: {
    files: 1,
    fileSize: 5 * 1024 * 1024,
    fields: 20,
    fieldNameSize: 100,
    fieldSize: 64 * 1024,
    parts: 24,
    headerPairs: 200,
  },
});

module.exports = {
  uploadEvidence,
  uploadDirectory,
};
