(function () {
  const API_BASE = window.API_BASE || "https://maharajabuilders.pk/api";
  if (!window.getToken || !window.getUser || !window.logout) return;
  const token = getToken();
  const user = getUser();
  if (!token || !user || !user.is_admin) {
    window.location.href = "login.html";
    return;
  }

  const logoutBtn = document.getElementById("admin-logout-btn");
  if (logoutBtn) logoutBtn.addEventListener("click", logout);

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
    
    if (url.startsWith('/api/')) {
        return imageBaseUrl + url;
    }
    
    if (url.includes('/uploads/') || url.includes('\\uploads\\')) {
        const filename = url.split(/[/\\]/).pop();
        return `${imageBaseUrl}/api/properties/uploads/properties/${filename}`;
    }
    
    if (url.includes(':/') || url.includes('\\')) {
        const filename = url.split(/[/\\]/).pop();
        return `${imageBaseUrl}/api/properties/uploads/properties/${filename}`;
    }
    
    if (url.indexOf("/uploads/") === 0) {
        const apiRoot = (API_BASE || "").replace(/\/api.*$/, "");
        if (!apiRoot || apiRoot.includes('localhost')) {
            return imageBaseUrl + url;
        }
        return apiRoot + url;
    }
    
    if (!url.startsWith('/')) {
        return `${imageBaseUrl}/api/properties/uploads/properties/${url}`;
    }
    
    return url;
  }

  // Load stats
  fetch(API_BASE + "/admin/stats", { headers })
    .then((r) => (r.ok ? r.json() : {}))
    .then((data) => {
      document.getElementById("stat-users").textContent = data.total_users != null ? data.total_users : "—";
      document.getElementById("stat-listings").textContent = data.total_listings != null ? data.total_listings : "—";
      document.getElementById("stat-pending").textContent = data.pending_approvals != null ? data.pending_approvals : "—";
      document.getElementById("stat-approved").textContent = data.approved_listings != null ? data.approved_listings : "—";
    })
    .catch(() => {});

  // Load recent pending properties (show limited number with View All link)
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
        // Show only first 3 properties on dashboard
        const recentList = list.slice(0, 3);
        recentList.forEach((p) => {
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
            "<a href=\"admin-listings.html\" class=\"view-link\">View Details</a>" +
            "</div>";
          pendingGrid.appendChild(card);
        });
        
        // Add "View All" button if there are more than 3
        if (list.length > 3) {
          const viewAllBtn = document.createElement("div");
          viewAllBtn.className = "view-all-container";
          viewAllBtn.innerHTML = `<a href="admin-listings.html?status=pending" class="view-all-btn">View All ${list.length} Pending Properties →</a>`;
          pendingGrid.appendChild(viewAllBtn);
        }
      }

      // Update activity list (show limited)
      if (activityList) {
        activityList.innerHTML = list.length
          ? list.slice(0, 5).map((p) => "<li><i class=\"fas fa-home\"></i> Pending: " + (p.title || "").replace(/</g, "&lt;") + " – " + (p.seller_name || "").replace(/</g, "&lt;") + "</li>").join("")
          : "<li>No recent pending activity.</li>";
      }
    })
    .catch(() => {
      pendingGrid.innerHTML = "<p class=\"no-pending\">Failed to load pending list.</p>";
    });
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