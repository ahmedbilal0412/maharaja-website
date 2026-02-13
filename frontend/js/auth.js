/**
 * Shared auth helpers. Use API_BASE and getToken() for all API calls.
 * After login/signup, store token and user; navbar and dashboards read from here.
 * API_BASE is set by config.js or defaults to window.API_BASE || fallback.
 */
if (typeof window !== "undefined" && !window.API_BASE) window.API_BASE = "https://maharaja-website.onrender.com/api";

const API_BASE = window.API_BASE;

function getToken() {
  return localStorage.getItem("token");
}

function getUser() {
  try {
    const u = localStorage.getItem("user");
    return u ? JSON.parse(u) : null;
  } catch (_) {
    return null;
  }
}

function setAuth(token, user) {
  if (token) localStorage.setItem("token", token);
  if (user) localStorage.setItem("user", JSON.stringify(user));
}

function clearAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

function isLoggedIn() {
  return !!getToken();
}

function isAdmin() {
  const u = getUser();
  return !!(u && u.is_admin);
}

function logout() {
  clearAuth();
  window.location.href = "index.html";
}

/**
 * Call after navbar HTML is injected. Shows Login/Sign Up or user + Logout.
 */
function updateNavbarForAuth() {
  const userNav = document.querySelector(".user-nav");
  const mobileUserNav = document.querySelector(".mobile-user-nav");
  const token = getToken();
  const user = getUser();

  const sellerBtnHtml = '<a href="dashboard.html" class="seller-btn"><i class="fas fa-user-tie"></i> Dashboard</a>';
  const loginHtml = '<a href="login.html">Login</a>';
  const signupHtml = '<a href="signup.html" class="signup-btn">Sign Up</a>';

  if (userNav) {
    if (token && user) {
      userNav.innerHTML =
        `<span class="nav-welcome">${escapeHtml(user.full_name || user.email)}</span>` +
        (user.is_admin
          ? '<a href="admin-dashboard.html" class="admin-link"><i class="fas fa-cog"></i> Admin</a>'
          : sellerBtnHtml) +
        '<button type="button" class="logout-nav-btn">Logout</button>';
      const logoutBtn = userNav.querySelector(".logout-nav-btn");
      if (logoutBtn) logoutBtn.addEventListener("click", logout);
    } else {
      userNav.innerHTML = loginHtml + signupHtml + '<a href="signup.html" class="seller-btn"><i class="fas fa-user-tie"></i> Become a Seller</a>';
    }
  }

  if (mobileUserNav) {
    if (token && user) {
      mobileUserNav.innerHTML =
        `<span class="nav-welcome">${escapeHtml(user.full_name || user.email)}</span>` +
        (user.is_admin
          ? '<a href="admin-dashboard.html"><i class="fas fa-cog"></i> Admin</a>'
          : '<a href="dashboard.html"><i class="fas fa-user-tie"></i> Dashboard</a>') +
        '<a href="#" class="logout-nav-btn">Logout</a>';
      mobileUserNav.querySelectorAll(".logout-nav-btn").forEach((el) => {
        el.addEventListener("click", (e) => { e.preventDefault(); logout(); });
      });
    } else {
      mobileUserNav.innerHTML =
        '<a href="login.html" class="login-btn"><i class="fas fa-sign-in-alt"></i> Login</a>' +
        '<a href="signup.html" class="signup-btn"><i class="fas fa-user-plus"></i> Sign Up</a>' +
        '<a href="dashboard.html" class="seller-btn"><i class="fas fa-user-tie"></i> Become a Seller</a>';
    }
  }
}

function escapeHtml(s) {
  const div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}

if (typeof window !== "undefined") {
  window.API_BASE = API_BASE;
  window.getToken = getToken;
  window.getUser = getUser;
  window.clearAuth = clearAuth;
  window.setAuth = setAuth;
  window.isLoggedIn = isLoggedIn;
  window.isAdmin = isAdmin;
  window.logout = logout;
  window.updateNavbarForAuth = updateNavbarForAuth;
}
