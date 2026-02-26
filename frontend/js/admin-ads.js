(function() {
  if (!getToken() || !isAdmin()) {
    window.location.href = 'login.html';
    return;
  }

  const API_BASE = window.API_BASE || "https://maharaja-website.onrender.com/api";
  const token = getToken();
  let currentFilter = 'all';

  const adsGrid = document.getElementById('adsGrid');
  const filterTabs = document.querySelectorAll('.filter-tab');

  // Stats elements
  const totalAdsEl = document.getElementById('totalAds');
  const pendingAdsEl = document.getElementById('pendingAds');
  const activeAdsEl = document.getElementById('activeAds');
  const totalRevenueEl = document.getElementById('totalRevenue');

  function resolveImageUrl(url) {
    if (!url) return 'https://via.placeholder.com/800x400?text=No+Image';
    if (url.startsWith('http')) return url;
    const baseUrl = window.location.hostname === 'localhost' 
      ? 'http://localhost:5000' 
      : 'https://maharaja-website.onrender.com';
    return baseUrl + (url.startsWith('/') ? url : '/' + url);
  }

  function formatDate(dateStr) {
    if (!dateStr) return 'Not set';
    return new Date(dateStr).toLocaleDateString();
  }

  function formatPrice(price) {
    return 'PKR ' + Number(price).toLocaleString();
  }

  function getStatusBadge(status) {
    const classes = {
      'pending': 'status-pending',
      'approved': 'status-approved',
      'rejected': 'status-rejected',
      'expired': 'status-expired'
    };
    return `<span class="ad-status ${classes[status] || ''}">${status.toUpperCase()}</span>`;
  }

  function calculateStats(ads) {
    const total = ads.length;
    const pending = ads.filter(ad => ad.status === 'pending').length;
    const active = ads.filter(ad => 
      ad.status === 'approved' && 
      ad.payment_status === 'paid' &&
      new Date(ad.end_date) > new Date()
    ).length;
    const revenue = ads
      .filter(ad => ad.payment_status === 'paid')
      .reduce((sum, ad) => sum + ad.price, 0);

    totalAdsEl.textContent = total;
    pendingAdsEl.textContent = pending;
    activeAdsEl.textContent = active;
    totalRevenueEl.textContent = 'PKR ' + revenue.toLocaleString();
  }

  function renderAds(ads) {
    if (ads.length === 0) {
      adsGrid.innerHTML = `
        <div class="no-ads">
          <i class="fas fa-ad"></i>
          <h3>No advertisements found</h3>
          <p>There are no ads matching the current filter.</p>
        </div>
      `;
      return;
    }

    adsGrid.innerHTML = ads.map(ad => {
      const isActive = ad.status === 'approved' && 
                      ad.payment_status === 'paid' &&
                      new Date(ad.end_date) > new Date();
      
      return `
        <div class="ad-card" data-ad-id="${ad.id}">
          <div class="ad-image">
            <img src="${resolveImageUrl(ad.image_url)}" alt="Ad ${ad.id}">
            ${getStatusBadge(ad.status)}
          </div>
          <div class="ad-content">
            <div class="ad-header">
              <span class="ad-id">Ad #${ad.id}</span>
              <span class="ad-duration">
                ${ad.duration === '1week' ? '1 Week' : 
                  ad.duration === '2weeks' ? '2 Weeks' : '1 Month'}
                <span class="payment-badge ${ad.payment_status === 'unpaid' ? 'unpaid' : ''}">
                  ${ad.payment_status === 'paid' ? '✓ Paid' : '⏳ Unpaid'}
                </span>
              </span>
            </div>

            <div class="ad-user">
              <i class="fas fa-user"></i> ${ad.user_name || 'User #' + ad.user_id}
            </div>

            <div class="ad-details">
              <div class="detail-item">
                <span class="detail-label">Price</span>
                <span class="detail-value">${formatPrice(ad.price)}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Start Date</span>
                <span class="detail-value">${formatDate(ad.start_date)}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">End Date</span>
                <span class="detail-value">${formatDate(ad.end_date)}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Status</span>
                <span class="detail-value">${isActive ? 'Active' : ad.status}</span>
              </div>
            </div>

            ${ad.link_url ? `
              <a href="${ad.link_url}" target="_blank" style="color: var(--primary-green); text-decoration: none; display: block; margin: 10px 0;">
                <i class="fas fa-external-link-alt"></i> ${ad.link_url}
              </a>
            ` : ''}

            ${ad.status === 'pending' && ad.payment_status === 'paid' ? `
              <div class="ad-actions">
                <button class="btn-approve" onclick="handleApprove(${ad.id})">
                  <i class="fas fa-check"></i> Approve
                </button>
                <button class="btn-reject" onclick="handleReject(${ad.id})">
                  <i class="fas fa-times"></i> Reject
                </button>
              </div>
            ` : ''}

            ${ad.status === 'pending' && ad.payment_status === 'unpaid' ? `
              <div style="margin-top: 15px; padding: 10px; background: #f8d7da; border-radius: 8px; color: #721c24;">
                <i class="fas fa-exclamation-triangle"></i> Waiting for payment
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  function loadAds(filter = 'all') {
    currentFilter = filter;
    let url = `${API_BASE}/admin/ads`;
    if (filter !== 'all') {
      url += `?status=${filter}`;
    }

    fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => {
      if (res.status === 403) {
        window.location.href = 'login.html';
        return;
      }
      return res.json();
    })
    .then(data => {
      const ads = data.ads || [];
      calculateStats(ads);
      renderAds(ads);
    })
    .catch(err => {
      console.error('Error loading ads:', err);
      adsGrid.innerHTML = `
        <div class="no-ads">
          <i class="fas fa-exclamation-triangle" style="color: #dc3545;"></i>
          <h3>Failed to load ads</h3>
          <p>Please try again later.</p>
        </div>
      `;
    });
  }

  // Filter tab handling
  filterTabs.forEach(tab => {
    tab.addEventListener('click', function() {
      filterTabs.forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      const filter = this.dataset.filter;
      loadAds(filter);
    });
  });

  // Approve handler
  window.handleApprove = function(adId) {
    if (!confirm('Approve this advertisement? It will become active immediately.')) return;

    fetch(`${API_BASE}/admin/ads/${adId}/approve`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      if (data.message) {
        alert('Ad approved successfully!');
        loadAds(currentFilter);
      }
    })
    .catch(err => {
      console.error('Error approving ad:', err);
      alert('Failed to approve ad. Please try again.');
    });
  };

  // Reject handler
  window.handleReject = function(adId) {
    if (!confirm('Reject this advertisement? This action cannot be undone.')) return;

    fetch(`${API_BASE}/admin/ads/${adId}/reject`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      if (data.message) {
        alert('Ad rejected successfully!');
        loadAds(currentFilter);
      }
    })
    .catch(err => {
      console.error('Error rejecting ad:', err);
      alert('Failed to reject ad. Please try again.');
    });
  };

  // Load initial data
  loadAds('all');
})();