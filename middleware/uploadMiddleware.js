const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDirectory = path.join(
  __dirname,
  "..",
  "public",
  "uploads"
);

// Folder missing ho toh automatically create hoga
fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, uploadDirectory);
  },

  filename: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();

    const safeFilename = [
      "complaint",
      req.user?.id || "user",
      Date.now(),
    ].join("-");

    callback(null, `${safeFilename}${extension}`);
  },
});

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const fileFilter = (req, file, callback) => {
  const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];
  const extension = path.extname(file.originalname).toLowerCase();

  if (
    allowedMimeTypes.has(file.mimetype) &&
    allowedExtensions.includes(extension)
  ) {
    callback(null, true);
    return;
  }

  callback(
    new multer.MulterError(
      "LIMIT_UNEXPECTED_FILE",
      "evidence"
    )
  );
};

const uploadEvidence = multer({
  storage,
  fileFilter,
  limits: {
    files: 1,
    fileSize: 5 * 1024 * 1024,
  },
});

module.exports = {
  uploadEvidence,
};