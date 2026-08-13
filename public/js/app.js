const API_BASE = "/api";

const authView = document.getElementById("authView");
const appView = document.getElementById("appView");

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const complaintForm = document.getElementById("complaintForm");

const studentDashboard =
  document.getElementById("studentDashboard");

const adminDashboard =
  document.getElementById("adminDashboard");

const studentComplaintList =
  document.getElementById("studentComplaintList");

const adminComplaintList =
  document.getElementById("adminComplaintList");

const toast = document.getElementById("toast");
const editComplaintModal = document.getElementById("editComplaintModal");
const editComplaintForm = document.getElementById("editComplaintForm");
const closeEditComplaintModalButton = document.getElementById("closeEditComplaintModal");
const cancelEditComplaintButton = document.getElementById("cancelEditComplaint");

let authToken = localStorage.getItem("campus_token");
let currentUser = getStoredUser();
let studentComplaintsCache = [];
let toastTimer;
let searchTimer;

document.querySelectorAll("[data-password-toggle]").forEach((button) => {
  button.addEventListener("click", () => {
    const passwordInput = document.getElementById(
      button.dataset.passwordToggle
    );

    if (!passwordInput) return;

    const passwordIsHidden = passwordInput.type === "password";

    passwordInput.type = passwordIsHidden ? "text" : "password";

    button.setAttribute(
      "aria-label",
      passwordIsHidden ? "Hide password" : "Show password"
    );
  });
});

function getStoredUser() {
  try {
    const storedUser = localStorage.getItem("campus_user");
    return storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    localStorage.removeItem("campus_user");
    return null;
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function categoryIcon(category) {
  const icons = {
    Electrical: "⚡",
    Plumbing: "◉",
    Internet: "⌁",
    Cleanliness: "✦",
    Furniture: "▤",
    Security: "◆",
    Other: "•",
  };

  return icons[category] || icons.Other;
}

function showToast(message, type = "success") {
  clearTimeout(toastTimer);

  toast.textContent = message;
  toast.className = `toast show ${type}`;

  toastTimer = setTimeout(() => {
    toast.className = "toast";
  }, 3200);
}

function setButtonLoading(button, isLoading, loadingText) {
  if (!button.dataset.originalText) {
    button.dataset.originalText = button.textContent.trim();
  }

  button.disabled = isLoading;
  button.textContent = isLoading
    ? loadingText
    : button.dataset.originalText;
}

async function apiRequest(endpoint, options = {}) {
  const headers = {
    ...(options.body
      ? { "Content-Type": "application/json" }
      : {}),
    ...options.headers,
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({
    success: false,
    message: "Invalid server response.",
  }));

  if (!response.ok) {
    if (response.status === 401 && authToken) {
      logout(false);
    }

    throw new Error(data.message || "Request failed.");
  }

  return data;
}

function formatDate(dateValue) {
  if (!dateValue) return "Not available";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateValue));
}

function getInitials(name) {
  return String(name || "User")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function statusClass(status) {
  return `status-${status.toLowerCase().replaceAll(" ", "-")}`;
}

function priorityClass(priority) {
  return `priority-${priority.toLowerCase()}`;
}

function switchAuthTab(tabName) {
  document.querySelectorAll("[data-auth-tab]").forEach((tab) => {
    tab.classList.toggle(
      "active",
      tab.dataset.authTab === tabName
    );
  });

  loginForm.classList.toggle("hidden", tabName !== "login");
  registerForm.classList.toggle(
    "hidden",
    tabName !== "register"
  );
}

document.querySelectorAll("[data-auth-tab]").forEach((tab) => {
  tab.addEventListener("click", () => {
    switchAuthTab(tab.dataset.authTab);
  });
});

function saveSession(data) {
  authToken = data.token;
  currentUser = data.user;

  localStorage.setItem("campus_token", authToken);
  localStorage.setItem(
    "campus_user",
    JSON.stringify(currentUser)
  );
}

function logout(showMessage = true) {
  authToken = null;
  currentUser = null;

  localStorage.removeItem("campus_token");
  localStorage.removeItem("campus_user");

  appView.classList.add("hidden");
  authView.classList.remove("hidden");

  studentDashboard.classList.add("hidden");
  adminDashboard.classList.add("hidden");

  loginForm.reset();
  switchAuthTab("login");

  if (showMessage) {
    showToast("Logged out successfully.");
  }
}

async function showApplication() {
  if (!authToken || !currentUser) {
    logout(false);
    return;
  }

  authView.classList.add("hidden");
  appView.classList.remove("hidden");

  document.getElementById("userName").textContent =
    currentUser.name;

  document.getElementById("userRole").textContent =
    currentUser.role;

  document.getElementById("userInitials").textContent =
    getInitials(currentUser.name);

  const isAdmin = currentUser.role === "admin";

  studentDashboard.classList.toggle("hidden", isAdmin);
  adminDashboard.classList.toggle("hidden", !isAdmin);

  try {
    if (isAdmin) {
      await loadAdminComplaints();
    } else {
      await loadStudentComplaints();
    }
  } catch (error) {
    showToast(error.message, "error");
  }
}

/* Authentication */

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const submitButton =
    loginForm.querySelector('button[type="submit"]');

  const body = {
    email: document.getElementById("loginEmail").value,
    password: document.getElementById("loginPassword").value,
  };

  try {
    setButtonLoading(submitButton, true, "Logging in...");

    const data = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    });

    saveSession(data);
    loginForm.reset();

    showToast(`Welcome back, ${data.user.name}.`);
    await showApplication();
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    setButtonLoading(submitButton, false);
  }
});

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const submitButton =
    registerForm.querySelector('button[type="submit"]');

  const email =
    document.getElementById("registerEmail").value;

  const body = {
    name: document.getElementById("registerName").value,
    email,
    password:
      document.getElementById("registerPassword").value,
    hostel:
      document.getElementById("registerHostel").value,
    roomNumber:
      document.getElementById("registerRoom").value,
  };

  try {
    setButtonLoading(
      submitButton,
      true,
      "Creating account..."
    );

    const data = await apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    });

    registerForm.reset();
    switchAuthTab("login");

    document.getElementById("loginEmail").value = email;

    showToast(data.message);
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    setButtonLoading(submitButton, false);
  }
});

document
  .getElementById("logoutButton")
  .addEventListener("click", () => logout());

/* Student Dashboard */

function updateStudentStats(complaints) {
  document.getElementById("studentTotal").textContent =
    complaints.length;

  document.getElementById("studentRaised").textContent =
    complaints.filter(
      (complaint) => complaint.status === "Raised"
    ).length;

  document.getElementById("studentProgress").textContent =
    complaints.filter(
      (complaint) => complaint.status === "In Progress"
    ).length;

  document.getElementById("studentResolved").textContent =
    complaints.filter(
      (complaint) => complaint.status === "Resolved"
    ).length;
}

function renderStudentComplaints(complaints) {
  if (complaints.length === 0) {
    studentComplaintList.innerHTML = `
      <div class="empty-state">
        <span class="empty-illustration">✓</span>
        <h3>No complaints raised</h3>
        <p>
          Your submitted complaints and their status updates
          will appear here.
        </p>
      </div>
    `;

    return;
  }

  studentComplaintList.innerHTML = complaints
    .map(
      (complaint) => `
        <article class="complaint-item">
          <div class="complaint-card-top">
            <div>
              <p class="complaint-number">
                Complaint #${escapeHtml(complaint.id)}
              </p>

              <h3>${escapeHtml(complaint.title)}</h3>
            </div>

            <span
              class="status-badge
              ${statusClass(complaint.status)}"
            >
              ${escapeHtml(complaint.status)}
            </span>
          </div>

          <p class="complaint-description">
            ${escapeHtml(complaint.description)}
          </p>

          <div class="complaint-meta">
            <span class="category-chip">
              <b aria-hidden="true">${categoryIcon(complaint.category)}</b>
              ${escapeHtml(complaint.category)}
            </span>

            <span>
              ${escapeHtml(complaint.location)}
            </span>

            <span
              class="priority-badge
              ${priorityClass(complaint.priority)}"
            >
              ${escapeHtml(complaint.priority)} priority
            </span>

            <span>${formatDate(complaint.created_at)}</span>

            ${
              complaint.assigned_department
                ? `<span class="assignment-badge">
                    Assigned: ${escapeHtml(complaint.assigned_department)}
                   </span>`
                : ""
            }
          </div>

          ${
            complaint.admin_note
              ? `
                <div class="admin-note">
                  <strong>Administrator update:</strong>
                  ${escapeHtml(complaint.admin_note)}
                </div>
              `
              : ""
          }
          ${
  String(complaint.status).trim().toLowerCase() === "raised"
    ? `
      <div class="student-complaint-actions">
        <button
          class="edit-complaint-button secondary-button"
          type="button"
          data-edit-id="${escapeHtml(complaint.id)}"
        >
          Edit Complaint
        </button>

        <button
          class="delete-complaint-button danger-button"
          type="button"
          data-delete-id="${escapeHtml(complaint.id)}"
        >
          Delete Complaint
        </button>
      </div>
    `
    : ""
}
          <button
  class="timeline-button secondary-button"
  type="button"
  data-history-id="${escapeHtml(complaint.id)}"
>
  View Status Timeline
</button>

<div
  id="timeline-${escapeHtml(complaint.id)}"
  class="timeline-container hidden"
></div>
        </article>
      `
    )
    .join("");
}

async function loadStudentComplaints() {
  studentComplaintList.innerHTML = `
    <div class="empty-state">
      <span class="loading-spinner" aria-hidden="true"></span>
      <h3>Loading complaints...</h3>
    </div>
  `;

  const data = await apiRequest("/complaints/mine");
  const complaints = data.complaints || [];

  studentComplaintsCache = complaints;

  updateStudentStats(complaints);
  renderStudentComplaints(complaints);
}

complaintForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const submitButton =
    complaintForm.querySelector('button[type="submit"]');

  const body = {
    title:
      document.getElementById("complaintTitle").value,
    category:
      document.getElementById("complaintCategory").value,
    location:
      document.getElementById("complaintLocation").value,
    description:
      document.getElementById("complaintDescription").value,
    priority:
      document.getElementById("complaintPriority").value,
  };

  try {
    setButtonLoading(
      submitButton,
      true,
      "Submitting complaint..."
    );

    const data = await apiRequest("/complaints", {
      method: "POST",
      body: JSON.stringify(body),
    });

    complaintForm.reset();
    document.getElementById("complaintPriority").value =
      "Medium";

    showToast(data.message);
    await loadStudentComplaints();
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    setButtonLoading(submitButton, false);
  }
});

document
  .getElementById("focusComplaintForm")
  .addEventListener("click", () => {
    document
      .getElementById("complaintFormCard")
      .scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

    document.getElementById("complaintTitle").focus({
      preventScroll: true,
    });
  });

document
  .getElementById("refreshStudentComplaints")
  .addEventListener("click", async () => {
    try {
      await loadStudentComplaints();
      showToast("Complaints refreshed.");
    } catch (error) {
      showToast(error.message, "error");
    }
  });

  studentComplaintList.addEventListener("click", async (event) => {
  const button = event.target.closest(".timeline-button");

  if (!button) return;

  const complaintId = button.dataset.historyId;
  const container = document.getElementById(
    `timeline-${complaintId}`
  );

  if (!container.classList.contains("hidden")) {
    container.classList.add("hidden");
    button.textContent = "View Status Timeline";
    return;
  }

  try {
    button.disabled = true;
    button.textContent = "Loading timeline...";

    const data = await apiRequest(
      `/complaints/${complaintId}/history`
    );

    container.innerHTML = data.timeline
      .map(
        (item) => `
          <div class="timeline-entry">
            <span class="timeline-dot"></span>

            <div>
              <strong>
                ${escapeHtml(item.new_status)}
              </strong>

              <p>
                ${escapeHtml(
                  item.note || "Status updated."
                )}
              </p>

              <small>
                ${escapeHtml(item.changed_by_name)}
                · ${formatDate(item.created_at)}
              </small>
            </div>
          </div>
        `
      )
      .join("");

    container.classList.remove("hidden");
    button.textContent = "Hide Status Timeline";
  } catch (error) {
    showToast(error.message, "error");
    button.textContent = "View Status Timeline";
  } finally {
    button.disabled = false;
  }
});
function openEditComplaintModal(complaint) {
  document.getElementById("editComplaintId").value = complaint.id;
  document.getElementById("editComplaintTitle").value = complaint.title || "";
  document.getElementById("editComplaintCategory").value = complaint.category || "Other";
  document.getElementById("editComplaintPriority").value = complaint.priority || "Medium";
  document.getElementById("editComplaintLocation").value = complaint.location || "";
  document.getElementById("editComplaintDescription").value = complaint.description || "";
  editComplaintModal.classList.remove("hidden");
  document.body.classList.add("modal-open");
  editComplaintModal.querySelector(".modal-card").focus();
}

function closeEditComplaintModal() {
  editComplaintModal.classList.add("hidden");
  document.body.classList.remove("modal-open");
  editComplaintForm.reset();
}

// Open the professional edit modal.
studentComplaintList.addEventListener("click", (event) => {
  const editButton = event.target.closest(".edit-complaint-button");

  if (!editButton) return;

  const complaintId = editButton.dataset.editId;

  const complaint = studentComplaintsCache.find(
    (item) => String(item.id) === String(complaintId)
  );

  if (!complaint) {
    showToast("Complaint details could not be loaded.", "error");
    return;
  }

  openEditComplaintModal(complaint);
});

editComplaintForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const submitButton = editComplaintForm.querySelector('button[type="submit"]');
  const complaintId = document.getElementById("editComplaintId").value;
  const body = {
    title: document.getElementById("editComplaintTitle").value.trim(),
    category: document.getElementById("editComplaintCategory").value,
    location: document.getElementById("editComplaintLocation").value.trim(),
    description: document.getElementById("editComplaintDescription").value.trim(),
    priority: document.getElementById("editComplaintPriority").value,
  };

  try {
    setButtonLoading(submitButton, true, "Saving changes...");

    const response = await apiRequest(`/complaints/${complaintId}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });

    closeEditComplaintModal();
    showToast(response.message || "Complaint updated successfully.");
    await loadStudentComplaints();
  } catch (error) {
    showToast(error.message || "Unable to update complaint.", "error");
  } finally {
    setButtonLoading(submitButton, false);
  }
});

closeEditComplaintModalButton.addEventListener("click", closeEditComplaintModal);
cancelEditComplaintButton.addEventListener("click", closeEditComplaintModal);
editComplaintModal.addEventListener("click", (event) => {
  if (event.target === editComplaintModal) closeEditComplaintModal();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !editComplaintModal.classList.contains("hidden")) {
    closeEditComplaintModal();
  }
});

// Delete complaint
studentComplaintList.addEventListener("click", async (event) => {
  const deleteButton = event.target.closest(
    ".delete-complaint-button"
  );

  if (!deleteButton) return;

  const complaintId = deleteButton.dataset.deleteId;

  const confirmed = confirm(
    "Are you sure you want to delete this complaint?"
  );

  if (!confirmed) return;

  try {
    deleteButton.disabled = true;
    deleteButton.textContent = "Deleting...";

    const response = await apiRequest(
      `/complaints/${complaintId}`,
      {
        method: "DELETE",
      }
    );

    showToast(
      response.message || "Complaint deleted successfully.",
      "success"
    );

    await loadStudentComplaints();
  } catch (error) {
    showToast(
      error.message || "Unable to delete complaint.",
      "error"
    );

    deleteButton.disabled = false;
    deleteButton.textContent = "Delete Complaint";
  }
});

/* Admin Dashboard */

function updateAdminStats(complaints) {
  document.getElementById("adminTotal").textContent =
    complaints.length;

  document.getElementById("adminRaised").textContent =
    complaints.filter(
      (complaint) =>
        String(complaint.status).trim().toLowerCase() === "raised"
    ).length;

  document.getElementById("adminProgress").textContent =
    complaints.filter(
      (complaint) => complaint.status === "In Progress"
    ).length;

  document.getElementById("adminResolved").textContent =
    complaints.filter(
      (complaint) => complaint.status === "Resolved"
    ).length;
}

function statusOptions(currentStatus) {
  return ["Raised", "In Progress", "Resolved"]
    .map(
      (status) => `
        <option
          value="${status}"
          ${status === currentStatus ? "selected" : ""}
        >
          ${status}
        </option>
      `
    )
    .join("");
}

function departmentOptions(currentDepartment) {
  const departments = [
    "Electrical Department",
    "Hostel Warden",
    "Cleaning Staff",
    "IT Support",
    "Security Team",
    "Maintenance Team",
  ];

  return [
    `<option value="">Select department</option>`,
    ...departments.map(
      (department) => `
        <option
          value="${escapeHtml(department)}"
          ${department === currentDepartment ? "selected" : ""}
        >
          ${escapeHtml(department)}
        </option>
      `
    ),
  ].join("");
}

function renderAdminComplaints(complaints) {
  if (complaints.length === 0) {
    adminComplaintList.innerHTML = `
      <div class="empty-state">
        <span class="empty-illustration">⌕</span>
        <h3>No matching complaints</h3>
        <p>
          Change the filters or search term to view
          additional complaints.
        </p>
      </div>
    `;

    return;
  }

  adminComplaintList.innerHTML = complaints
    .map(
      (complaint) => `
        <article class="admin-complaint-card">
          <div>
            <div class="complaint-card-top">
              <div>
                <p class="complaint-number">
                  Complaint #${escapeHtml(complaint.id)}
                </p>

                <h3>${escapeHtml(complaint.title)}</h3>
              </div>

              <span
                class="status-badge
                ${statusClass(complaint.status)}"
              >
                ${escapeHtml(complaint.status)}
              </span>
            </div>

            <p class="complaint-description">
              ${escapeHtml(complaint.description)}
            </p>

            <div class="complaint-meta">
              <span class="category-chip">
                <b aria-hidden="true">${categoryIcon(complaint.category)}</b>
                ${escapeHtml(complaint.category)}
              </span>

              <span>
                ${escapeHtml(complaint.location)}
              </span>

              <span
                class="priority-badge
                ${priorityClass(complaint.priority)}"
              >
                ${escapeHtml(complaint.priority)} priority
              </span>

              <span>
                ${formatDate(complaint.created_at)}
              </span>

              ${
                complaint.assigned_department
                  ? `<span class="assignment-badge">
                      Assigned: ${escapeHtml(complaint.assigned_department)}
                     </span>`
                  : `<span class="assignment-badge unassigned">
                      Not assigned
                     </span>`
              }
            </div>

            <div class="admin-student-details">
              <div>
                <span>Student</span>
                <strong>
                  ${escapeHtml(complaint.student_name)}
                </strong>
              </div>

              <div>
                <span>Email</span>
                <strong>
                  ${escapeHtml(complaint.student_email)}
                </strong>
              </div>

              <div>
                <span>Hostel</span>
                <strong>
                  ${escapeHtml(complaint.hostel || "Not added")}
                </strong>
              </div>

              <div>
                <span>Room</span>
                <strong>
                  ${escapeHtml(
                    complaint.room_number || "Not added"
                  )}
                </strong>
              </div>
            </div>
          </div>

          <form
            class="assignment-form"
            data-complaint-id="${escapeHtml(complaint.id)}"
          >
            <label>
              Assign department

              <select class="department-select" required>
                ${departmentOptions(complaint.assigned_department)}
              </select>
            </label>

            <button class="secondary-button" type="submit">
              Assign Department
            </button>
          </form>

          <form
            class="status-update-form"
            data-complaint-id="${escapeHtml(complaint.id)}"
          >
            <label>
              Update status

              <select class="status-select">
                ${statusOptions(complaint.status)}
              </select>
            </label>

            <label>
              Administrator note

              <textarea
                class="status-note"
                rows="3"
                placeholder="Add a clear update for the student..."
              >${escapeHtml(complaint.admin_note || "")}</textarea>
            </label>

            <button class="primary-button" type="submit">
              Save Update
            </button>
          </form>
        </article>
      `
    )
    .join("");
}

function buildAdminQuery() {
  const parameters = new URLSearchParams();

  const search =
    document.getElementById("adminSearch").value.trim();

  const status =
    document.getElementById("adminStatusFilter").value;

  const priority =
    document.getElementById("adminPriorityFilter").value;

  const category =
    document.getElementById("adminCategoryFilter").value;

  if (search) parameters.set("search", search);
  if (status) parameters.set("status", status);
  if (priority) parameters.set("priority", priority);
  if (category) parameters.set("category", category);

  const queryString = parameters.toString();
  return queryString ? `?${queryString}` : "";
}

async function loadAdminComplaints() {
  adminComplaintList.innerHTML = `
    <div class="empty-state">
      <span class="loading-spinner" aria-hidden="true"></span>
      <h3>Loading complaint queue...</h3>
    </div>
  `;

  const data = await apiRequest(
    `/complaints${buildAdminQuery()}`
  );

  const complaints = data.complaints || [];

  updateAdminStats(complaints);
  renderAdminComplaints(complaints);
}

adminComplaintList.addEventListener(
  "submit",
  async (event) => {
    const assignmentForm = event.target.closest(".assignment-form");

    if (assignmentForm) {
      event.preventDefault();

      const complaintId = assignmentForm.dataset.complaintId;
      const department = assignmentForm.querySelector(
        ".department-select"
      ).value;
      const submitButton = assignmentForm.querySelector(
        'button[type="submit"]'
      );

      if (!department) {
        showToast("Please select a department.", "error");
        return;
      }

      try {
        setButtonLoading(submitButton, true, "Assigning...");

        const data = await apiRequest(
          `/complaints/${complaintId}/assign`,
          {
            method: "PATCH",
            body: JSON.stringify({ department }),
          }
        );

        showToast(data.message);
        await loadAdminComplaints();
      } catch (error) {
        showToast(error.message, "error");
      } finally {
        setButtonLoading(submitButton, false);
      }

      return;
    }

    const form = event.target.closest(".status-update-form");

    if (!form) return;

    event.preventDefault();

    const complaintId = form.dataset.complaintId;
    const submitButton =
      form.querySelector('button[type="submit"]');

    const body = {
      status: form.querySelector(".status-select").value,
      note: form.querySelector(".status-note").value,
    };

    try {
      setButtonLoading(
        submitButton,
        true,
        "Saving update..."
      );

      const data = await apiRequest(
        `/complaints/${complaintId}/status`,
        {
          method: "PATCH",
          body: JSON.stringify(body),
        }
      );

      showToast(data.message);
      await loadAdminComplaints();
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setButtonLoading(submitButton, false);
    }
  }
);

[
  "adminStatusFilter",
  "adminPriorityFilter",
  "adminCategoryFilter",
].forEach((elementId) => {
  document
    .getElementById(elementId)
    .addEventListener("change", async () => {
      try {
        await loadAdminComplaints();
      } catch (error) {
        showToast(error.message, "error");
      }
    });
});

document
  .getElementById("adminSearch")
  .addEventListener("input", () => {
    clearTimeout(searchTimer);

    searchTimer = setTimeout(async () => {
      try {
        await loadAdminComplaints();
      } catch (error) {
        showToast(error.message, "error");
      }
    }, 350);
  });

document
  .getElementById("refreshAdminComplaints")
  .addEventListener("click", async () => {
    try {
      await loadAdminComplaints();
      showToast("Complaint queue refreshed.");
    } catch (error) {
      showToast(error.message, "error");
    }
  });

/* Initial Session */

if (authToken && currentUser) {
  showApplication();
} else {
  logout(false);
}
