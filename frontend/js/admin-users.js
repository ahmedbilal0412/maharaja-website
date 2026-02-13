(function () {
  const API_BASE = window.API_BASE || "https://maharaja-website.onrender.com";
  if (!window.getToken || !window.getUser || !window.logout) return;
  const token = getToken();
  const user = getUser();
  if (!token || !user || !user.is_admin) {
    window.location.href = "login.html";
    return;
  }

  const logoutBtn = document.getElementById("admin-logout-btn");
  if (logoutBtn) logoutBtn.addEventListener("click", logout);

  const tbody = document.getElementById("user-table-body");
  const searchInput = document.getElementById("search-user");
  const headers = { Authorization: "Bearer " + token };

  let allUsers = [];

  function escape(s) {
    if (s == null) return "";
    return String(s).replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function render(users) {
    const list = users || [];
    tbody.innerHTML = "";
    list.forEach((u, i) => {
      const tr = document.createElement("tr");
      const date = u.created_at ? new Date(u.created_at).toLocaleDateString() : "—";
      tr.innerHTML =
        "<td>" + (i + 1) + "</td>" +
        "<td>" + escape(u.full_name) + "</td>" +
        "<td>" + escape(u.email) + "</td>" +
        "<td>" + date + "</td>" +
        "<td><span class=\"status-active\">Active</span></td>" +
        "<td>—</td>";
      tbody.appendChild(tr);
    });
    if (list.length === 0) tbody.innerHTML = "<tr><td colspan=\"6\">No users found.</td></tr>";
  }

  function applyFilters() {
    let list = allUsers;
    const q = (searchInput && searchInput.value || "").trim().toLowerCase();
    if (q) list = list.filter((u) => (u.full_name || "").toLowerCase().indexOf(q) >= 0 || (u.email || "").toLowerCase().indexOf(q) >= 0);
    render(list);
  }

  if (searchInput) searchInput.addEventListener("input", applyFilters);

  fetch(API_BASE + "/admin/users", { headers })
    .then((r) => {
      if (r.status === 401 || r.status === 403) { window.location.href = "login.html"; return []; }
      return r.json();
    })
    .then((data) => {
      allUsers = (data && data.users) ? data.users : [];
      applyFilters();
    })
    .catch(() => render([]));
})();
