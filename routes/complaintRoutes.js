const express = require("express");
const multer = require("multer");

const {
  createComplaint,
  getMyComplaints,
  getAllComplaints,
  getComplaintAnalytics,
  getFeedbackOverview,
  exportComplaintsCsv,
  updateComplaintStatus,
  updateComplaintAssignment,
  getComplaintHistory,
  updateOwnComplaint,
  deleteOwnComplaint,
  submitComplaintFeedback,
} = require("../controllers/complaintController");

const {
  authenticate,
  authorize,
} = require("../middleware/authMiddleware");

const {
  uploadEvidence,
} = require("../middleware/uploadMiddleware");

const handleEvidenceUpload = (req, res, next) => {
  uploadEvidence.single("evidence")(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "Evidence image must be smaller than 5 MB.",
        });
      }

      if (error.code === "LIMIT_UNEXPECTED_FILE") {
        return res.status(400).json({
          success: false,
          message: "Please upload only JPG, PNG or WebP images.",
        });
      }

      return res.status(400).json({
        success: false,
        message: "Unable to upload the evidence image.",
      });
    }

    return res.status(400).json({
      success: false,
      message: "Invalid evidence image.",
    });
  });
};

const router = express.Router();

router.post(
  "/",
  authenticate,
  authorize("student"),
  handleEvidenceUpload,
  createComplaint
);

router.get(
  "/mine",
  authenticate,
  authorize("student"),
  getMyComplaints
);

router.get(
  "/",
  authenticate,
  authorize("admin"),
  getAllComplaints
);

router.get(
  "/analytics",
  authenticate,
  authorize("admin"),
  getComplaintAnalytics
);

router.get(
  "/feedback/overview",
  authenticate,
  authorize("admin"),
  getFeedbackOverview
);

router.get(
  "/export/csv",
  authenticate,
  authorize("admin"),
  exportComplaintsCsv
);

router.get(
  "/:id/history",
  authenticate,
  getComplaintHistory
);

router.put(
  "/:id",
  authenticate,
  authorize("student"),
  updateOwnComplaint
);

router.delete(
  "/:id",
  authenticate,
  authorize("student"),
  deleteOwnComplaint
);

router.post(
  "/:id/feedback",
  authenticate,
  authorize("student"),
  submitComplaintFeedback
);

router.patch(
  "/:id/assign",
  authenticate,
  authorize("admin"),
  updateComplaintAssignment
);

router.patch(
  "/:id/status",
  authenticate,
  authorize("admin"),
  updateComplaintStatus
);

module.exports = router;
