(function() {
  if (!getToken()) {
    window.location.href = "login.html";
    return;
  }

  const API_BASE = window.API_BASE || "https://maharajabuilders.pk/api";
  const form = document.getElementById("change-password-form");
  const submitBtn = form.querySelector('button[type="submit"]');

  function showToastMessage(message, type) {
    if (typeof showToast === "function") {
      showToast(message, type);
    } else {
      alert(message);
    }
  }

  function setLoading(isLoading) {
    if (isLoading) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner"></span> Changing...';
    } else {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Change Password';
    }
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const currentPassword = document.getElementById("current-password").value;
    const newPassword = document.getElementById("new-password").value;
    const confirmPassword = document.getElementById("confirm-password").value;

    if (!currentPassword || !newPassword) {
      showToastMessage("Please fill in all fields.", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      showToastMessage("New passwords do not match.", "error");
      return;
    }

    if (newPassword.length < 6) {
      showToastMessage("Password must be at least 6 characters.", "error");
      return;
    }

    const token = getToken();
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/users/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword
        })
      });

      const data = await response.json();
      setLoading(false);

      if (response.ok) {
        showToastMessage(data.message, "success");
        form.reset();
      } else if (response.status === 401) {
        showToastMessage(data.message || "Current password is incorrect.", "error");
      } else {
        showToastMessage(data.message || "Something went wrong.", "error");
      }
    } catch (err) {
      console.error("Error:", err);
      setLoading(false);
      showToastMessage("Network error. Please try again.", "error");
    }
  });
})();