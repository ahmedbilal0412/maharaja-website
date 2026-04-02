(function() {
  if (!getToken()) {
    showToast('Please log in to register an ad', 'error');
    setTimeout(() => { window.location.href = 'login.html'; }, 1500);
    return;
  }

  const API_BASE = window.API_BASE || "https://maharaja-website.onrender.com/api";
  const token = getToken();

  // Pricing per day (in PKR)
  const DAILY_RATE = 8000 / 7; // ~1142.86 PKR per day
  // Or use weekly/monthly rates:
  const PRICING = {
    week: 8000,    // 1 week
    twoWeeks: 15000, // 2 weeks
    month: 28000   // 1 month
  };

  let selectedStartDate = null;
  let selectedEndDate = null;
  let uploadedImageUrl = null;

  // Helper function to calculate days between dates
  function getDaysDifference(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  // Helper function to calculate price based on duration
  function calculatePrice(days) {
    if (days === 7) return PRICING.week;
    if (days === 14) return PRICING.twoWeeks;
    if (days === 30) return PRICING.month;
    // For custom durations, calculate daily rate
    return Math.round(DAILY_RATE * days);
  }

  // Helper function to format price display
  function formatPrice(price) {
    return 'PKR ' + price.toLocaleString();
  }

  // Update price display when dates change
  function updatePriceDisplay() {
    if (!selectedStartDate || !selectedEndDate) return;

    const start = new Date(selectedStartDate);
    const end = new Date(selectedEndDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Validate dates
    if (start < today) {
      showToast('Start date cannot be in the past', 'error');
      document.getElementById('startDate').value = '';
      document.getElementById('endDate').value = '';
      selectedStartDate = null;
      selectedEndDate = null;
      document.getElementById('priceDisplay').style.display = 'none';
      updateSubmitButton();
      return;
    }

    if (end <= start) {
      showToast('End date must be after start date', 'error');
      document.getElementById('endDate').value = '';
      selectedEndDate = null;
      document.getElementById('priceDisplay').style.display = 'none';
      updateSubmitButton();
      return;
    }

    const days = getDaysDifference(selectedStartDate, selectedEndDate);
    const minDays = 7; // Minimum 1 week

    if (days < minDays) {
      document.getElementById('durationWarning').style.display = 'block';
      document.getElementById('priceDisplay').style.display = 'none';
      updateSubmitButton();
      return;
    }

    document.getElementById('durationWarning').style.display = 'none';

    const price = calculatePrice(days);
    const totalAmount = document.getElementById('totalAmount');
    const totalPeriod = document.getElementById('totalPeriod');
    
    totalAmount.textContent = formatPrice(price);
    
    // Format period display
    if (days === 7) totalPeriod.textContent = 'for 1 week';
    else if (days === 14) totalPeriod.textContent = 'for 2 weeks';
    else if (days === 30) totalPeriod.textContent = 'for 1 month';
    else totalPeriod.textContent = `for ${days} days`;
    
    document.getElementById('priceDisplay').style.display = 'block';
    updateSubmitButton();
  }

  // Date picker event listeners
  const startDateInput = document.getElementById('startDate');
  const endDateInput = document.getElementById('endDate');
  let availabilityCheckTimeout = null;

  async function checkDateAvailability() {
    if (!selectedStartDate || !selectedEndDate) return;
    
    const response = await fetch(`${API_BASE}/ads/check-availability`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        start_date: selectedStartDate,
        end_date: selectedEndDate
      })
    });
    
    const data = await response.json();
    
    const availabilityMessage = document.getElementById('availabilityMessage');
    
    if (!data.available) {
      if (!availabilityMessage) {
        const msg = document.createElement('div');
        msg.id = 'availabilityMessage';
        msg.className = 'availability-warning';
        document.querySelector('.date-range-container').after(msg);
      }
      document.getElementById('availabilityMessage').innerHTML = `
        <i class="fas fa-exclamation-triangle"></i> ${data.message}
      `;
      document.getElementById('availabilityMessage').style.display = 'block';
      updateSubmitButton();
      return false;
    } else {
      if (availabilityMessage) {
        availabilityMessage.style.display = 'none';
      }
      return true;
    }
  }


  if (startDateInput) {
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    startDateInput.min = today;
    
    startDateInput.addEventListener('change', function() {
      selectedStartDate = this.value;
      if (endDateInput.value) {
        selectedEndDate = endDateInput.value;
        updatePriceDisplay();
        clearTimeout(availabilityCheckTimeout);
        availabilityCheckTimeout = setTimeout(checkDateAvailability, 500);
      } else {
        document.getElementById('priceDisplay').style.display = 'none';
        updateSubmitButton();
      }
    });
  }

  if (endDateInput) {
    endDateInput.addEventListener('change', function() {
      selectedEndDate = this.value;
      if (selectedStartDate) {
        updatePriceDisplay();
        clearTimeout(availabilityCheckTimeout);
        availabilityCheckTimeout = setTimeout(checkDateAvailability, 500);
      } else {
        showToast('Please select start date first', 'error');
        this.value = '';
        selectedEndDate = null;
      }
    });
  }

  // Image upload
  document.getElementById('adImage').addEventListener('change', async function(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onload = function(e) {
      const preview = document.getElementById('imagePreview');
      preview.src = e.target.result;
      preview.style.display = 'block';
    };
    reader.readAsDataURL(file);

    // Upload
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch(`${API_BASE}/ads/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const data = await response.json();
      if (response.ok) {
        uploadedImageUrl = data.image_url;
        showToast('Image uploaded successfully!', 'success');
      } else {
        showToast('Upload failed: ' + (data.message || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Upload error:', error);
      showToast('Upload failed. Please try again.', 'error');
    }

    updateSubmitButton();
  });

  function updateSubmitButton() {
    const submitBtn = document.getElementById('submitBtn');
    const availabilityMessage = document.getElementById('availabilityMessage');
    const isAvailable = !availabilityMessage || availabilityMessage.style.display === 'none';
    const hasValidDates = selectedStartDate && selectedEndDate && 
                          getDaysDifference(selectedStartDate, selectedEndDate) >= 7;
    submitBtn.disabled = !(uploadedImageUrl && hasValidDates && isAvailable);
  }

  // Form submission
  document.getElementById('adForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    if (!uploadedImageUrl || !selectedStartDate || !selectedEndDate) {
      showToast('Please select an image and valid date range (minimum 1 week).', 'error');
      return;
    }

    const days = getDaysDifference(selectedStartDate, selectedEndDate);
    if (days < 7) {
      showToast('Minimum duration is 1 week (7 days).', 'error');
      return;
    }

    // Final availability check
    const isAvailable = await checkDateAvailability();
    if (!isAvailable) {
      showToast('The selected dates are not available. Please choose different dates.', 'error');
      return;
    }

    const price = calculatePrice(days);
    const linkUrl = document.getElementById('linkUrl').value.trim();

    // Determine duration string for backend (maintaining compatibility)
    let durationStr = 'custom';
    if (days === 7) durationStr = '1week';
    else if (days === 14) durationStr = '2weeks';
    else if (days === 30) durationStr = '1month';

    try {
      const response = await fetch(`${API_BASE}/ads/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          image_url: uploadedImageUrl,
          link_url: linkUrl,
          duration: durationStr,
          start_date: selectedStartDate,
          end_date: selectedEndDate,
          price: price
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        const totalPrice = price;
        showConfirm(`Payment required: PKR ${totalPrice.toLocaleString()}. Proceed with payment?`, async function() {
          try {
            const payResponse = await fetch(`${API_BASE}/ads/pay/${data.ad.id}`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (payResponse.ok) {
              showToast('Ad submitted and payment recorded! Awaiting admin approval.', 'success');
              setTimeout(() => { window.location.href = 'my-ads.html'; }, 2000);
            } else {
              const payData = await payResponse.json();
              showToast(payData.message || 'Payment failed', 'error');
            }
          } catch (error) {
            console.error('Payment error:', error);
            showToast('Payment failed. Please try again.', 'error');
          }
        }, function() {
          showToast('Payment cancelled', 'info');
        });
      } else {
        showToast('Error: ' + data.message, 'error');
      }
    } catch (error) {
      console.error('Submission error:', error);
      showToast('Failed to submit ad. Please try again.', 'error');
    }
  });
})();