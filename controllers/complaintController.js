const db = require("../config/db");

const createComplaint = async (req, res) => {
  try {
    const {
      title,
      category,
      location,
      description,
      priority,
    } = req.body;

    if (!title || !category || !location || !description) {
      return res.status(400).json({
        success: false,
        message:
          "Title, category, location and description are required.",
      });
    }

    const validPriorities = ["Low", "Medium", "High"];

    const selectedPriority = validPriorities.includes(priority)
      ? priority
      : "Medium";

    const evidenceImage = req.file
      ? `/uploads/${req.file.filename}`
      : null;

    // Priority-based SLA:
    // High = 1 day, Medium = 3 days, Low = 7 days
    const slaDays = {
      High: 1,
      Medium: 3,
      Low: 7,
    };

    const dueAt = new Date();

    dueAt.setDate(
      dueAt.getDate() + slaDays[selectedPriority]
    );

    const [result] = await db.query(
      `INSERT INTO complaints
       (
         student_id,
         title,
         category,
         location,
         description,
         evidence_image,
         priority,
         due_at
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        title.trim(),
        category.trim(),
        location.trim(),
        description.trim(),
        evidenceImage,
        selectedPriority,
        dueAt,
      ]
    );

    const referenceNumber =
      `CR-${new Date().getFullYear()}-${String(
        result.insertId
      ).padStart(4, "0")}`;

    await db.query(
      `UPDATE complaints
       SET reference_number = ?
       WHERE id = ?`,
      [referenceNumber, result.insertId]
    );

    return res.status(201).json({
      success: true,
      message: "Complaint raised successfully.",
      complaintId: result.insertId,
      referenceNumber,
      dueAt,
      evidenceImage,
    });
  } catch (error) {
    console.error("Create complaint error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create complaint.",
    });
  }
};

const getMyComplaints = async (req, res) => {
  try {
    const [complaints] = await db.query(
      `SELECT id, reference_number, title, category, location,
              description, priority, status, admin_note,
              evidence_image, assigned_department, assigned_at,
              created_at, updated_at, resolved_at, due_at,
              CASE
                WHEN due_at IS NOT NULL
                  AND due_at < NOW()
                  AND status <> 'Resolved'
                THEN TRUE
                ELSE FALSE
              END AS is_overdue
       FROM complaints
       WHERE student_id = ?
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    return res.status(200).json({
      success: true,
      count: complaints.length,
      complaints,
    });
  } catch (error) {
    console.error("Get student complaints error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to load complaints.",
    });
  }
};

const getAllComplaints = async (req, res) => {
  try {
    const { status, priority, category, search } = req.query;

    let query = `
      SELECT
        c.id,
        c.reference_number,
        c.title,
        c.category,
        c.location,
        c.description,
        c.priority,
        c.status,
        c.admin_note,
        c.evidence_image,
        c.assigned_department,
        c.assigned_at,
        c.created_at,
        c.updated_at,
        c.resolved_at,
        c.due_at,
        CASE
          WHEN c.due_at IS NOT NULL
            AND c.due_at < NOW()
            AND c.status <> 'Resolved'
          THEN TRUE
          ELSE FALSE
        END AS is_overdue,
        u.name AS student_name,
        u.email AS student_email,
        u.hostel,
        u.room_number
      FROM complaints c
      JOIN users u ON c.student_id = u.id
      WHERE 1 = 1
    `;

    const values = [];

    if (status) {
      query += " AND c.status = ?";
      values.push(status);
    }

    if (priority) {
      query += " AND c.priority = ?";
      values.push(priority);
    }

    if (category) {
      query += " AND c.category = ?";
      values.push(category);
    }

    if (search) {
      query += `
        AND (
          c.title LIKE ?
          OR c.reference_number LIKE ?
          OR c.location LIKE ?
          OR u.name LIKE ?
          OR u.email LIKE ?
        )
      `;

      const searchValue = `%${search}%`;
      values.push(
        searchValue,
        searchValue,
        searchValue,
        searchValue,
        searchValue
      );
    }

    query += `
      ORDER BY
        FIELD(c.priority, 'Urgent', 'High', 'Medium', 'Low'),
        c.created_at DESC
    `;

    const [complaints] = await db.query(query, values);

    return res.status(200).json({
      success: true,
      count: complaints.length,
      complaints,
    });
  } catch (error) {
    console.error("Get all complaints error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to load complaints.",
    });
  }
};

const updateComplaintStatus = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const complaintId = Number(req.params.id);
    const { status, note } = req.body;

    const allowedStatuses = [
      "Raised",
      "In Progress",
      "Resolved",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid complaint status.",
      });
    }

    await connection.beginTransaction();

    const [complaints] = await connection.query(
      "SELECT id, status FROM complaints WHERE id = ? FOR UPDATE",
      [complaintId]
    );

    if (complaints.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Complaint not found.",
      });
    }

    const oldStatus = complaints[0].status;
    const resolvedAt =
      status === "Resolved" ? new Date() : null;

    await connection.query(
      `UPDATE complaints
       SET status = ?,
           admin_note = ?,
           assigned_to = ?,
           resolved_at = ?
       WHERE id = ?`,
      [
        status,
        note?.trim() || null,
        req.user.id,
        resolvedAt,
        complaintId,
      ]
    );

    await connection.query(
      `INSERT INTO complaint_status_history
       (complaint_id, changed_by, old_status, new_status, note)
       VALUES (?, ?, ?, ?, ?)`,
      [
        complaintId,
        req.user.id,
        oldStatus,
        status,
        note?.trim() || null,
      ]
    );

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "Complaint status updated successfully.",
    });
  } catch (error) {
    await connection.rollback();
    console.error("Update complaint error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to update complaint status.",
    });
  } finally {
    connection.release();
  }
};

const updateComplaintAssignment = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const complaintId = Number(req.params.id);
    const department = String(
      req.body.department || req.body.assignedDepartment || ""
    ).trim();

    const allowedDepartments = [
      "Electrical Department",
      "Hostel Warden",
      "Cleaning Staff",
      "IT Support",
      "Security Team",
      "Maintenance Team",
    ];

    if (!Number.isInteger(complaintId) || complaintId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid complaint ID.",
      });
    }

    if (!allowedDepartments.includes(department)) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid department.",
      });
    }

    await connection.beginTransaction();

    const [complaints] = await connection.query(
      `SELECT id, status, assigned_department
       FROM complaints
       WHERE id = ?
       FOR UPDATE`,
      [complaintId]
    );

    if (complaints.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Complaint not found.",
      });
    }

    const complaint = complaints[0];

    await connection.query(
      `UPDATE complaints
       SET assigned_department = ?,
           assigned_at = CURRENT_TIMESTAMP,
           assigned_to = ?
       WHERE id = ?`,
      [department, req.user.id, complaintId]
    );

    const assignmentNote = complaint.assigned_department
      ? `Complaint reassigned from ${complaint.assigned_department} to ${department}.`
      : `Complaint assigned to ${department}.`;

    await connection.query(
      `INSERT INTO complaint_status_history
       (complaint_id, changed_by, old_status, new_status, note)
       VALUES (?, ?, ?, ?, ?)`,
      [
        complaintId,
        req.user.id,
        complaint.status,
        complaint.status,
        assignmentNote,
      ]
    );

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: `Complaint assigned to ${department} successfully.`,
      assignment: { complaintId, department },
    });
  } catch (error) {
    await connection.rollback();
    console.error("Assign complaint error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to assign complaint.",
    });
  } finally {
    connection.release();
  }
};

const getComplaintHistory = async (req, res) => {
  try {
    const complaintId = Number(req.params.id);

    const [complaints] = await db.query(
      `SELECT
         c.id,
         c.student_id,
         c.created_at,
         u.name AS student_name
       FROM complaints c
       JOIN users u ON c.student_id = u.id
       WHERE c.id = ?`,
      [complaintId]
    );

    if (complaints.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found.",
      });
    }

    const complaint = complaints[0];

    if (
      req.user.role === "student" &&
      complaint.student_id !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "You cannot view this complaint history.",
      });
    }

    const [history] = await db.query(
      `SELECT
         h.id,
         h.old_status,
         h.new_status,
         h.note,
         h.created_at,
         u.name AS changed_by_name,
         u.role AS changed_by_role
       FROM complaint_status_history h
       JOIN users u ON h.changed_by = u.id
       WHERE h.complaint_id = ?
       ORDER BY h.created_at ASC`,
      [complaintId]
    );

    const timeline = [
      {
        id: `created-${complaintId}`,
        old_status: null,
        new_status: "Raised",
        note: "Complaint submitted by student.",
        created_at: complaint.created_at,
        changed_by_name: complaint.student_name,
        changed_by_role: "student",
      },
      ...history,
    ];

    return res.status(200).json({
      success: true,
      complaintId,
      timeline,
    });
  } catch (error) {
    console.error("Get complaint history error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to load complaint history.",
    });
  }
};

const updateOwnComplaint = async (req, res) => {
  try {
    const complaintId = Number(req.params.id);

    const {
      title,
      category,
      location,
      description,
      priority,
    } = req.body;

    if (!title || !category || !location || !description) {
      return res.status(400).json({
        success: false,
        message:
          "Title, category, location and description are required.",
      });
    }

    const allowedCategories = [
      "Electrical",
      "Plumbing",
      "Internet",
      "Cleanliness",
      "Furniture",
      "Security",
      "Other",
    ];

    const allowedPriorities = ["Low", "Medium", "High"];

    if (!allowedCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: "Invalid complaint category.",
      });
    }

    if (!allowedPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: "Invalid complaint priority.",
      });
    }

    const slaDays = {
      High: 1,
      Medium: 3,
      Low: 7,
    };

    const [result] = await db.query(
      `UPDATE complaints
       SET title = ?,
           category = ?,
           location = ?,
           description = ?,
           priority = ?,
           due_at = DATE_ADD(created_at, INTERVAL ? DAY)
       WHERE id = ?
         AND student_id = ?
         AND status = 'Raised'`,
      [
        title.trim(),
        category,
        location.trim(),
        description.trim(),
        priority,
        slaDays[priority],
        complaintId,
        req.user.id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({
        success: false,
        message:
          "Only your complaints with Raised status can be edited.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Complaint updated successfully.",
    });
  } catch (error) {
    console.error("Update own complaint error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to update complaint.",
    });
  }
};

const deleteOwnComplaint = async (req, res) => {
  try {
    const complaintId = Number(req.params.id);

    const [result] = await db.query(
      `DELETE FROM complaints
       WHERE id = ?
         AND student_id = ?
         AND status = 'Raised'`,
      [complaintId, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({
        success: false,
        message:
          "Only your complaints with Raised status can be deleted.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Complaint deleted successfully.",
    });
  } catch (error) {
    console.error("Delete complaint error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to delete complaint.",
    });
  }
};
const getComplaintAnalytics = async (req, res) => {
  try {
    const [summaryRows] = await db.query(`
      SELECT
        COUNT(*) AS total_complaints,
        SUM(status = 'Raised') AS raised_complaints,
        SUM(status = 'In Progress') AS in_progress_complaints,
        SUM(status = 'Resolved') AS resolved_complaints,
        SUM(
          due_at IS NOT NULL
          AND due_at < NOW()
          AND status <> 'Resolved'
        ) AS overdue_complaints,
        ROUND(
          (SUM(status = 'Resolved') / NULLIF(COUNT(*), 0)) * 100,
          1
        ) AS resolution_rate,
        ROUND(
          AVG(
            CASE
              WHEN resolved_at IS NOT NULL
              THEN TIMESTAMPDIFF(HOUR, created_at, resolved_at)
            END
          ),
          1
        ) AS average_resolution_hours
      FROM complaints
    `);

    const [categoryRows] = await db.query(`
      SELECT
        category,
        COUNT(*) AS complaint_count
      FROM complaints
      GROUP BY category
      ORDER BY complaint_count DESC, category ASC
    `);

    const [priorityRows] = await db.query(`
      SELECT
        priority,
        COUNT(*) AS complaint_count
      FROM complaints
      GROUP BY priority
      ORDER BY FIELD(priority, 'Urgent', 'High', 'Medium', 'Low')
    `);

    const [departmentRows] = await db.query(`
      SELECT
        COALESCE(assigned_department, 'Unassigned') AS department,
        COUNT(*) AS complaint_count
      FROM complaints
      GROUP BY assigned_department
      ORDER BY complaint_count DESC
    `);

    const [locationRows] = await db.query(`
      SELECT
        location,
        COUNT(*) AS complaint_count
      FROM complaints
      WHERE location IS NOT NULL
        AND TRIM(location) <> ''
      GROUP BY location
      ORDER BY complaint_count DESC, location ASC
      LIMIT 5
    `);

    const summary = summaryRows[0];

    return res.status(200).json({
      success: true,
      analytics: {
        summary: {
          totalComplaints:
            Number(summary.total_complaints) || 0,
          raisedComplaints:
            Number(summary.raised_complaints) || 0,
          inProgressComplaints:
            Number(summary.in_progress_complaints) || 0,
          resolvedComplaints:
            Number(summary.resolved_complaints) || 0,
          overdueComplaints:
            Number(summary.overdue_complaints) || 0,
          resolutionRate:
            Number(summary.resolution_rate) || 0,
          averageResolutionHours:
            Number(summary.average_resolution_hours) || 0,
        },
        categories: categoryRows,
        priorities: priorityRows,
        departments: departmentRows,
        topLocations: locationRows,
      },
    });
  } catch (error) {
    console.error(
      "Get complaint analytics error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Unable to load complaint analytics.",
    });
  }
};

module.exports = {
  createComplaint,
  getMyComplaints,
  getAllComplaints,
  getComplaintAnalytics,
  updateComplaintStatus,
  updateComplaintAssignment,
  getComplaintHistory,
  updateOwnComplaint,
  deleteOwnComplaint,
};
