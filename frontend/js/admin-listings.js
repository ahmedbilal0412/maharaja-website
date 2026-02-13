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

  const grid = document.getElementById("property-list");
  const statusFilter = document.getElementById("status-filter");
  const searchInput = document.getElementById("search-property");
  const headers = { Authorization: "Bearer " + token };

  let allListings = [];

  function resolveImageUrl(url) {
    if (!url) return null;
    
    // Already a full HTTP URL
    if (url.indexOf("http://") === 0 || url.indexOf("https://") === 0) return url;
    
    // Determine the base URL for images
    const imageBaseUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:5000' 
        : 'https://maharaja-website.onrender.com';
    
    // ✅ NEW: Handle URLs that already have the correct /api/ format
    if (url.startsWith('/api/')) {
        return imageBaseUrl + url;
    }
    
    // Handle old/wrong paths that might still be in the database
    // This includes absolute server paths like //opt/render/project/...
    if (url.includes('/uploads/') || url.includes('\\uploads\\')) {
        // Extract just the filename from any path
        const filename = url.split(/[/\\]/).pop();
        return `${imageBaseUrl}/api/properties/uploads/properties/${filename}`;
    }
    
    // Handle local file paths (C:/Users/...)
    if (url.includes(':/') || url.includes('\\')) {
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

  function deleteProperty(id, cardEl) {
    function doDelete() {
      fetch(API_BASE + "/properties/" + id, {
        method: "DELETE",
        headers: { Authorization: "Bearer " + token },
      })
        .then(function (res) {
          if (res.status === 401) { logout(); return; }
          return res.json();
        })
        .then(function (data) {
          if (data && data.message) {
            if (cardEl && cardEl.parentNode) cardEl.parentNode.removeChild(cardEl);
            if (typeof showToast === "function") showToast("Listing deleted.", "success");
          } else {
            var msg = (data && data.message) ? data.message : "Delete failed.";
            if (typeof showToast === "function") showToast(msg, "error");
            else alert(msg);
          }
        })
        .catch(function () {
          if (typeof showToast === "function") showToast("Request failed.", "error");
          else alert("Request failed.");
        });
    }
    if (typeof showConfirm === "function") {
      showConfirm("Delete this listing?", doDelete);
      return;
    }
    if (!confirm("Delete this listing?")) return;
    doDelete();
  }

  function render(listings) {
    grid.innerHTML = "";
    const list = listings || [];
    if (list.length === 0) {
      grid.innerHTML = "<p class=\"no-listings-msg\">No listings match.</p>";
      return;
    }
    list.forEach((p) => {
      const card = document.createElement("div");
      card.className = "property-card";
      const imgSrc =
        resolveImageUrl(p.image_url) ||
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80";
      const statusClass =
        p.status === "approved" ? "approved" : p.status === "pending_approval" ? "pending" : "rejected";
      card.innerHTML =
        '<img src="' + imgSrc.replace(/"/g, "&quot;") + '" alt="">' +
        '<div class="info">' +
        "<h3>" + (p.title || "").replace(/</g, "&lt;") + "</h3>" +
        "<p>PKR " + Number(p.price).toLocaleString() + "</p>" +
        '<p><span class="status ' + statusClass + '">' + (p.status || "").replace(/</g, "&lt;") + "</span></p>" +
        '<div class="action-btns">' +
        '<a href="property-details?id=' + p.id + '" class="action-btn view-btn">View details</a>' +
        (p.status === "pending_approval"
          ? '<button type="button" class="action-btn approve-btn" data-id="' +
            p.id +
            '">Approve</button><button type="button" class="action-btn reject-btn" data-id="' +
            p.id +
            '">Reject</button>'
          : '<button type="button" class="delete-btn" data-id="' + p.id + '"><i class="fas fa-trash"></i> Delete</button>') +
        "</div>" +
        "</div>";
      const deleteBtn = card.querySelector(".delete-btn");
      if (deleteBtn) deleteBtn.addEventListener("click", () => deleteProperty(p.id, card));
      if (p.status === "pending_approval") {
        card.querySelector(".approve-btn").addEventListener("click", function () { doApproveReject(p.id, true); });
        card.querySelector(".reject-btn").addEventListener("click", function () { doApproveReject(p.id, false); });
      }
      grid.appendChild(card);
    });
  }

  function doApproveReject(id, approve) {
    const path = approve ? "/approve" : "/reject";
    fetch(API_BASE + "/admin/properties/" + id + path, { method: "POST", headers })
      .then((r) => r.json())
      .then(() => {
        allListings = allListings.filter((l) => l.id !== id);
        applyFilters();
      })
      .catch(function () { if (typeof showToast === "function") showToast("Request failed.", "error"); else alert("Request failed."); });
  }

  function applyFilters() {
    let list = allListings;
    const status = statusFilter ? statusFilter.value : "";
    if (status === "approved") list = list.filter((p) => p.status === "approved");
    else if (status === "pending") list = list.filter((p) => p.status === "pending_approval");
    else if (status === "rejected") list = list.filter((p) => p.status === "rejected");

    const q = (searchInput && searchInput.value || "").trim().toLowerCase();
    if (q) list = list.filter((p) => (p.title || "").toLowerCase().indexOf(q) >= 0 || (p.location || "").toLowerCase().indexOf(q) >= 0);
    render(list);
  }

  if (statusFilter) statusFilter.addEventListener("change", applyFilters);
  if (searchInput) searchInput.addEventListener("input", applyFilters);

  fetch(API_BASE + "/admin/properties", { headers })
    .then((r) => {
      if (r.status === 401 || r.status === 403) { window.location.href = "login.html"; return []; }
      return r.json();
    })
    .then((data) => {
      allListings = (data && data.properties) ? data.properties : [];
      applyFilters();
    })
    .catch(() => render([]));
})();
