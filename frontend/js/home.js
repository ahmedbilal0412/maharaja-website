/**
 * Home page (index) only: UAE modal, country card behavior, and latest properties.
 * Run after DOM ready; modal and cards are always in the page.
 */
(function () {
  // City pill switching functionality
  document.addEventListener('DOMContentLoaded', function() {
    const cityPills = document.querySelectorAll('.city-pill');
    const locationGrids = {
      islamabad: document.getElementById('islamabad-locations'),
      lahore: document.getElementById('lahore-locations'),
      rawalpindi: document.getElementById('rawalpindi-locations'),
      karachi: document.getElementById('karachi-locations')
    };

    cityPills.forEach(pill => {
      pill.addEventListener('click', function() {
        // Remove active class from all pills
        cityPills.forEach(p => p.classList.remove('active'));
        // Add active class to clicked pill
        this.classList.add('active');

        // Hide all location grids
        Object.values(locationGrids).forEach(grid => {
          if (grid) grid.style.display = 'none';
        });

        // Show selected city grid
        const city = this.dataset.city;
        if (locationGrids[city]) {
          locationGrids[city].style.display = 'grid';
        }
      });
    });

    // Filter tabs functionality
    const filterTabs = document.querySelectorAll('.filter-tab');
    filterTabs.forEach(tab => {
      tab.addEventListener('click', function() {
        filterTabs.forEach(t => t.classList.remove('active'));
        this.classList.add('active');
      });
    });

    // Explore tabs functionality
    const exploreTabs = document.querySelectorAll('.explore-tab');
    exploreTabs.forEach(tab => {
      tab.addEventListener('click', function() {
        exploreTabs.forEach(t => t.classList.remove('active'));
        this.classList.add('active');
      });
    });

    // Search button functionality
    const searchBtn = document.getElementById('hero-search-btn');
    if (searchBtn) {
      searchBtn.addEventListener('click', function() {
        const location = document.getElementById('location-search')?.value || '';
        const propertyType = document.getElementById('property-type-filter')?.value || '';
        const activeFilter = document.querySelector('.filter-tab.active')?.dataset.filter || 'rent';
        
        let listingType = 'sale';
        if (activeFilter === 'rent') listingType = 'rent';
        else if (activeFilter === 'buy') listingType = 'sale';
        
        const params = new URLSearchParams();
        if (location && location !== 'City, community or building') params.append('city', location.toLowerCase());
        if (propertyType) params.append('property_type', propertyType);
        params.append('listing_type', listingType);
        
        window.location.href = `properties.html?${params.toString()}`;
      });
    }
  });

  // ==================== NEW: Load Latest Properties ====================
  
  let currentCity = ''; // Track current city filter
  
  function loadLatestProperties() {
    const projectGrid = document.querySelector('.project-grid');
    if (!projectGrid) return;

    // Show loading state
    projectGrid.innerHTML = `
      <div class="loading-projects" style="grid-column: 1/-1; text-align: center; padding: 50px;">
        <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #0b3d2e;"></i>
        <p style="margin-top: 15px; color: #666;">Loading latest properties...</p>
      </div>
    `;

    // Get API base from window or use default
    const API_BASE = window.API_BASE || "https://maharaja-website.onrender.com/api";

    // Build URL with city filter if provided
    let url = `${API_BASE}/properties?listing_type=sale&limit=6`; // Show more properties when filtering
    if (currentCity) {
      url = `${API_BASE}/properties?listing_type=sale&city=${currentCity}&limit=6`;
    }

    // Fetch latest approved properties (limit to 3)
    fetch(url)
      .then(response => response.json())
      .then(data => {
        const properties = data.properties || [];
        
        if (properties.length === 0) {
          projectGrid.innerHTML = `
            <div class="no-projects" style="grid-column: 1/-1; text-align: center; padding: 50px;">
              <i class="fas fa-home" style="font-size: 2rem; color: #999;"></i>
              <p style="margin-top: 15px; color: #666;">No properties available yet.</p>
            </div>
          `;
          return;
        }

        // Display up to 3 properties
        projectGrid.innerHTML = properties.slice(0, 3).map(property => {
          // Helper function to resolve image URL (copied from properties.js)
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

            // Handle old/wrong paths that might still be in the database
            if (url.includes('/uploads/') || url.includes('\\uploads\\')) {
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

          // Helper function to format price
          function formatPrice(price, listingType) {
            if (listingType === "rent") return "PKR " + Number(price).toLocaleString() + "/month";
            if (price >= 1e7) return "PKR " + (price / 1e7).toFixed(1) + " Crore";
            if (price >= 1e5) return "PKR " + (price / 1e5).toFixed(1) + " Lakh";
            return "PKR " + Number(price).toLocaleString();
          }

          // Determine property type badge
          const propertyType = property.property_type || 'property';
          const badgeText = propertyType === 'apartment' ? 'Apartment' : 
                           propertyType === 'house' ? 'House' : 
                           propertyType === 'villa' ? 'Villa' : 'Property';
          
          // Format beds display
          const bedsText = property.bedrooms ? 
            (property.bedrooms === 1 ? '1 Bed' : 
             property.bedrooms <= 3 ? `${property.bedrooms} Beds` : 
             '3+ Beds') : 'Studio';
          
          // Developer/Builder name
          const developer = property.seller_name || 'Maharaja Builders';
          
          // Image URL
          const imageUrl = resolveImageUrl(property.image_url) || 
            (property.images && property.images.length > 0 ? resolveImageUrl(property.images[0].image_url) : null) ||
            'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80';
          
          return `
            <div class="project-card" onclick="window.location.href='property-details.html?id=${property.id}'">
              <div class="project-image" style="background-image: url('${imageUrl}'); background-size: cover; background-position: center;">
                <span class="project-badge">${badgeText}</span>
              </div>
              <div class="project-content">
                <h3>${property.title || 'New Property'}</h3>
                <div class="project-location">
                  <i class="fas fa-map-marker-alt"></i>
                  <span>${property.location || property.city || 'Pakistan'}</span>
                </div>
                <div class="project-details">
                  <div class="project-detail">
                    <span class="label">Beds</span>
                    <span class="value">${bedsText}</span>
                  </div>
                  <div class="project-detail">
                    <span class="label">Type</span>
                    <span class="value">${propertyType}</span>
                  </div>
                  <div class="project-detail">
                    <span class="label">Price</span>
                    <span class="value">${formatPrice(property.price, 'sale')}</span>
                  </div>
                </div>
                <div class="developer">
                  <i class="fas fa-building"></i>
                  <span>${developer}</span>
                </div>
                <a href="property-details.html?id=${property.id}" class="view-details-btn">
                  <i class="fas fa-eye"></i> View Details
                </a>
              </div>
            </div>
          `;
        }).join('');
      })
      .catch(error => {
        console.error('Error loading projects:', error);
        projectGrid.innerHTML = `
          <div class="error-projects" style="grid-column: 1/-1; text-align: center; padding: 50px;">
            <i class="fas fa-exclamation-triangle" style="font-size: 2rem; color: #e63946;"></i>
            <p style="margin-top: 15px; color: #666;">Failed to load properties. Please try again later.</p>
          </div>
        `;
      });
  }

  // Add city tab click handlers
  function setupCityTabs() {
    const cityTabs = document.querySelectorAll('.city-tab');
    
    cityTabs.forEach(tab => {
      tab.addEventListener('click', function() {
        // Remove active class from all tabs
        cityTabs.forEach(t => t.classList.remove('active'));
        // Add active class to clicked tab
        this.classList.add('active');
        
        // Update the currentCity variable
        currentCity = this.dataset.city || '';
        
        // Reload properties with city filter
        loadLatestProperties(currentCity);
      });
    });
  }

  // ==================== EXISTING FUNCTIONS ====================

  function openUaeModal() {
    var modal = document.getElementById('uaeModal');
    if (!modal) return;
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    setTimeout(function () {
      modal.style.animation = 'fadeIn 0.3s ease';
    }, 10);
  }

  function closeUaeModal() {
    var modal = document.getElementById('uaeModal');
    if (!modal) return;
    modal.style.animation = 'fadeOut 0.3s ease';
    setTimeout(function () {
      modal.style.display = 'none';
      document.body.style.overflow = 'auto';
    }, 300);
  }

  // Home page search functionality
  function setupHomeSearch() {
    const searchBtn = document.getElementById('home-search-btn');
    if (!searchBtn) return;

    searchBtn.addEventListener('click', function() {
      const city = document.getElementById('home-city')?.value || '';
      const area = document.getElementById('home-area')?.value || '';
      const listingType = document.getElementById('home-listing-type')?.value || '';
      const propertyType = document.getElementById('home-property-type')?.value || '';

      // Build query string
      const params = new URLSearchParams();
      if (city) params.append('city', city);
      if (area) params.append('area', area);
      if (listingType) params.append('listing_type', listingType);
      if (propertyType) params.append('property_type', propertyType);

      // Redirect to properties page with filters
      window.location.href = `properties.html?${params.toString()}`;
    });

    // Allow Enter key to trigger search
    const inputs = ['home-city', 'home-area', 'home-listing-type', 'home-property-type'];
    inputs.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener('keypress', function(e) {
          if (e.key === 'Enter') searchBtn.click();
        });
      }
    });
  }

  function init() {
    setupHomeSearch();
    setupCityTabs();
    
    // Load latest properties from backend
    loadLatestProperties();
    
    var modal = document.getElementById('uaeModal');
    if (modal) {
      modal.addEventListener('click', function (e) {
        if (e.target === this) closeUaeModal();
      });
    }
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeUaeModal();
    });

    document.querySelectorAll('.country-card').forEach(function (card) {
      card.addEventListener('click', function (e) {
        if (!e.target.closest('button') && !e.target.closest('a')) {
          if (this.classList.contains('pakistan-card')) {
            window.location.href = 'buy-pakistan.html';
          } else if (this.classList.contains('uae-card')) {
            openUaeModal();
          }
        }
      });
    });
  }

  // ==================== EXPOSE GLOBALS ====================

  window.openUaeModal = openUaeModal;
  window.closeUaeModal = closeUaeModal;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();