const express = require("express");

const {
  createComplaint,
  getMyComplaints,
  getAllComplaints,
  updateComplaintStatus,
  updateComplaintAssignment,
  getComplaintHistory,
  updateOwnComplaint,
  deleteOwnComplaint,
} = require("../controllers/complaintController");

const {
  authenticate,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

// Student: create a new complaint
router.post(
  "/",
  authenticate,
  authorize("student"),
  createComplaint
);

// Student: view own complaints
router.get(
  "/mine",
  authenticate,
  authorize("student"),
  getMyComplaints
);

// Admin: view and filter all complaints
router.get(
  "/",
  authenticate,
  authorize("admin"),
  getAllComplaints
);

// Student or admin: view complaint status history
router.get(
  "/:id/history",
  authenticate,
  getComplaintHistory
);

// Student: edit own complaint while status is Raised
router.put(
  "/:id",
  authenticate,
  authorize("student"),
  updateOwnComplaint
);

// Student: delete own complaint while status is Raised
router.delete(
  "/:id",
  authenticate,
  authorize("student"),
  deleteOwnComplaint
);

// Admin: assign complaint to a department
router.patch(
  "/:id/assign",
  authenticate,
  authorize("admin"),
  updateComplaintAssignment
);

// Admin: update complaint status and note
router.patch(
  "/:id/status",
  authenticate,
  authorize("admin"),
  updateComplaintStatus
);

module.exports = router;