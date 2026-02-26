(function() {
  if (!getToken()) {
    window.location.href = 'login.html';
    return;
  }

  const API_BASE = window.API_BASE || "https://maharaja-website.onrender.com/api";
  const token = getToken();
  const adsGrid = document.getElementById('ads-grid');

  function getStatusBadge(status) {
    const statusClasses = {
      'pending': 'status-pending',
      'approved': 'status-approved',
      'rejected': 'status-rejected',
      'expired': 'status-expired'
    };
    const statusText = {
      'pending': 'Pending Approval',
      'approved': 'Active',
      'rejected': 'Rejected',
      'expired': 'Expired'
    };
    return `<span class="status-badge ${statusClasses[status] || ''}">${statusText[status] || status}</span>`;
  }

  function formatDate(dateStr) {
    if (!dateStr) return 'Not set';
    return new Date(dateStr).toLocaleDateString();
  }

  fetch(`${API_BASE}/ads/my`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  .then(res => res.json())
  .then(data => {
    const ads = data.ads || [];
    
    if (ads.length === 0) {
      adsGrid.innerHTML = `
        <div class="no-listings">
          <p>You haven't created any ads yet.</p>
          <a href="register-ad.html" class="add-new-btn">Create Your First Ad</a>
        </div>
      `;
      return;
    }

    adsGrid.innerHTML = ads.map(ad => {
      const imgSrc = resolveImageUrl(ad.image_url);
      const isActive = ad.status === 'approved' && ad.payment_status === 'paid';
      
      return `
        <div class="property-card">
          <img src="${imgSrc}" alt="Ad" style="height: 150px; object-fit: cover;">
          <div class="property-info" style="padding: 15px;">
            <h3>Ad #${ad.id}</h3>
            <div class="property-location">
              <i class="fas fa-calendar"></i>
              <span>Duration: ${ad.duration}</span>
            </div>
            <div class="property-features" style="flex-direction: column; gap: 5px;">
              <div><strong>Price:</strong> PKR ${ad.price.toLocaleString()}</div>
              <div><strong>Payment:</strong> ${ad.payment_status}</div>
              <div><strong>Start:</strong> ${formatDate(ad.start_date)}</div>
              <div><strong>End:</strong> ${formatDate(ad.end_date)}</div>
            </div>
            <div style="margin-top: 15px;">
              ${getStatusBadge(ad.status)}
            </div>
            ${ad.link_url ? `
              <a href="${ad.link_url}" target="_blank" class="view-details-btn" style="margin-top: 15px;">
                <i class="fas fa-external-link-alt"></i> Visit Link
              </a>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  })
  .catch(err => {
    console.error('Error loading ads:', err);
    adsGrid.innerHTML = '<p class="no-listings">Failed to load ads. Please try again.</p>';
  });

  // Reuse resolveImageUrl from your existing code
  function resolveImageUrl(url) {
    if (!url) return 'https://via.placeholder.com/800x400?text=Ad+Image';
    if (url.startsWith('http')) return url;
    const baseUrl = window.location.hostname === 'localhost' 
      ? 'http://localhost:5000' 
      : 'https://maharaja-website.onrender.com';
    return baseUrl + (url.startsWith('/') ? url : '/' + url);
  }
})();