(function() {
  const API_BASE = window.API_BASE || "https://maharajabuilders.pk/api";
  const form = document.getElementById("reset-password-form");
  const messageEl = document.getElementById("message");
  const submitBtn = form.querySelector('button[type="submit"]');

  // Get token from URL
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("token");

  if (!token) {
    messageEl.textContent = "Invalid or missing reset token.";
    messageEl.className = "form-message error";
    messageEl.style.display = "block";
    submitBtn.disabled = true;
  }

  function showMessage(text, isError) {
    messageEl.textContent = text;
    messageEl.className = "form-message " + (isError ? "error" : "success");
    messageEl.style.display = "block";
  }

  function setLoading(isLoading) {
    if (isLoading) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner"></span> Resetting...';
    } else {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Reset Password';
    }
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    showMessage("");

    const newPassword = form.querySelector('input[name="new_password"]').value;
    const confirmPassword = form.querySelector('input[name="confirm_password"]').value;

    if (!newPassword || !confirmPassword) {
      showMessage("Please fill in both password fields.", true);
      return;
    }

    if (newPassword !== confirmPassword) {
      showMessage("Passwords do not match.", true);
      return;
    }

    if (newPassword.length < 6) {
      showMessage("Password must be at least 6 characters.", true);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/users/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: newPassword })
      });

      const data = await response.json();
      setLoading(false);

      if (response.ok) {
        showMessage(data.message, false);
        setTimeout(() => {
          window.location.href = "login.html";
        }, 2000);
      } else {
        showMessage(data.message || "Something went wrong.", true);
      }
    } catch (err) {
      console.error("Error:", err);
      setLoading(false);
      showMessage("Network error. Please try again.", true);
    }
  });
})();