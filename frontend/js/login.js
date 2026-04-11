(function () {
  const API_BASE = window.API_BASE || "https://api.maharajabuilders.pk/api";
  const form = document.getElementById("login-form");
  const messageEl = document.getElementById("login-message");
  const submitBtn = form ? form.querySelector('button[type="submit"]') : null;
  
  if (!form) return;

  function showMessage(text, isError) {
    if (!messageEl) return;
    messageEl.textContent = text;
    messageEl.className = "form-message " + (isError ? "error" : "success");
    messageEl.style.display = text ? "block" : "none";
  }

  function setLoading(isLoading) {
    if (!submitBtn) return;
    
    if (isLoading) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner"></span> Logging in...';
    } else {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Login';
    }
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    showMessage("");
    
    const email = (form.querySelector('input[name="email"]').value || "").trim();
    const password = form.querySelector('input[name="password"]').value || "";

    if (!email || !password) {
      showMessage("Please enter email and password.", true);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      setLoading(false);

      if (!res.ok) {
        showMessage(data.message || "Login failed.", true);
        return;
      }

      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user || {}));
      }
      showMessage("Login successful! Redirecting…", false);
      const redirect = (data.user && data.user.is_admin) ? "admin-dashboard.html" : "dashboard.html";
      setTimeout(() => { window.location.href = redirect; }, 800);
    } catch (err) {
      console.error("Login error:", err);
      setLoading(false);
      showMessage("An error occurred. Please try again.", true);
    }
  });
})();