(function() {
  if (!getToken()) {
    window.location.href = 'login.html';
    return;
  }

  const API_BASE = window.API_BASE || "https://maharaja-website.onrender.com/api";
  const token = getToken();

  const durationPrices = {
    '1week': 500,
    '2weeks': 900,
    '1month': 1500
  };

  let selectedDuration = null;
  let uploadedImageUrl = null;

  // Duration selection
  document.querySelectorAll('.duration-option').forEach(option => {
    option.addEventListener('click', function() {
      document.querySelectorAll('.duration-option').forEach(opt => opt.classList.remove('selected'));
      this.classList.add('selected');
      selectedDuration = this.dataset.duration;
      
      const price = durationPrices[selectedDuration];
      document.getElementById('totalAmount').textContent = 'PKR ' + price.toLocaleString();
      document.getElementById('totalPeriod').textContent = 
        selectedDuration === '1week' ? 'for 1 week' :
        selectedDuration === '2weeks' ? 'for 2 weeks' : 'for 1 month';
      document.getElementById('priceDisplay').style.display = 'block';
      
      updateSubmitButton();
    });
  });

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
      } else {
        alert('Upload failed: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    }

    updateSubmitButton();
  });

  function updateSubmitButton() {
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = !(uploadedImageUrl && selectedDuration);
  }

  // Form submission
  document.getElementById('adForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    if (!uploadedImageUrl || !selectedDuration) {
      alert('Please select an image and duration.');
      return;
    }

    const linkUrl = document.getElementById('linkUrl').value.trim();

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
          duration: selectedDuration
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        // Simulate payment - in real app, redirect to payment gateway
        if (confirm(`Payment required: PKR ${data.payment_amount}. Click OK to simulate payment.`)) {
          const payResponse = await fetch(`${API_BASE}/ads/pay/${data.ad.id}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (payResponse.ok) {
            alert('Ad submitted and payment recorded! Awaiting admin approval.');
            window.location.href = 'my-ads.html';
          }
        }
      } else {
        alert('Error: ' + data.message);
      }
    } catch (error) {
      console.error('Submission error:', error);
      alert('Failed to submit ad. Please try again.');
    }
  });
})();