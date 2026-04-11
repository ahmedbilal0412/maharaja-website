(function() {
  const API_BASE = window.API_BASE || "https://api.maharajabuilders.pk/api";
  const form = document.getElementById("forgot-password-form");
  const messageEl = document.getElementById("message");
  const submitBtn = form.querySelector('button[type="submit"]');

  function showMessage(text, isError) {
    messageEl.textContent = text;
    messageEl.className = "form-message " + (isError ? "error" : "success");
    messageEl.style.display = "block";
  }

  function setLoading(isLoading) {
    if (isLoading) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner"></span> Sending...';
    } else {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Send Reset Link';
    }
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    showMessage("");

    const email = form.querySelector('input[name="email"]').value.trim();

    if (!email) {
      showMessage("Please enter your email address.", true);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/users/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      setLoading(false);

      if (response.ok) {
        showMessage(data.message, false);
        form.reset();
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