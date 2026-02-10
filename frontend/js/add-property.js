if (window.getToken && !window.getToken()) {
  window.location.href = "login.html";
}

const locationInput = document.getElementById("location");
const freeMsg = document.getElementById("freeListingMsg");
const paymentSection = document.getElementById("paymentSection");

if (locationInput) {
  locationInput.addEventListener("input", () => {
    const value = (locationInput.value || "").toLowerCase();
    if (value.includes("dha") || value.includes("bahria town") || value.includes("bahria")) {
      freeMsg.style.display = "block";
      paymentSection.style.display = "none";
    } else {
      freeMsg.style.display = "none";
      paymentSection.style.display = "block";
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
    var paymentMsg = "For locations other than DHA/Bahria Town, Rs. 500 payment is required (JazzCash/EasyPaisa: 0300-1234567). Have you made the payment?";

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
      var amenities = [];
      form.querySelectorAll('.checkbox-group input[type="checkbox"]:checked').forEach(function (cb) {
        if (cb.value) amenities.push(cb.value);
      });

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
        primary_image_index: 0  // First image is primary
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
          var msg = isFreeLocation
            ? "Property listed successfully!"
            : "Property submitted for admin approval. You will see it in My Listings.";
          if (typeof showToast === "function") showToast(msg, "success");
          else alert(msg);
        })
        .catch(function (err) {
          console.error("Submit error:", err);
          if (typeof showToast === "function") showToast("An error occurred. Please try again.", "error");
          else alert("An error occurred. Please try again.");
        });
    }

    if (!isFreeLocation && paymentSection && paymentSection.style.display !== "none") {
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