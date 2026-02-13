
const API_BASE = window.API_BASE || "https://maharaja-website.onrender.com/api";

const propertyGrid = document.getElementById("properties-grid");
const propertyCount = document.getElementById("properties-count");
const resetBtn = document.getElementById("reset-filters");
const sortSelect = document.getElementById("sort-properties");
const propertyTypeSelect = document.getElementById("property-type");
const cityFilterSelect = document.getElementById("city-filter");
const priceFilterSelect = document.getElementById("price-filter");
const listingFilters = document.querySelectorAll(".listing-filter");
const bedroomFilters = document.querySelectorAll(".bedroom-filter");

let allProperties = [];
let filteredProperties = [];

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
    const imgSrc =
      resolveImageUrl(property.image_url) ||
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
        <a href="property-details?id=${property.id}" class="view-details-btn">
          <i class="fas fa-eye"></i> View Details
        </a>
      </div>`;
    propertyGrid.appendChild(card);
  });

  propertyCount.textContent = filteredProperties.length + " Properties Found";
}

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
    if (propertyType && property.property_type !== propertyType) return false;
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
  (listingFilters || []).forEach((cb) => (cb.checked = false));
  (bedroomFilters || []).forEach((cb) => (cb.checked = false));
  filteredProperties = [...allProperties];
  sortProperties();
  renderProperties();
}

if (propertyTypeSelect) propertyTypeSelect.addEventListener("change", filterProperties);
if (cityFilterSelect) cityFilterSelect.addEventListener("change", filterProperties);
if (priceFilterSelect) priceFilterSelect.addEventListener("change", filterProperties);
if (sortSelect) sortSelect.addEventListener("change", filterProperties);
(listingFilters || []).forEach((cb) => cb.addEventListener("change", filterProperties));
(bedroomFilters || []).forEach((cb) => cb.addEventListener("change", filterProperties));
if (resetBtn) resetBtn.addEventListener("click", resetFilters);

fetch(API_BASE + "/properties")
  .then((r) => r.json())
  .then((data) => {
    allProperties = (data && data.properties) ? data.properties : [];
    filteredProperties = [...allProperties];
    sortProperties();
    renderProperties();
  })
  .catch(() => {
    allProperties = [];
    filteredProperties = [];
    propertyCount.textContent = "0 Properties Found";
    propertyGrid.innerHTML = '<div class="no-results"><i class="fas fa-exclamation-triangle"></i><h3>Could not load properties</h3><p>Please try again later.</p></div>';
  });
