(function () {
  const API_BASE = window.API_BASE || "https://maharaja-website.onrender.com";
  if (!window.getToken || !window.getUser || !window.logout) return;
  const token = getToken();
  const user = getUser();
  if (!token || !user || !user.is_admin) {
    window.location.href = "login.html";
    return;
  }

  document.getElementById("admin-logout-btn").addEventListener("click", logout);

  const headers = { Authorization: "Bearer " + token };

  function formatPrice(price) {
    if (price >= 1e7) return (price / 1e7).toFixed(1) + " Crore";
    return Number(price).toLocaleString();
  }

  function resolveImageUrl(url) {
    if (!url) return null;
    
    // Already a full HTTP URL
    if (url.indexOf("http://") === 0 || url.indexOf("https://") === 0) return url;
    
    // Determine the base URL for images
    const imageBaseUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:5000' 
        : 'https://maharaja-website.onrender.com';
    
    // Handle local file paths (C:/Users/...)
    if (url.includes(':/') || url.includes('\\')) {
        // Extract just the filename from the path
        const filename = url.split(/[/\\]/).pop();
        return `${imageBaseUrl}/api/properties/uploads/properties/${filename}`;
    }
    
    // Handle relative paths starting with /uploads/
    if (url.indexOf("/uploads/") === 0) {
        const apiRoot = (API_BASE || "").replace(/\/api.*$/, "");
        // If apiRoot is empty or localhost, use imageBaseUrl
        if (!apiRoot || apiRoot.includes('localhost')) {
            return imageBaseUrl + url;
        }
        return apiRoot + url;
    }
    
    // Handle other relative paths (just filename)
    if (!url.startsWith('/')) {
        return `${imageBaseUrl}/api/properties/uploads/properties/${url}`;
    }
    
    // Default fallback
    return url;
}

  fetch(API_BASE + "/admin/stats", { headers })
    .then((r) => (r.ok ? r.json() : {}))
    .then((data) => {
      document.getElementById("stat-users").textContent = data.total_users != null ? data.total_users : "—";
      document.getElementById("stat-listings").textContent = data.total_listings != null ? data.total_listings : "—";
      document.getElementById("stat-pending").textContent = data.pending_approvals != null ? data.pending_approvals : "—";
      document.getElementById("stat-approved").textContent = data.approved_listings != null ? data.approved_listings : "—";
    })
    .catch(() => {});

  const pendingGrid = document.getElementById("admin-pending-grid");
  const activityList = document.getElementById("admin-activity-list");

  fetch(API_BASE + "/admin/properties/pending", { headers })
    .then((r) => {
      if (r.status === 401 || r.status === 403) { window.location.href = "login.html"; return []; }
      return r.json();
    })
    .then((data) => {
      const list = (data && data.properties) ? data.properties : [];
      pendingGrid.innerHTML = "";

      if (list.length === 0) {
        pendingGrid.innerHTML = "<p class=\"no-pending\">No pending approvals.</p>";
      } else {
        list.forEach((p) => {
          const card = document.createElement("div");
          card.className = "property-card";
          const imgSrc =
            resolveImageUrl(p.image_url) ||
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80";
          card.innerHTML =
            "<img src=\"" + imgSrc.replace(/"/g, "&quot;") + "\" alt=\"\">" +
            "<div class=\"details\">" +
            "<h4>" + (p.title || "").replace(/</g, "&lt;") + "</h4>" +
            "<p>PKR " + formatPrice(p.price) + "</p>" +
            "<p class=\"seller-info\">" + (p.seller_name || "").replace(/</g, "&lt;") + "</p>" +
            "<button type=\"button\" class=\"approve-btn\" data-id=\"" + p.id + "\">Approve</button> " +
            "<button type=\"button\" class=\"reject-btn\" data-id=\"" + p.id + "\">Reject</button>" +
            "</div>";
          card.querySelector(".approve-btn").addEventListener("click", function () {
            approveReject(p.id, true, card);
          });
          card.querySelector(".reject-btn").addEventListener("click", function () {
            approveReject(p.id, false, card);
          });
          pendingGrid.appendChild(card);
        });
      }

      if (activityList) {
        activityList.innerHTML = list.length
          ? list.slice(0, 5).map((p) => "<li><i class=\"fas fa-home\"></i> Pending: " + (p.title || "").replace(/</g, "&lt;") + " – " + (p.seller_name || "").replace(/</g, "&lt;") + "</li>").join("")
          : "<li>No recent pending activity.</li>";
      }
    })
    .catch(() => {
      pendingGrid.innerHTML = "<p class=\"no-pending\">Failed to load pending list.</p>";
    });

  function approveReject(id, approve, cardEl) {
    const path = approve ? "/approve" : "/reject";
    fetch(API_BASE + "/admin/properties/" + id + path, { method: "POST", headers })
      .then((r) => r.json())
      .then((data) => {
        if (cardEl && cardEl.parentNode) cardEl.parentNode.removeChild(cardEl);
        const pendingGrid = document.getElementById("admin-pending-grid");
        if (pendingGrid && pendingGrid.children.length === 0) pendingGrid.innerHTML = "<p class=\"no-pending\">No pending approvals.</p>";
        const statPending = document.getElementById("stat-pending");
        if (statPending) statPending.textContent = Math.max(0, parseInt(statPending.textContent, 10) - 1);
        if (approve && document.getElementById("stat-approved")) {
          const el = document.getElementById("stat-approved");
          el.textContent = parseInt(el.textContent, 10) + 1;
        }
      })
      .catch(function () { if (typeof showToast === "function") showToast("Request failed.", "error"); else alert("Request failed."); });
  }
})();

function toggleSidebar() {
  const sidebar = document.getElementById("sidebar-nav");
  if (sidebar) sidebar.classList.toggle("collapsed");
}

document.addEventListener("click", function (event) {
  const sidebar = document.getElementById("sidebar-nav");
  const toggleBtn = document.querySelector(".mobile-menu-toggle");
  if (window.innerWidth <= 768 && sidebar && !sidebar.contains(event.target) && toggleBtn && !toggleBtn.contains(event.target) && !sidebar.classList.contains("collapsed")) {
    sidebar.classList.add("collapsed");
  }
});
