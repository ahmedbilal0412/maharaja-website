// DOM Elements
const propertyGrid = document.getElementById("properties-grid");
const propertyCount = document.getElementById("properties-count");
const resetBtn = document.getElementById("reset-filters");
const sortSelect = document.getElementById("sort-properties");
const propertyTypeSelect = document.getElementById("property-type");
const cityFilterSelect = document.getElementById("city-filter");
const priceFilterSelect = document.getElementById("price-filter");
const listingFilters = document.querySelectorAll(".listing-filter");
const bedroomFilters = document.querySelectorAll(".bedroom-filter");
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search');
const suggestionsContainer = document.createElement('div');
suggestionsContainer.className = 'search-suggestions';
searchInput.parentNode.appendChild(suggestionsContainer);

let searchTerm = '';
let showSuggestions = true;

// State
let allProperties = [];
let filteredProperties = [];

// ==================== HELPER FUNCTIONS ====================
// ==================== AUTOCOMPLETE SUGGESTIONS ====================

function getSuggestions(query) {
  if (!query || query.length < 2) return [];

  const term = query.toLowerCase();
  const suggestions = new Set(); // Use Set to avoid duplicates
  
  // Common areas and cities to suggest
  const commonTerms = [
    // Cities
    { text: 'Islamabad', type: 'city', filter: 'city', value: 'islamabad' },
    { text: 'Lahore', type: 'city', filter: 'city', value: 'lahore' },
    { text: 'Karachi', type: 'city', filter: 'city', value: 'karachi' },
    { text: 'Rawalpindi', type: 'city', filter: 'city', value: 'rawalpindi' },
    { text: 'Peshawar', type: 'city', filter: 'city', value: 'peshawar' },
    { text: 'Multan', type: 'city', filter: 'city', value: 'multan' },
    { text: 'Faisalabad', type: 'city', filter: 'city', value: 'faisalabad' },
    { text: 'Quetta', type: 'city', filter: 'city', value: 'quetta' },
    
    // Areas
    { text: 'DHA Islamabad', type: 'area', filter: 'area', value: 'DHA' },
    { text: 'DHA Lahore', type: 'area', filter: 'area', value: 'DHA' },
    { text: 'DHA Karachi', type: 'area', filter: 'area', value: 'DHA' },
    { text: 'DHA Rawalpindi', type: 'area', filter: 'area', value: 'DHA' },
    { text: 'Bahria Town Islamabad', type: 'area', filter: 'area', value: 'Bahria Town' },
    { text: 'Bahria Town Lahore', type: 'area', filter: 'area', value: 'Bahria Town' },
    { text: 'Bahria Town Karachi', type: 'area', filter: 'area', value: 'Bahria Town' },
    { text: 'Bahria Town Rawalpindi', type: 'area', filter: 'area', value: 'Bahria Town' },
    { text: 'Gulberg Lahore', type: 'area', filter: 'area', value: 'Gulberg' },
    { text: 'Clifton Karachi', type: 'area', filter: 'area', value: 'Clifton' },
    { text: 'F-6 Islamabad', type: 'area', filter: 'area', value: 'F-6' },
    { text: 'F-7 Islamabad', type: 'area', filter: 'area', value: 'F-7' },
    { text: 'G-9 Islamabad', type: 'area', filter: 'area', value: 'G-9' },
    { text: 'E-11 Islamabad', type: 'area', filter: 'area', value: 'E-11' },
  ];
  
  // Filter common terms based on query
  commonTerms.forEach(term => {
    if (term.text.toLowerCase().includes(query.toLowerCase())) {
      suggestions.add(JSON.stringify({
        text: term.text,
        type: term.type,
        filter: term.filter,
        value: term.value
      }));
    }
  });
  
  // Also suggest from actual properties in the database
  allProperties.forEach(prop => {
    // Suggest cities from properties
    if (prop.city && prop.city.toLowerCase().includes(term)) {
      suggestions.add(JSON.stringify({
        text: prop.city,
        type: 'city',
        filter: 'city',
        value: prop.city.toLowerCase()
      }));
    }
    
    // Suggest areas from properties
    if (prop.area && prop.area.toLowerCase().includes(term)) {
      suggestions.add(JSON.stringify({
        text: prop.area + (prop.city ? `, ${prop.city}` : ''),
        type: 'area',
        filter: 'area',
        value: prop.area
      }));
    }
    
    // Suggest locations
    if (prop.location && prop.location.toLowerCase().includes(term)) {
      // Only add if it's reasonably short
      if (prop.location.length < 30) {
        suggestions.add(JSON.stringify({
          text: prop.location,
          type: 'location',
          filter: 'location',
          value: prop.location
        }));
      }
    }
  });
  
  // Convert back from Set and limit to 8 suggestions
  return Array.from(suggestions)
    .map(s => JSON.parse(s))
    .slice(0, 8);
}

function showSuggestionsDropdown(query) {
  if (!showSuggestions) return;
  
  const suggestions = getSuggestions(query);
  
  if (suggestions.length === 0) {
    suggestionsContainer.style.display = 'none';
    return;
  }
  
  suggestionsContainer.innerHTML = suggestions.map(s => `
    <div class="suggestion-item" data-filter="${s.filter}" data-value="${s.value}" data-text="${s.text}">
      <i class="fas fa-${s.type === 'city' ? 'city' : s.type === 'area' ? 'map-marker-alt' : 'map-pin'}"></i>
      <span>${s.text}</span>
      <small>${s.type}</small>
    </div>
  `).join('');
  
  suggestionsContainer.style.display = 'block';
  
  // Add click handlers to suggestions
  suggestionsContainer.querySelectorAll('.suggestion-item').forEach(item => {
    item.addEventListener('click', function() {
      const filter = this.dataset.filter;
      const value = this.dataset.value;
      const text = this.dataset.text;
      
      // Apply the filter
      if (filter === 'city' && cityFilterSelect) {
        cityFilterSelect.value = value;
      } else if (filter === 'area') {
        // For area, we might want to also set city filter
        // This is simplified - you could enhance this
        searchInput.value = text;
        searchTerm = text;
      }
      
      // Clear suggestions
      suggestionsContainer.style.display = 'none';
      
      // Trigger filter
      filterProperties();
    });
  });
}

// ==================== SEARCH FUNCTION ====================

function filterBySearch(property) {
  if (!searchTerm) return true;
  
  const term = searchTerm.toLowerCase();
  const searchableFields = [
    property.title || '',
    property.location || '',
    property.city || '',
    property.area || ''
  ];
  
  return searchableFields.some(field => 
    field.toLowerCase().includes(term)
  );
}

function formatPrice(price, listingType) {
  if (listingType === "rent") return "PKR " + Number(price).toLocaleString() + "/month";
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

// ==================== FILTER & SORT FUNCTIONS ====================

function filterProperties() {
  const propertyType = propertyTypeSelect ? propertyTypeSelect.value : "";
  const city = cityFilterSelect ? cityFilterSelect.value : "";
  const priceRange = priceFilterSelect ? priceFilterSelect.value : "";

  const activeListingTypes = Array.from(listingFilters || [])
    .filter((cb) => cb.checked)
    .map((cb) => cb.value);
  const activeBedrooms = Array.from(bedroomFilters || [])
    .filter((cb) => cb.checked)
    .map((cb) => cb.value);

  filteredProperties = allProperties.filter((property) => {
    // search filter
    if (!filterBySearch(property)) return false;
    // Property type filter
    if (propertyType && property.property_type !== propertyType) return false;

    // City filter
    const cityVal = (property.city || "").toLowerCase();
    if (city && cityVal.indexOf(city.toLowerCase()) < 0) return false;

    // Listing type filter (sale/rent)
    if (activeListingTypes.length > 0 && !activeListingTypes.includes(property.listing_type)) return false;

    // Bedrooms filter
    if (activeBedrooms.length > 0) {
      const beds = property.bedrooms || 0;
      if (activeBedrooms.includes("4") && beds < 4) return false;
      if (!activeBedrooms.includes("4") && !activeBedrooms.includes(String(beds))) return false;
    }

    // Price range filter
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
    case "newest":
    default:
      filteredProperties.sort((a, b) => {
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
  if (searchInput) searchInput.value = "";
  searchTerm = "";
  (listingFilters || []).forEach((cb) => (cb.checked = false));
  (bedroomFilters || []).forEach((cb) => (cb.checked = false));

  filteredProperties = [...allProperties];
  sortProperties();
  renderProperties();

  if (clearSearchBtn) {
    clearSearchBtn.style.display = 'none';
  }
}

// ==================== URL PARAMETER HANDLING ====================

function applyFiltersFromURL() {
  const urlParams = new URLSearchParams(window.location.search);

  const cityParam = urlParams.get('city');
  const areaParam = urlParams.get('area');      // Not directly used yet
  const listingTypeParam = urlParams.get('listing_type');
  const propertyTypeParam = urlParams.get('property_type');

  console.log("📋 URL Parameters received:", {
    city: cityParam,
    area: areaParam,
    listing_type: listingTypeParam,
    property_type: propertyTypeParam
  });
  
  // Apply city filter
  if (cityParam && cityFilterSelect) {
    cityFilterSelect.value = cityParam;
  }

  // Apply listing type filter (sale/rent)
  if (listingTypeParam && listingFilters) {
    listingFilters.forEach(cb => {
      if (cb.value === listingTypeParam) cb.checked = true;
    });
  }

  // Apply property type filter
  if (propertyTypeParam && propertyTypeSelect) {
    propertyTypeSelect.value = propertyTypeParam;
  }
}

// ==================== RENDER FUNCTION ====================

function renderProperties() {
  propertyGrid.innerHTML = "";

  if (filteredProperties.length === 0) {
    propertyGrid.innerHTML = `
      <div class="no-results">
        <i class="fas fa-search"></i>
        <h3>No Properties Found</h3>
        <p>Try adjusting your filters or check back later.</p>
      </div>`;
    propertyCount.textContent = "0 Properties Found";
    return;
  }

  filteredProperties.forEach((property) => {
    const card = document.createElement("div");
    card.classList.add("property-card");

    const isForRent = property.listing_type === "rent";
    const priceText = isForRent ? formatPrice(property.price, "rent") : formatPrice(property.price, "sale");
    const tagText = isForRent ? "FOR RENT" : "FOR SALE";

    const imgSrc = resolveImageUrl(property.image_url) ||
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80";

    const areaStr = (property.size_sqft || 0) + " sq ft";

    card.innerHTML = `
      <div class="card-top">
        <span class="property-tag">${tagText}</span>
        <img src="${imgSrc.replace(/"/g, "&quot;")}" alt="${(property.title || "").replace(/"/g, "&quot;")}" class="property-img">
      </div>
      <div class="property-info">
        <h3>${(property.title || "").replace(/</g, "&lt;")}</h3>
        <div class="property-location">
          <i class="fas fa-map-marker-alt"></i>
          <span>${(property.location || "").replace(/</g, "&lt;")}</span>
        </div>
        <div class="property-features">
          <div class="feature"><i class="fas fa-bed"></i><span>${property.bedrooms || 0} Bed</span></div>
          <div class="feature"><i class="fas fa-bath"></i><span>${property.bathrooms || 0} Bath</span></div>
          <div class="feature"><i class="fas fa-ruler-combined"></i><span>${areaStr}</span></div>
        </div>
        <div class="price">${priceText}</div>
        <a href="property-details.html?id=${property.id}" class="view-details-btn">
          <i class="fas fa-eye"></i> View Details
        </a>
      </div>`;

    propertyGrid.appendChild(card);
  });

  propertyCount.textContent = filteredProperties.length + " Properties Found";
}

// ==================== EVENT LISTENERS ====================

if (propertyTypeSelect) propertyTypeSelect.addEventListener("change", filterProperties);
if (cityFilterSelect) cityFilterSelect.addEventListener("change", filterProperties);
if (priceFilterSelect) priceFilterSelect.addEventListener("change", filterProperties);
if (sortSelect) sortSelect.addEventListener("change", filterProperties);
(listingFilters || []).forEach((cb) => cb.addEventListener("change", filterProperties));
(bedroomFilters || []).forEach((cb) => cb.addEventListener("change", filterProperties));
if (resetBtn) resetBtn.addEventListener("click", resetFilters);

// ==================== SEARCH EVENT LISTENERS ====================

if (searchInput) {
  // Debounce search to avoid too many updates while typing
  let searchTimeout;
  
  searchInput.addEventListener('input', function() {
    const value = this.value.trim();
    
    // Show suggestions
    if (value.length >= 2) {
      showSuggestionsDropdown(value);
    } else {
      suggestionsContainer.style.display = 'none';
    }
    
    // Debounce the actual search
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      searchTerm = value;
      filterProperties();

    }, 300);
  });
  
  // Hide suggestions when clicking outside
  document.addEventListener('click', function(e) {
    if (!searchInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
      suggestionsContainer.style.display = 'none';
    }
  });
  
  // Handle keyboard navigation in suggestions
  searchInput.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const firstSuggestion = suggestionsContainer.querySelector('.suggestion-item');
      if (firstSuggestion) firstSuggestion.focus();
    } else if (e.key === 'Escape') {
      suggestionsContainer.style.display = 'none';
    }
  });
}

if (clearSearchBtn) {
  clearSearchBtn.addEventListener('click', function() {
    if (searchInput) {
      searchInput.value = '';
      searchTerm = '';
      suggestionsContainer.style.display = 'none';
      filterProperties();
    }
  });
}

// ==================== INITIAL DATA LOAD ====================

fetch(API_BASE + "/properties")
  .then((r) => r.json())
  .then((data) => {
    allProperties = (data && data.properties) ? data.properties : [];
    
    applyFiltersFromURL();    
    filterProperties(); 
    
  })
  .catch(() => {
    allProperties = [];
    filteredProperties = [];
    propertyCount.textContent = "0 Properties Found";
    propertyGrid.innerHTML = `
      <div class="no-results">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Could not load properties</h3>
        <p>Please try again later.</p>
      </div>`;
  });