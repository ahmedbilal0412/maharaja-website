if (window.getToken && !window.getToken()) {
  window.location.href = "login.html";
}

const locationInput = document.getElementById("location");
const freeMsg = document.getElementById("freeListingMsg");
const paymentSection = document.getElementById("paymentSection");
const premiumCheckbox = document.getElementById("isPremium");
const basePaymentSpan = document.getElementById("basePaymentAmount");

// Function to update payment amount based on location and premium selection
function updatePaymentAmount() {
  if (!paymentSection || paymentSection.style.display === "none") return;
  
  const value = (locationInput?.value || "").toLowerCase();
  const isFreeLocation = value.includes("dha") || value.includes("bahria town") || value.includes("bahria");
  const isPremium = premiumCheckbox ? premiumCheckbox.checked : false;
  
  let baseAmount = 500;
  if (isFreeLocation && !isPremium) {
    baseAmount = 0;
  } else if (isFreeLocation && isPremium) {
    baseAmount = 500; // Premium only
  } else if (!isFreeLocation && !isPremium) {
    baseAmount = 500; // Location fee only
  } else {
    baseAmount = 1000; // Both location fee + premium
  }
  
  const totalAmount = baseAmount;
  
  if (basePaymentSpan) {
    basePaymentSpan.textContent = totalAmount;
  }
  
  // Update payment message based on what's being paid for
  const paymentInfo = paymentSection.querySelector('.payment-info');
  if (paymentInfo) {
    let message = "Send payment to: <strong>0300-1234567</strong><br>Once paid, click \"Submit for Approval\".";
    
    if (isFreeLocation && isPremium) {
      message += "<br><strong>Note: Premium listing fee (PKR 500) only.</strong>";
    } else if (!isFreeLocation && !isPremium) {
      message += "<br><strong>Note: Standard listing fee (PKR 500).</strong>";
    } else if (!isFreeLocation && isPremium) {
      message += "<br><strong>Note: Standard listing fee + Premium listing fee (PKR 1,000 total).</strong>";
    }
    
    paymentInfo.innerHTML = message;
  }
}

if (locationInput) {
  locationInput.addEventListener("input", () => {
    const value = (locationInput.value || "").toLowerCase();
    const isPremium = premiumCheckbox ? premiumCheckbox.checked : false;
    const isFreeLocation = value.includes("dha") || value.includes("bahria town") || value.includes("bahria");
    
    // Show payment if:
    // 1. Premium is selected (regardless of location), OR
    // 2. Location is not free
    if (isPremium || !isFreeLocation) {
      freeMsg.style.display = "none";
      paymentSection.style.display = "block";
      updatePaymentAmount();
    } else {
      freeMsg.style.display = "block";
      paymentSection.style.display = "none";
    }
  });
}

// Listen for premium checkbox change
if (premiumCheckbox) {
  premiumCheckbox.addEventListener("change", () => {
    const value = (locationInput?.value || "").toLowerCase();
    const isFreeLocation = value.includes("dha") || value.includes("bahria town") || value.includes("bahria");
    const isPremium = premiumCheckbox.checked;
    
    // Show payment if premium is selected OR location is not free
    if (isPremium || !isFreeLocation) {
      freeMsg.style.display = "none";
      paymentSection.style.display = "block";
      updatePaymentAmount();
    } else {
      freeMsg.style.display = "block";
      paymentSection.style.display = "none";
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
    
    const isPremium = premiumCheckbox ? premiumCheckbox.checked : false;
    
    // Calculate payment message based on scenario
    let paymentMsg = "";
    let totalAmount = 0;
    
    if (isFreeLocation && !isPremium) {
      // Free location, no premium - NO PAYMENT
      totalAmount = 0;
      paymentMsg = ""; // No payment needed
    } else if (isFreeLocation && isPremium) {
      // Free location, premium only
      totalAmount = 500;
      paymentMsg = `Premium listing fee: Rs. 500 (JazzCash/EasyPaisa: 0300-1234567).\n\nThis will give your property priority placement in search results.\n\nHave you made the payment?`;
    } else if (!isFreeLocation && !isPremium) {
      // Non-free location, no premium
      totalAmount = 500;
      paymentMsg = `Standard listing fee: Rs. 500 (JazzCash/EasyPaisa: 0300-1234567).\n\nHave you made the payment?`;
    } else {
      // Non-free location, premium
      totalAmount = 1000;
      paymentMsg = `Total payment required: Rs. 1000\n\n- Standard listing fee: Rs. 500\n- Premium listing fee: Rs. 500\n\nSend payment to: 0300-1234567 (JazzCash/EasyPaisa)\n\nYour property will get priority placement in search results!\n\nHave you made the payment?`;
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
        
        // New fields
        description: description || null,
        parking: parking,
        furnished: furnished || null,
        total_floors: totalFloors,
        electricity_backup: electricity_backup,
        year_built: yearBuilt,
        
        // Premium field
        is_premium: isPremium
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
          
          let successMsg = "";
          if (isFreeLocation && !isPremium) {
            successMsg = "Property listed successfully!";
          } else if (isFreeLocation && isPremium) {
            successMsg = "Property submitted for admin approval. Your premium listing is pending approval.";
          } else if (!isFreeLocation && !isPremium) {
            successMsg = "Property submitted for admin approval. You will see it in My Listings.";
          } else {
            successMsg = "Property submitted for admin approval. Your premium listing is pending approval and will appear at the top once approved!";
          }
          
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