// ==================== DOM ELEMENTS ====================

const propertyGrid = document.getElementById("properties-grid");
const propertyCount = document.getElementById("properties-count-header");
const resetBtn = document.getElementById("reset-filters");
const sortSelect = document.getElementById("sort-properties");
const priceFilterSelect = document.getElementById("price-filter");
const searchInput = document.getElementById('search-input');
const propertyTypeFilters = document.querySelectorAll('.filter-option input[type="checkbox"]');
const listingTypeRadios = document.querySelectorAll('input[name="listing-type"]');
const propertyTypeSelect = document.getElementById("property-type");
const cityFilterSelect = document.getElementById("city-filter");
const listingFilters = document.querySelectorAll(".listing-filter");
const bedroomFilters = document.querySelectorAll(".bedroom-filter");
const clearSearchBtn = document.getElementById('clear-search');

// Create suggestions container
const suggestionsContainer = document.createElement('div');
suggestionsContainer.className = 'search-suggestions';
if (searchInput && searchInput.parentNode) {
  searchInput.parentNode.appendChild(suggestionsContainer);
}

// ==================== STATE ====================

let allProperties = [];
let filteredProperties = [];
let searchTerm = '';
let showSuggestions = true;
let allLocations = [];

// ==================== HELPER FUNCTIONS ====================

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

function formatPrice(price, listingType) {
  if (listingType === "rent") return "PKR " + Number(price).toLocaleString() + "/month";
  if (price >= 1e7) return "PKR " + (price / 1e7).toFixed(1) + " Crore";
  if (price >= 1e5) return "PKR " + (price / 1e5).toFixed(1) + " Lakh";
  return "PKR " + Number(price).toLocaleString();
}

function formatPriceCompact(price) {
  if (price >= 1e7) return (price / 1e7).toFixed(1) + 'Cr';
  if (price >= 1e5) return (price / 1e5).toFixed(1) + 'L';
  if (price >= 1e3) return (price / 1e3).toFixed(0) + 'K';
  return price.toString();
}

function resolveImageUrl(url) {
  if (!url) return null;

  if (url.indexOf("http://") === 0 || url.indexOf("https://") === 0) return url;

  const imageBaseUrl = window.location.hostname === 'localhost'
    ? 'http://localhost:5000'
    : 'https://api.maharajabuilders.pk';

  if (url.startsWith('/api/')) return imageBaseUrl + url;

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
    if (!apiRoot || apiRoot.includes('localhost')) return imageBaseUrl + url;
    return apiRoot + url;
  }

  if (!url.startsWith('/')) {
    return `${imageBaseUrl}/api/properties/uploads/properties/${url}`;
  }

  return url;
}

function filterBySearch(property) {
  if (!searchTerm) return true;
  const term = searchTerm.toLowerCase();
  const searchableFields = [
    property.title || '',
    property.location || '',
    property.city || '',
    property.area || ''
  ];
  return searchableFields.some(field => field.toLowerCase().includes(term));
}

// ==================== LOCATION AUTOCOMPLETE ====================

async function fetchLocationSuggestions() {
  try {
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
    const container = document.getElementById('search-suggestions');
    if (container) container.style.display = 'none';
    return;
  }

  const term = query.toLowerCase();
  const suggestions = allLocations.filter(item => 
    item.text.toLowerCase().includes(term)
  );

  const suggestionsContainer = document.getElementById('search-suggestions');
  
  if (suggestions.length === 0) {
    suggestionsContainer.style.display = 'none';
    return;
  }

  suggestionsContainer.innerHTML = suggestions.slice(0, 8).map(s => `
    <div class="suggestion-item" data-type="${s.type}" data-value="${s.value}" data-text="${s.text}">
      <i class="fas fa-${s.type === 'city' ? 'city' : 'map-marker-alt'}"></i>
      <span>${escapeHtml(s.text)}</span>
      <small>${s.type}</small>
    </div>
  `).join('');

  suggestionsContainer.style.display = 'block';

  suggestionsContainer.querySelectorAll('.suggestion-item').forEach(item => {
    item.addEventListener('click', function() {
      const text = this.dataset.text;
      const value = this.dataset.value;
      const type = this.dataset.type;
      
      if (searchInput) {
        searchInput.value = text;
        searchTerm = text;
      }
      
      suggestionsContainer.style.display = 'none';
      
      if (type === 'city' && cityFilterSelect) {
        cityFilterSelect.value = value;
      }
      
      filterProperties();
    });
  });
}

function setupLocationAutocomplete() {
  fetchLocationSuggestions();
  
  if (!searchInput) return;
  
  let searchTimeout;
  
  const newSearchInput = searchInput.cloneNode(true);
  searchInput.parentNode.replaceChild(newSearchInput, searchInput);
  
  const updatedSearchInput = document.getElementById('search-input');
  
  if (updatedSearchInput) {
    updatedSearchInput.addEventListener('input', function() {
      const value = this.value.trim();
      
      clearTimeout(searchTimeout);
      if (value.length >= 2) {
        searchTimeout = setTimeout(() => {
          showLocationSuggestions(value);
        }, 300);
      } else {
        const container = document.getElementById('search-suggestions');
        if (container) container.style.display = 'none';
        searchTerm = value;
        filterProperties();
      }
    });
  }
}

// ==================== SUGGESTIONS DROPDOWN ====================

function showSuggestionsDropdown(query) {
  if (!showSuggestions || !suggestionsContainer) return;

  const term = query.toLowerCase();
  const suggestions = allLocations.filter(item => 
    item.text.toLowerCase().includes(term)
  );
  
  if (suggestions.length === 0) {
    suggestionsContainer.style.display = 'none';
    return;
  }

  suggestionsContainer.innerHTML = suggestions.slice(0, 8).map(s => `
    <div class="suggestion-item" data-filter="${s.type === 'city' ? 'city' : 'area'}" data-value="${s.value}" data-text="${s.text}">
      <i class="fas fa-${s.type === 'city' ? 'city' : 'map-marker-alt'}"></i>
      <span>${s.text}</span>
      <small>${s.type}</small>
    </div>
  `).join('');
  
  suggestionsContainer.style.display = 'block';
  
  suggestionsContainer.querySelectorAll('.suggestion-item').forEach(item => {
    item.addEventListener('click', function() {
      const filter = this.dataset.filter;
      const value = this.dataset.value;
      const text = this.dataset.text;
      
      if (filter === 'city' && cityFilterSelect) {
        cityFilterSelect.value = value;
        searchInput.value = text;
        searchTerm = text;
      } else {
        searchInput.value = text;
        searchTerm = text;
      }
      
      suggestionsContainer.style.display = 'none';
      filterProperties();
    });
  });
}

// ==================== FILTER & SORT ====================

function filterProperties() {
  const propertyType = propertyTypeSelect ? propertyTypeSelect.value : "";
  const city = cityFilterSelect ? cityFilterSelect.value : "";
  const priceRange = priceFilterSelect ? priceFilterSelect.value : "";
  let selectedListingType = 'sale';
  
  listingTypeRadios.forEach(radio => {
    if (radio.checked) selectedListingType = radio.value;
  });

  const activeListingTypes = Array.from(listingFilters || [])
    .filter((cb) => cb.checked)
    .map((cb) => cb.value);
  const activeBedrooms = Array.from(bedroomFilters || [])
    .filter((cb) => cb.checked)
    .map((cb) => cb.value);
  const selectedTypes = Array.from(propertyTypeFilters || [])
    .filter(cb => cb.checked)
    .map(cb => cb.value);

  filteredProperties = allProperties.filter((property) => {
    if (property.listing_type !== selectedListingType) return false;
    if (!filterBySearch(property)) return false;
    if (propertyType && property.property_type !== propertyType) return false;
    if (selectedTypes.length > 0 && !selectedTypes.includes(property.property_type)) return false;

    const cityVal = (property.city || "").toLowerCase();
    if (city && cityVal.indexOf(city.toLowerCase()) < 0) return false;

    if (activeListingTypes.length > 0 && !activeListingTypes.includes(property.listing_type)) return false;

    if (activeBedrooms.length > 0) {
      const beds = property.bedrooms || 0;
      if (activeBedrooms.includes("4") && beds < 4) return false;
      if (!activeBedrooms.includes("4") && !activeBedrooms.includes(String(beds))) return false;
    }

    if (priceRange) {
      if (priceRange === "100000000+") {
        if (property.price < 100000000) return false;
      } else {
        const [min, max] = priceRange.split("-").map(Number);
        if (property.price < min || property.price > max) return false;
      }
    }

    return true;
  });

  sortProperties();
  renderProperties();
}

function sortProperties() {
  const sortBy = sortSelect ? sortSelect.value : "newest";
  
  switch (sortBy) {
    case "price-low":
      filteredProperties.sort((a, b) => a.price - b.price);
      break;
    case "price-high":
      filteredProperties.sort((a, b) => b.price - a.price);
      break;
    case "bedrooms":
      filteredProperties.sort((a, b) => (b.bedrooms || 0) - (a.bedrooms || 0));
      break;
    default:
      filteredProperties.sort((a, b) => {
        const aPremium = a.is_premium && a.is_premium_active === true ? 0 : 1;
        const bPremium = b.is_premium && b.is_premium_active === true ? 0 : 1;
        if (aPremium !== bPremium) return aPremium - bPremium;
        const da = a.created_at ? new Date(a.created_at).getTime() : 0;
        const db = b.created_at ? new Date(b.created_at).getTime() : 0;
        return db - da;
      });
      break;
  }
}

function resetFilters() {
  if (propertyTypeSelect) propertyTypeSelect.value = "";
  if (cityFilterSelect) cityFilterSelect.value = "";
  if (priceFilterSelect) priceFilterSelect.value = "";
  if (sortSelect) sortSelect.value = "newest";
  document.querySelector('input[name="listing-type"][value="sale"]').checked = true;
  
  if (searchInput) searchInput.value = "";
  searchTerm = "";
  
  (listingFilters || []).forEach((cb) => (cb.checked = false));
  (bedroomFilters || []).forEach((cb) => (cb.checked = false));
  propertyTypeFilters.forEach(cb => cb.checked = false);

  if (suggestionsContainer) suggestionsContainer.style.display = 'none';

  filteredProperties = [...allProperties];
  sortProperties();
  renderProperties();

  if (clearSearchBtn) clearSearchBtn.style.display = 'none';
}

// ==================== URL PARAMETER HANDLING ====================

function applyFiltersFromURL() {
  const urlParams = new URLSearchParams(window.location.search);

  const cityParam = urlParams.get('city');
  const listingTypeParam = urlParams.get('listing_type');
  const propertyTypeParam = urlParams.get('property_type');

  if (cityParam && cityFilterSelect) cityFilterSelect.value = cityParam;
  if (listingTypeParam && listingFilters) {
    listingFilters.forEach(cb => {
      if (cb.value === listingTypeParam) cb.checked = true;
    });
  }
  if (propertyTypeParam && propertyTypeSelect) propertyTypeSelect.value = propertyTypeParam;
  
  if (cityParam && searchInput) {
    const cityNames = {
      islamabad: 'Islamabad', lahore: 'Lahore', karachi: 'Karachi',
      rawalpindi: 'Rawalpindi', peshawar: 'Peshawar', faisalabad: 'Faisalabad',
      multan: 'Multan', quetta: 'Quetta'
    };
    searchInput.value = cityNames[cityParam] || cityParam;
    searchTerm = searchInput.value;
  }
}

// ==================== RENDER ====================

function renderProperties() {
  propertyGrid.innerHTML = "";

  if (filteredProperties.length === 0) {
    propertyGrid.innerHTML = `
      <div class="no-results">
        <i class="fas fa-home"></i>
        <h3>No Properties Found</h3>
        <p>Try adjusting your filters</p>
      </div>`;
    propertyCount.textContent = "0 properties";
    return;
  }

  filteredProperties.forEach((property) => {
    const card = document.createElement("div");
    card.classList.add("property-card");

    const compactPrice = formatPriceCompact(property.price);
    
    let tagClass = 'property-tag';
    let tagText = property.listing_type === 'rent' ? 'FOR RENT' : 'FOR SALE';
    const isPremiumActive = property.is_premium && property.is_premium_active === true;
    
    if (isPremiumActive) {
      tagClass += ' premium premium-badge';
      tagText = '⭐ PREMIUM';
    } else if (property.area === 'DHA' || property.area === 'Bahria Town') {
      tagClass += ' premium';
      tagText = 'PREMIUM AREA';
    }

    const imgSrc = resolveImageUrl(property.image_url) ||
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80";

    card.innerHTML = `
      <div class="card-top">
        <span class="${tagClass}">${tagText}</span>
        <img src="${imgSrc.replace(/"/g, "&quot;")}" alt="${(property.title || "").replace(/"/g, "&quot;")}" class="property-img">
      </div>
      <div class="property-info">
        <h3>${(property.title || "").replace(/</g, "&lt;")}</h3>
        <div class="property-location">
          <i class="fas fa-map-marker-alt"></i>
          <span>${(property.location || "").replace(/</g, "&lt;")}</span>
        </div>
        <div class="property-features">
          <div class="feature"><i class="fas fa-bed"></i><span>${property.bedrooms || 0}</span></div>
          <div class="feature"><i class="fas fa-bath"></i><span>${property.bathrooms || 0}</span></div>
          <div class="feature"><i class="fas fa-ruler-combined"></i><span>${property.size_sqft || 0} sqft</span></div>
        </div>
        <div class="price">${compactPrice}</div>
        <a href="property-details.html?id=${property.id}" class="view-details-btn">View Details</a>
      </div>`;

    propertyGrid.appendChild(card);
  });

  propertyCount.textContent = filteredProperties.length.toLocaleString() + " properties";
}

// ==================== EVENT LISTENERS ====================

if (propertyTypeSelect) propertyTypeSelect.addEventListener("change", filterProperties);
if (cityFilterSelect) cityFilterSelect.addEventListener("change", filterProperties);
if (priceFilterSelect) priceFilterSelect.addEventListener("change", filterProperties);
if (sortSelect) sortSelect.addEventListener("change", filterProperties);
(listingFilters || []).forEach((cb) => cb.addEventListener("change", filterProperties));
(bedroomFilters || []).forEach((cb) => cb.addEventListener("change", filterProperties));
propertyTypeFilters.forEach(cb => cb.addEventListener("change", filterProperties));
if (resetBtn) resetBtn.addEventListener("click", resetFilters);
listingTypeRadios.forEach(radio => radio.addEventListener("change", filterProperties));

// Search event listeners
if (searchInput) {
  let searchTimeout;
  
  searchInput.addEventListener('input', function() {
    const value = this.value.trim();
    
    if (value.length >= 2) {
      showSuggestionsDropdown(value);
    } else {
      if (suggestionsContainer) suggestionsContainer.style.display = 'none';
    }
    
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      searchTerm = value;
      filterProperties();
    }, 300);
  });
  
  document.addEventListener('click', function(e) {
    if (suggestionsContainer && 
        !searchInput.contains(e.target) && 
        !suggestionsContainer.contains(e.target)) {
      suggestionsContainer.style.display = 'none';
    }
  });
  
  searchInput.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const firstSuggestion = suggestionsContainer?.querySelector('.suggestion-item');
      if (firstSuggestion) firstSuggestion.focus();
    } else if (e.key === 'Escape') {
      if (suggestionsContainer) suggestionsContainer.style.display = 'none';
    }
  });
}

if (clearSearchBtn) {
  clearSearchBtn.addEventListener('click', function() {
    if (searchInput) {
      searchInput.value = '';
      searchTerm = '';
      if (suggestionsContainer) suggestionsContainer.style.display = 'none';
      filterProperties();
    }
  });
}

// ==================== VIEW TOGGLE ====================

const gridViewBtn = document.getElementById('grid-view-btn');
const columnViewBtn = document.getElementById('column-view-btn');
const propertiesGrid = document.getElementById('properties-grid');

if (gridViewBtn) {
  gridViewBtn.addEventListener('click', function() {
    gridViewBtn.classList.add('active');
    columnViewBtn.classList.remove('active');
    propertiesGrid.classList.remove('column-view');
    propertiesGrid.classList.add('grid-view');
    localStorage.setItem('property-view-preference', 'grid');
  });
}

if (columnViewBtn) {
  columnViewBtn.addEventListener('click', function() {
    columnViewBtn.classList.add('active');
    gridViewBtn.classList.remove('active');
    propertiesGrid.classList.remove('grid-view');
    propertiesGrid.classList.add('column-view');
    localStorage.setItem('property-view-preference', 'column');
  });
}

document.addEventListener('DOMContentLoaded', function() {
  const savedPreference = localStorage.getItem('property-view-preference');
  if (savedPreference === 'column') {
    columnViewBtn.click();
  } else {
    if (gridViewBtn) gridViewBtn.click();
  }
});

document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', function() {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    this.classList.add('active');
  });
});

// ==================== INITIAL DATA LOAD ====================

fetchLocationSuggestions().then(() => {
  setupLocationAutocomplete();
  fetch(API_BASE + "/properties")
    .then((r) => r.json())
    .then((data) => {
      allProperties = (data && data.properties) ? data.properties : [];
      filteredProperties = [...allProperties];
      applyFiltersFromURL();
      sortProperties();
      renderProperties();
    })
    .catch(() => {
      allProperties = [];
      filteredProperties = [];
      propertyCount.textContent = "0 properties";
      propertyGrid.innerHTML = `
        <div class="no-results">
          <i class="fas fa-exclamation-triangle"></i>
          <h3>Could not load properties</h3>
          <p>Please try again later.</p>
        </div>`;
    });
});