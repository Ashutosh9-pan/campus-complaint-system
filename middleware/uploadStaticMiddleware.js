const path = require("path");

const allowedExtensions = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
]);

const protectUploadedEvidence = (req, res, next) => {
  const extension = path.extname(req.path).toLowerCase();

  if (!allowedExtensions.has(extension)) {
    return res.status(404).end();
  }

  /*
   * Uploaded evidence should only render as media.
   * Prevent content sniffing / inline execution of unexpected types.
   */
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'none'; img-src 'self' data:; sandbox"
  );

  return next();
};

module.exports = {
  protectUploadedEvidence,
};
