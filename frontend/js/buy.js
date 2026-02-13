
function openUaeModal() {
  document.getElementById("uaeModal").style.display = "block";
  document.body.style.overflow = "hidden";
}
function closeUaeModal() {
  document.getElementById("uaeModal").style.display = "none";
  document.body.style.overflow = "auto";
}

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

let selectedCity = "";
let selectedArea = "";
let currentStep = 1;

const cityNames = { islamabad: "Islamabad", lahore: "Lahore", rawalpindi: "Rawalpindi", karachi: "Karachi" };
const areaNames = { dha: "DHA", bahria: "Bahria Town", other: "Other Properties" };

function showPakistanSelection() {
  document.querySelector(".country-cards-section").style.display = "none";
  document.getElementById("pakistanSelection").style.display = "block";
  document.getElementById("propertiesDisplay").style.display = "none";
  resetSelections();
  document.getElementById("pakistanSelection").scrollIntoView({ behavior: "smooth" });
}

function selectCity(city) {
  selectedCity = city;
  document.querySelectorAll("#cityOptions .option-card").forEach((c) => c.classList.remove("selected"));
  const card = document.querySelector('[data-city="' + city + '"]');
  if (card) card.classList.add("selected");
  document.getElementById("nextButton").disabled = false;
}

function selectArea(area) {
  selectedArea = area;
  document.querySelectorAll("#areaOptions .option-card").forEach((c) => c.classList.remove("selected"));
  const card = document.querySelector('[data-area="' + area + '"]');
  if (card) card.classList.add("selected");
  document.getElementById("nextButton").disabled = false;
}

function goToNextStep() {
  if (currentStep === 1 && selectedCity) {
    document.getElementById("cityStep").style.display = "none";
    document.getElementById("areaStep").style.display = "block";
    document.getElementById("backButton").style.display = "inline-block";
    document.getElementById("selectedCityText").textContent = "Selected City: " + (cityNames[selectedCity] || selectedCity);
    selectedArea = "";
    document.querySelectorAll("#areaOptions .option-card").forEach((c) => c.classList.remove("selected"));
    document.getElementById("nextButton").innerHTML = 'Show Properties <i class="fas fa-home"></i>';
    document.getElementById("nextButton").disabled = true;
    currentStep = 2;
  } else if (currentStep === 2 && selectedArea) {
    showProperties();
  }
}

function goBack() {
  if (currentStep === 2) {
    document.getElementById("cityStep").style.display = "block";
    document.getElementById("areaStep").style.display = "none";
    document.getElementById("backButton").style.display = "none";
    document.getElementById("nextButton").innerHTML = 'Continue <i class="fas fa-arrow-right"></i>';
    document.getElementById("nextButton").disabled = selectedCity !== "";
    currentStep = 1;
  }
}

function goBackToSelection() {
  document.getElementById("propertiesDisplay").style.display = "none";
  document.getElementById("pakistanSelection").style.display = "block";
  document.getElementById("cityStep").style.display = "block";
  document.getElementById("areaStep").style.display = "none";
  document.getElementById("backButton").style.display = "none";
  resetSelections();
  document.getElementById("pakistanSelection").scrollIntoView({ behavior: "smooth" });
}

function resetSelections() {
  selectedCity = "";
  selectedArea = "";
  currentStep = 1;
  document.querySelectorAll(".option-card").forEach((c) => c.classList.remove("selected"));
  document.getElementById("nextButton").innerHTML = 'Continue <i class="fas fa-arrow-right"></i>';
  document.getElementById("nextButton").disabled = true;
  document.getElementById("backButton").style.display = "none";
}

function formatPrice(price, listingType) {
  if (listingType === "rent") return "PKR " + Number(price).toLocaleString() + "/mo";
  if (price >= 1e7) return "PKR " + (price / 1e7).toFixed(1) + " Crore";
  return "PKR " + Number(price).toLocaleString();
}

function showProperties() {
  document.getElementById("pakistanSelection").style.display = "none";
  document.getElementById("propertiesDisplay").style.display = "block";
  const container = document.querySelector("#propertiesDisplay .properties-container");
  container.innerHTML = "<p class=\"loading-properties\">Loading properties…</p>";

  const params = new URLSearchParams();
  params.set("listing_type", "sale");
  if (selectedCity) params.set("city", selectedCity);
  if (selectedArea) {
    if (selectedArea === "dha") params.set("area", "DHA");
    else if (selectedArea === "bahria") params.set("area", "Bahria");
    else params.set("area", "Other");
  }

  fetch(API_BASE + "/properties?" + params.toString())
    .then((r) => r.json())
    .then((data) => {
      const list = (data && data.properties) ? data.properties : [];
      container.innerHTML = "";

      const titleContainer = document.createElement("div");
      titleContainer.className = "title-container";
      const title = document.createElement("h2");
      title.className = "properties-title";
      title.textContent = "Properties in " + (cityNames[selectedCity] || selectedCity) + " – " + (areaNames[selectedArea] || selectedArea);
      const subtitle = document.createElement("p");
      subtitle.className = "properties-subtitle";
      const cardContainer = document.createElement("div");
      cardContainer.className = "card-container";
      subtitle.textContent = list.length + " propert" + (list.length === 1 ? "y" : "ies") + " found.";
      container.appendChild(titleContainer);
      titleContainer.appendChild(title);
      titleContainer.appendChild(subtitle);
      container.appendChild(cardContainer);

      if (list.length === 0) {
        const empty = document.createElement("p");
        empty.className = "no-properties";
        empty.textContent = "No properties match your selection. Try a different city or area.";
        titleContainer.appendChild(empty);
      } else {
        list.forEach((p) => {
          const card = document.createElement("div");
          card.className = "property-card";
          const imgSrc =
            resolveImageUrl(p.image_url) ||
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80";
          card.innerHTML = `
            <div class="property-image">
                <img src="${imgSrc.replace(/"/g, '&quot;')}" alt="">
            </div>
            <div class="property-content">
                <h3 class="property-title">${(p.title || "").replace(/</g, "&lt;")}</h3>
                <div class="property-location">
                    <i class="fas fa-map-marker-alt"></i> ${(p.location || "").replace(/</g, "&lt;")}
                </div>
                <div class="property-features">
                    <div class="property-feature">
                        <div class="feature-icon"><i class="fas fa-bed"></i></div>
                        <div class="feature-value">${p.bedrooms || 0}</div>
                        <div class="feature-label">Bedrooms</div>
                    </div>
                    <div class="property-feature">
                        <div class="feature-icon"><i class="fas fa-bath"></i></div>
                        <div class="feature-value">${p.bathrooms || 0}</div>
                        <div class="feature-label">Bathrooms</div>
                    </div>
                    <div class="property-feature">
                        <div class="feature-icon"><i class="fas fa-ruler-combined"></i></div>
                        <div class="feature-value">${p.size_sqft || 0}</div>
                        <div class="feature-label">Sq Ft</div>
                    </div>
                </div>
                <div class="property-price">${formatPrice(p.price, p.listing_type)}</div>
                <a href="property-details?id=${p.id}" class="property-button">
                    <i class="fas fa-eye"></i> View Details
                </a>
            </div>
        `;
          cardContainer.appendChild(card);
        });
      }

      document.getElementById("propertiesDisplay").scrollIntoView({ behavior: "smooth" });
    })
    .catch(() => {
      container.innerHTML = "<p class=\"no-properties\">Unable to load properties. Please try again.</p>";
    });
}

window.onclick = function(event) {
    const modal = document.getElementById('uaeModal');
    if (event.target === modal) {
    closeUaeModal();
    }
};

