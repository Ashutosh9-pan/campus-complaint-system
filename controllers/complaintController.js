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
      `SELECT
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
  c.is_escalated,
  c.escalation_level,
  c.escalated_at,

  f.rating AS feedback_rating,
  f.feedback AS feedback_text,
  f.created_at AS feedback_created_at,

  CASE
    WHEN c.due_at IS NOT NULL
      AND c.due_at < NOW()
      AND c.status <> 'Resolved'
    THEN TRUE
    ELSE FALSE
  END AS is_overdue

FROM complaints c

LEFT JOIN complaint_feedback f
  ON f.complaint_id = c.id

WHERE c.student_id = ?

ORDER BY c.created_at DESC`,

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
    const {
      status,
      priority,
      category,
      search,
      escalated,
    } = req.query;

    const requestedPage = Number.parseInt(req.query.page, 10);
    const requestedLimit = Number.parseInt(req.query.limit, 10);

    const page =
      Number.isInteger(requestedPage) && requestedPage > 0
        ? requestedPage
        : 1;

    const limit =
      Number.isInteger(requestedLimit) &&
      requestedLimit > 0 &&
      requestedLimit <= 100
        ? requestedLimit
        : 5;

    let fromWhere = `
      FROM complaints c
      JOIN users u ON c.student_id = u.id
      WHERE 1 = 1
    `;

    const filterValues = [];

    if (status) {
      fromWhere += " AND c.status = ?";
      filterValues.push(status);
    }

    if (escalated === "1" || escalated === "0") {
      fromWhere += " AND c.is_escalated = ?";
      filterValues.push(Number(escalated));
    }

    if (priority) {
      fromWhere += " AND c.priority = ?";
      filterValues.push(priority);
    }

    if (category) {
      fromWhere += " AND c.category = ?";
      filterValues.push(category);
    }

    if (search) {
      fromWhere += `
        AND (
          c.title LIKE ?
          OR c.reference_number LIKE ?
          OR c.location LIKE ?
          OR u.name LIKE ?
          OR u.email LIKE ?
        )
      `;

      const searchValue = `%${search}%`;

      filterValues.push(
        searchValue,
        searchValue,
        searchValue,
        searchValue,
        searchValue
      );
    }

    const [countRows] = await db.query(
      `SELECT COUNT(*) AS total ${fromWhere}`,
      filterValues
    );

    const totalItems = Number(countRows[0]?.total) || 0;
    const totalPages = Math.max(
      1,
      Math.ceil(totalItems / limit)
    );

    const currentPage = Math.min(page, totalPages);
    const offset = (currentPage - 1) * limit;

    const query = `
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
        c.is_escalated,
        c.escalation_level,
        c.escalated_at,
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
      ${fromWhere}
      ORDER BY
        FIELD(c.priority, 'Urgent', 'High', 'Medium', 'Low'),
        c.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const queryValues = [
      ...filterValues,
      limit,
      offset,
    ];

    const [complaints] = await db.query(
      query,
      queryValues
    );

    return res.status(200).json({
      success: true,
      count: complaints.length,
      complaints,
      pagination: {
        page: currentPage,
        limit,
        totalItems,
        totalPages,
        hasPreviousPage: currentPage > 1,
        hasNextPage: currentPage < totalPages,
      },
    });
  } catch (error) {
    console.error(
      "Get all complaints error:",
      error.message
    );

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
`SELECT id, student_id, reference_number, status
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

    const oldStatus = complaints[0].status;
    const studentId = complaints[0].student_id;
const referenceNumber =
  complaints[0].reference_number ||
  `Complaint #${complaintId}`;
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

    await connection.query(
  `INSERT INTO notifications
   (user_id, complaint_id, message, type)
   VALUES (?, ?, ?, ?)`,
  [
    studentId,
    complaintId,
    `${referenceNumber} status changed to ${status}.`,
    "status_update",
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
      `SELECT
   id,
   student_id,
   reference_number,
   status,
   assigned_department
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
    const referenceNumber =
  complaint.reference_number ||
  `Complaint #${complaintId}`;

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

await connection.query(
  `INSERT INTO notifications
   (user_id, complaint_id, message, type)
   VALUES (?, ?, ?, ?)`,
  [
    complaint.student_id,
    complaintId,
    `${referenceNumber} assigned to ${department}.`,
    "department_assignment",
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

const submitComplaintFeedback = async (req, res) => {
  try {
    const complaintId = Number(req.params.id);
    const rating = Number(req.body.rating);
    const feedback = String(req.body.feedback || "").trim();

    if (!Number.isInteger(complaintId) || complaintId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid complaint ID.",
      });
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5.",
      });
    }

    const [complaints] = await db.query(
      `SELECT id, student_id, status
       FROM complaints
       WHERE id = ?`,
      [complaintId]
    );

    if (complaints.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found.",
      });
    }

    const complaint = complaints[0];

    if (complaint.student_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You can only rate your own complaint.",
      });
    }

    if (complaint.status !== "Resolved") {
      return res.status(400).json({
        success: false,
        message: "Only resolved complaints can be rated.",
      });
    }

    const [existingFeedback] = await db.query(
      `SELECT id
       FROM complaint_feedback
       WHERE complaint_id = ?`,
      [complaintId]
    );

    if (existingFeedback.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Feedback has already been submitted for this complaint.",
      });
    }

    await db.query(
      `INSERT INTO complaint_feedback
       (complaint_id, student_id, rating, feedback)
       VALUES (?, ?, ?, ?)`,
      [
        complaintId,
        req.user.id,
        rating,
        feedback || null,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Feedback submitted successfully.",
    });
  } catch (error) {
    console.error("Submit complaint feedback error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to submit feedback.",
    });
  }
};


const exportComplaintsCsv = async (req, res) => {
  try {
    const {
      status,
      priority,
      category,
      search,
      escalated,
    } = req.query;

    let query = `
      SELECT
        c.reference_number,
        c.title,
        c.category,
        c.priority,
        c.status,
        c.location,
        c.assigned_department,
        c.created_at,
        c.due_at,
        c.resolved_at,
        c.is_escalated,
        c.escalation_level,
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

    if (escalated === "1" || escalated === "0") {
      query += " AND c.is_escalated = ?";
      values.push(Number(escalated));
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

    const escapeCsvValue = (value) => {
      if (value === null || value === undefined) {
        return "";
      }

      const stringValue = String(value);

      if (
        stringValue.includes(",") ||
        stringValue.includes('"') ||
        stringValue.includes("\n") ||
        stringValue.includes("\r")
      ) {
        return `"${stringValue.replaceAll('"', '""')}"`;
      }

      return stringValue;
    };

    const formatCsvDate = (value) => {
      if (!value) {
        return "";
      }

      const date = new Date(value);

      if (Number.isNaN(date.getTime())) {
        return "";
      }

      return date.toISOString();
    };

    const headers = [
      "Reference Number",
      "Title",
      "Student Name",
      "Student Email",
      "Hostel",
      "Room Number",
      "Category",
      "Priority",
      "Status",
      "Department",
      "Location",
      "Registered At",
      "Due At",
      "Resolved At",
      "Escalated",
      "Escalation Level",
    ];

    const rows = complaints.map((complaint) => [
      complaint.reference_number || "",
      complaint.title || "",
      complaint.student_name || "",
      complaint.student_email || "",
      complaint.hostel || "",
      complaint.room_number || "",
      complaint.category || "",
      complaint.priority || "",
      complaint.status || "",
      complaint.assigned_department || "Unassigned",
      complaint.location || "",
      formatCsvDate(complaint.created_at),
      formatCsvDate(complaint.due_at),
      formatCsvDate(complaint.resolved_at),
      Number(complaint.is_escalated) === 1 ? "Yes" : "No",
      complaint.escalation_level || "",
    ]);

    const csv = [
      headers.map(escapeCsvValue).join(","),
      ...rows.map((row) =>
        row.map(escapeCsvValue).join(",")
      ),
    ].join("\r\n");

    const fileDate = new Date()
      .toISOString()
      .slice(0, 10);

    res.setHeader(
      "Content-Type",
      "text/csv; charset=utf-8"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="CampusResolve-complaints-${fileDate}.csv"`
    );

    // UTF-8 BOM helps Excel display text correctly.
    return res.status(200).send(`\uFEFF${csv}`);
  } catch (error) {
    console.error(
      "Export complaints CSV error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Unable to export complaint report.",
    });
  }
};


const getFeedbackOverview = async (req, res) => {
  try {
    const requestedRating = Number.parseInt(req.query.rating, 10);
    const hasRatingFilter =
      Number.isInteger(requestedRating) &&
      requestedRating >= 1 &&
      requestedRating <= 5;

    const [summaryRows] = await db.query(`
      SELECT
        COUNT(*) AS total_feedback,
        ROUND(AVG(rating), 1) AS average_rating,
        SUM(rating = 5) AS five_star,
        SUM(rating = 4) AS four_star,
        SUM(rating = 3) AS three_star,
        SUM(rating = 2) AS two_star,
        SUM(rating = 1) AS one_star
      FROM complaint_feedback
    `);

    const [distributionRows] = await db.query(`
      SELECT
        rating,
        COUNT(*) AS feedback_count
      FROM complaint_feedback
      GROUP BY rating
      ORDER BY rating DESC
    `);


    const [departmentInsightRows] = await db.query(`
      SELECT
        COALESCE(c.assigned_department, 'Unassigned') AS department,
        ROUND(AVG(f.rating), 1) AS average_rating,
        COUNT(*) AS feedback_count
      FROM complaint_feedback f
      JOIN complaints c ON c.id = f.complaint_id
      GROUP BY c.assigned_department
      HAVING COUNT(*) > 0
      ORDER BY average_rating DESC, feedback_count DESC, department ASC
    `);

    const [categoryInsightRows] = await db.query(`
      SELECT
        c.category,
        ROUND(AVG(f.rating), 1) AS average_rating,
        COUNT(*) AS feedback_count
      FROM complaint_feedback f
      JOIN complaints c ON c.id = f.complaint_id
      GROUP BY c.category
      HAVING COUNT(*) > 0
      ORDER BY average_rating DESC, feedback_count DESC, c.category ASC
    `);

    const [trendRows] = await db.query(`
      SELECT
        DATE(f.created_at) AS feedback_date,
        ROUND(AVG(f.rating), 1) AS average_rating,
        COUNT(*) AS feedback_count
      FROM complaint_feedback f
      WHERE f.created_at >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)
      GROUP BY DATE(f.created_at)
      ORDER BY feedback_date ASC
    `);

    let recentQuery = `
      SELECT
        f.id,
        f.rating,
        f.feedback,
        f.created_at,
        c.id AS complaint_id,
        c.reference_number,
        c.title AS complaint_title,
        c.category,
        c.assigned_department,
        u.id AS student_id,
        u.name AS student_name,
        u.email AS student_email
      FROM complaint_feedback f
      JOIN complaints c ON c.id = f.complaint_id
      JOIN users u ON u.id = f.student_id
    `;

    const values = [];

    if (hasRatingFilter) {
      recentQuery += " WHERE f.rating = ?";
      values.push(requestedRating);
    }

    recentQuery += `
      ORDER BY f.created_at DESC
      LIMIT 20
    `;

    const [recentFeedback] = await db.query(
      recentQuery,
      values
    );

    const summary = summaryRows[0] || {};

    const rankedDepartments = departmentInsightRows
      .filter((row) => row.department !== "Unassigned")
      .map((row) => ({
        department: row.department,
        averageRating: Number(row.average_rating) || 0,
        feedbackCount: Number(row.feedback_count) || 0,
      }));

    const rankedCategories = categoryInsightRows.map((row) => ({
      category: row.category,
      averageRating: Number(row.average_rating) || 0,
      feedbackCount: Number(row.feedback_count) || 0,
    }));

    const highestRatedDepartment =
      rankedDepartments.length > 0 ? rankedDepartments[0] : null;

    const lowestRatedDepartment =
      rankedDepartments.length > 0
        ? rankedDepartments[rankedDepartments.length - 1]
        : null;

    const highestRatedCategory =
      rankedCategories.length > 0 ? rankedCategories[0] : null;

    const lowestRatedCategory =
      rankedCategories.length > 0
        ? rankedCategories[rankedCategories.length - 1]
        : null;

    return res.status(200).json({
      success: true,
      feedbackOverview: {
        summary: {
          totalFeedback:
            Number(summary.total_feedback) || 0,
          averageRating:
            Number(summary.average_rating) || 0,
          fiveStar:
            Number(summary.five_star) || 0,
          fourStar:
            Number(summary.four_star) || 0,
          threeStar:
            Number(summary.three_star) || 0,
          twoStar:
            Number(summary.two_star) || 0,
          oneStar:
            Number(summary.one_star) || 0,
        },
        distribution: distributionRows.map((row) => ({
          rating: Number(row.rating) || 0,
          count: Number(row.feedback_count) || 0,
        })),
        insights: {
          highestRatedDepartment,
          lowestRatedDepartment,
          highestRatedCategory,
          lowestRatedCategory,
          departmentRatings: rankedDepartments,
          categoryRatings: rankedCategories,
          ratingTrend: trendRows.map((row) => ({
            date: row.feedback_date,
            averageRating: Number(row.average_rating) || 0,
            feedbackCount: Number(row.feedback_count) || 0,
          })),
        },
        recentFeedback,
        activeRatingFilter:
          hasRatingFilter ? requestedRating : null,
      },
    });
  } catch (error) {
    console.error(
      "Get feedback overview error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Unable to load feedback overview.",
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
  getFeedbackOverview,
  exportComplaintsCsv,
  updateComplaintStatus,
  updateComplaintAssignment,
  getComplaintHistory,
  updateOwnComplaint,
  deleteOwnComplaint,
  submitComplaintFeedback,
};
