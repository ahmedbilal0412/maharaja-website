if (window.getToken && !window.getToken()) {
  window.location.href = "login.html";
}

const locationInput = document.getElementById("location");
const freeMsg = document.getElementById("freeListingMsg");
const paymentSection = document.getElementById("paymentSection");
const basePaymentSpan = document.getElementById("basePaymentAmount");
let uploadedReceiptUrl = null;

// Function to update payment amount based on location
function updatePaymentAmount() {
  if (!paymentSection || paymentSection.style.display === "none") return;
  
  const value = (locationInput?.value || "").toLowerCase();
  const isFreeLocation = value.includes("dha") || value.includes("bahria town") || value.includes("bahria");
  
  let baseAmount = isFreeLocation ? 0 : 500;
  
  if (basePaymentSpan) {
    basePaymentSpan.textContent = baseAmount;
  }
  
  // Update payment message
  const paymentInfo = paymentSection.querySelector('.payment-info');
  if (paymentInfo) {
    let message = "Send payment to: <strong>0300-1234567</strong><br>Once paid, click \"Submit for Approval\".";
    
    if (!isFreeLocation) {
      message += "<br><strong>Note: Standard listing fee (PKR 500).</strong>";
    }
    
    paymentInfo.innerHTML = message;
  }
}

if (locationInput) {
  locationInput.addEventListener("input", () => {
    const value = (locationInput.value || "").toLowerCase();
    const isFreeLocation = value.includes("dha") || value.includes("bahria town") || value.includes("bahria");
    
    if (isFreeLocation) {
      freeMsg.style.display = "block";
      paymentSection.style.display = "none";
    } else {
      freeMsg.style.display = "none";
      paymentSection.style.display = "block";
      updatePaymentAmount();
    }
  });
}

// Receipt image upload
const receiptInput = document.getElementById('receiptImage');
if (receiptInput) {
  receiptInput.addEventListener('change', async function(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onload = function(e) {
      const preview = document.getElementById('receiptPreviewImg');
      const previewContainer = document.getElementById('receipt-preview');
      if (preview && previewContainer) {
        preview.src = e.target.result;
        previewContainer.style.display = 'block';
      }
    };
    reader.readAsDataURL(file);

    // Upload
    const formData = new FormData();
    formData.append('receipt', file);

    try {
      const response = await fetch(`${API_BASE}/properties/upload-receipt`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}` },
        body: formData
      });

      const data = await response.json();
      if (response.ok) {
        uploadedReceiptUrl = data.receipt_url;
        if (typeof showToast === "function") showToast('Receipt uploaded successfully!', 'success');
        else alert('Receipt uploaded successfully!');
      } else {
        if (typeof showToast === "function") showToast('Receipt upload failed: ' + (data.message || 'Unknown error'), 'error');
        else alert('Receipt upload failed: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Receipt upload error:', error);
      if (typeof showToast === "function") showToast('Receipt upload failed. Please try again.', 'error');
      else alert('Receipt upload failed. Please try again.');
    }
  });
}

const form = document.getElementById("addPropertyForm");
if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const token = getToken();
    if (!token) {
      if (typeof showToast === "function") showToast("Please log in to add a property.", "error");
      else alert("Please log in to add a property.");
      window.location.href = "login.html";
      return;
    }

    var location = (document.getElementById("location") && document.getElementById("location").value || "").trim();
    var isFreeLocation = (location.toLowerCase().indexOf("dha") >= 0 ||
      location.toLowerCase().indexOf("bahria town") >= 0 ||
      location.toLowerCase().indexOf("bahria") >= 0);
    
    // Calculate payment message based on location
    let paymentMsg = "";
    let totalAmount = 0;
    
    if (isFreeLocation) {
      totalAmount = 0;
      paymentMsg = ""; // No payment needed
    } else {
      totalAmount = 500;
      paymentMsg = `Standard listing fee: Rs. 500 (JazzCash/EasyPaisa: 0300-1234567).\n\nHave you made the payment?`;
    }

    const filesEl = document.getElementById("images");
    const files = filesEl ? filesEl.files : null;
    if (!files || files.length === 0) {
      if (typeof showToast === "function") showToast("Please select at least one image.", "error");
      else alert("Please select at least one image");
      return;
    }
    if (files.length > 5) {
      if (typeof showToast === "function") showToast("Maximum 5 images allowed.", "error");
      else alert("Maximum 5 images allowed");
      return;
    }

    const image_urls = await uploadImages(files);

    function doSubmit() {
      // Get amenities from checkboxes
      var amenities = [];
      form.querySelectorAll('.checkbox-group input[type="checkbox"]:checked').forEach(function (cb) {
        if (cb.value) amenities.push(cb.value);
      });

      // Get parking checkbox
      const parkingCheckbox = document.getElementById("parking");
      const parking = parkingCheckbox ? parkingCheckbox.checked : false;

      // Get electricity backup checkbox
      const electricityCheckbox = document.getElementById("electricityBackup");
      const electricity_backup = electricityCheckbox ? electricityCheckbox.checked : false;

      // Get other fields
      const description = document.getElementById("description") ? document.getElementById("description").value.trim() : "";
      const furnished = document.getElementById("furnished") ? document.getElementById("furnished").value : "";
      const totalFloors = document.getElementById("totalFloors") ? parseInt(document.getElementById("totalFloors").value, 10) || null : null;
      const yearBuilt = document.getElementById("yearBuilt") ? parseInt(document.getElementById("yearBuilt").value, 10) || null : null;

      var payload = {
        title: (document.getElementById("title") && document.getElementById("title").value || "").trim(),
        city: (document.getElementById("city") && document.getElementById("city").value) || "",
        location: location,
        price: parseInt((document.getElementById("price") && document.getElementById("price").value) || 0, 10),
        property_type: (document.getElementById("type") && document.getElementById("type").value || "").trim(),
        listing_type: (document.getElementById("listing") && document.getElementById("listing").value || "").trim(),
        bedrooms: parseInt((document.getElementById("beds") && document.getElementById("beds").value) || 0, 10),
        bathrooms: parseInt((document.getElementById("baths") && document.getElementById("baths").value) || 0, 10),
        size_sqft: parseInt((document.getElementById("size") && document.getElementById("size").value) || 0, 10),
        amenities: amenities,
        images: image_urls, 
        primary_image_index: 0,  // First image is primary
        receipt_image_url: uploadedReceiptUrl,
        
        // New fields
        description: description || null,
        parking: parking,
        furnished: furnished || null,
        total_floors: totalFloors,
        electricity_backup: electricity_backup,
        year_built: yearBuilt,
      };

      if (!payload.title || !payload.location || !payload.price) {
        if (typeof showToast === "function") showToast("Please fill in title, location and price.", "error");
        else alert("Please fill in title, location and price.");
        return;
      }

      fetch(API_BASE + "/properties", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token,
        },
        body: JSON.stringify(payload),
      })
        .then(function (res) { return res.json().then(function (data) { return { res: res, data: data }; }); })
        .then(function (_) {
          var res = _.res;
          var data = _.data;
          if (!res.ok) {
            if (typeof showToast === "function") showToast(data.message || "Failed to submit property.", "error");
            else alert(data.message || "Failed to submit property.");
            return;
          }
          
          let successMsg = isFreeLocation
            ? "Property listed successfully!"
            : "Property submitted for admin approval. You will see it in My Listings.";
          
          if (typeof showToast === "function") showToast(successMsg, "success");
          else alert(successMsg);
          
          // Redirect to my listings after successful submission
          setTimeout(() => {
            window.location.href = "my-listings.html";
          }, 2000);
        })
        .catch(function (err) {
          console.error("Submit error:", err);
          if (typeof showToast === "function") showToast("An error occurred. Please try again.", "error");
          else alert("An error occurred. Please try again.");
        });
    }

    // Show confirmation only if payment is required
    if (totalAmount > 0) {
      if (typeof showConfirm === "function") {
        showConfirm(paymentMsg, doSubmit);
        return;
      }
      if (!confirm(paymentMsg)) return;
    }
    doSubmit();
  });
}

async function uploadImages(files) {
    const formData = new FormData();
    Array.from(files).forEach(file => {
        formData.append('images', file);
    });
    
    const token = getToken();
    const response = await fetch(API_BASE + '/properties/upload', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
            // No Content-Type header for FormData
        },
        body: formData
    });
    
    const data = await response.json();
    return data.image_urls;  // Array of URLs
}