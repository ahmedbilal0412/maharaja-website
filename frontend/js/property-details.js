(function () {
  const API_BASE = window.API_BASE || "https://maharajabuilders.pk/api";

  function resolveImageUrl(url) {
    if (!url) return null;
    
    // Already a full HTTP URL
    if (url.indexOf("http://") === 0 || url.indexOf("https://") === 0) return url;
    
    // Determine the base URL for images
    const imageBaseUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:5000' 
        : 'https://maharaja-website.onrender.com';
    
    // Handle URLs that already have the correct /api/ format
    if (url.startsWith('/api/')) {
        return imageBaseUrl + url;
    }
    
    // Handle old/wrong paths
    if (url.includes('/uploads/') || url.includes('\\uploads\\')) {
        const filename = url.split(/[/\\]/).pop();
        return `${imageBaseUrl}/api/properties/uploads/properties/${filename}`;
    }
    
    // Handle local file paths
    if (url.includes(':/') || url.includes('\\')) {
        const filename = url.split(/[/\\]/).pop();
        return `${imageBaseUrl}/api/properties/uploads/properties/${filename}`;
    }
    
    // Handle relative paths
    if (!url.startsWith('/')) {
        return `${imageBaseUrl}/api/properties/uploads/properties/${url}`;
    }
    
    return url;
  }

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  
  const token = typeof getToken === 'function' ? getToken() : null;

  if (!id) {
    document.querySelector(".property-info-panel").innerHTML = "<h2>Property not found</h2>";
    return;
  }

  const headers = {};
  if (token) {
    headers['Authorization'] = 'Bearer ' + token;
  }

  fetch(API_BASE + "/properties/" + id, { headers: headers })
    .then(function (r) {
      if (!r.ok) throw new Error("Not found");
      return r.json();
    })
    .then(function (p) {
      // Set badge based on listing type
      const badge = document.getElementById('propertyBadge');
      if (badge) {
        badge.textContent = p.listing_type === 'rent' ? 'For Rent' : 'For Sale';
      }

      // Images
      const images = Array.isArray(p.images) ? p.images : [];
      const primary = images.find(function (img) { return img && img.is_primary; }) || images[0] || null;
      
      const mainImageEl = document.getElementById("mainImage");
      const mainUrl = resolveImageUrl(primary && primary.image_url) ||
        resolveImageUrl(p.image_url) ||
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80";
      
      mainImageEl.src = mainUrl;
      mainImageEl.alt = p.title || "Property";

      // Basic info
      document.getElementById("title").textContent = p.title || "Property";
      document.getElementById("location").querySelector('span').textContent = 
        (p.location || "") + (p.city ? ", " + p.city : "");

      // Price
      const isRent = p.listing_type === "rent";
      const priceStr = isRent
        ? "PKR " + Number(p.price).toLocaleString() + "/month"
        : "PKR " + Number(p.price).toLocaleString();
      document.getElementById("price").textContent = priceStr;

      // Key features
      document.getElementById("features").innerHTML = [
        p.bedrooms ? '<div class="feature"><i class="fas fa-bed"></i> ' + p.bedrooms + ' Bedrooms</div>' : '',
        p.bathrooms ? '<div class="feature"><i class="fas fa-bath"></i> ' + p.bathrooms + ' Bathrooms</div>' : '',
        '<div class="feature"><i class="fas fa-ruler-combined"></i> ' + (p.size_sqft || 0) + ' sq ft</div>'
      ].join('');

      // Parking badge (from boolean field)
      const parkingBadge = document.getElementById('parkingBadge');
      if (parkingBadge && p.parking) {
        parkingBadge.style.display = 'inline-flex';
      }

      // Electricity backup badge
      const electricityBadge = document.getElementById('electricityBadge');
      if (electricityBadge && p.electricity_backup) {
        electricityBadge.style.display = 'inline-flex';
      }

      // Additional details row (furnished, year built, total floors)
      const additionalDetails = document.getElementById('additionalDetails');
      if (additionalDetails) {
        let detailsHtml = '';
        
        if (p.furnished) {
          let furnishedText = '';
          if (p.furnished === 'fully-furnished') furnishedText = 'Fully Furnished';
          else if (p.furnished === 'semi-furnished') furnishedText = 'Semi Furnished';
          else if (p.furnished === 'unfurnished') furnishedText = 'Unfurnished';
          
          if (furnishedText) {
            detailsHtml += '<div class="detail-item"><i class="fas fa-couch"></i> ' + furnishedText + '</div>';
          }
        }
        
        if (p.year_built) {
          detailsHtml += '<div class="detail-item"><i class="fas fa-calendar"></i> Built ' + p.year_built + '</div>';
        }
        
        if (p.total_floors) {
          detailsHtml += '<div class="detail-item"><i class="fas fa-building"></i> ' + p.total_floors + ' Floor' + (p.total_floors > 1 ? 's' : '') + '</div>';
        }
        
        if (detailsHtml) {
          additionalDetails.innerHTML = detailsHtml;
          additionalDetails.style.display = 'flex';
        }
      }

      // Description
      const descriptionEl = document.getElementById('description');
      if (descriptionEl) {
        descriptionEl.textContent = p.description || 'No description provided.';
      }

      // Property specs in overview tab
      const propertySpecs = document.getElementById('propertySpecs');
      if (propertySpecs) {
        let specsHtml = '';
        
        if (p.year_built) {
          specsHtml += '<div class="spec-item"><i class="fas fa-calendar-alt"></i><span class="label">Year Built</span><span class="value">' + p.year_built + '</span></div>';
        }
        
        if (p.total_floors) {
          specsHtml += '<div class="spec-item"><i class="fas fa-layer-group"></i><span class="label">Total Floors</span><span class="value">' + p.total_floors + '</span></div>';
        }
        
        if (p.furnished) {
          let furnishedText = '';
          if (p.furnished === 'fully-furnished') furnishedText = 'Fully Furnished';
          else if (p.furnished === 'semi-furnished') furnishedText = 'Semi Furnished';
          else if (p.furnished === 'unfurnished') furnishedText = 'Unfurnished';
          
          if (furnishedText) {
            specsHtml += '<div class="spec-item"><i class="fas fa-couch"></i><span class="label">Furnishing</span><span class="value">' + furnishedText + '</span></div>';
          }
        }
        
        if (specsHtml) {
          propertySpecs.innerHTML = specsHtml;
        }
      }

      // Amenities (combine both from amenities string and boolean fields)
      const amenitiesList = Array.isArray(p.amenities) ? p.amenities : (p.amenities || "").split(",").filter(Boolean);
      
      // Add parking to amenities if available (for display in amenities tab)
      if (p.parking && !amenitiesList.includes('parking')) {
        amenitiesList.unshift('parking');
      }
      
      // Add electricity backup to amenities if available
      if (p.electricity_backup && !amenitiesList.includes('electricity_backup')) {
        amenitiesList.unshift('electricity_backup');
      }

      // Amenities grid
      document.getElementById("amenities").innerHTML = amenitiesList.length
        ? amenitiesList
            .map(function (a) {
              // Format amenity names for display
              let displayName = a.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
              return '<div class="amenity"><i class="fas fa-check-circle"></i> ' + displayName + '</div>';
            })
            .join("")
        : '<p style="color: var(--text-light);">No amenities listed.</p>';

      // Thumbnail grid
      const grid = document.getElementById("imagesGrid");
      if (grid) {
        if (images.length) {
          grid.innerHTML = images
            .map(function (img, index) {
              var url = resolveImageUrl(img && img.image_url);
              if (!url) return "";
              return '<img src="' + url.replace(/"/g, "&quot;") + 
                     '" alt="Thumbnail" class="thumb-image" data-index="' + index + '">';
            })
            .join("");

          // Thumbnail click handlers
          grid.querySelectorAll(".thumb-image").forEach(function (thumb) {
            thumb.addEventListener("click", function () {
              const index = this.dataset.index;
              const img = images[index];
              const url = resolveImageUrl(img && img.image_url);
              if (url) mainImageEl.src = url;
            });
          });
        } else {
          grid.innerHTML = '<p style="grid-column: 1/-1; color: var(--text-light);">No additional photos</p>';
        }
      }

      // Seller info
      const sellerNameEl = document.getElementById('sellerName');
      if (sellerNameEl) {
        sellerNameEl.textContent = p.seller_name || 'Maharaja Builders';
      }

      // Contact buttons
      const callBtn = document.getElementById('callBtn');
      const emailBtn = document.getElementById('emailBtn');
      
      if (callBtn && p.seller_phone) {
        callBtn.style.display = 'flex';
        callBtn.onclick = () => window.location.href = 'tel:' + p.seller_phone;
      }
      
      if (emailBtn && p.seller_email) {
        emailBtn.style.display = 'flex';
        emailBtn.onclick = () => window.location.href = 'mailto:' + p.seller_email;
      }

      // Hide seller rating if not available (you can remove this if you don't have ratings)
      const sellerRating = document.getElementById('sellerRating');
      if (sellerRating) {
        sellerRating.style.display = 'none'; // Hide since we don't have ratings yet
      }
    })
    .catch(function () {
      document.querySelector(".property-info-panel").innerHTML = "<h2>Property not found</h2>";
    });

  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      // Remove active class from all tabs and panes
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      
      // Add active class to clicked tab
      this.classList.add('active');
      
      // Show corresponding pane
      const tabName = this.dataset.tab;
      document.getElementById(tabName + '-tab').classList.add('active');
    });
  });

  // Request form submission
  document.getElementById('requestForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    alert('Thank you for your interest! The seller will contact you soon.');
    this.reset();
  });
})();