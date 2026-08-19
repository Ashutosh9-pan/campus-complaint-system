const db = require("../config/db");

// Student: get their notifications
const getMyNotifications = async (req, res) => {
  try {
    const [notifications] = await db.query(
      `SELECT
         n.id,
         n.complaint_id,
         n.message,
         n.type,
         n.is_read,
         n.created_at,
         c.reference_number
       FROM notifications n
       LEFT JOIN complaints c
         ON n.complaint_id = c.id
       WHERE n.user_id = ?
       ORDER BY n.created_at DESC`,
      [req.user.id]
    );

    const unreadCount = notifications.filter(
      (notification) => Number(notification.is_read) === 0
    ).length;

    return res.status(200).json({
      success: true,
      unreadCount,
      notifications,
    });
  } catch (error) {
    console.error(
      "Get notifications error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Unable to load notifications.",
    });
  }
};

// Student: mark one notification as read
const markNotificationAsRead = async (req, res) => {
  try {
    const notificationId = Number(req.params.id);

    if (
      !Number.isInteger(notificationId) ||
      notificationId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID.",
      });
    }

    const [result] = await db.query(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE id = ?
         AND user_id = ?`,
      [notificationId, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification marked as read.",
    });
  } catch (error) {
    console.error(
      "Mark notification as read error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Unable to update notification.",
    });
  }
};

// Student: mark all their notifications as read
const markAllNotificationsAsRead = async (req, res) => {
  try {
    await db.query(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE user_id = ?
         AND is_read = FALSE`,
      [req.user.id]
    );

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read.",
    });
  } catch (error) {
    console.error(
      "Mark all notifications as read error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Unable to update notifications.",
    });
  }
};

module.exports = {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
};