(function () {
  if (!window.getToken || !window.getUser || !window.logout) {
    document.body.innerHTML = "<p>Please enable JavaScript and reload. (auth.js required.)</p>";
    return;
  }
  if (!getToken()) {
    window.location.href = "login.html";
    return;
  }

  const user = getUser();
  const usernameEl = document.getElementById("username");
  if (usernameEl && user) usernameEl.textContent = user.full_name || user.email || "User";

  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) logoutBtn.addEventListener("click", logout);

  const API_BASE = window.API_BASE || "https://maharaja-website.onrender.com/api";
  const token = getToken();

  function formatPrice(price, listingType) {
    if (listingType === "rent") return "PKR " + Number(price).toLocaleString() + "/mo";
    if (price >= 1e7) return "PKR " + (price / 1e7).toFixed(1) + " Crore";
    if (price >= 1e5) return "PKR " + (price / 1e5).toFixed(1) + " Lakh";
    return "PKR " + Number(price).toLocaleString();
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

  function renderListings(properties) {
    const grid = document.getElementById("dashboard-listing-grid");
    const totalEl = document.getElementById("total-listings");
    const approvedEl = document.getElementById("total-approved");
    const pendingEl = document.getElementById("total-pending");
    const activityList = document.getElementById("activity-list");

    if (!grid) return;

    totalEl.textContent = properties.length;
    const approved = properties.filter((p) => p.status === "approved").length;
    const pending = properties.filter((p) => p.status === "pending_approval").length;
    approvedEl.textContent = approved;
    pendingEl.textContent = pending;

    if (activityList) {
      if (properties.length === 0) {
        activityList.innerHTML = "<li class=\"no-activity\">No activity yet. Add a property to get started.</li>";
      } else {
        activityList.innerHTML = properties.slice(0, 5).map((p) => {
          const time = p.created_at ? new Date(p.created_at).toLocaleDateString() : "";
          const status = p.status === "approved" ? "approved" : "pending approval";
          return `<li><i class="fas fa-home"></i> ${escapeHtml(p.title)} – ${status} ${time ? "(" + time + ")" : ""}</li>`;
        }).join("");
      }
    }

    grid.innerHTML = "";
    if (properties.length === 0) {
      grid.innerHTML = "<p class=\"no-listings\">No listings yet. <a href=\"add-property.html\">Add your first property</a>.</p>";
      return;
    }

    properties.forEach((p) => {
      const card = document.createElement("div");
      card.className = "property-card";
      const imgSrc =
        resolveImageUrl(p.image_url) ||
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80";
      
      const priceStr = formatPrice(p.price, p.listing_type);
      card.innerHTML = `
        <img src="${escapeAttr(imgSrc)}" alt="${escapeAttr(p.title)}">
        <h3>${escapeHtml(p.title)}</h3>
        <p class="location"><i class="fas fa-map-marker-alt"></i> ${escapeHtml(p.location || "")}</p>
        <p class="price">${escapeHtml(priceStr)}</p>
        <span class="status-badge status-${p.status}">${p.status === "approved" ? "Live" : "Pending"}</span>
        <div class="details">
          <span>${p.bedrooms} Beds</span>
          <span>${p.bathrooms} Baths</span>
          <span>${p.size_sqft} sqft</span>
        </div>
        <a href="property-details?id=${p.id}" class="view-btn">View Details</a>
      `;
      grid.appendChild(card);
    });
  }

  function escapeHtml(s) {
    if (s == null) return "";
    const div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
  }
  function escapeAttr(s) {
    if (s == null) return "";
    return String(s).replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  fetch(API_BASE + "/properties/my", {
    headers: { Authorization: "Bearer " + token },
  })
    .then((res) => {
      if (res.status === 401) {
        logout();
        return;
      }
      return res.json();
    })
    .then((data) => {
      if (data && data.properties) renderListings(data.properties);
      else renderListings([]);
    })
    .catch(() => renderListings([]));
})();

function toggleSidebar() {
  const nav = document.getElementById("navbar");
  if (nav) nav.classList.toggle("collapsed");
}
