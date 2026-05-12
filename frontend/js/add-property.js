if (window.getToken && !window.getToken()) {
  window.location.href = "login.html";
}

const locationInput = document.getElementById("location");
const freeMsg = document.getElementById("freeListingMsg");
const paymentSection = document.getElementById("paymentSection");
const basePaymentSpan = document.getElementById("basePaymentAmount");
const receiptSection = document.querySelector('.receipt-section');
const receiptInput = document.getElementById('receiptImage');
const submitBtn = document.querySelector('.submit-btn');  // Add this
let uploadedReceiptUrl = null;

// Function to set loading state on button
function setButtonLoading(isLoading, originalText = "Submit for Approval") {
  if (!submitBtn) return;
  
  if (isLoading) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Submitting...';
  } else {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
}

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
    let message = "Send payment to: <strong>0333-5256719</strong> on EasyPaisa or <strong>0323-5472636</strong> on JazzCash<br>Once paid, click \"Submit for Approval\".";
    if (isFreeLocation) {
      message = "No payment required for DHA/Bahria Town.<br>Click \"Submit for Approval\" to submit your listing.";
    }
    paymentInfo.innerHTML = message;
  }
}

// Function to toggle plot-specific fields
function togglePlotFields() {
  const propertyType = document.getElementById("type")?.value;
  const isPlot = propertyType === "plot";
  
  // Get all fields that should be hidden for plots
  const bedsField = document.getElementById("beds")?.closest(".form-group");
  const bathsField = document.getElementById("baths")?.closest(".form-group");
  const totalFloorsField = document.getElementById("totalFloors")?.closest(".form-group");
  const furnishedField = document.getElementById("furnished")?.closest(".form-group");
  const parkingField = document.getElementById("parking")?.closest(".checkbox-single");
  const electricityField = document.getElementById("electricityBackup")?.closest(".checkbox-single");
  const yearBuiltField = document.getElementById("yearBuilt")?.closest(".form-group");
  const amenitiesFields = document.getElementById("amenities-fields");
  const amenitiesTitle = document.getElementById("amenities-title");
  
  // For checkboxes, find their parent containers
  const parkingParent = parkingField?.closest(".form-row");
  const electricityParent = electricityField?.closest(".form-row");
  
  if (isPlot) {
    // Hide plot-specific fields
    if (bedsField) bedsField.style.display = "none";
    if (bathsField) bathsField.style.display = "none";
    if (totalFloorsField) totalFloorsField.style.display = "none";
    if (furnishedField) furnishedField.style.display = "none";
    if (parkingParent) parkingParent.style.display = "none";
    if (electricityParent) electricityParent.style.display = "none";
    if (yearBuiltField) yearBuiltField.style.display = "none";
    if (amenitiesFields) amenitiesFields.style.display = "none";
    if (amenitiesTitle) amenitiesTitle.style.display = "none";
    
    // Set default values for plot (so validation passes)
    const bedsInput = document.getElementById("beds");
    const bathsInput = document.getElementById("baths");
    if (bedsInput && !bedsInput.value) bedsInput.value = "0";
    if (bathsInput && !bathsInput.value) bathsInput.value = "0";
  } else {
    // Show fields for non-plot properties
    if (bedsField) bedsField.style.display = "block";
    if (bathsField) bathsField.style.display = "block";
    if (totalFloorsField) totalFloorsField.style.display = "block";
    if (furnishedField) furnishedField.style.display = "block";
    if (parkingParent) parkingParent.style.display = "flex";
    if (electricityParent) electricityParent.style.display = "flex";
    if (yearBuiltField) yearBuiltField.style.display = "block";
    if (amenitiesFields) amenitiesFields.style.display = "block";
    if (amenitiesTitle) amenitiesTitle.style.display = "block";
  }
}

if (locationInput) {
  locationInput.addEventListener("input", () => {
    const value = (locationInput.value || "").toLowerCase();
    const isFreeLocation = value.includes("dha") || value.includes("bahria town") || value.includes("bahria");
    
    if (isFreeLocation) {
      freeMsg.style.display = "block";
      paymentSection.style.display = "none";
      if (receiptSection) receiptSection.style.display = "none";
      if (receiptInput) receiptInput.required = false;
    } else {
      freeMsg.style.display = "none";
      paymentSection.style.display = "block";
      updatePaymentAmount();
      if (receiptSection) receiptSection.style.display = "block";
      if (receiptInput) receiptInput.required = true;
    }
  });
}

// Listen for property type change to toggle plot fields
const propertyTypeSelect = document.getElementById("type");
if (propertyTypeSelect) {
  propertyTypeSelect.addEventListener("change", togglePlotFields);
  // Call once on page load to set initial state
  togglePlotFields();
}

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
        preview.style.maxHeight = '300px';
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

function isValidPrice(value) {
  // Check if value only contains digits and commas
  const regex = /^[0-9,]+$/;
  if (!regex.test(value)) {
    return false;
  }

  return true;
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
      paymentMsg = `Standard listing fee: Rs. 500 (JazzCash: 0323-5472636 / EasyPaisa: 0333-5256719).\n\nHave you made the payment?`;
    }

    const priceValue = document.getElementById("price").value;
    if (!isValidPrice(priceValue)) {
      if (typeof showToast === "function") {
        showToast("Please enter a valid price (only numbers and commas)", "error");
      } else {
        alert("Please enter a valid price (only numbers and commas)");
      }
      return;
    }

    const filesEl = document.getElementById("images");
    const files = filesEl ? filesEl.files : null;
    if (!files || files.length === 0) {
      if (typeof showToast === "function") showToast("Please select at least one image.", "error");
      else alert("Please select at least one image");
      return;
    }
    if (files.length > 10) {
      if (typeof showToast === "function") showToast("Maximum 10 images allowed.", "error");
      else alert("Maximum 10 images allowed");
      return;
    }

    // Show loading state
    setButtonLoading(true);

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
      const isPlot = document.getElementById("type")?.value === "plot";

      var payload = {
        title: (document.getElementById("title") && document.getElementById("title").value || "").trim(),
        city: (document.getElementById("city") && document.getElementById("city").value) || "",
        location: location,
        price: (function() {
          const priceEl = document.getElementById("price");
          if (priceEl) {
            const rawValue = priceEl.value.replace(/,/g, '');
            return parseInt(rawValue) || 0;
          }
          return 0;
        })(),
        property_type: (document.getElementById("type") && document.getElementById("type").value || "").trim(),
        listing_type: (document.getElementById("listing") && document.getElementById("listing").value || "").trim(),
        bedrooms: isPlot ? 0 : parseInt((document.getElementById("beds") && document.getElementById("beds").value) || 0, 10),
        bathrooms: isPlot ? 0 : parseInt((document.getElementById("baths") && document.getElementById("baths").value) || 0, 10),
        size_sqft: parseInt((document.getElementById("size") && document.getElementById("size").value) || 0, 10),
        amenities: amenities,
        images: image_urls, 
        primary_image_index: 0,
        receipt_image_url: uploadedReceiptUrl || null,
        
        description: description || null,
        parking: isPlot ? false : parking,
        furnished: isPlot ? null : (furnished || null),
        total_floors: isPlot ? null : totalFloors,
        electricity_backup: isPlot ? false : electricity_backup,
        year_built: isPlot ? null : yearBuilt,
      };

      if (!payload.title || !payload.location || !payload.price) {
        if (typeof showToast === "function") showToast("Please fill in title, location and price.", "error");
        else alert("Please fill in title, location and price.");
        setButtonLoading(false);
        return;
      }

      const isFreeLocation = (location.toLowerCase().indexOf("dha") >= 0 ||
        location.toLowerCase().indexOf("bahria town") >= 0 ||
        location.toLowerCase().indexOf("bahria") >= 0);

      // Only require receipt for paid listings
      if (!isFreeLocation && !uploadedReceiptUrl) {
        showToast('Please upload payment receipt', 'error');
        setButtonLoading(false);
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
          setButtonLoading(false);
          
          if (!res.ok) {
            if (typeof showToast === "function") showToast(data.message || "Failed to submit property.", "error");
            else alert(data.message || "Failed to submit property.");
            return;
          }
          
          let successMsg = "Property submitted for admin approval. You will see it in My Listings.";
          
          if (typeof showToast === "function") showToast(successMsg, "success");
          else alert(successMsg);
          
          // Redirect to my listings after successful submission
          setTimeout(() => {
            window.location.href = "my-listings.html";
          }, 2000);
        })
        .catch(function (err) {
          console.error("Submit error:", err);
          setButtonLoading(false);
          if (typeof showToast === "function") showToast("An error occurred. Please try again.", "error");
          else alert("An error occurred. Please try again.");
        });
    }

    // Show confirmation only if payment is required
    if (totalAmount > 0) {
      if (typeof showConfirm === "function") {
        showConfirm(paymentMsg, doSubmit);
        setButtonLoading(false); // Button will be re-enabled if user cancels
        return;
      }
      if (!confirm(paymentMsg)) {
        setButtonLoading(false);
        return;
      }
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
        },
        body: formData
    });
    
    const data = await response.json();
    return data.image_urls;
}