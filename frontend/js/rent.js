
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
  // Build query string with user's selections
  const params = new URLSearchParams();
  
  // Always include listing_type (default to "sale" if not specified, but we have it from selection)
  params.set("listing_type", "rent");
  
  // Add city if selected
  if (selectedCity) {
    // Convert to proper format (islamabad → Islamabad)
    const cityMap = {
      islamabad: "islamabad",
      lahore: "lahore",
      rawalpindi: "rawalpindi",
      karachi: "karachi"
    };
    params.set("city", cityMap[selectedCity] || selectedCity);
  }
  
  // Add area if selected
  if (selectedArea) {
    if (selectedArea === "dha") {
      params.set("area", "DHA");
    } else if (selectedArea === "bahria") {
      params.set("area", "Bahria Town");
    } else if (selectedArea === "other") {
      params.set("area", "Other");
    }
  }
  
  // Redirect to properties page with all filters
  window.location.href = `properties.html?${params.toString()}`;
}

window.onclick = function(event) {
    const modal = document.getElementById('uaeModal');
    if (event.target === modal) {
    closeUaeModal();
    }
};

