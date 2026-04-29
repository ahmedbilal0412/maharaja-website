(function() {
  if (!getToken() || !isAdmin()) {
    window.location.href = 'login.html';
    return;
  }

  const API_BASE = window.API_BASE || "https://api.maharajabuilders.pk/api";
  const token = getToken();
  let currentFilter = 'all';
  let allPurchases = [];

  const logoutBtn = document.getElementById("admin-logout-btn");
  if (logoutBtn) logoutBtn.addEventListener("click", logout);

  const purchasesGrid = document.getElementById('purchasesGrid');
  const filterTabs = document.querySelectorAll('.filter-tab');

  // Stats elements
  const totalRequestsEl = document.getElementById('totalRequests');
  const pendingRequestsEl = document.getElementById('pendingRequests');
  const totalTokensEl = document.getElementById('totalTokens');
  const totalRevenueEl = document.getElementById('totalRevenue');

  function resolveImageUrl(url) {
    if (!url) return 'https://via.placeholder.com/800x400?text=No+Receipt';
    if (url.startsWith('http')) return url;
    const baseUrl = window.location.hostname === 'localhost' 
      ? 'http://localhost:5000' 
      : 'https://api.maharajabuilders.pk';
    return baseUrl + (url.startsWith('/') ? url : '/' + url);
  }

  function formatDate(dateStr) {
    if (!dateStr) return 'Not set';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function formatPrice(price) {
    return 'PKR ' + Number(price).toLocaleString();
  }

  function getStatusBadge(status) {
    const classes = {
      'pending': 'status-pending',
      'approved': 'status-approved',
      'rejected': 'status-rejected'
    };
    const texts = {
      'pending': 'Pending',
      'approved': 'Approved',
      'rejected': 'Rejected'
    };
    return `<span class="status-badge ${classes[status] || ''}">${texts[status] || status}</span>`;
  }

  function calculateStats(purchases) {
    const total = purchases.length;
    const pending = purchases.filter(p => p.status === 'pending').length;
    const totalTokens = purchases
      .filter(p => p.status === 'approved')
      .reduce((sum, p) => sum + p.token_count, 0);
    const totalRevenue = purchases
      .filter(p => p.status === 'approved')
      .reduce((sum, p) => sum + p.total_price, 0);

    if (totalRequestsEl) totalRequestsEl.textContent = total;
    if (pendingRequestsEl) pendingRequestsEl.textContent = pending;
    if (totalTokensEl) totalTokensEl.textContent = totalTokens.toLocaleString();
    if (totalRevenueEl) totalRevenueEl.textContent = formatPrice(totalRevenue);
  }

  function viewReceipt(receiptUrl) {
    if (receiptUrl) {
      // console.log(receiptUrl);
      window.open(receiptUrl, '_blank');
    } else {
      showToast('No receipt uploaded for this purchase', 'error');
    }
  }

  function renderPurchases(purchases) {
    if (!purchasesGrid) return;

    if (purchases.length === 0) {
      purchasesGrid.innerHTML = `
        <div class="no-purchases">
          <i class="fas fa-crown"></i>
          <h3>No token purchases found</h3>
          <p>There are no token purchases matching the current filter.</p>
        </div>
      `;
      return;
    }

    purchasesGrid.innerHTML = purchases.map(purchase => {
      const receiptUrl = resolveImageUrl(purchase.receipt_image_url);
      
      return `
        <div class="purchase-card" data-purchase-id="${purchase.id}">
          <div class="purchase-header">
            <div class="purchase-id">Purchase #${purchase.id}</div>
            <div class="purchase-user">
              <i class="fas fa-user"></i> ${purchase.user_name || 'User #' + purchase.user_id}
            </div>
            <div class="purchase-user" style="font-size: 0.85rem; opacity: 0.8;">
              <i class="fas fa-envelope"></i> ${purchase.user_email || 'No email'}
            </div>
          </div>
          <div class="purchase-content">
            <div class="purchase-details">
              <div class="detail-item">
                <span class="detail-label">Tokens</span>
                <span class="detail-value">${purchase.token_count}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Price/Token</span>
                <span class="detail-value">${formatPrice(purchase.price_per_token)}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Total</span>
                <span class="detail-value">${formatPrice(purchase.total_price)}</span>
              </div>
            </div>

            <div class="purchase-details">
              <div class="detail-item">
                <span class="detail-label">Status</span>
                <span class="detail-value">${getStatusBadge(purchase.status)}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Date</span>
                <span class="detail-value">${formatDate(purchase.created_at)}</span>
              </div>
              ${purchase.approved_at ? `
                <div class="detail-item">
                  <span class="detail-label">Approved Date</span>
                  <span class="detail-value">${formatDate(purchase.approved_at)}</span>
                </div>
              ` : ''}
            </div>

            <div class="receipt-section">
              <button class="view-receipt-btn" onclick="viewReceipt('${receiptUrl}')">
                <i class="fas fa-receipt"></i> View Payment Receipt
              </button>
            </div>

            ${purchase.status === 'pending' ? `
              <div class="purchase-actions">
                <button class="btn-approve" onclick="handleApprove(${purchase.id})">
                  <i class="fas fa-check"></i> Approve & Add Tokens
                </button>
                <button class="btn-reject" onclick="handleReject(${purchase.id})">
                  <i class="fas fa-times"></i> Reject
                </button>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  function loadPurchases(filter = 'all') {
    currentFilter = filter;
    let url = `${API_BASE}/admin/token-purchases`;
    if (filter !== 'all') {
      url += `?status=${filter}`;
    }

    purchasesGrid.innerHTML = '<div class="loading">Loading token purchases...</div>';

    fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => {
      if (res.status === 403) {
        showToast('Admin access required', 'error');
        setTimeout(() => { window.location.href = 'login.html'; }, 1500);
        return;
      }
      return res.json();
    })
    .then(data => {
      const purchases = data.purchases || [];
      allPurchases = purchases;
      calculateStats(purchases);
      renderPurchases(purchases);
    })
    .catch(err => {
      console.error('Error loading purchases:', err);
      showToast('Failed to load token purchases. Please try again.', 'error');
      purchasesGrid.innerHTML = `
        <div class="no-purchases">
          <i class="fas fa-exclamation-triangle" style="color: #dc3545;"></i>
          <h3>Failed to load purchases</h3>
          <p>Please try again later.</p>
        </div>
      `;
    });
  }

  // Filter tab handling
  if (filterTabs) {
    filterTabs.forEach(tab => {
      tab.addEventListener('click', function() {
        filterTabs.forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        const filter = this.dataset.filter;
        loadPurchases(filter);
      });
    });
  }

  // Approve handler
  window.handleApprove = function(purchaseId) {
    const purchase = allPurchases.find(p => p.id === purchaseId);
    const tokenCount = purchase ? purchase.token_count : '';
    
    showConfirm(`Approve this token purchase? ${tokenCount} tokens will be added to the user's account.`, function() {
      fetch(`${API_BASE}/admin/token-purchases/${purchaseId}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.message) {
          showToast(data.message, 'success');
          loadPurchases(currentFilter);
        }
      })
      .catch(err => {
        console.error('Error approving purchase:', err);
        showToast('Failed to approve purchase. Please try again.', 'error');
      });
    });
  };

  // Reject handler
  window.handleReject = function(purchaseId) {
    showConfirm('Reject this token purchase? This action cannot be undone.', function() {
      fetch(`${API_BASE}/admin/token-purchases/${purchaseId}/reject`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.message) {
          showToast('Token purchase rejected.', 'success');
          loadPurchases(currentFilter);
        }
      })
      .catch(err => {
        console.error('Error rejecting purchase:', err);
        showToast('Failed to reject purchase. Please try again.', 'error');
      });
    });
  };

  // Make viewReceipt globally available
  window.viewReceipt = viewReceipt;

  // Load initial data
  loadPurchases('pending');
})();