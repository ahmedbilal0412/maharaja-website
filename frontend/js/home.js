/**
 * Home page (index) only: UAE modal, country card behavior, and latest properties.
 * Run after DOM ready; modal and cards are always in the page.
 */
(function () {
  // ==================== GLOBAL HELPER FUNCTIONS ====================
  
  function resolveImageUrl(url) {
    if (!url) return null;
    if (url.indexOf("http://") === 0 || url.indexOf("https://") === 0) return url;
    
    const imageBaseUrl = window.location.hostname === 'localhost'
      ? 'http://localhost:5000'
      : 'https://api.maharajabuilders.pk';
    
    if (url.startsWith('/api/')) return imageBaseUrl + url;
    
    if (url.includes('/uploads/')) {
      const filename = url.split('/').pop();
      if (url.includes('/ads/')) {
        return `${imageBaseUrl}/api/ads/uploads/${filename}`;
      } else {
        return `${imageBaseUrl}/api/properties/uploads/properties/${filename}`;
      }
    }
    
    if (url.includes(':/') || url.includes('\\')) {
      const filename = url.split(/[/\\]/).pop();
      return `${imageBaseUrl}/api/properties/uploads/properties/${filename}`;
    }
    
    if (url.indexOf("/uploads/") === 0) {
      const apiRoot = (window.API_BASE || "").replace(/\/api.*$/, "");
      if (!apiRoot || apiRoot.includes('localhost')) return imageBaseUrl + url;
      return apiRoot + url;
    }
    
    if (!url.startsWith('/')) {
      return `${imageBaseUrl}/api/properties/uploads/properties/${url}`;
    }
    
    return url;
  }

  function formatPrice(price, listingType) {
    if (listingType === "rent") return "PKR " + Number(price).toLocaleString() + "/month";
    if (price >= 1e7) return "PKR " + (price / 1e7).toFixed(1) + " Crore";
    if (price >= 1e5) return "PKR " + (price / 1e5).toFixed(1) + " Lakh";
    return "PKR " + Number(price).toLocaleString();
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
        
        if (adTitle) adTitle.textContent = 'Sponsored Content';
        if (adDescription) adDescription.textContent = 'Check out this featured business';
        
        if (adCTA) {
          adCTA.href = ad.link_url || '#';
          adCTA.innerHTML = 'Learn More <i class="fas fa-arrow-right"></i>';
        }
        
        if (adQR) {
          adQR.innerHTML = `<img src="${resolveImageUrl(ad.image_url)}" alt="Ad" style="width: 100%; border-radius: 10px;">`;
        }
      }
    } catch (error) {
      console.error('Error loading ad:', error);
    }
  }

  // ==================== LOAD LATEST PROPERTIES ====================
  
  let currentCity = '';
  
  function loadLatestProperties() {
    const projectGrid = document.querySelector('.project-grid');
    if (!projectGrid) return;

    projectGrid.innerHTML = `
      <div class="loading-projects" style="grid-column: 1/-1; text-align: center; padding: 50px;">
        <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #0b3d2e;"></i>
        <p style="margin-top: 15px; color: #666;">Loading latest properties...</p>
      </div>
    `;

    const API_BASE = window.API_BASE || "https://api.maharajabuilders.pk/api";
    let url = `${API_BASE}/properties?listing_type=sale&limit=10`;
    if (currentCity) url = `${API_BASE}/properties?listing_type=sale&city=${currentCity}&limit=10`;

    fetch(url)
      .then(response => response.json())
      .then(data => {
        let properties = data.properties || [];
        
        properties.sort((a, b) => {
          const aIsPremium = a.is_premium === true && a.is_premium_active === true;
          const bIsPremium = b.is_premium === true && b.is_premium_active === true;
          if (aIsPremium && !bIsPremium) return -1;
          if (!aIsPremium && bIsPremium) return 1;
          const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
          const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
          return bDate - aDate;
        });
        
        if (properties.length === 0) {
          projectGrid.innerHTML = `<div class="no-projects" style="grid-column: 1/-1; text-align: center; padding: 50px;">
            <i class="fas fa-home" style="font-size: 2rem; color: #999;"></i>
            <p>No properties available yet.</p>
          </div>`;
          return;
        }

        projectGrid.innerHTML = properties.slice(0, 3).map(property => {
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
          
          const bedsText = property.bedrooms ? 
            (property.bedrooms === 1 ? '1 Bed' : property.bedrooms <= 3 ? `${property.bedrooms} Beds` : '3+ Beds') : 'Studio';
          const developer = property.seller_name || 'Maharaja Builders';
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
                  <div class="project-detail"><span class="label">Beds</span><span class="value">${bedsText}</span></div>
                  <div class="project-detail"><span class="label">Type</span><span class="value">${propertyType}</span></div>
                  <div class="project-detail"><span class="label">Price</span><span class="value">${formatPrice(property.price, 'sale')}</span></div>
                </div>
                <div class="developer"><i class="fas fa-building"></i><span>${developer}</span></div>
                <a href="property-details.html?id=${property.id}" class="view-details-btn"><i class="fas fa-eye"></i> View Details</a>
              </div>
            </div>
          `;
        }).join('');
      })
      .catch(error => {
        console.error('Error loading projects:', error);
        projectGrid.innerHTML = `<div class="error-projects" style="grid-column: 1/-1; text-align: center; padding: 50px;">
          <i class="fas fa-exclamation-triangle" style="font-size: 2rem; color: #e63946;"></i>
          <p>Failed to load properties. Please try again later.</p>
        </div>`;
      });
  }

  // ==================== UI EVENT HANDLERS ====================

  function setupCityTabs() {
    const cityTabs = document.querySelectorAll('.city-tab');
    cityTabs.forEach(tab => {
      tab.addEventListener('click', function() {
        cityTabs.forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        currentCity = this.dataset.city || '';
        loadLatestProperties();
      });
    });
  }

  function setupModernSearch() {
    const searchBtn = document.getElementById('search-find-btn');
    if (!searchBtn) return;

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

      if (activeTab === 'buy') params.append('listing_type', 'sale');
      else if (activeTab === 'rent') params.append('listing_type', 'rent');

      if (city) params.append('city', city.toLowerCase());
      else if (location) params.append('city', location.toLowerCase());

      if (propertyType) params.append('property_type', propertyType);
      if (beds) params.append('min_bedrooms', beds);
      if (priceMin) params.append('min_price', priceMin);
      if (priceMax) params.append('max_price', priceMax);
      if (areaMin) params.append('min_size', areaMin);
      if (areaMax) params.append('max_size', areaMax);

      window.location.href = `properties.html?${params.toString()}`;
    });

    document.querySelectorAll('.search-tab').forEach(tab => {
      tab.addEventListener('click', function() {
        document.querySelectorAll('.search-tab').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
      });
    });
  }

  // ==================== DROPDOWN MODALS ====================

  function setupDropdownModals() {
    function closeAllModals() {
      document.querySelectorAll('.dropdown-modal').forEach(modal => modal.classList.remove('active'));
      document.querySelectorAll('.dropdown-trigger').forEach(trigger => trigger.classList.remove('active'));
    }

    // Add this inside setupDropdownModals() after the closeAllModals function
    function resetDropdownValues() {
      // Reset price modal
      const priceMin = document.getElementById('price-modal-min');
      const priceMax = document.getElementById('price-modal-max');
      if (priceMin) priceMin.value = '0';
      if (priceMax) priceMax.value = '';
      
      // Reset area modal
      const areaMin = document.getElementById('area-modal-min');
      const areaMax = document.getElementById('area-modal-max');
      if (areaMin) areaMin.value = '0';
      if (areaMax) areaMax.value = '';
      
      // Reset beds
      document.querySelectorAll('.bed-option').forEach(opt => opt.classList.remove('active'));
    }

    function setupDropdown(triggerId, modalId, fieldName) {
      const trigger = document.getElementById(triggerId);
      const modal = document.getElementById(modalId);
      if (!trigger || !modal) return;
      
      const closeBtn = modal.querySelector('.close-dropdown');
      const applyBtn = modal.querySelector('.btn-apply');
      const triggerValue = trigger.querySelector('.dropdown-value');

      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        closeAllModals();
        modal.classList.add('active');
        trigger.classList.add('active');
      });

      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          modal.classList.remove('active');
          trigger.classList.remove('active');
        });
      }

      if (applyBtn) {
        applyBtn.addEventListener('click', () => {
          if (fieldName === 'price') {
            const minVal = document.getElementById('price-modal-min')?.value || '0';
            const maxVal = document.getElementById('price-modal-max')?.value;
            const displayMax = maxVal || 'Any';
            if (triggerValue) triggerValue.textContent = `${minVal} to ${displayMax}`;
          } else if (fieldName === 'area') {
            const minVal = document.getElementById('area-modal-min')?.value || '0';
            const maxVal = document.getElementById('area-modal-max')?.value;
            const displayMax = maxVal || 'Any';
            if (triggerValue) triggerValue.textContent = `${minVal} to ${displayMax}`;
          } else if (fieldName === 'beds') {
            const selected = modal.querySelector('.bed-option.active');
            if (selected && triggerValue) triggerValue.textContent = selected.textContent;
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
    function setupRangeButtons(modalId, minInputId, maxInputId) {
      const modal = document.getElementById(modalId);
      const minInput = document.getElementById(minInputId);
      const maxInput = document.getElementById(maxInputId);
      var minWrite = false;

      if (!modal) return;
      minInput.addEventListener('click', () => {
        minWrite = true;
      })
      maxInput.addEventListener('click', () => {
        minWrite = false;
      })
      const buttons = modal.querySelectorAll('.range-btn');
      buttons.forEach(btn => {
        btn.addEventListener('click', () => {
          const value = btn.dataset.value;          
          // Check which input has focus
          if (minWrite && minInput) {
            minInput.value = value;
            minInput.dispatchEvent(new Event('change'));
          } else {
            // Default to max if no input focused
            if (maxInput) {
              maxInput.value = value;
              maxInput.dispatchEvent(new Event('change'));
            }
          }
        });
      });
    }

    setupDropdown('price-trigger', 'price-modal', 'price');
    setupDropdown('area-trigger', 'area-modal', 'area');
    setupDropdown('beds-trigger', 'beds-modal', 'beds');
    setupRangeButtons('price-modal', 'price-modal-min', 'price-modal-max');
    setupRangeButtons('area-modal', 'area-modal-min', 'area-modal-max');

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.dropdown-field')) closeAllModals();
    });
  }

  // ==================== POPUP HANDLERS ====================

  function setupActionPopups() {
    const overlay = document.getElementById('popup-overlay');
    
    function closeAllPopups() {
      document.querySelectorAll('.action-popup').forEach(popup => popup.classList.remove('active'));
      if (overlay) overlay.classList.remove('active');
    }

    const unitConversions = {
      marla: {
        label: 'MARLA',
        factors: [2, 5, 10, 20],
        displayValues: ['2', '5', '10', '20']
      },
      square_feet: {
        label: 'SQ FT',
        factors: [2 * 225, 5 * 225, 10 * 225, 20 * 225],
        displayValues: ['450', '1125', '2250', '4500']
      },
      square_yards: {
        label: 'SQ YD',
        factors: [2 * 25, 5 * 25, 10 * 25, 20 * 25],
        displayValues: ['50', '125', '250', '500']
      },
      square_meters: {
        label: 'SQ M',
        factors: [Math.round(2 * 20.9), Math.round(5 * 20.9), Math.round(10 * 20.9), Math.round(20 * 20.9)],
        displayValues: ['42', '105', '209', '418']
      },
      kanal: {
        label: 'KANAL',
        factors: [2 / 20, 5 / 20, 10 / 20, 20 / 20],
        displayValues: ['0.1', '0.25', '0.5', '1']
      }
    };

    let currentUnit = 'marla';
    
      function updateRangeButtons(unit) {
        const unitData = unitConversions[unit];
        if (!unitData) return;
        
        const areaModal = document.getElementById('area-modal');
        if (!areaModal) return;
        
        const rangeButtons = areaModal.querySelectorAll('.range-btn');
        rangeButtons.forEach((btn, index) => {
          if (unitData.displayValues[index]) {
            btn.textContent = unitData.displayValues[index];
            btn.dataset.value = unitData.factors[index];
          }
        });
        
        // Also update the area field label
        const areaLabel = document.querySelector('#area-field label');
        if (areaLabel) {
          areaLabel.innerHTML = `AREA (${unitData.label})`;
        }
      }

    function openPopup(popupId) {
      closeAllPopups();
      const popup = document.getElementById(popupId);
      if (popup) {
        popup.classList.add('active');
        if (overlay) overlay.classList.add('active');
      }
    }
    
    const changeCurrencyBtn = document.getElementById('change-currency');
    if (changeCurrencyBtn) changeCurrencyBtn.addEventListener('click', () => openPopup('currency-popup'));
    
    const changeAreaUnitBtn = document.getElementById('change-area-unit');
    if (changeAreaUnitBtn) changeAreaUnitBtn.addEventListener('click', () => openPopup('areaunit-popup'));
    
    document.querySelectorAll('.close-popup').forEach(btn => btn.addEventListener('click', closeAllPopups));
    if (overlay) overlay.addEventListener('click', closeAllPopups);
    
    // Currency options
    document.querySelectorAll('.currency-option').forEach(opt => {
      opt.addEventListener('click', function() {
        document.querySelectorAll('.currency-option').forEach(o => o.classList.remove('active'));
        this.classList.add('active');
      });
    });
    
    // Unit options
    document.querySelectorAll('.unit-option').forEach(opt => {
      opt.addEventListener('click', function() {
        document.querySelectorAll('.unit-option').forEach(o => o.classList.remove('active'));
        this.classList.add('active');
        currentUnit = this.dataset.unit;
        updateRangeButtons(currentUnit);
      });
    });
    
    // Apply currency
    const applyCurrency = document.querySelector('#currency-popup .popup-apply');
    if (applyCurrency) {
      applyCurrency.addEventListener('click', () => {
        const selected = document.querySelector('.currency-option.active');
        if (selected) {
          const currency = selected.dataset.currency;
          const priceLabel = document.querySelector('#price-field label');
          if (priceLabel) priceLabel.innerHTML = currency === 'USD' ? 'PRICE (USD)' : 'PRICE (PKR)';
          if (typeof showToast === 'function') showToast(`Currency changed to ${currency}`, 'success');
          else alert(`Currency changed to ${currency}`);
        }
        closeAllPopups();
      });
    }
    
    // Apply area unit
    const applyUnit = document.querySelector('#areaunit-popup .popup-apply');
    if (applyUnit) {
      applyUnit.addEventListener('click', () => {
        const selected = document.querySelector('.unit-option.active');
        if (selected) {
          const unit = selected.dataset.unit;
          const unitNames = {
            marla: 'MARLA', square_feet: 'SQ FT', square_yards: 'SQ YD',
            square_meters: 'SQ M', kanal: 'KANAL'
          };

          currentUnit = unit;
          updateRangeButtons(currentUnit);

          // Also update the area dropdown display value conversion
          const areaMin = document.getElementById('area-modal-min');
          const areaMax = document.getElementById('area-modal-max');
          const areaTrigger = document.querySelector('#area-trigger .dropdown-value');
          
          // If there are existing values, convert them
          if (areaMin && areaMin.value !== '0') {
            // Convert from marla to new unit
            const conversionFactor = {
              marla: 1,
              square_feet: 225,
              square_yards: 25,
              square_meters: 20.9,
              kanal: 1/20
            };
            const oldValue = parseFloat(areaMin.value);
            const newValue = Math.round(oldValue * conversionFactor[unit] / conversionFactor.marla);
            areaMin.value = newValue;
          }

          if (typeof showToast === 'function') showToast(`Area unit changed to ${unitNames[unit]}`, 'success');
          else alert(`Area unit changed to ${unitNames[unit]}`);
        }
        closeAllPopups();
      });
    }

    const resetBtn = document.getElementById('reset-search');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        // Reset price
        const priceMin = document.getElementById('price-modal-min');
        const priceMax = document.getElementById('price-modal-max');
        if (priceMin) priceMin.value = '0';
        if (priceMax) priceMax.value = '';
        const priceTrigger = document.querySelector('#price-trigger .dropdown-value');
        if (priceTrigger) priceTrigger.textContent = '0 to Any';
        
        // Reset area
        const areaMin = document.getElementById('area-modal-min');
        const areaMax = document.getElementById('area-modal-max');
        if (areaMin) areaMin.value = '0';
        if (areaMax) areaMax.value = '';
        const areaTrigger = document.querySelector('#area-trigger .dropdown-value');
        if (areaTrigger) areaTrigger.textContent = '0 to Any';
        currentUnit = 'marla';
        updateRangeButtons('marla');
        
        // Reset beds
        const bedsTrigger = document.querySelector('#beds-trigger .dropdown-value');
        if (bedsTrigger) bedsTrigger.textContent = 'All';
        document.querySelectorAll('.bed-option').forEach(opt => opt.classList.remove('active'));
        
        // Reset selects
        const citySelect = document.getElementById('search-city');
        const propertyTypeSelect = document.getElementById('search-property-type');
        const locationInput = document.getElementById('search-location');
        if (citySelect) citySelect.value = '';
        if (propertyTypeSelect) propertyTypeSelect.value = '';
        if (locationInput) locationInput.value = '';
        
        // Also reset the actual search params used in filterProperties
        // These are the hidden fields that the search button uses
        const priceMinSearch = document.getElementById('price-min');
        const priceMaxSearch = document.getElementById('price-max');
        const areaMinSearch = document.getElementById('area-min');
        const areaMaxSearch = document.getElementById('area-max');
        const bedsSearch = document.getElementById('search-beds');
        
        if (priceMinSearch) priceMinSearch.value = '';
        if (priceMaxSearch) priceMaxSearch.value = '';
        if (areaMinSearch) areaMinSearch.value = '';
        if (areaMaxSearch) areaMaxSearch.value = '';
        if (bedsSearch) bedsSearch.value = '';
        
        if (typeof showToast === 'function') {
          showToast('All filters reset', 'info');
        }

        // After resetting values, re-trigger any event listeners
        if (priceMin) priceMin.dispatchEvent(new Event('change'));
        if (areaMin) areaMin.dispatchEvent(new Event('change'));
      });
    }

    updateRangeButtons('marla');
  }

  // ==================== LOCATION AUTOCOMPLETE ====================

  let allLocations = [];

  async function fetchLocationSuggestions() {
    try {
      const API_BASE = window.API_BASE || "https://api.maharajabuilders.pk/api";
      const response = await fetch(`${API_BASE}/properties/locations`);
      const data = await response.json();
      allLocations = data.locations || [];
    } catch (error) {
      console.error('Error fetching locations:', error);
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
    const suggestions = allLocations.filter(item => item.text.toLowerCase().includes(term));
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
        if (locationInput) locationInput.value = text;
        
        suggestionsContainer.style.display = 'none';
        
        if (type === 'city') {
          const citySelect = document.getElementById('search-city');
          if (citySelect) citySelect.value = value;
        }
      });
    });
  }

  function setupLocationAutocomplete() {
    fetchLocationSuggestions();
    
    const locationInput = document.getElementById('search-location');
    if (!locationInput) return;
    
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
      searchTimeout = setTimeout(() => showLocationSuggestions(value), 300);
    });
    
    document.addEventListener('click', function(e) {
      const container = document.getElementById('location-suggestions');
      if (container && !e.target.closest('.location-input-wrapper')) {
        container.style.display = 'none';
      }
    });
  }

  // ==================== POPULAR LOCATIONS ====================

  document.querySelectorAll('.popular-tab').forEach(tab => {
    tab.addEventListener('click', function() {
      document.querySelectorAll('.popular-tab').forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      const type = this.dataset.type;
      document.getElementById('plots-grid').style.display = 'none';
      document.getElementById('flats-grid').style.display = 'none';
      document.getElementById('houses-grid').style.display = 'none';
      document.getElementById(type + '-grid').style.display = 'grid';
    });
  });

  document.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      const listingType = this.dataset.listing;
      document.querySelectorAll('.location-list a, .city-list a').forEach(link => {
        const href = link.getAttribute('href');
        const newHref = href.replace(/listing_type=\w+/, `listing_type=${listingType}`);
        link.setAttribute('href', newHref);
        const linkText = link.innerHTML;
        link.innerHTML = listingType === 'sale' ? linkText.replace(/rent/g, 'sale') : linkText.replace(/sale/g, 'rent');
      });
    });
  });

  // ==================== RESPONSIVE VIDEO ====================

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
    
    updateVideoSource();
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(updateVideoSource, 250);
    });
  }

  // ==================== DOM CONTENT LOADED HANDLERS ====================

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
        cityPills.forEach(p => p.classList.remove('active'));
        this.classList.add('active');
        Object.values(locationGrids).forEach(grid => { if (grid) grid.style.display = 'none'; });
        const city = this.dataset.city;
        if (locationGrids[city]) locationGrids[city].style.display = 'grid';
      });
    });

    document.querySelectorAll('.filter-tab').forEach(tab => {
      tab.addEventListener('click', function() {
        document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
      });
    });

    document.querySelectorAll('.explore-tab').forEach(tab => {
      tab.addEventListener('click', function() {
        document.querySelectorAll('.explore-tab').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
      });
    });

    const searchBtn = document.getElementById('hero-search-btn');
    if (searchBtn) {
      searchBtn.addEventListener('click', function() {
        const location = document.getElementById('location-search')?.value || '';
        const propertyType = document.getElementById('property-type-filter')?.value || '';
        const activeFilter = document.querySelector('.filter-tab.active')?.dataset.filter || 'rent';
        let listingType = activeFilter === 'rent' ? 'rent' : 'sale';
        const params = new URLSearchParams();
        if (location) params.append('city', location.toLowerCase());
        if (propertyType) params.append('property_type', propertyType);
        params.append('listing_type', listingType);
        window.location.href = `properties.html?${params.toString()}`;
      });
    }
  });

  // ==================== INIT FUNCTION ====================

  function init() {
    setupCityTabs();
    loadLatestProperties();
    loadCurrentAd();
    initResponsiveVideo();
    setupDropdownModals();
    setupModernSearch();
    setupLocationAutocomplete();
    setupActionPopups();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();