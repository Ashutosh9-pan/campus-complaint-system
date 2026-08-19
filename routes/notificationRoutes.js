const express = require("express");

const {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} = require("../controllers/notificationController");

const {
  authenticate,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

// Student: get their notifications
router.get(
  "/",
  authenticate,
  authorize("student"),
  getMyNotifications
);

// Student: mark all notifications as read
// IMPORTANT: keep this route before "/:id/read"
router.patch(
  "/read-all",
  authenticate,
  authorize("student"),
  markAllNotificationsAsRead
);

// Student: mark one notification as read
router.patch(
  "/:id/read",
  authenticate,
  authorize("student"),
  markNotificationAsRead
);

module.exports = router;