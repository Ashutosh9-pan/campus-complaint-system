const API_BASE = "/api";

const authView = document.getElementById("authView");
const appView = document.getElementById("appView");

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const forgotPasswordForm =
  document.getElementById("forgotPasswordForm");
const verifyResetOtpForm =
  document.getElementById("verifyResetOtpForm");
const resetPasswordForm =
  document.getElementById("resetPasswordForm");
const authTabs = document.querySelector(".auth-tabs");
const authEyebrow = document.getElementById("authEyebrow");
const authTitle = document.getElementById("authTitle");
const authSubtitle = document.getElementById("authSubtitle");
const complaintForm = document.getElementById("complaintForm");

const studentDashboard =
  document.getElementById("studentDashboard");

const adminDashboard =
  document.getElementById("adminDashboard");

const studentComplaintList =
  document.getElementById("studentComplaintList");

const adminComplaintList =
  document.getElementById("adminComplaintList");

const refreshAnalyticsButton =
  document.getElementById("refreshAnalytics");

const analyticsResolutionRate =
  document.getElementById("analyticsResolutionRate");

const analyticsResolutionTime =
  document.getElementById("analyticsResolutionTime");

const analyticsDepartmentCount =
  document.getElementById("analyticsDepartmentCount");

const categoryAnalytics =
  document.getElementById("categoryAnalytics");

const priorityAnalytics =
  document.getElementById("priorityAnalytics");

const departmentAnalytics =
  document.getElementById("departmentAnalytics");

const locationAnalytics =
  document.getElementById("locationAnalytics");


const refreshFeedbackOverviewButton =
  document.getElementById("refreshFeedbackOverview");

const feedbackRatingFilter =
  document.getElementById("feedbackRatingFilter");

const feedbackAverageRating =
  document.getElementById("feedbackAverageRating");

const feedbackTotalCount =
  document.getElementById("feedbackTotalCount");

const feedbackFiveStarCount =
  document.getElementById("feedbackFiveStarCount");

const feedbackAverageStars =
  document.getElementById("feedbackAverageStars");

const feedbackDistribution =
  document.getElementById("feedbackDistribution");

const recentFeedbackList =
  document.getElementById("recentFeedbackList");


const highestRatedDepartment =
  document.getElementById("highestRatedDepartment");
const highestRatedDepartmentMeta =
  document.getElementById("highestRatedDepartmentMeta");
const lowestRatedDepartment =
  document.getElementById("lowestRatedDepartment");
const lowestRatedDepartmentMeta =
  document.getElementById("lowestRatedDepartmentMeta");
const highestRatedCategory =
  document.getElementById("highestRatedCategory");
const highestRatedCategoryMeta =
  document.getElementById("highestRatedCategoryMeta");
const lowestRatedCategory =
  document.getElementById("lowestRatedCategory");
const lowestRatedCategoryMeta =
  document.getElementById("lowestRatedCategoryMeta");

const highestRatedDepartmentScore =
  document.getElementById("highestRatedDepartmentScore");
const lowestRatedDepartmentScore =
  document.getElementById("lowestRatedDepartmentScore");
const highestRatedCategoryScore =
  document.getElementById("highestRatedCategoryScore");
const lowestRatedCategoryScore =
  document.getElementById("lowestRatedCategoryScore");
const feedbackTrendChart =
  document.getElementById("feedbackTrendChart");
const feedbackTrendSummary =
  document.getElementById("feedbackTrendSummary");


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
let notificationRefreshTimer;
let adminCurrentPage = 1;
const ADMIN_PAGE_LIMIT = 5;
let adminPagination = {
  page: 1,
  limit: ADMIN_PAGE_LIMIT,
  totalItems: 0,
  totalPages: 1,
  hasPreviousPage: false,
  hasNextPage: false,
};
let passwordResetState = {
  email: "",
  resetToken: "",
};

/* Student Notifications */

function ensureNotificationUI() {
  if (!currentUser || currentUser.role !== "student") return;
  if (document.getElementById("notificationButton")) return;

  const logoutButton = document.getElementById("logoutButton");
  if (!logoutButton || !logoutButton.parentElement) return;

  const wrapper = document.createElement("div");
  wrapper.className = "notification-wrapper";
  wrapper.innerHTML = `
    <button id="notificationButton" class="notification-button" type="button" aria-label="Notifications" aria-expanded="false">
      ${crIcon("bell", "cr-notification-bell")}
      <span id="notificationBadge" class="notification-badge hidden">0</span>
    </button>
    <div id="notificationPanel" class="notification-panel hidden">
      <div class="notification-panel-header">
        <div>
          <strong>Notifications</strong>
          <small id="notificationSummary">You're all caught up</small>
        </div>
        <button id="markAllNotificationsRead" type="button">Mark all as read</button>
      </div>
      <div id="notificationList" class="notification-list">
        <div class="notification-empty">Loading notifications...</div>
      </div>
    </div>
  `;

  logoutButton.parentElement.insertBefore(wrapper, logoutButton);

  if (!document.getElementById("notificationRuntimeStyles")) {
    const style = document.createElement("style");
    style.id = "notificationRuntimeStyles";
    style.textContent = `
      .notification-wrapper{position:relative;display:inline-flex;align-items:center}
      .notification-button{position:relative;width:48px;height:48px;border:1px solid #d8e7e5;border-radius:16px;background:#fff;cursor:pointer;display:grid;place-items:center;font-size:20px;color:#12343b}
      .notification-button:hover{background:#f2fbfa}
      .notification-badge{position:absolute;top:-6px;right:-6px;min-width:22px;height:22px;padding:0 6px;border-radius:999px;background:#ef4444;color:#fff;font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center;border:2px solid #fff}
      .notification-badge.hidden,.notification-panel.hidden{display:none!important}
      .notification-panel{position:absolute;right:0;top:58px;width:min(390px,calc(100vw - 28px));max-height:470px;overflow:hidden;background:#fff;border:1px solid #d8e7e5;border-radius:20px;box-shadow:0 20px 55px rgba(17,52,59,.18);z-index:1000}
      .notification-panel-header{padding:16px 18px;border-bottom:1px solid #e8f0ef;display:flex;align-items:center;justify-content:space-between;gap:12px}
      .notification-panel-header strong{display:block;font-size:18px;color:#12343b}.notification-panel-header small{display:block;margin-top:3px;color:#789096}
      #markAllNotificationsRead{border:0;background:transparent;color:#0b9f93;font-weight:800;cursor:pointer;white-space:nowrap}
      #markAllNotificationsRead:disabled{opacity:.45;cursor:default}
      .notification-list{max-height:390px;overflow:auto}
      .notification-item{width:100%;border:0;border-bottom:1px solid #edf3f2;background:#fff;text-align:left;padding:15px 18px;cursor:pointer;display:block}
      .notification-item.unread{background:#effaf8}.notification-item:hover{background:#f5fbfa}
      .notification-item-title{font-weight:800;color:#12343b;margin-bottom:5px}.notification-item-message{color:#58747a;line-height:1.45;font-size:14px}.notification-item-time{display:block;margin-top:7px;color:#8ba0a5;font-size:12px}
      .notification-empty{padding:28px 18px;text-align:center;color:#789096}
      @media(max-width:600px){.notification-button{width:42px;height:42px;border-radius:14px}.notification-panel{position:fixed;top:82px;right:14px;left:14px;width:auto}}
    `;
    document.head.appendChild(style);
  }

  document.getElementById("notificationButton").addEventListener("click", async (event) => {
    event.stopPropagation();
    const panel = document.getElementById("notificationPanel");
    const opening = panel.classList.contains("hidden");
    panel.classList.toggle("hidden");
    document.getElementById("notificationButton").setAttribute("aria-expanded", String(opening));
    if (opening) {
      try { await loadNotifications(); } catch (error) { showToast(error.message, "error"); }
    }
  });

  document.getElementById("notificationPanel").addEventListener("click", (event) => event.stopPropagation());
  document.addEventListener("click", () => {
    const panel = document.getElementById("notificationPanel");
    const button = document.getElementById("notificationButton");
    if (panel) panel.classList.add("hidden");
    if (button) button.setAttribute("aria-expanded", "false");
  });

  document.getElementById("markAllNotificationsRead").addEventListener("click", markAllNotificationsAsRead);
  document.getElementById("notificationList").addEventListener("click", async (event) => {
    const item = event.target.closest("[data-notification-id]");
    if (!item || !item.classList.contains("unread")) return;
    try {
      await apiRequest(`/notifications/${item.dataset.notificationId}/read`, { method: "PATCH" });
      await loadNotifications();
    } catch (error) { showToast(error.message, "error"); }
  });
}

function removeNotificationUI() {
  document.getElementById("notificationButton")?.closest(".notification-wrapper")?.remove();
  clearInterval(notificationRefreshTimer);
  notificationRefreshTimer = null;
}

function renderNotifications(notifications, unreadCount) {
  const badge = document.getElementById("notificationBadge");
  const list = document.getElementById("notificationList");
  const summary = document.getElementById("notificationSummary");
  const markAllButton = document.getElementById("markAllNotificationsRead");
  if (!badge || !list || !summary || !markAllButton) return;

  const unread = Number(unreadCount) || 0;
  badge.textContent = unread > 99 ? "99+" : String(unread);
  badge.classList.toggle("hidden", unread === 0);
  summary.textContent = unread ? `${unread} unread notification${unread === 1 ? "" : "s"}` : "You're all caught up";
  markAllButton.disabled = unread === 0;

  if (!Array.isArray(notifications) || notifications.length === 0) {
    list.innerHTML = `<div class="notification-empty">No notifications yet.</div>`;
    return;
  }

  list.innerHTML = notifications.map((notification) => {
    const isRead = Number(notification.is_read) === 1 || notification.is_read === true;
    const title = notification.title || "Complaint update";
    const message = notification.message || "Your complaint has been updated.";
    return `
      <button class="notification-item ${isRead ? "" : "unread"}" type="button" data-notification-id="${escapeHtml(notification.id)}">
        <div class="notification-item-title">${escapeHtml(title)}</div>
        <div class="notification-item-message">${escapeHtml(message)}</div>
        <small class="notification-item-time">${formatDate(notification.created_at)}</small>
      </button>
    `;
  }).join("");
}

async function loadNotifications() {
  if (!currentUser || currentUser.role !== "student" || !authToken) return;
  const data = await apiRequest("/notifications");
  renderNotifications(data.notifications || [], data.unreadCount || 0);
}

async function markAllNotificationsAsRead() {
  const button = document.getElementById("markAllNotificationsRead");
  if (!button) return;
  try {
    button.disabled = true;
    await apiRequest("/notifications/read-all", { method: "PATCH" });
    await loadNotifications();
    showToast("All notifications marked as read.");
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    if (document.getElementById("markAllNotificationsRead")) button.disabled = false;
  }
}

function startNotificationRefresh() {
  clearInterval(notificationRefreshTimer);
  notificationRefreshTimer = setInterval(() => {
    if (currentUser?.role === "student" && authToken) loadNotifications().catch(() => {});
  }, 30000);
}

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


function crIcon(name, className = "cr-js-icon") {
  const icons = {
    grid: `<svg class="cr-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/></svg>`,
    flag: `<svg class="cr-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M6 21V4"/><path d="M6 5h10l-2 3 2 3H6"/></svg>`,
    calendar: `<svg class="cr-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="6" width="16" height="14" rx="2"/><path d="M8 3v5M16 3v5M4 10h16"/><path d="M8 14h2M14 14h2M8 17h2M14 17h2"/></svg>`,
    pin: `<svg class="cr-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s6-5.4 6-11a6 6 0 1 0-12 0c0 5.6 6 11 6 11Z"/><circle cx="12" cy="10" r="2"/></svg>`,
    chevron: `<svg class="cr-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>`,
    bell: `<svg class="cr-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9a6 6 0 0 1 12 0v4.5l2 2.5H4l2-2.5z"/><path d="M10 19h4"/></svg>`,
    check: `<svg class="cr-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><path d="m8.5 12.2 2.3 2.4 4.8-5"/></svg>`
  };

  return (icons[name] || "").replace(
    'class="cr-icon"',
    `class="${className}"`
  );
}

function formatShortDate(dateValue) {
  if (!dateValue) return "Not available";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(dateValue));
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
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(!isFormData && options.body
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

function resetPasswordRecoveryState() {
  passwordResetState = {
    email: "",
    resetToken: "",
  };

  forgotPasswordForm?.reset();
  verifyResetOtpForm?.reset();
  resetPasswordForm?.reset();
}

function setAuthHeading({ eyebrow, title, subtitle }) {
  if (authEyebrow) authEyebrow.textContent = eyebrow;
  if (authTitle) authTitle.textContent = title;
  if (authSubtitle) authSubtitle.textContent = subtitle;
}

function showPasswordRecoveryStep(step) {
  loginForm.classList.add("hidden");
  registerForm.classList.add("hidden");
  forgotPasswordForm?.classList.add("hidden");
  verifyResetOtpForm?.classList.add("hidden");
  resetPasswordForm?.classList.add("hidden");
  authTabs?.classList.add("hidden");

  if (step === "email") {
    forgotPasswordForm?.classList.remove("hidden");
    setAuthHeading({
      eyebrow: "Password recovery",
      title: "Reset your password",
      subtitle: "Enter your registered email to receive a secure verification code.",
    });

    const emailInput = document.getElementById("forgotPasswordEmail");
    if (emailInput) {
      emailInput.value =
        passwordResetState.email ||
        document.getElementById("loginEmail")?.value ||
        "";
      emailInput.focus();
    }
    return;
  }

  if (step === "otp") {
    verifyResetOtpForm?.classList.remove("hidden");
    setAuthHeading({
      eyebrow: "Verification",
      title: "Check your email",
      subtitle: "Use the latest 6-digit code sent by CampusResolve.",
    });

    const preview = document.getElementById("resetEmailPreview");
    if (preview) preview.textContent = passwordResetState.email || "your email";
    document.getElementById("resetOtp")?.focus();
    return;
  }

  resetPasswordForm?.classList.remove("hidden");
  setAuthHeading({
    eyebrow: "Almost done",
    title: "Create a new password",
    subtitle: "Your email is verified. Choose a new password for your account.",
  });
  document.getElementById("newResetPassword")?.focus();
}

function switchAuthTab(tabName) {
  resetPasswordRecoveryState();
  authTabs?.classList.remove("hidden");

  document.querySelectorAll("[data-auth-tab]").forEach((tab) => {
    tab.classList.toggle(
      "active",
      tab.dataset.authTab === tabName
    );
  });

  forgotPasswordForm?.classList.add("hidden");
  verifyResetOtpForm?.classList.add("hidden");
  resetPasswordForm?.classList.add("hidden");

  loginForm.classList.toggle("hidden", tabName !== "login");
  registerForm.classList.toggle(
    "hidden",
    tabName !== "register"
  );

  setAuthHeading({
    eyebrow: "Welcome",
    title: "Access your portal",
    subtitle: "Login or create your student account.",
  });
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
  removeNotificationUI();
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
      ensureAdminExportButton();
      ensureAdminPaginationUI();
      await loadAdminComplaints();
      await loadComplaintAnalytics();
      await loadFeedbackOverview();
    } else {
      await loadStudentComplaints();
      ensureNotificationUI();
      await loadNotifications();
      startNotificationRefresh();
    }
  } catch (error) {
    showToast(error.message, "error");
  }
}

/* Authentication */

document
  .getElementById("forgotPasswordButton")
  ?.addEventListener("click", () => {
    passwordResetState.email =
      document.getElementById("loginEmail")?.value.trim() || "";
    showPasswordRecoveryStep("email");
  });

document
  .querySelectorAll("[data-recovery-back]")
  .forEach((button) => {
    button.addEventListener("click", () => {
      const destination = button.dataset.recoveryBack;
      if (destination === "email") {
        passwordResetState.resetToken = "";
        showPasswordRecoveryStep("email");
        return;
      }
      switchAuthTab("login");
    });
  });

forgotPasswordForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submitButton = forgotPasswordForm.querySelector('button[type="submit"]');
  const email = document
    .getElementById("forgotPasswordEmail")
    .value.trim()
    .toLowerCase();

  try {
    setButtonLoading(submitButton, true, "Sending code...");
    const data = await apiRequest("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    passwordResetState.email = email;
    passwordResetState.resetToken = "";
    showToast(data.message);
    showPasswordRecoveryStep("otp");
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    setButtonLoading(submitButton, false);
  }
});

verifyResetOtpForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submitButton = verifyResetOtpForm.querySelector('button[type="submit"]');
  const otp = document.getElementById("resetOtp").value.trim();

  try {
    setButtonLoading(submitButton, true, "Verifying...");
    const data = await apiRequest("/auth/verify-reset-otp", {
      method: "POST",
      body: JSON.stringify({ email: passwordResetState.email, otp }),
    });
    passwordResetState.resetToken = data.resetToken || "";
    if (!passwordResetState.resetToken) {
      throw new Error("Password reset session could not be created.");
    }
    showToast(data.message);
    showPasswordRecoveryStep("password");
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    setButtonLoading(submitButton, false);
  }
});

document
  .getElementById("resendResetOtpButton")
  ?.addEventListener("click", async (event) => {
    const button = event.currentTarget;
    if (!passwordResetState.email) {
      showPasswordRecoveryStep("email");
      return;
    }

    try {
      setButtonLoading(button, true, "Sending...");
      const data = await apiRequest("/auth/resend-reset-otp", {
        method: "POST",
        body: JSON.stringify({ email: passwordResetState.email }),
      });
      passwordResetState.resetToken = "";
      verifyResetOtpForm?.reset();
      showToast(data.message);
      document.getElementById("resetOtp")?.focus();
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setButtonLoading(button, false);
    }
  });

resetPasswordForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submitButton = resetPasswordForm.querySelector('button[type="submit"]');
  const newPassword = document.getElementById("newResetPassword").value;
  const confirmPassword = document.getElementById("confirmResetPassword").value;

  if (newPassword !== confirmPassword) {
    showToast("Passwords do not match.", "error");
    return;
  }

  if (!passwordResetState.resetToken) {
    showToast(
      "Your verification session has expired. Please request a new code.",
      "error"
    );
    showPasswordRecoveryStep("email");
    return;
  }

  try {
    setButtonLoading(submitButton, true, "Resetting password...");
    const data = await apiRequest("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({
        resetToken: passwordResetState.resetToken,
        newPassword,
        confirmPassword,
      }),
    });

    const recoveredEmail = passwordResetState.email;
    resetPasswordRecoveryState();
    switchAuthTab("login");
    if (recoveredEmail) {
      document.getElementById("loginEmail").value = recoveredEmail;
    }
    document.getElementById("loginPassword").value = "";
    document.getElementById("loginPassword").focus();
    showToast(data.message);
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    setButtonLoading(submitButton, false);
  }
});

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


function renderComplaintSkeleton(target, count = 3, type = "student") {
  if (!target) return;

  const cards = Array.from({ length: count }, (_, index) => `
    <div class="cr-skeleton-card ${type === "admin" ? "cr-skeleton-admin" : ""}" aria-hidden="true">
      <div class="cr-skeleton-top">
        <span class="cr-skeleton-line cr-skeleton-ref"></span>
        <span class="cr-skeleton-pill"></span>
      </div>
      <span class="cr-skeleton-line cr-skeleton-title"></span>
      <span class="cr-skeleton-line cr-skeleton-subtitle"></span>
      <div class="cr-skeleton-meta">
        <span></span><span></span><span></span>
      </div>
      ${type === "admin" ? '<span class="cr-skeleton-action"></span>' : ""}
    </div>
  `).join("");

  target.innerHTML = `
    <div class="cr-loading-state" role="status" aria-live="polite">
      <div class="cr-loading-heading">
        <span class="cr-loading-spinner" aria-hidden="true"></span>
        <div>
          <strong>${type === "admin" ? "Loading complaint queue" : "Loading your complaints"}</strong>
          <small>Please wait while the latest data is fetched.</small>
        </div>
      </div>
      <div class="cr-skeleton-list">${cards}</div>
    </div>
  `;
}

function renderComplaintLoadError(target, type = "student", message = "") {
  if (!target) return;

  const retryTarget = type === "admin" ? "admin" : "student";

  target.innerHTML = `
    <div class="empty-state cr-error-state">
      <span class="empty-illustration cr-error-icon" aria-hidden="true">!</span>
      <h3>Couldn’t load complaints</h3>
      <p>
        ${escapeHtml(
          message ||
          "The latest complaint data could not be fetched. Check your connection and try again."
        )}
      </p>
      <button
        class="cr-retry-button"
        type="button"
        data-retry-complaints="${retryTarget}"
      >
        Try Again
      </button>
    </div>
  `;
}

function renderStudentComplaints(complaints) {
  if (complaints.length === 0) {
    studentComplaintList.innerHTML = `
      <div class="empty-state cr-empty-polished">
        <span class="empty-illustration">
          ${crIcon("check", "cr-empty-icon")}
        </span>
        <h3>No complaints yet</h3>
        <p>
          Once you raise a complaint, its status, updates and resolution progress will appear here.
        </p>
        <button class="cr-empty-action" type="button" data-focus-complaint-form>
          Raise your first complaint
        </button>
      </div>
    `;
    return;
  }

  studentComplaintList.innerHTML = complaints
    .map((complaint) => {
      const normalizedStatus =
        String(complaint.status || "").trim().toLowerCase();

      const tone =
        normalizedStatus === "resolved"
          ? "resolved"
          : normalizedStatus === "in progress"
            ? "progress"
            : "raised";

      return `
        <article class="complaint-item cr-student-card cr-${tone}-card">
          <div class="cr-card-top">
            <div>
              <p class="complaint-number">
                ${escapeHtml(
                  complaint.reference_number ||
                  `Complaint #${complaint.id}`
                )}
              </p>

              <h3>${escapeHtml(complaint.title)}</h3>

              <p class="cr-card-location">
                ${crIcon("pin", "cr-card-location-icon")}
                <span>${escapeHtml(complaint.location)}</span>
              </p>
            </div>

            <span class="status-badge ${statusClass(complaint.status)}">
              ${escapeHtml(complaint.status)}
            </span>
          </div>

          <div class="cr-card-grid">
            <div class="cr-info-tile cr-category-tile">
              <span class="cr-tile-icon">
                ${crIcon("grid", "cr-tile-svg")}
              </span>
              <span>
                <small>Category</small>
                <strong>${escapeHtml(complaint.category)}</strong>
              </span>
            </div>

            <div class="cr-info-tile cr-priority-tile ${priorityClass(
              complaint.priority
            )}">
              <span class="cr-tile-icon">
                ${crIcon("flag", "cr-tile-svg")}
              </span>
              <span>
                <small>Priority</small>
                <strong>${escapeHtml(complaint.priority)}</strong>
              </span>
            </div>

            <div class="cr-info-tile cr-date-tile">
              <span class="cr-tile-icon">
                ${crIcon("calendar", "cr-tile-svg")}
              </span>
              <span>
                <small>Registered On</small>
                <strong>${formatShortDate(complaint.created_at)}</strong>
              </span>
            </div>

            <button
              class="timeline-button cr-view-details"
              type="button"
              data-history-id="${escapeHtml(complaint.id)}"
            >
              <span>View Details</span>
              ${crIcon("chevron", "cr-chevron-svg")}
            </button>
          </div>

          ${
            complaint.is_overdue ||
            Number(complaint.is_escalated) === 1
              ? `
                <div class="cr-alert-badges">
                  ${
                    complaint.is_overdue
                      ? `<span class="overdue-badge">Overdue</span>`
                      : ""
                  }

                  ${
                    Number(complaint.is_escalated) === 1
                      ? `<span class="escalation-badge">
                          Escalated · Level ${escapeHtml(
                            complaint.escalation_level || 1
                          )}
                        </span>`
                      : ""
                  }
                </div>
              `
              : ""
          }

          <div class="cr-card-details">
            <div class="cr-detail-grid">
              <div class="cr-detail-box">
                <small>Description</small>
                <p>${escapeHtml(complaint.description)}</p>
              </div>

              <div class="cr-detail-box">
                <small>Expected resolution</small>
                <strong>
                  ${
                    complaint.due_at
                      ? formatDate(complaint.due_at)
                      : "Not assigned"
                  }
                </strong>
              </div>
            </div>

            ${
              complaint.evidence_image
                ? `
                  <div class="cr-detail-section">
                    <small>Attached evidence</small>
                    <div class="complaint-evidence">
                      <a
                        href="${escapeHtml(complaint.evidence_image)}"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <img
                          src="${escapeHtml(complaint.evidence_image)}"
                          alt="Evidence for ${escapeHtml(complaint.title)}"
                          loading="lazy"
                        />
                      </a>
                    </div>
                  </div>
                `
                : ""
            }

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
              normalizedStatus === "raised"
                ? `
                  <div class="cr-detail-actions">
                    <button
                      class="edit-complaint-button"
                      type="button"
                      data-edit-id="${escapeHtml(complaint.id)}"
                    >
                      Edit Complaint
                    </button>

                    <button
                      class="delete-complaint-button"
                      type="button"
                      data-delete-id="${escapeHtml(complaint.id)}"
                    >
                      Delete Complaint
                    </button>
                  </div>
                `
                : ""
            }

            ${
              normalizedStatus === "resolved"
                ? complaint.feedback_rating
                  ? `
                    <div class="feedback-summary">
                      <strong>Resolution rating:</strong>
                      ${escapeHtml(complaint.feedback_rating)}/5
                      ${
                        complaint.feedback_text
                          ? `<p>${escapeHtml(complaint.feedback_text)}</p>`
                          : ""
                      }
                    </div>
                  `
                  : `
                    <div class="feedback-box">
                      <p><strong>Rate this resolution</strong></p>
                      <form
                        class="feedback-form"
                        data-complaint-id="${escapeHtml(complaint.id)}"
                      >
                        <label>
                          Rating
                          <select class="feedback-rating" required>
                            <option value="">Select rating</option>
                            <option value="5">5 - Excellent</option>
                            <option value="4">4 - Good</option>
                            <option value="3">3 - Average</option>
                            <option value="2">2 - Poor</option>
                            <option value="1">1 - Very Poor</option>
                          </select>
                        </label>

                        <label>
                          Feedback (optional)
                          <textarea
                            class="feedback-text"
                            rows="3"
                            placeholder="Share your experience..."
                          ></textarea>
                        </label>

                        <button type="submit" class="primary-button">
                          Submit Feedback
                        </button>
                      </form>
                    </div>
                  `
                : ""
            }
          </div>

          <div
            id="timeline-${escapeHtml(complaint.id)}"
            class="timeline-container hidden"
          ></div>
        </article>
      `;
    })
    .join("");
}

studentComplaintList.addEventListener("submit", async (event) => {
  const form = event.target.closest(".feedback-form");

  if (!form) return;

  event.preventDefault();

  const complaintId = form.dataset.complaintId;
  const submitButton = form.querySelector('button[type="submit"]');

  const rating = Number(
    form.querySelector(".feedback-rating").value
  );

  const feedback =
    form.querySelector(".feedback-text").value.trim();

  if (!rating) {
    showToast("Please select a rating.", "error");
    return;
  }

  try {
    setButtonLoading(
      submitButton,
      true,
      "Submitting feedback..."
    );

    const data = await apiRequest(
      `/complaints/${complaintId}/feedback`,
      {
        method: "POST",
        body: JSON.stringify({
          rating,
          feedback,
        }),
      }
    );

    showToast(
      data.message || "Feedback submitted successfully."
    );

    await loadStudentComplaints();
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    setButtonLoading(submitButton, false);
  }
});

async function loadStudentComplaints() {
  renderComplaintSkeleton(studentComplaintList, 3, "student");

  try {
    const data = await apiRequest("/complaints/mine");
    const complaints = data.complaints || [];

    studentComplaintsCache = complaints;

    updateStudentStats(complaints);
    renderStudentComplaints(complaints);
  } catch (error) {
    renderComplaintLoadError(
      studentComplaintList,
      "student",
      error.message
    );
  }
}

complaintForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const submitButton =
    complaintForm.querySelector('button[type="submit"]');

  const evidenceInput =
    document.getElementById("complaintEvidence");

  const evidenceFile = evidenceInput?.files?.[0];

  const allowedEvidenceTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const allowedEvidenceExtensions = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
];

if (evidenceFile) {
  const fileName = evidenceFile.name.toLowerCase();

  const hasValidExtension = allowedEvidenceExtensions.some(
    (extension) => fileName.endsWith(extension)
  );

  const hasValidMimeType = allowedEvidenceTypes.includes(
    evidenceFile.type
  );

  if (!hasValidExtension || !hasValidMimeType) {
    showToast(
      "Please upload only JPG, PNG or WebP images.",
      "error"
    );

    evidenceInput.value = "";
    return;
  }
}

  if (evidenceFile && evidenceFile.size > 5 * 1024 * 1024) {
    showToast(
      "Evidence image must be smaller than 5 MB.",
      "error"
    );
    return;
  }

  const formData = new FormData();

  formData.append(
    "title",
    document.getElementById("complaintTitle").value.trim()
  );

  formData.append(
    "category",
    document.getElementById("complaintCategory").value
  );

  formData.append(
    "location",
    document.getElementById("complaintLocation").value.trim()
  );

  formData.append(
    "description",
    document
      .getElementById("complaintDescription")
      .value.trim()
  );

  formData.append(
    "priority",
    document.getElementById("complaintPriority").value
  );

  if (evidenceFile) {
    formData.append("evidence", evidenceFile);
  }

  try {
    setButtonLoading(
      submitButton,
      true,
      "Submitting complaint..."
    );

    const data = await apiRequest("/complaints", {
      method: "POST",
      body: formData,
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
    button.innerHTML = `<span>View Details</span>${crIcon("chevron", "cr-chevron-svg")}`;
    return;
  }

  try {
    button.disabled = true;
    button.textContent = "Loading...";

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
    button.innerHTML = `<span>Hide Details</span>${crIcon("chevron", "cr-chevron-svg cr-chevron-up")}`;
  } catch (error) {
    showToast(error.message, "error");
    button.innerHTML = `<span>View Details</span>${crIcon("chevron", "cr-chevron-svg")}`;
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


studentComplaintList.addEventListener("click", async (event) => {
  const retryButton = event.target.closest('[data-retry-complaints="student"]');
  if (retryButton) {
    await loadStudentComplaints();
    return;
  }

  const emptyAction = event.target.closest("[data-focus-complaint-form]");
  if (emptyAction) {
    document.getElementById("focusComplaintForm")?.click();
  }
});

adminComplaintList.addEventListener("click", async (event) => {
  const retryButton = event.target.closest('[data-retry-complaints="admin"]');
  if (!retryButton) return;

  await loadAdminComplaints();
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
      <div class="empty-state cr-empty-polished">
        <span class="empty-illustration cr-search-empty" aria-hidden="true">⌕</span>
        <h3>No matching complaints</h3>
        <p>
          No complaint matches the current search or filters. Adjust them to view more results.
        </p>
      </div>
    `;

    return;
  }

  adminComplaintList.innerHTML = complaints
    .map(
      (complaint) => `
        <article class="admin-complaint-card">
          <div class="admin-card-summary">
            <div class="complaint-card-top">
              <div>
                <p class="complaint-number">
                  ${escapeHtml(
                    complaint.reference_number ||
                    `Complaint #${complaint.id}`
                  )}
                </p>
                <h3>${escapeHtml(complaint.title)}</h3>
              </div>
              <span class="status-badge ${statusClass(complaint.status)}">
                ${escapeHtml(complaint.status)}
              </span>
            </div>

            <div class="complaint-meta admin-summary-meta">
              <span class="category-chip">
                <b aria-hidden="true">${categoryIcon(complaint.category)}</b>
                ${escapeHtml(complaint.category)}
              </span>
              <span
                class="priority-badge ${priorityClass(complaint.priority)}"
              >
                ${escapeHtml(complaint.priority)} priority
              </span>
              <span class="due-date-badge">
                Due: ${
                  complaint.due_at
                    ? formatDate(complaint.due_at)
                    : "Not assigned"
                }
              </span>

              ${
                complaint.is_overdue
                  ? `<span class="overdue-badge">Overdue</span>`
                  : ""
              }

              ${
                Number(complaint.is_escalated) === 1
                  ? `<span class="escalation-badge">
                      Escalation Level ${escapeHtml(
                        complaint.escalation_level || 1
                      )}
                     </span>`
                  : ""
              }

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
          </div>

          <details class="admin-card-disclosure">
            <summary>
              <span>View complaint details</span>
              <span class="admin-disclosure-icon" aria-hidden="true">⌄</span>
            </summary>

            <div class="admin-card-details">
              <div class="admin-detail-content">
                <p class="admin-detail-label">Complaint description</p>
                <p class="complaint-description">
                  ${escapeHtml(complaint.description)}
                </p>

                <div class="admin-detail-facts">
                  <div>
                    <span>Location</span>
                    <strong>${escapeHtml(complaint.location)}</strong>
                  </div>
                  <div>
                    <span>Registered</span>
                    <strong>${formatDate(complaint.created_at)}</strong>
                  </div>
                </div>

                ${
                  complaint.evidence_image
                    ? `
                      <div class="complaint-evidence">
                        <p class="evidence-label">Student evidence</p>
                        <a
                          href="${escapeHtml(complaint.evidence_image)}"
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Open student evidence image"
                        >
                          <img
                            src="${escapeHtml(complaint.evidence_image)}"
                            alt="Evidence for ${escapeHtml(complaint.title)}"
                            loading="lazy"
                          />
                        </a>
                      </div>
                    `
                    : ""
                }

                <div class="admin-student-details">
                  <div>
                    <span>Student</span>
                    <strong>${escapeHtml(complaint.student_name)}</strong>
                  </div>
                  <div>
                    <span>Email</span>
                    <strong>${escapeHtml(complaint.student_email)}</strong>
                  </div>
                  <div>
                    <span>Hostel</span>
                    <strong>${escapeHtml(complaint.hostel || "Not added")}</strong>
                  </div>
                  <div>
                    <span>Room</span>
                    <strong>${escapeHtml(complaint.room_number || "Not added")}</strong>
                  </div>
                </div>
              </div>

              <div class="admin-card-actions">
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

                <button
                  class="admin-history-button secondary-button"
                  type="button"
                  data-admin-history-id="${escapeHtml(complaint.id)}"
                >
                  View Activity Log
                </button>

                <div
                  id="admin-history-${escapeHtml(complaint.id)}"
                  class="timeline-container hidden"
                ></div>
              </div>
            </div>
          </details>
        </article>
      `
    )
    .join("");
}

adminComplaintList.addEventListener("click", async (event) => {
  const button = event.target.closest(".admin-history-button");

  if (!button) return;

  const complaintId = button.dataset.adminHistoryId;
  const container = document.getElementById(
    `admin-history-${complaintId}`
  );

  if (!container) return;

  if (!container.classList.contains("hidden")) {
    container.classList.add("hidden");
    button.textContent = "View Activity Log";
    return;
  }

  try {
    button.disabled = true;
    button.textContent = "Loading activity...";

    const data = await apiRequest(
      `/complaints/${complaintId}/history`
    );

    const timeline = Array.isArray(data.timeline)
      ? data.timeline
      : [];

    if (timeline.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>No activity recorded yet.</p>
        </div>
      `;
    } else {
      container.innerHTML = timeline
        .map(
          (item) => `
            <div class="timeline-entry">
              <span class="timeline-dot"></span>

              <div>
                <strong>
                  ${escapeHtml(item.new_status || "Updated")}
                </strong>

                <p>
                  ${escapeHtml(
                    item.note || "Complaint updated."
                  )}
                </p>

                <small>
                  ${escapeHtml(item.changed_by_name || "Unknown user")}
                  · ${escapeHtml(item.changed_by_role || "user")}
                  · ${formatDate(item.created_at)}
                </small>
              </div>
            </div>
          `
        )
        .join("");
    }

    container.classList.remove("hidden");
    button.textContent = "Hide Activity Log";
  } catch (error) {
    showToast(error.message, "error");
    button.textContent = "View Activity Log";
  } finally {
    button.disabled = false;
  }
});

function ensureAdminPaginationUI() {
  if (!currentUser || currentUser.role !== "admin") return;

  let pagination = document.getElementById("adminPagination");

  if (!pagination) {
    pagination = document.createElement("div");
    pagination.id = "adminPagination";
    pagination.className = "admin-pagination";
    pagination.innerHTML = `
      <button
        id="adminPreviousPage"
        type="button"
        class="secondary-button"
      >
        Previous
      </button>

      <span id="adminPageInfo" class="admin-page-info">
        Page 1 of 1
      </span>

      <button
        id="adminNextPage"
        type="button"
        class="secondary-button"
      >
        Next
      </button>
    `;

    adminComplaintList.insertAdjacentElement(
      "afterend",
      pagination
    );

    if (!document.getElementById("adminPaginationRuntimeStyles")) {
      const style = document.createElement("style");
      style.id = "adminPaginationRuntimeStyles";
      style.textContent = `
        .admin-pagination{
          display:flex;
          align-items:center;
          justify-content:center;
          gap:12px;
          flex-wrap:wrap;
          margin:22px 0 8px;
        }
        .admin-page-info{
          min-width:150px;
          text-align:center;
          font-weight:800;
          color:#365c62;
        }
        .admin-pagination button:disabled{
          opacity:.5;
          cursor:not-allowed;
        }
      `;
      document.head.appendChild(style);
    }

    document
      .getElementById("adminPreviousPage")
      .addEventListener("click", async () => {
        if (!adminPagination.hasPreviousPage) return;

        adminCurrentPage = adminPagination.page - 1;

        try {
          await loadAdminComplaints();
          adminComplaintList.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        } catch (error) {
          showToast(error.message, "error");
        }
      });

    document
      .getElementById("adminNextPage")
      .addEventListener("click", async () => {
        if (!adminPagination.hasNextPage) return;

        adminCurrentPage = adminPagination.page + 1;

        try {
          await loadAdminComplaints();
          adminComplaintList.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        } catch (error) {
          showToast(error.message, "error");
        }
      });
  }

  renderAdminPagination();
}

function renderAdminPagination() {
  const pagination = document.getElementById("adminPagination");
  const previousButton =
    document.getElementById("adminPreviousPage");
  const nextButton =
    document.getElementById("adminNextPage");
  const pageInfo =
    document.getElementById("adminPageInfo");

  if (
    !pagination ||
    !previousButton ||
    !nextButton ||
    !pageInfo
  ) {
    return;
  }

  const page = Number(adminPagination.page) || 1;
  const totalPages =
    Number(adminPagination.totalPages) || 1;
  const totalItems =
    Number(adminPagination.totalItems) || 0;

  pageInfo.textContent =
    `Page ${page} of ${totalPages} · ${totalItems} total`;

  previousButton.disabled =
    !adminPagination.hasPreviousPage;

  nextButton.disabled =
    !adminPagination.hasNextPage;

  pagination.classList.toggle(
    "hidden",
    totalItems === 0
  );
}

function buildAdminQuery() {
  const parameters = new URLSearchParams();

  const search =
    document.getElementById("adminSearch")?.value.trim() || "";

  const status =
    document.getElementById("adminStatusFilter")?.value || "";

  const escalation =
    document.getElementById("adminEscalationFilter")?.value || "";

  const priority =
    document.getElementById("adminPriorityFilter")?.value || "";

  const category =
    document.getElementById("adminCategoryFilter")?.value || "";

  if (search) parameters.set("search", search);
  if (status) parameters.set("status", status);
  if (escalation !== "") {
    parameters.set("escalated", escalation);
  }
  if (priority) parameters.set("priority", priority);
  if (category) parameters.set("category", category);

  const queryString = parameters.toString();
  return queryString ? `?${queryString}` : "";
}


function ensureAdminExportButton() {
  if (!currentUser || currentUser.role !== "admin") return;
  if (document.getElementById("exportComplaintsCsv")) return;

  const refreshButton =
    document.getElementById("refreshAdminComplaints");

  if (!refreshButton || !refreshButton.parentElement) return;

  const exportButton = document.createElement("button");
  exportButton.id = "exportComplaintsCsv";
  exportButton.type = "button";
  exportButton.className = "secondary-button";
  exportButton.textContent = "Export CSV";

  refreshButton.parentElement.insertBefore(
    exportButton,
    refreshButton
  );

  exportButton.addEventListener("click", exportAdminComplaintsCsv);
}

async function exportAdminComplaintsCsv() {
  const button = document.getElementById("exportComplaintsCsv");

  if (!button || !authToken) return;

  try {
    setButtonLoading(button, true, "Exporting...");

    const response = await fetch(
      `${API_BASE}/complaints/export/csv${buildAdminQuery()}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    if (!response.ok) {
      const data = await response.json().catch(() => ({
        message: "Unable to export complaint report.",
      }));

      if (response.status === 401 && authToken) {
        logout(false);
      }

      throw new Error(
        data.message || "Unable to export complaint report."
      );
    }

    const blob = await response.blob();

    const disposition =
      response.headers.get("Content-Disposition") || "";

    const fileNameMatch = disposition.match(
      /filename="?([^"]+)"?/i
    );

    const fileName = fileNameMatch?.[1]
      ? fileNameMatch[1]
      : "CampusResolve-complaints.csv";

    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = downloadUrl;
    link.download = fileName;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(downloadUrl);

    showToast("Complaint report exported successfully.");
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    setButtonLoading(button, false);
  }
}

function renderAnalyticsList(container, items, labelKey) {
  if (!container) return;

  if (!items || items.length === 0) {
    container.innerHTML = `
      <div class="analytics-empty">
        No analytics data available.
      </div>
    `;
    return;
  }

  const maximumCount = Math.max(
    ...items.map((item) => Number(item.complaint_count) || 0),
    1
  );

  container.innerHTML = items
    .map((item) => {
      const label = item[labelKey] || "Unknown";
      const count = Number(item.complaint_count) || 0;
      const percentage = Math.round(
        (count / maximumCount) * 100
      );

      return `
        <div class="analytics-item">
          <div class="analytics-item-info">
            <span>${escapeHtml(String(label))}</span>
            <strong>${count}</strong>
          </div>

          <div
            class="analytics-progress"
            role="progressbar"
            aria-valuemin="0"
            aria-valuemax="${maximumCount}"
            aria-valuenow="${count}"
            aria-label="${escapeHtml(String(label))}: ${count} complaints"
          >
            <span style="width: ${percentage}%"></span>
          </div>
        </div>
      `;
    })
    .join("");
}


function renderFeedbackStars(rating) {
  const normalized = Math.max(0, Math.min(5, Number(rating) || 0));
  return Array.from({ length: 5 }, (_, index) =>
    `<span class="${index < normalized ? "filled" : ""}">★</span>`
  ).join("");
}

function renderFeedbackDistribution(items, totalFeedback) {
  if (!feedbackDistribution) return;

  const counts = new Map(
    (Array.isArray(items) ? items : []).map((item) => [
      Number(item.rating),
      Number(item.count) || 0,
    ])
  );

  const total = Number(totalFeedback) || 0;

  feedbackDistribution.innerHTML = [5, 4, 3, 2, 1]
    .map((rating) => {
      const count = counts.get(rating) || 0;
      const percentage =
        total > 0 ? Math.round((count / total) * 100) : 0;

      return `
        <div class="feedback-distribution-row">
          <div class="feedback-distribution-label">
            <strong>${rating} ★</strong>
            <span>${count}</span>
          </div>

          <div
            class="feedback-distribution-track"
            role="progressbar"
            aria-valuemin="0"
            aria-valuemax="${total}"
            aria-valuenow="${count}"
            aria-label="${rating} star ratings: ${count}"
          >
            <span style="width:${percentage}%"></span>
          </div>

          <small>${percentage}%</small>
        </div>
      `;
    })
    .join("");
}

function renderRecentFeedback(items) {
  if (!recentFeedbackList) return;

  const feedbackItems = Array.isArray(items) ? items : [];

  if (feedbackItems.length === 0) {
    recentFeedbackList.innerHTML = `
      <div class="feedback-empty-state">
        No feedback matches this rating yet.
      </div>
    `;
    return;
  }

  recentFeedbackList.innerHTML = feedbackItems
    .map((item) => `
      <article class="recent-feedback-item">
        <div class="recent-feedback-top">
          <div>
            <strong>
              ${escapeHtml(item.reference_number || `Complaint #${item.complaint_id}`)}
            </strong>
            <span>${escapeHtml(item.complaint_title || "Resolved complaint")}</span>
          </div>

          <div class="recent-feedback-stars" aria-label="${escapeHtml(item.rating)} out of 5 stars">
            ${renderFeedbackStars(item.rating)}
          </div>
        </div>

        <p class="recent-feedback-message">
          ${escapeHtml(item.feedback || "No written feedback provided.")}
        </p>

        <div class="recent-feedback-meta">
          <span>${escapeHtml(item.student_name || "Student")}</span>
          <span>${escapeHtml(item.category || "Other")}</span>
          <span>${formatDate(item.created_at)}</span>
        </div>
      </article>
    `)
    .join("");
}


function formatInsightFeedbackCount(item) {
  if (!item) return "No ratings yet";

  const count = Number(item.feedbackCount) || 0;
  return `${count} feedback${count === 1 ? "" : "s"}`;
}

function renderFeedbackInsightCard(
  titleElement,
  scoreElement,
  metaElement,
  item,
  labelKey
) {
  if (!titleElement || !scoreElement || !metaElement) return;

  if (!item) {
    titleElement.textContent = "Not available";
    scoreElement.textContent = "—";
    metaElement.textContent = "No ratings yet";
    return;
  }

  titleElement.textContent =
    item[labelKey] || "Not available";

  const rating = Number(item.averageRating) || 0;
  scoreElement.textContent = `${rating.toFixed(1)}/5`;
  metaElement.textContent =
    formatInsightFeedbackCount(item);
}

function renderAverageRatingStars(rating) {
  if (!feedbackAverageStars) return;

  const value = Math.max(0, Math.min(5, Number(rating) || 0));

  [...feedbackAverageStars.children].forEach((star, index) => {
    const fill = Math.max(0, Math.min(1, value - index));
    star.style.setProperty("--star-fill", `${fill * 100}%`);
  });

  feedbackAverageStars.setAttribute(
    "aria-label",
    `Average rating ${value.toFixed(1)} out of 5`
  );
}

function renderFeedbackTrend(items) {
  if (!feedbackTrendChart || !feedbackTrendSummary) return;

  const trend = Array.isArray(items)
    ? items.filter((item) => {
        const rating = Number(item.averageRating);
        return Number.isFinite(rating) && rating > 0;
      })
    : [];

  if (trend.length === 0) {
    feedbackTrendChart.innerHTML = `
      <div class="feedback-empty-state">
        No rating trend data available yet.
      </div>
    `;
    feedbackTrendSummary.textContent =
      "Waiting for feedback data";
    return;
  }

  const width = 760;
  const height = 220;
  const paddingX = 34;
  const paddingTop = 26;
  const paddingBottom = 34;
  const usableWidth = width - paddingX * 2;
  const usableHeight = height - paddingTop - paddingBottom;

  const points = trend.map((item, index) => {
    const x =
      trend.length === 1
        ? width / 2
        : paddingX +
          (index / (trend.length - 1)) * usableWidth;

    const rating = Math.max(
      1,
      Math.min(5, Number(item.averageRating) || 0)
    );

    const y =
      paddingTop +
      ((5 - rating) / 4) * usableHeight;

    return {
      x,
      y,
      rating,
      date: item.date,
      count: Number(item.feedbackCount) || 0,
    };
  });

  const polyline = points
    .map((point) => `${point.x},${point.y}`)
    .join(" ");

  const circles = points
    .map(
      (point) => `
        <circle
          cx="${point.x}"
          cy="${point.y}"
          r="4.5"
          tabindex="0"
          aria-label="${escapeHtml(
            `${formatShortDate(point.date)}: ${point.rating.toFixed(1)} out of 5`
          )}"
        >
          <title>
            ${escapeHtml(formatShortDate(point.date))}
            · ${point.rating.toFixed(1)}/5
            · ${point.count} feedback${point.count === 1 ? "" : "s"}
          </title>
        </circle>
      `
    )
    .join("");

  const horizontalGuides = [5, 4, 3, 2, 1]
    .map((rating) => {
      const y =
        paddingTop +
        ((5 - rating) / 4) * usableHeight;

      return `
        <g class="feedback-trend-guide">
          <line
            x1="${paddingX}"
            y1="${y}"
            x2="${width - paddingX}"
            y2="${y}"
          ></line>
          <text x="6" y="${y + 4}">
            ${rating}
          </text>
        </g>
      `;
    })
    .join("");

  const firstDate = formatShortDate(trend[0].date);
  const lastDate = formatShortDate(
    trend[trend.length - 1].date
  );

  const latestRating =
    Number(trend[trend.length - 1].averageRating) || 0;

  feedbackTrendSummary.textContent =
    `Latest ${latestRating.toFixed(1)}/5`;

  feedbackTrendChart.innerHTML = `
    <svg
      class="feedback-trend-svg"
      viewBox="0 0 ${width} ${height}"
      role="img"
      aria-label="30-day average rating trend"
    >
      ${horizontalGuides}

      <polyline
        class="feedback-trend-line"
        points="${polyline}"
      ></polyline>

      <g class="feedback-trend-points">
        ${circles}
      </g>

      <text
        class="feedback-trend-date feedback-trend-date-start"
        x="${paddingX}"
        y="${height - 8}"
      >
        ${escapeHtml(firstDate)}
      </text>

      <text
        class="feedback-trend-date feedback-trend-date-end"
        x="${width - paddingX}"
        y="${height - 8}"
        text-anchor="end"
      >
        ${escapeHtml(lastDate)}
      </text>
    </svg>
  `;
}

async function loadFeedbackOverview() {
  if (!currentUser || currentUser.role !== "admin") {
    return;
  }

  const selectedRating = feedbackRatingFilter?.value || "";
  const query = selectedRating
    ? `?rating=${encodeURIComponent(selectedRating)}`
    : "";

  const data = await apiRequest(
    `/complaints/feedback/overview${query}`
  );

  const overview = data.feedbackOverview || {};
  const summary = overview.summary || {};

  if (feedbackAverageRating) {
    feedbackAverageRating.textContent =
      Number(summary.averageRating || 0).toFixed(1);
  }

  renderAverageRatingStars(
    Number(summary.averageRating || 0)
  );

  if (feedbackTotalCount) {
    feedbackTotalCount.textContent =
      Number(summary.totalFeedback || 0);
  }

  if (feedbackFiveStarCount) {
    feedbackFiveStarCount.textContent =
      Number(summary.fiveStar || 0);
  }

  renderFeedbackDistribution(
    overview.distribution || [],
    summary.totalFeedback || 0
  );

  const insights = overview.insights || {};

  renderFeedbackInsightCard(
    highestRatedDepartment,
    highestRatedDepartmentScore,
    highestRatedDepartmentMeta,
    insights.highestRatedDepartment,
    "department"
  );

  renderFeedbackInsightCard(
    lowestRatedDepartment,
    lowestRatedDepartmentScore,
    lowestRatedDepartmentMeta,
    insights.lowestRatedDepartment,
    "department"
  );

  renderFeedbackInsightCard(
    highestRatedCategory,
    highestRatedCategoryScore,
    highestRatedCategoryMeta,
    insights.highestRatedCategory,
    "category"
  );

  renderFeedbackInsightCard(
    lowestRatedCategory,
    lowestRatedCategoryScore,
    lowestRatedCategoryMeta,
    insights.lowestRatedCategory,
    "category"
  );

  renderFeedbackTrend(
    insights.ratingTrend || []
  );

  renderRecentFeedback(
    overview.recentFeedback || []
  );
}

async function loadComplaintAnalytics() {
  if (!currentUser || currentUser.role !== "admin") {
    return;
  }

  try {
    const data = await apiRequest("/complaints/analytics");
    const analytics = data.analytics;
    const summary = analytics.summary;

    analyticsResolutionRate.textContent =
      `${summary.resolutionRate}%`;

    analyticsResolutionTime.textContent =
      summary.averageResolutionHours > 0
        ? `${summary.averageResolutionHours} hrs`
        : "Not available";

    const assignedDepartments =
      analytics.departments.filter(
        (item) => item.department !== "Unassigned"
      ).length;

    analyticsDepartmentCount.textContent =
      assignedDepartments;

    renderAnalyticsList(
      categoryAnalytics,
      analytics.categories,
      "category"
    );

    renderAnalyticsList(
      priorityAnalytics,
      analytics.priorities,
      "priority"
    );

    renderAnalyticsList(
      departmentAnalytics,
      analytics.departments,
      "department"
    );

    renderAnalyticsList(
      locationAnalytics,
      analytics.topLocations,
      "location"
    );
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function loadAdminComplaints() {
  ensureAdminPaginationUI();
  renderComplaintSkeleton(adminComplaintList, 4, "admin");

  try {

      ensureAdminPaginationUI();

    const filterQuery = buildAdminQuery();
      const parameters = new URLSearchParams(
        filterQuery.startsWith("?")
          ? filterQuery.slice(1)
          : filterQuery
      );

      parameters.set("page", String(adminCurrentPage));
      parameters.set("limit", String(ADMIN_PAGE_LIMIT));

      const data = await apiRequest(
        `/complaints?${parameters.toString()}`
      );

      const complaints = data.complaints || [];

      adminPagination = {
        page: Number(data.pagination?.page) || 1,
        limit:
          Number(data.pagination?.limit) ||
          ADMIN_PAGE_LIMIT,
        totalItems:
          Number(data.pagination?.totalItems) || 0,
        totalPages:
          Number(data.pagination?.totalPages) || 1,
        hasPreviousPage:
          Boolean(data.pagination?.hasPreviousPage),
        hasNextPage:
          Boolean(data.pagination?.hasNextPage),
      };

      adminCurrentPage = adminPagination.page;

      updateAdminStats(complaints);
      renderAdminComplaints(complaints);
      renderAdminPagination();
  } catch (error) {
    renderComplaintLoadError(
      adminComplaintList,
      "admin",
      error.message
    );
  }
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
        await loadComplaintAnalytics();
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
      await loadComplaintAnalytics();
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setButtonLoading(submitButton, false);
    }
  }
);

[
  "adminStatusFilter",
  "adminEscalationFilter",
  "adminPriorityFilter",
  "adminCategoryFilter",
].forEach((elementId) => {
  document
    .getElementById(elementId)
    ?.addEventListener("change", async () => {
      adminCurrentPage = 1;

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
      adminCurrentPage = 1;

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
      await loadComplaintAnalytics();
      showToast("Complaint queue refreshed.");
    } catch (error) {
      showToast(error.message, "error");
    }
  });

refreshAnalyticsButton?.addEventListener(
  "click",
  async () => {
    try {
      setButtonLoading(
        refreshAnalyticsButton,
        true,
        "Refreshing..."
      );

      await loadComplaintAnalytics();
      showToast("Analytics refreshed successfully.");
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setButtonLoading(refreshAnalyticsButton, false);
    }
  }
);


refreshFeedbackOverviewButton?.addEventListener(
  "click",
  async () => {
    try {
      setButtonLoading(
        refreshFeedbackOverviewButton,
        true,
        "Refreshing..."
      );

      await loadFeedbackOverview();
      showToast("Feedback overview refreshed.");
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setButtonLoading(
        refreshFeedbackOverviewButton,
        false
      );
    }
  }
);

feedbackRatingFilter?.addEventListener(
  "change",
  async () => {
    try {
      await loadFeedbackOverview();
    } catch (error) {
      showToast(error.message, "error");
    }
  }
);

/* Initial Session */

if (authToken && currentUser) {
  showApplication();
} else {
  logout(false);
}
