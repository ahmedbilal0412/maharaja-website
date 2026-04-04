(function() {
  if (!getToken()) {
    window.location.href = 'login.html';
    return;
  }

  const API_BASE = window.API_BASE || "https://maharaja-website.onrender.com/api";
  const token = getToken();

  let selectedPack = null;
  let uploadedReceiptUrl = null;
  let tokenPacks = {};
  let userProperties = [];
  let tokenBalance = 0;

  // DOM Elements
  const packsGrid = document.getElementById('packsGrid');
  const receiptInput = document.getElementById('receiptImage');
  const receiptPreview = document.getElementById('receiptPreview');
  const receiptPreviewImg = document.getElementById('receiptPreviewImg');
  const purchaseBtn = document.getElementById('purchaseBtn');
  const tokenBalanceEl = document.getElementById('tokenBalance');
  const propertiesList = document.getElementById('propertiesList');

  // Helper function to resolve image URLs
  function resolveImageUrl(url) {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const imageBaseUrl = window.location.hostname === 'localhost'
      ? 'http://localhost:5000'
      : 'https://maharaja-website.onrender.com';
    if (url.startsWith('/api/')) return imageBaseUrl + url;
    return url;
  }

  // Load token packs
  async function loadTokenPacks() {
    try {
      const response = await fetch(`${API_BASE}/tokens/packs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      tokenPacks = data.packs;
      renderTokenPacks();
    } catch (error) {
      console.error('Error loading token packs:', error);
      showToast('Failed to load token packs', 'error');
    }
  }

  // Render token packs
  function renderTokenPacks() {
    if (!packsGrid) return;

    packsGrid.innerHTML = Object.entries(tokenPacks).map(([key, pack]) => `
      <div class="pack-card" data-pack="${key}">
        <div class="pack-tokens">${pack.tokens} <span>tokens</span></div>
        <div class="pack-price">PKR ${pack.total.toLocaleString()}</div>
        <div class="pack-price-per-token">PKR ${pack.price_per_token.toLocaleString()}/token</div>
      </div>
    `).join('');

    // Add click handlers to pack cards
    document.querySelectorAll('.pack-card').forEach(card => {
      card.addEventListener('click', () => {
        // Remove selected class from all
        document.querySelectorAll('.pack-card').forEach(c => c.classList.remove('selected'));
        // Add selected class to clicked
        card.classList.add('selected');
        selectedPack = card.dataset.pack;
        updatePurchaseButton();
      });
    });
  }

  // Load token balance
  async function loadTokenBalance() {
    try {
      const response = await fetch(`${API_BASE}/tokens/balance`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      tokenBalance = data.balance;
      tokenBalanceEl.textContent = tokenBalance;
    } catch (error) {
      console.error('Error loading token balance:', error);
    }
  }

  // Load user's properties
  async function loadUserProperties() {
    try {
      const response = await fetch(`${API_BASE}/properties/my`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      userProperties = data.properties || [];
      renderProperties();
    } catch (error) {
      console.error('Error loading properties:', error);
      propertiesList.innerHTML = '<div class="no-properties">Failed to load properties</div>';
    }
  }

  // Render properties with premium buttons
  function renderProperties() {
    if (!propertiesList) return;

    if (userProperties.length === 0) {
      propertiesList.innerHTML = '<div class="no-properties">No properties found. <a href="add-property.html">Add your first property</a></div>';
      return;
    }

    const approvedProperties = userProperties.filter(p => p.status === 'approved');
    
    if (approvedProperties.length === 0) {
      propertiesList.innerHTML = '<div class="no-properties">You have no approved properties yet. <a href="my-listings.html">Check your listings</a></div>';
      return;
    }

    propertiesList.innerHTML = approvedProperties.map(property => {
      const isPremiumActive = property.is_premium && property.is_premium_active;
      const expiryText = property.premium_expiry ? new Date(property.premium_expiry).toLocaleDateString() : null;
      
      return `
        <div class="property-item" data-id="${property.id}">
          <div class="property-info">
            <h4>${property.title || 'Untitled'}</h4>
            <p>${property.location || property.city || 'N/A'} • ${property.bedrooms || 0} beds • ${property.bathrooms || 0} baths</p>
            ${isPremiumActive ? `<span class="property-status status-premium">Premium until ${expiryText}</span>` : '<span class="property-status status-normal">Normal</span>'}
          </div>
          <div class="property-action">
            ${isPremiumActive 
              ? '<button class="premium-btn" disabled><i class="fas fa-crown"></i> Premium Active</button>'
              : `<button class="premium-btn" onclick="activatePremium(${property.id})"><i class="fas fa-star"></i> Make Premium (1 token)</button>`
            }
          </div>
        </div>
      `;
    }).join('');
  }

  // Activate premium for a property
  window.activatePremium = async function(propertyId) {
    if (tokenBalance < 1) {
      showToast('You don\'t have enough tokens. Please purchase more tokens.', 'error');
      return;
    }

    showConfirm('Use 1 premium token to make this property premium for 30 days?', async () => {
      try {
        const response = await fetch(`${API_BASE}/properties/${propertyId}/use-premium-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (response.ok) {
          showToast(data.message, 'success');
          // Refresh token balance and properties
          await loadTokenBalance();
          await loadUserProperties();
        } else {
          showToast(data.message || 'Failed to activate premium', 'error');
        }
      } catch (error) {
        console.error('Error activating premium:', error);
        showToast('An error occurred. Please try again.', 'error');
      }
    });
  };

  // Receipt upload
  if (receiptInput) {
    receiptInput.addEventListener('change', async function(e) {
      const file = e.target.files[0];
      if (!file) return;

      // Preview
      const reader = new FileReader();
      reader.onload = function(e) {
        receiptPreviewImg.src = e.target.result;
        receiptPreview.style.display = 'block';
      };
      reader.readAsDataURL(file);

      // Upload
      const formData = new FormData();
      formData.append('receipt', file);

      try {
        const response = await fetch(`${API_BASE}/tokens/upload-receipt`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });

        const data = await response.json();
        if (response.ok) {
          uploadedReceiptUrl = data.receipt_url;
          showToast('Receipt uploaded successfully!', 'success');
        } else {
          showToast('Receipt upload failed: ' + (data.message || 'Unknown error'), 'error');
        }
      } catch (error) {
        console.error('Receipt upload error:', error);
        showToast('Receipt upload failed. Please try again.', 'error');
      }

      updatePurchaseButton();
    });
  }

  // Update purchase button state
  function updatePurchaseButton() {
    purchaseBtn.disabled = !(selectedPack && uploadedReceiptUrl);
  }

  // Purchase tokens
  if (purchaseBtn) {
    purchaseBtn.addEventListener('click', async function() {
      if (!selectedPack || !uploadedReceiptUrl) {
        showToast('Please select a token pack and upload receipt', 'error');
        return;
      }

      purchaseBtn.disabled = true;
      purchaseBtn.innerHTML = '<span class="spinner"></span> Submitting...';

      try {
        const response = await fetch(`${API_BASE}/tokens/purchase`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            token_pack: parseInt(selectedPack),
            receipt_image_url: uploadedReceiptUrl
          })
        });

        const data = await response.json();

        if (response.ok) {
          showToast('Token purchase request submitted for admin approval!', 'success');
          // Reset form
          selectedPack = null;
          uploadedReceiptUrl = null;
          document.querySelectorAll('.pack-card').forEach(c => c.classList.remove('selected'));
          receiptInput.value = '';
          receiptPreview.style.display = 'none';
          updatePurchaseButton();
        } else {
          showToast(data.message || 'Purchase failed', 'error');
        }
      } catch (error) {
        console.error('Purchase error:', error);
        showToast('An error occurred. Please try again.', 'error');
      } finally {
        purchaseBtn.disabled = false;
        purchaseBtn.innerHTML = 'Purchase Tokens';
      }
    });
  }

  // Initialize page
  async function init() {
    await loadTokenPacks();
    await loadTokenBalance();
    await loadUserProperties();
  }

  init();
})();