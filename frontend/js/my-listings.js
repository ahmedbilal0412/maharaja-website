(function () {
  if (!window.getToken || !window.logout) return;
  if (!getToken()) {
    window.location.href = "login.html";
    return;
  }

  const token = getToken();
  const grid = document.getElementById("my-listings-grid");

  function escapeHtml(s) {
    if (s == null) return "";
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }
  function escapeAttr(s) {
    if (s == null) return "";
    return String(s).replace(/"/g, "&quot;").replace(/'/g, "&#39;");
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

  function formatPrice(price, listingType) {
    if (listingType === "rent") return "PKR " + Number(price).toLocaleString() + "/mo";
    if (price >= 1e7) return "PKR " + (price / 1e7).toFixed(1) + " Crore";
    return "PKR " + Number(price).toLocaleString();
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

  function render(properties) {
    grid.innerHTML = "";
    if (!properties.length) {
      grid.innerHTML = '<p class="no-listings">No listings yet. <a href="add-property.html">Add your first property</a>.</p>';
      return;
    }
    properties.forEach((p) => {
      const card = document.createElement("div");
      card.className = "property-card";
      const imgSrc =
        resolveImageUrl(p.image_url) ||
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80";
      card.innerHTML = `
        <img src="${escapeAttr(imgSrc)}" alt="${escapeAttr(p.title)}">
        <h3>${escapeHtml(p.title)}</h3>
        <p class="location"><i class="fas fa-map-marker-alt"></i> ${escapeHtml(p.location || "")}</p>
        <p class="price">${escapeHtml(formatPrice(p.price, p.listing_type))}</p>
        <span class="status-badge status-${p.status}">${p.status === "approved" ? "Live" : "Pending"}</span>
        <div class="details">
          <span>${p.bedrooms} Beds</span>
          <span>${p.bathrooms} Baths</span>
          <span>${p.size_sqft} sqft</span>
        </div>
        <div class="card-actions">
          <a href="property-details?id=${p.id}" class="edit-btn"><i class="fas fa-eye"></i> View</a>
          <button type="button" class="delete-btn" data-id="${p.id}"><i class="fas fa-trash"></i> Delete</button>
        </div>
      `;
      const deleteBtn = card.querySelector(".delete-btn");
      if (deleteBtn) deleteBtn.addEventListener("click", () => deleteProperty(p.id, card));
      grid.appendChild(card);
    });
  }

  fetch(API_BASE + "/properties/my", { headers: { Authorization: "Bearer " + token } })
    .then((res) => {
      if (res.status === 401) { logout(); return []; }
      return res.json();
    })
    .then((data) => render(data && data.properties ? data.properties : []))
    .catch(() => render([]));
})();
