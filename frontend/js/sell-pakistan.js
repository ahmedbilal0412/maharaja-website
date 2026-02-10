// Property data for different cities
const propertyData = {
    islamabad: [
    {
        id: 1,
        title: "Modern Villa in DHA Phase 2",
        location: "DHA Phase 2, Islamabad",
        price: "PKR 45,000,000",
        type: "villa",
        bedrooms: 4,
        bathrooms: 4,
        area: "3,500 sq.ft",
        image: "https://i.pinimg.com/736x/c4/ee/a4/c4eea4906647b7c01cc0e9f98862f9ce.jpg",
        featured: true
    },
    {
        id: 2,
        title: "Luxury Apartment in E-11",
        location: "E-11, Islamabad",
        price: "PKR 28,000,000",
        type: "apartment",
        bedrooms: 3,
        bathrooms: 3,
        area: "2,200 sq.ft",
        image: "https://i.pinimg.com/736x/c4/ee/a4/c4eea4906647b7c01cc0e9f98862f9ce.jpg"
    },
    {
        id: 3,
        title: "Premium Plot in Bahria Town",
        location: "Bahria Town, Islamabad",
        price: "PKR 12,500,000",
        type: "plot",
        area: "500 sq.yd",
        image: "https://i.pinimg.com/736x/c4/ee/a4/c4eea4906647b7c01cc0e9f98862f9ce.jpg"
    },
    {
        id: 4,
        title: "Family House in F-8",
        location: "F-8, Islamabad",
        price: "PKR 85,000,000",
        type: "house",
        bedrooms: 5,
        bathrooms: 5,
        area: "4,800 sq.ft",
        image: "https://i.pinimg.com/736x/c4/ee/a4/c4eea4906647b7c01cc0e9f98862f9ce.jpg",
        featured: true
    },
    {
        id: 5,
        title: "Commercial Space in Blue Area",
        location: "Blue Area, Islamabad",
        price: "PKR 120,000,000",
        type: "commercial",
        area: "5,000 sq.ft",
        image: "https://i.pinimg.com/736x/c4/ee/a4/c4eea4906647b7c01cc0e9f98862f9ce.jpg"
    },
    {
        id: 6,
        title: "Modern Apartment in G-11",
        location: "G-11, Islamabad",
        price: "PKR 22,000,000",
        type: "apartment",
        bedrooms: 2,
        bathrooms: 2,
        area: "1,800 sq.ft",
        image: "https://i.pinimg.com/736x/c4/ee/a4/c4eea4906647b7c01cc0e9f98862f9ce.jpg"
    },
    {
        id: 7,
        title: "Luxury Penthouse in F-10",
        location: "F-10, Islamabad",
        price: "PKR 95,000,000",
        type: "apartment",
        bedrooms: 4,
        bathrooms: 4,
        area: "3,800 sq.ft",
        image: "https://i.pinimg.com/736x/c4/ee/a4/c4eea4906647b7c01cc0e9f98862f9ce.jpg",
        featured: true
    },
    {
        id: 8,
        title: "Plot in I-8",
        location: "I-8, Islamabad",
        price: "PKR 8,500,000",
        type: "plot",
        area: "400 sq.yd",
        image: "https://i.pinimg.com/736x/c4/ee/a4/c4eea4906647b7c01cc0e9f98862f9ce.jpg"
    }
    ],
    lahore: [
    {
        id: 9,
        title: "Luxury House in DHA Lahore",
        location: "DHA Phase 6, Lahore",
        price: "PKR 65,000,000",
        type: "house",
        bedrooms: 5,
        bathrooms: 5,
        area: "4,200 sq.ft",
        image: "https://i.pinimg.com/736x/c4/ee/a4/c4eea4906647b7c01cc0e9f98862f9ce.jpg",
        featured: true
    },
    {
        id: 10,
        title: "Premium Apartment in Gulberg",
        location: "Gulberg, Lahore",
        price: "PKR 35,000,000",
        type: "apartment",
        bedrooms: 3,
        bathrooms: 3,
        area: "2,400 sq.ft",
        image: "https://i.pinimg.com/736x/c4/ee/a4/c4eea4906647b7c01cc0e9f98862f9ce.jpg"
    },
    {
        id: 11,
        title: "Plot in Bahria Orchard",
        location: "Bahria Orchard, Lahore",
        price: "PKR 18,000,000",
        type: "plot",
        area: "600 sq.yd",
        image: "https://i.pinimg.com/736x/c4/ee/a4/c4eea4906647b7c01cc0e9f98862f9ce.jpg"
    },
    {
        id: 12,
        title: "Modern Villa in Park View City",
        location: "Park View City, Lahore",
        price: "PKR 95,000,000",
        type: "villa",
        bedrooms: 6,
        bathrooms: 6,
        area: "5,500 sq.ft",
        image: "https://i.pinimg.com/736x/c4/ee/a4/c4eea4906647b7c01cc0e9f98862f9ce.jpg",
        featured: true
    },
    {
        id: 13,
        title: "Commercial Plaza in MM Alam",
        location: "MM Alam Road, Lahore",
        price: "PKR 180,000,000",
        type: "commercial",
        area: "7,000 sq.ft",
        image: "https://i.pinimg.com/736x/c4/ee/a4/c4eea4906647b7c01cc0e9f98862f9ce.jpg"
    },
    {
        id: 14,
        title: "Apartment in Askari",
        location: "Askari, Lahore",
        price: "PKR 25,000,000",
        type: "apartment",
        bedrooms: 2,
        bathrooms: 2,
        area: "1,600 sq.ft",
        image: "https://i.pinimg.com/736x/c4/ee/a4/c4eea4906647b7c01cc0e9f98862f9ce.jpg"
    }
    ],
    karachi: [
    {
        id: 15,
        title: "Seaview Apartment in Clifton",
        location: "Clifton, Karachi",
        price: "PKR 55,000,000",
        type: "apartment",
        bedrooms: 4,
        bathrooms: 4,
        area: "3,000 sq.ft",
        image: "https://i.pinimg.com/736x/c4/ee/a4/c4eea4906647b7c01cc0e9f98862f9ce.jpg",
        featured: true
    },
    {
        id: 16,
        title: "Modern House in DHA Karachi",
        location: "DHA Phase 8, Karachi",
        price: "PKR 75,000,000",
        type: "house",
        bedrooms: 4,
        bathrooms: 4,
        area: "3,800 sq.ft",
        image: "https://i.pinimg.com/736x/c4/ee/a4/c4eea4906647b7c01cc0e9f98862f9ce.jpg"
    },
    {
        id: 17,
        title: "Plot in Scheme 33",
        location: "Scheme 33, Karachi",
        price: "PKR 9,000,000",
        type: "plot",
        area: "400 sq.yd",
        image: "https://i.pinimg.com/736x/c4/ee/a4/c4eea4906647b7c01cc0e9f98862f9ce.jpg"
    },
    {
        id: 18,
        title: "Commercial Office in Saddar",
        location: "Saddar, Karachi",
        price: "PKR 150,000,000",
        type: "commercial",
        area: "6,000 sq.ft",
        image: "https://i.pinimg.com/736x/c4/ee/a4/c4eea4906647b7c01cc0e9f98862f9ce.jpg",
        featured: true
    },
    {
        id: 19,
        title: "Apartment in Gulshan",
        location: "Gulshan-e-Iqbal, Karachi",
        price: "PKR 32,000,000",
        type: "apartment",
        bedrooms: 3,
        bathrooms: 3,
        area: "2,200 sq.ft",
        image: "https://i.pinimg.com/736x/c4/ee/a4/c4eea4906647b7c01cc0e9f98862f9ce.jpg"
    },
    {
        id: 20,
        title: "Villa in Bahria Town Karachi",
        location: "Bahria Town, Karachi",
        price: "PKR 65,000,000",
        type: "villa",
        bedrooms: 5,
        bathrooms: 5,
        area: "4,500 sq.ft",
        image: "https://i.pinimg.com/736x/c4/ee/a4/c4eea4906647b7c01cc0e9f98862f9ce.jpg"
    }
    ]
};

// DOM Elements
const cityCards = document.querySelectorAll('.city-card-select');
const propertiesGrid = document.getElementById('properties-grid');
const cityDisplay = document.getElementById('city-display');
const selectedCitySpan = document.getElementById('selected-city');
const propertyCountSpan = document.getElementById('property-count');
const applyFiltersBtn = document.getElementById('apply-filters');
const resetFiltersBtn = document.getElementById('reset-filters');
const sortSelect = document.getElementById('sort-by');

// Current state
let currentCity = 'islamabad';
let currentFilters = {
    propertyType: '',
    bedrooms: '',
    minPrice: '',
    maxPrice: ''
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    renderProperties(propertyData[currentCity]);
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    // City selection
    cityCards.forEach(card => {
    card.addEventListener('click', () => {
        const city = card.dataset.city;
        selectCity(city);
    });
    });

    // Filter changes
    document.getElementById('property-type').addEventListener('change', (e) => {
    currentFilters.propertyType = e.target.value;
    });

    document.getElementById('bedrooms').addEventListener('change', (e) => {
    currentFilters.bedrooms = e.target.value;
    });

    document.getElementById('min-price').addEventListener('change', (e) => {
    currentFilters.minPrice = e.target.value;
    });

    document.getElementById('max-price').addEventListener('change', (e) => {
    currentFilters.maxPrice = e.target.value;
    });

    // Apply filters
    applyFiltersBtn.addEventListener('click', applyFilters);

    // Reset filters
    resetFiltersBtn.addEventListener('click', resetFilters);

    // Sort properties
    sortSelect.addEventListener('change', sortProperties);

    // Pagination
    document.getElementById('prev-page').addEventListener('click', function() {
      if (typeof showToast === 'function') showToast('Previous page – pagination coming soon.', 'info');
      else alert('Previous page clicked - Implement pagination logic here');
    });

    document.getElementById('next-page').addEventListener('click', function() {
      if (typeof showToast === 'function') showToast('Next page – pagination coming soon.', 'info');
      else alert('Next page clicked - Implement pagination logic here');
    });

    // Page number buttons
    document.querySelectorAll('.page-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.page-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        if (typeof showToast === 'function') showToast('Page ' + this.textContent + ' – pagination coming soon.', 'info');
        else alert('Page ' + this.textContent + ' clicked - Implement pagination logic here');
      });
    });
}

// City selection function
function selectCity(city) {
    // Update active city card
    cityCards.forEach(card => {
    card.classList.remove('active');
    if (card.dataset.city === city) {
        card.classList.add('active');
    }
    });

    // Update current city
    currentCity = city;
    
    // Update display
    const cityNames = {
    islamabad: 'Islamabad',
    lahore: 'Lahore',
    karachi: 'Karachi'
    };
    
    cityDisplay.textContent = cityNames[city];
    selectedCitySpan.textContent = cityNames[city];
    
    // Render properties for selected city
    applyFilters();
}

// Apply filters function
function applyFilters() {
    let filteredProperties = [...propertyData[currentCity]];

    // Apply filters
    if (currentFilters.propertyType) {
    filteredProperties = filteredProperties.filter(
        property => property.type === currentFilters.propertyType
    );
    }

    if (currentFilters.bedrooms) {
    filteredProperties = filteredProperties.filter(
        property => property.bedrooms >= parseInt(currentFilters.bedrooms)
    );
    }

    if (currentFilters.minPrice) {
    filteredProperties = filteredProperties.filter(property => {
        const price = parseInt(property.price.replace(/[^0-9]/g, ''));
        return price >= parseInt(currentFilters.minPrice);
    });
    }

    if (currentFilters.maxPrice) {
    filteredProperties = filteredProperties.filter(property => {
        const price = parseInt(property.price.replace(/[^0-9]/g, ''));
        return price <= parseInt(currentFilters.maxPrice);
    });
    }

    // Sort properties
    sortProperties(filteredProperties);

    // Update property count
    propertyCountSpan.textContent = filteredProperties.length;

    // Render properties
    renderProperties(filteredProperties);
}

// Reset filters function
function resetFilters() {
    // Reset filter inputs
    document.getElementById('property-type').value = '';
    document.getElementById('bedrooms').value = '';
    document.getElementById('min-price').value = '';
    document.getElementById('max-price').value = '';
    sortSelect.value = 'newest';

    // Reset current filters
    currentFilters = {
    propertyType: '',
    bedrooms: '',
    minPrice: '',
    maxPrice: ''
    };

    // Apply reset
    applyFilters();
}

// Sort properties function
function sortProperties(propertiesArray = null) {
    const sortValue = sortSelect.value;
    let properties = propertiesArray || [...propertyData[currentCity]];

    switch (sortValue) {
    case 'price-low':
        properties.sort((a, b) => {
        const priceA = parseInt(a.price.replace(/[^0-9]/g, ''));
        const priceB = parseInt(b.price.replace(/[^0-9]/g, ''));
        return priceA - priceB;
        });
        break;
    case 'price-high':
        properties.sort((a, b) => {
        const priceA = parseInt(a.price.replace(/[^0-9]/g, ''));
        const priceB = parseInt(b.price.replace(/[^0-9]/g, ''));
        return priceB - priceA;
        });
        break;
    case 'popular':
        properties.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
        break;
    case 'newest':
    default:
        // Already sorted by ID (newest first)
        break;
    }

    if (!propertiesArray) {
    renderProperties(properties);
    }
    return properties;
}

// Render properties function
function renderProperties(properties) {
    if (properties.length === 0) {
    propertiesGrid.innerHTML = `
        <div class="no-properties">
        <i class="far fa-folder-open"></i>
        <h3>No Properties Found</h3>
        <p>We couldn't find any properties matching your criteria. Try adjusting your filters or select a different city.</p>
        <button class="btn-primary" onclick="resetFilters()" style="margin: 0 auto;">
            <i class="fas fa-redo"></i> Reset Filters
        </button>
        </div>
    `;
    return;
    }

    propertiesGrid.innerHTML = properties.map(property => `
    <div class="property-card">
        <div class="property-image">
        <img src="${property.image}" alt="${property.title}">
        ${property.featured ? '<div class="property-badge">Featured</div>' : ''}
        </div>
        <div class="property-content">
        <h3 class="property-title">${property.title}</h3>
        <p class="property-location">
            <i class="fas fa-map-marker-alt"></i> ${property.location}
        </p>
        
        <div class="property-features">
            ${property.bedrooms ? `
            <div class="feature">
                <i class="fas fa-bed"></i>
                <span>${property.bedrooms} Bed</span>
            </div>
            ` : ''}
            
            ${property.bathrooms ? `
            <div class="feature">
                <i class="fas fa-bath"></i>
                <span>${property.bathrooms} Bath</span>
            </div>
            ` : ''}
            
            <div class="feature">
            <i class="fas fa-expand-arrows-alt"></i>
            <span>${property.area}</span>
            </div>
        </div>
        
        <div class="property-price">
            ${property.price} <span>/ ${property.type.charAt(0).toUpperCase() + property.type.slice(1)}</span>
        </div>
        
        <div class="property-actions">
            <a href="#" class="btn-view">
            <i class="fas fa-eye"></i> View Details
            </a>
            <button class="btn-save">
            <i class="far fa-heart"></i>
            </button>
        </div>
        </div>
    </div>
    `).join('');

    // Add event listeners to save buttons
    document.querySelectorAll('.btn-save').forEach((btn, index) => {
      btn.addEventListener('click', function() {
        const icon = this.querySelector('i');
        if (icon.classList.contains('far')) {
          icon.classList.remove('far');
          icon.classList.add('fas');
          if (typeof showToast === 'function') showToast('Property saved to favorites!', 'success');
          else alert('Property saved to favorites!');
        } else {
          icon.classList.remove('fas');
          icon.classList.add('far');
          if (typeof showToast === 'function') showToast('Property removed from favorites!', 'info');
          else alert('Property removed from favorites!');
        }
      });
    });

    // Add event listeners to view buttons
    document.querySelectorAll('.btn-view').forEach((btn, index) => {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        if (typeof showToast === 'function') showToast('Viewing details for: ' + properties[index].title, 'info');
        else alert('Viewing details for: ' + properties[index].title);
      });
    });
}
