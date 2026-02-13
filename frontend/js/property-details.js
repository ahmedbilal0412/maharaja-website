(function () {
  const API_BASE = window.API_BASE || "https://maharaja-website.onrender.com/api";

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

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  const token = getToken();

  if (!id) {
    document.querySelector(".content").innerHTML = "<h2>Property not found</h2>";
    return;
  }

  fetch(API_BASE + "/properties/" + id, { headers: { Authorization: "Bearer " + token } })
    .then(function (r) {
      if (!r.ok) throw new Error("Not found");
      return r.json();
    })
    .then(function (p) {
      const images = Array.isArray(p.images) ? p.images : [];
      const primary = images.find(function (img) { return img && img.is_primary; }) || images[0] || null;
      var mainUrl =
        resolveImageUrl(primary && primary.image_url) ||
        resolveImageUrl(p.image_url) ||
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80";

      const mainImageEl = document.getElementById("mainImage");
      mainImageEl.src = mainUrl;
      mainImageEl.alt = p.title || "Property";

      document.getElementById("title").textContent = p.title || "Property";
      document.getElementById("location").textContent = (p.location || "") + (p.city ? ", " + p.city : "");

      const isRent = p.listing_type === "rent";
      const priceStr = isRent
        ? "PKR " + Number(p.price).toLocaleString() + "/month"
        : "PKR " + Number(p.price).toLocaleString();
      document.getElementById("price").textContent = priceStr;

      document.getElementById("features").innerHTML = [
        p.bedrooms ? '<div class="feature"><i class="fas fa-bed"></i> ' + p.bedrooms + " Bedrooms</div>" : "",
        p.bathrooms ? '<div class="feature"><i class="fas fa-bath"></i> ' + p.bathrooms + " Bathrooms</div>" : "",
        '<div class="feature"><i class="fas fa-ruler-combined"></i> ' + (p.size_sqft || 0) + " sq ft</div>",
        '<div class="feature"><i class="fas fa-home"></i> ' + (p.property_type || "").replace(/</g, "&lt;") + "</div>",
      ].join("");

      const amenities = Array.isArray(p.amenities) ? p.amenities : (p.amenities || "").split(",").filter(Boolean);
      document.getElementById("amenities").innerHTML = amenities.length
        ? amenities
            .map(function (a) {
              return '<div class="amenity"><i class="fas fa-check-circle"></i> ' +
                String(a).replace(/</g, "&lt;") +
                "</div>";
            })
            .join("")
        : '<p style="color: var(--text-light);">No amenities listed.</p>';

      const contactHtml =
        (p.seller_name || p.seller_phone || p.seller_email)
          ? '<h3 style="color: var(--primary-green); margin-top: 24px;">Contact Owner</h3>' +
            "<p><i class=\"fas fa-user\"></i> " + (p.seller_name || "").replace(/</g, "&lt;") + "</p>" +
            (p.seller_phone
              ? '<p><i class="fas fa-phone"></i> <a href="tel:' +
                p.seller_phone +
                '">' +
                p.seller_phone.replace(/</g, "&lt;") +
                "</a></p>"
              : "") +
            (p.seller_email
              ? '<p><i class="fas fa-envelope"></i> <a href="mailto:' +
                p.seller_email +
                '">' +
                (p.seller_email || "").replace(/</g, "&lt;") +
                "</a></p>"
              : "")
          : "";
      const content = document.querySelector(".content");
      if (content && contactHtml) {
        const div = document.createElement("div");
        div.className = "contact-owner";
        div.innerHTML = contactHtml;
        const actions = content.querySelector(".actions");
        if (actions) content.insertBefore(div, actions);
        else content.appendChild(div);
      }

      const grid = document.getElementById("imagesGrid");
      if (grid) {
        if (images.length) {
          grid.innerHTML = images
            .map(function (img, index) {
              var url = resolveImageUrl(img && img.image_url);
              if (!url) return "";
              return (
                '<img src="' +
                url.replace(/"/g, "&quot;") +
                '" alt="Property image ' +
                (index + 1) +
                '" class="thumb-image">'
              );
            })
            .join("");

          const thumbs = grid.querySelectorAll(".thumb-image");
          thumbs.forEach(function (thumb, index) {
            thumb.addEventListener("click", function () {
              var img = images[index];
              var url = resolveImageUrl(img && img.image_url);
              if (url) mainImageEl.src = url;
            });
          });
        } else {
          grid.innerHTML =
            '<p style="color: var(--text-light); margin-top: 10px;">No additional photos available.</p>';
        }
      }
    })
    .catch(function () {
      document.querySelector(".content").innerHTML = "<h2>Property not found</h2>";
    });
})();
