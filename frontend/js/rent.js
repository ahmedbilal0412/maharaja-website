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
        : 'https://api.maharajabuilders.pk';
    
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
  
  // AUTO MOVE TO NEXT STEP after selecting city
  goToNextStep();
}

function selectArea(area) {
  selectedArea = area;
  document.querySelectorAll("#areaOptions .option-card").forEach((c) => c.classList.remove("selected"));
  const card = document.querySelector('[data-area="' + area + '"]');
  if (card) card.classList.add("selected");
  
  // AUTO SHOW PROPERTIES after selecting area
  showProperties();
}

function goToNextStep() {
  if (currentStep === 1 && selectedCity) {
    document.getElementById("cityStep").style.display = "none";
    document.getElementById("areaStep").style.display = "block";
    document.getElementById("backButton").style.display = "inline-block";
    document.getElementById("selectedCityText").textContent = "Selected City: " + (cityNames[selectedCity] || selectedCity);
    selectedArea = "";
    document.querySelectorAll("#areaOptions .option-card").forEach((c) => c.classList.remove("selected"));
    currentStep = 2;
  }
}

function goBack() {
  if (currentStep === 2) {
    document.getElementById("cityStep").style.display = "block";
    document.getElementById("areaStep").style.display = "none";
    document.getElementById("backButton").style.display = "none";
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
  
  params.set("listing_type", "rent");
  
  // Add city if selected
  if (selectedCity) {
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