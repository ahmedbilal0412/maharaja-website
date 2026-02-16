/**
 * Home page (index) only: UAE modal and country card behavior.
 * Run after DOM ready; modal and cards are always in the page.
 */
(function () {
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

  window.openUaeModal = openUaeModal;
  window.closeUaeModal = closeUaeModal;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
