/**
 * Home page (index) only: UAE modal, country card behavior, and latest properties.
 * Run after DOM ready; modal and cards are always in the page.
 */
(function () {
  // ==================== GLOBAL HELPER FUNCTIONS ====================
  
  // Helper function to resolve image URLs (make it global)
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
    
    // Handle upload paths (for ads and properties)
    if (url.includes('/uploads/')) {
      const filename = url.split('/').pop();
      // Check if it's an ad or property
      if (url.includes('/ads/')) {
        return `${imageBaseUrl}/api/ads/uploads/${filename}`;
      } else {
        return `${imageBaseUrl}/api/properties/uploads/properties/${filename}`;
      }
    }
    
    // Handle local file paths (C:/Users/...)
    if (url.includes(':/') || url.includes('\\')) {
      const filename = url.split(/[/\\]/).pop();
      return `${imageBaseUrl}/api/properties/uploads/properties/${filename}`;
    }
    
    // Handle relative paths starting with /uploads/
    if (url.indexOf("/uploads/") === 0) {
      const apiRoot = (window.API_BASE || "").replace(/\/api.*$/, "");
      if (!apiRoot || apiRoot.includes('localhost')) {
        return imageBaseUrl + url;
      }
      return apiRoot + url;
    }
    
    // Handle other relative paths (just filename)
    if (!url.startsWith('/')) {
      return `${imageBaseUrl}/api/properties/uploads/properties/${url}`;
    }
    
    return url;
  }

  // Helper function to format price
  function formatPrice(price, listingType) {
    if (listingType === "rent") return "PKR " + Number(price).toLocaleString() + "/month";
    if (price >= 1e7) return "PKR " + (price / 1e7).toFixed(1) + " Crore";
    if (price >= 1e5) return "PKR " + (price / 1e5).toFixed(1) + " Lakh";
    return "PKR " + Number(price).toLocaleString();
  }

  // ==================== LOAD CURRENT AD ====================
  
  async function loadCurrentAd() {
    try {
      const API_BASE = window.API_BASE || "https://api.maharajabuilders.pk/api";
      const response = await fetch(`${API_BASE}/ads/current`);
      const data = await response.json();
      
      const adBanner = document.getElementById('adBanner');
      if (!adBanner) return;
      
      if (data.ad) {
        const ad = data.ad;
        const adCTA = document.getElementById('adCTA');
        const adTitle = document.getElementById('adTitle');
        const adDescription = document.getElementById('adDescription');
        const adQR = document.getElementById('adQR');
        
        // Update ad content
        if (adTitle) adTitle.textContent = 'Sponsored Content';
        if (adDescription) adDescription.textContent = 'Check out this featured business';
        
        // Change CTA to link to ad
        if (adCTA) {
          adCTA.href = ad.link_url || '#';
          adCTA.innerHTML = 'Learn More <i class="fas fa-arrow-right"></i>';
        }
        
        // Add image to QR section
        if (adQR) {
          adQR.innerHTML = `
            <img src="${resolveImageUrl(ad.image_url)}" alt="Ad" style="width: 100%; border-radius: 10px;">
          `;
        }
      } else {
        // No active ad - show default "Ad Space Available"
      }
    } catch (error) {
      console.error('Error loading ad:', error);
    }
  }

  // ==================== LOAD LATEST PROPERTIES ====================
  
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
    const API_BASE = window.API_BASE || "https://api.maharajabuilders.pk/api";

    // Build URL with city filter if provided
    let url = `${API_BASE}/properties?listing_type=sale&limit=10`;
    if (currentCity) {
      url = `${API_BASE}/properties?listing_type=sale&city=${currentCity}&limit=10`;
    }

    // Fetch latest approved properties
    fetch(url)
      .then(response => response.json())
      .then(data => {
        let properties = data.properties || [];
        
        // Sort properties: premium active first, then by creation date
        properties.sort((a, b) => {
          // Check if premium is active
          const aIsPremium = a.is_premium === true && a.is_premium_active === true;
          const bIsPremium = b.is_premium === true && b.is_premium_active === true;
          
          if (aIsPremium && !bIsPremium) return -1;  // a premium comes first
          if (!aIsPremium && bIsPremium) return 1;   // b premium comes first
          
          // If both premium or both non-premium, sort by created date (newest first)
          const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
          const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
          return bDate - aDate;
        });
        
        if (properties.length === 0) {
          projectGrid.innerHTML = `
            <div class="no-projects" style="grid-column: 1/-1; text-align: center; padding: 50px;">
              <i class="fas fa-home" style="font-size: 2rem; color: #999;"></i>
              <p style="margin-top: 15px; color: #666;">No properties available yet.</p>
            </div>
          `;
          return;
        }

        // Display up to 3 properties (premium ones will appear first due to sorting)
        projectGrid.innerHTML = properties.slice(0, 3).map(property => {
          // Determine property type badge with premium styling
          const propertyType = property.property_type || 'property';
          const isPremium = property.is_premium === true && property.is_premium_active === true;
          
          let badgeText = propertyType === 'apartment' ? 'Apartment' : 
                         propertyType === 'house' ? 'House' : 
                         propertyType === 'villa' ? 'Villa' : 'Property';
          
          let badgeClass = 'project-badge';
          if (isPremium) {
            badgeClass += ' premium-badge';
            badgeText = '⭐ PREMIUM';
          }
          
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
                <span class="${badgeClass}">${badgeText}</span>
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

  // ==================== UI EVENT HANDLERS ====================

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
        if (location) params.append('city', location.toLowerCase());
        if (propertyType) params.append('property_type', propertyType);
        params.append('listing_type', listingType);
        
        window.location.href = `properties.html?${params.toString()}`;
      });
    }
  });

  // City tab click handlers for projects section
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
        loadLatestProperties();
      });
    });
  }

  // Search functionality for the new form
  function setupModernSearch() {
    const searchBtn = document.getElementById('search-find-btn');
    if (!searchBtn) return;

    // Get active tab (Buy/Rent/Projects)
    function getActiveTab() {
      const activeTab = document.querySelector('.search-tab.active');
      return activeTab ? activeTab.dataset.tab : 'buy';
    }

    searchBtn.addEventListener('click', function() {
      const activeTab = getActiveTab();
      const city = document.getElementById('search-city')?.value || '';
      const location = document.getElementById('search-location')?.value || '';
      const propertyType = document.getElementById('search-property-type')?.value || '';
      const priceMin = document.getElementById('price-min')?.value || '';
      const priceMax = document.getElementById('price-max')?.value || '';
      const areaMin = document.getElementById('area-min')?.value || '';
      const areaMax = document.getElementById('area-max')?.value || '';
      const beds = document.getElementById('search-beds')?.value || '';

      const params = new URLSearchParams();

      // Set listing type based on active tab
      if (activeTab === 'buy') {
        params.append('listing_type', 'sale');
      } else if (activeTab === 'rent') {
        params.append('listing_type', 'rent');
      }
      // Projects tab - you can handle differently if needed

      // Use city or location
      if (city) {
        params.append('city', city.toLowerCase());
      } else if (location) {
        params.append('city', location.toLowerCase());
      }

      if (propertyType) params.append('property_type', propertyType);
      if (beds) params.append('min_bedrooms', beds);
      if (priceMin) params.append('min_price', priceMin);
      if (priceMax) params.append('max_price', priceMax);
      
      // Area filter (convert marla to sqft if needed)
      if (areaMin) params.append('min_size', areaMin);
      if (areaMax) params.append('max_size', areaMax);

      window.location.href = `properties.html?${params.toString()}`;
    });

    // Tab switching
    document.querySelectorAll('.search-tab').forEach(tab => {
      tab.addEventListener('click', function() {
        document.querySelectorAll('.search-tab').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
      });
    });
  }

  // Setup dropdown modals for Price, Area, Beds
  function setupDropdownModals() {
    // Close all modals function
    function closeAllModals() {
      document.querySelectorAll('.dropdown-modal').forEach(modal => {
        modal.classList.remove('active');
      });
      document.querySelectorAll('.dropdown-trigger').forEach(trigger => {
        trigger.classList.remove('active');
      });
    }

    // Setup single dropdown
    function setupDropdown(triggerId, modalId, fieldName) {
      const trigger = document.getElementById(triggerId);
      const modal = document.getElementById(modalId);
      const closeBtn = modal.querySelector('.close-dropdown');
      const applyBtn = modal.querySelector('.btn-apply');
      const triggerValue = trigger.querySelector('.dropdown-value');

      // Open modal
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        closeAllModals();
        modal.classList.add('active');
        trigger.classList.add('active');
      });

      // Close button
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          modal.classList.remove('active');
          trigger.classList.remove('active');
        });
      }

      // Apply button
      if (applyBtn) {
        applyBtn.addEventListener('click', () => {
          if (fieldName === 'price') {
            const minVal = document.getElementById('price-modal-min')?.value || '0';
            const maxVal = document.getElementById('price-modal-max')?.value;
            const displayMax = maxVal ? maxVal : 'Any';
            if (triggerValue) triggerValue.textContent = `${minVal} to ${displayMax}`;
          } else if (fieldName === 'area') {
            const minVal = document.getElementById('area-modal-min')?.value || '0';
            const maxVal = document.getElementById('area-modal-max')?.value;
            const displayMax = maxVal ? maxVal : 'Any';
            if (triggerValue) triggerValue.textContent = `${minVal} to ${displayMax}`;
          } else if (fieldName === 'beds') {
            const selected = modal.querySelector('.bed-option.active');
            if (selected && triggerValue) {
              triggerValue.textContent = selected.textContent;
            }
          }
          modal.classList.remove('active');
          trigger.classList.remove('active');
        });
      }
    }

    // Setup bed options
    const bedsModal = document.getElementById('beds-modal');
    if (bedsModal) {
      const bedOptions = bedsModal.querySelectorAll('.bed-option');
      bedOptions.forEach(option => {
        option.addEventListener('click', () => {
          bedOptions.forEach(opt => opt.classList.remove('active'));
          option.classList.add('active');
        });
      });
    }

    // Setup range buttons
    function setupRangeButtons(modalId, inputId) {
      const modal = document.getElementById(modalId);
      if (!modal) return;
      const buttons = modal.querySelectorAll('.range-btn');
      buttons.forEach(btn => {
        btn.addEventListener('click', () => {
          const value = btn.dataset.value;
          const input = document.getElementById(inputId);
          if (input) {
            input.value = value;
          }
        });
      });
    }

    // Initialize dropdowns
    setupDropdown('price-trigger', 'price-modal', 'price');
    setupDropdown('area-trigger', 'area-modal', 'area');
    setupDropdown('beds-trigger', 'beds-modal', 'beds');
    setupRangeButtons('price-modal', 'price-modal-max');
    setupRangeButtons('area-modal', 'area-modal-max');

    // Close modal when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.dropdown-field')) {
        closeAllModals();
      }
    });
  }

  // ==================== LOCATION AUTOCOMPLETE ====================

  let locationSuggestions = [];
  let allCitiesAndAreas = [];

  function buildLocationSuggestions() {
    // Common locations based on your database
    allCitiesAndAreas = [
      // Cities
      { text: 'Islamabad', type: 'city', value: 'islamabad' },
      { text: 'Lahore', type: 'city', value: 'lahore' },
      { text: 'Karachi', type: 'city', value: 'karachi' },
      { text: 'Rawalpindi', type: 'city', value: 'rawalpindi' },
      { text: 'Peshawar', type: 'city', value: 'peshawar' },
      { text: 'Multan', type: 'city', value: 'multan' },
      { text: 'Faisalabad', type: 'city', value: 'faisalabad' },
      { text: 'Quetta', type: 'city', value: 'quetta' },
      
      // Areas
      { text: 'DHA Islamabad', type: 'area', value: 'DHA' },
      { text: 'DHA Lahore', type: 'area', value: 'DHA' },
      { text: 'DHA Karachi', type: 'area', value: 'DHA' },
      { text: 'DHA Rawalpindi', type: 'area', value: 'DHA' },
      { text: 'Bahria Town Islamabad', type: 'area', value: 'Bahria Town' },
      { text: 'Bahria Town Lahore', type: 'area', value: 'Bahria Town' },
      { text: 'Bahria Town Karachi', type: 'area', value: 'Bahria Town' },
      { text: 'Bahria Town Rawalpindi', type: 'area', value: 'Bahria Town' },
      { text: 'Gulberg Lahore', type: 'area', value: 'Gulberg' },
      { text: 'Clifton Karachi', type: 'area', value: 'Clifton' },
      { text: 'F-6 Islamabad', type: 'area', value: 'F-6' },
      { text: 'F-7 Islamabad', type: 'area', value: 'F-7' },
      { text: 'G-9 Islamabad', type: 'area', value: 'G-9' },
      { text: 'E-11 Islamabad', type: 'area', value: 'E-11' },
    ];
  }

  function showLocationSuggestions(query) {
    if (!query || query.length < 2) {
      document.getElementById('location-suggestions').style.display = 'none';
      return;
    }

    const term = query.toLowerCase();
    const suggestions = [];

    allCitiesAndAreas.forEach(item => {
      if (item.text.toLowerCase().includes(term)) {
        suggestions.push(item);
      }
    });

    const suggestionsContainer = document.getElementById('location-suggestions');
    
    if (suggestions.length === 0) {
      suggestionsContainer.style.display = 'none';
      return;
    }

    suggestionsContainer.innerHTML = suggestions.slice(0, 8).map(s => `
      <div class="location-suggestion-item" data-type="${s.type}" data-value="${s.value}" data-text="${s.text}">
        <i class="fas fa-${s.type === 'city' ? 'city' : 'map-marker-alt'}"></i>
        <span>${s.text}</span>
        <small>${s.type}</small>
      </div>
    `).join('');

    suggestionsContainer.style.display = 'block';

    // Add click handlers
    suggestionsContainer.querySelectorAll('.location-suggestion-item').forEach(item => {
      item.addEventListener('click', function() {
        const text = this.dataset.text;
        const value = this.dataset.value;
        const type = this.datatype;
        
        const locationInput = document.getElementById('search-location');
        if (locationInput) {
          locationInput.value = text;
        }
        
        suggestionsContainer.style.display = 'none';
        
        // Optionally, also set the city select if it's a city
        if (type === 'city') {
          const citySelect = document.getElementById('search-city');
          if (citySelect) {
            citySelect.value = value;
          }
        }
      });
    });
  }

  // ==================== LOCATION AUTOCOMPLETE ====================

  let allLocations = [];

  async function fetchLocationSuggestions() {
    try {
      const API_BASE = window.API_BASE || "https://api.maharajabuilders.pk/api";
      const response = await fetch(`${API_BASE}/properties/locations`);
      const data = await response.json();
      allLocations = data.locations || [];
      console.log(`Fetched ${allLocations.length} location suggestions`);
    } catch (error) {
      console.error('Error fetching locations:', error);
      // Fallback to default suggestions
      allLocations = [
        { text: 'Islamabad', type: 'city', value: 'islamabad' },
        { text: 'Lahore', type: 'city', value: 'lahore' },
        { text: 'Karachi', type: 'city', value: 'karachi' },
        { text: 'Rawalpindi', type: 'city', value: 'rawalpindi' },
        { text: 'DHA', type: 'area', value: 'DHA' },
        { text: 'Bahria Town', type: 'area', value: 'Bahria Town' },
      ];
    }
  }

  function showLocationSuggestions(query) {
    if (!query || query.length < 2) {
      const container = document.getElementById('location-suggestions');
      if (container) container.style.display = 'none';
      return;
    }

    const term = query.toLowerCase();
    const suggestions = allLocations.filter(item => 
      item.text.toLowerCase().includes(term)
    );

    const suggestionsContainer = document.getElementById('location-suggestions');
    
    if (suggestions.length === 0) {
      suggestionsContainer.style.display = 'none';
      return;
    }

    suggestionsContainer.innerHTML = suggestions.slice(0, 8).map(s => `
      <div class="location-suggestion-item" data-type="${s.type}" data-value="${s.value}" data-text="${s.text}">
        <i class="fas fa-${s.type === 'city' ? 'city' : 'map-marker-alt'}"></i>
        <span>${escapeHtml(s.text)}</span>
        <small>${s.type}</small>
      </div>
    `).join('');

    suggestionsContainer.style.display = 'block';

    suggestionsContainer.querySelectorAll('.location-suggestion-item').forEach(item => {
      item.addEventListener('click', function() {
        const text = this.dataset.text;
        const value = this.dataset.value;
        const type = this.dataset.type;
        
        const locationInput = document.getElementById('search-location');
        if (locationInput) {
          locationInput.value = text;
        }
        
        suggestionsContainer.style.display = 'none';
        
        if (type === 'city') {
          const citySelect = document.getElementById('search-city');
          if (citySelect) {
            citySelect.value = value;
          }
        }
      });
    });
  }

  function setupLocationAutocomplete() {
    // First fetch locations from API
    fetchLocationSuggestions();
    
    const locationInput = document.getElementById('search-location');
    if (!locationInput) return;
    
    // Create suggestions container if it doesn't exist
    if (!document.getElementById('location-suggestions')) {
      const wrapper = locationInput.parentElement;
      wrapper.style.position = 'relative';
      const container = document.createElement('div');
      container.id = 'location-suggestions';
      container.className = 'location-suggestions';
      wrapper.appendChild(container);
    }
    
    let searchTimeout;
    
    locationInput.addEventListener('input', function() {
      const value = this.value.trim();
      
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        showLocationSuggestions(value);
      }, 300);
    });
    
    document.addEventListener('click', function(e) {
      const container = document.getElementById('location-suggestions');
      const wrapper = document.querySelector('.location-input-wrapper');
      if (container && !e.target.closest('.location-input-wrapper')) {
        container.style.display = 'none';
      }
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
      if (m === '&') return '&amp;';
      if (m === '<') return '&lt;';
      if (m === '>') return '&gt;';
      return m;
    });
  }  

  // ==================== POPULAR LOCATIONS TAB FUNCTIONALITY ====================

// Property type tabs (Plots/Flats/Houses)
document.querySelectorAll('.popular-tab').forEach(tab => {
  tab.addEventListener('click', function() {
    // Update active tab
    document.querySelectorAll('.popular-tab').forEach(t => t.classList.remove('active'));
    this.classList.add('active');
    
    // Get the type
    const type = this.dataset.type;
    
    // Hide all grids
    document.getElementById('plots-grid').style.display = 'none';
    document.getElementById('flats-grid').style.display = 'none';
    document.getElementById('houses-grid').style.display = 'none';
    
    // Show selected grid
    document.getElementById(type + '-grid').style.display = 'grid';
  });
});

// Sale/Rent toggle
document.querySelectorAll('.toggle-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    
    const listingType = this.dataset.listing; // 'sale' or 'rent'
    const listingText = listingType === 'sale' ? 'sale' : 'rent';
    
    // Update all location links based on selection
    document.querySelectorAll('.location-list a, .city-list a').forEach(link => {
      const href = link.getAttribute('href');
      const newHref = href.replace(/listing_type=\w+/, `listing_type=${listingType}`);
      link.setAttribute('href', newHref);
      
      // Update the text inside the link (for display only)
      const linkText = link.innerHTML;
      if (listingType === 'sale') {
        link.innerHTML = linkText.replace(/rent/g, 'sale');
      } else {
        link.innerHTML = linkText.replace(/sale/g, 'rent');
      }
    });
  });
});

// Video source switcher for responsive hero video
function initResponsiveVideo() {
  const video = document.getElementById('hero-video');
  if (!video) return;
  
  function updateVideoSource() {
    const isMobile = window.innerWidth <= 540;
    const sources = video.getElementsByTagName('source');
    const newSrc = isMobile ? 'img/mobile-video.mp4' : 'img/hero-video.mp4';
    
    if (sources.length > 0 && !sources[0].src.includes(newSrc)) {
      sources[0].src = newSrc;
      video.load();
      video.play().catch(e => console.log('Video autoplay prevented:', e));
    }
  }
  
  // Initial check
  updateVideoSource();
  
  // Debounced resize handler
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(updateVideoSource, 250);
  });
}

  // ==================== INIT FUNCTION ====================

  function init() {
    setupCityTabs();
    loadLatestProperties();
    loadCurrentAd();
    initResponsiveVideo();
    setupDropdownModals();
    setupModernSearch();
    setupLocationAutocomplete();
  }

  // ==================== EXPOSE GLOBALS ====================

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();