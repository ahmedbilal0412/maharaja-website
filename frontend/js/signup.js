(function () {
  const API_BASE = window.API_BASE || "https://maharaja-website.onrender.com";
  const form = document.getElementById("signup-form");
  const messageEl = document.getElementById("signup-message");
  if (!form) return;

  function showMessage(text, isError) {
    if (!messageEl) return;
    messageEl.textContent = text;
    messageEl.className = "form-message " + (isError ? "error" : "success");
    messageEl.style.display = text ? "block" : "none";
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    showMessage("");

    const full_name = (form.querySelector('input[name="fullName"]').value || "").trim();
    const email = (form.querySelector('input[name="email"]').value || "").trim();
    const phone = (form.querySelector('input[name="phone"]').value || "").trim();
    const password = (form.querySelector('input[name="password"]').value || "").trim();
    const confirmPassword = (form.querySelector('input[name="confirmPassword"]').value || "").trim();

    if (password !== confirmPassword) {
      showMessage("Passwords do not match.", true);
      return;
    }
    if (password.length < 6) {
      showMessage("Password must be at least 6 characters.", true);
      return;
    }

    const userData = { full_name, email, phone, password };

    try {
      const res = await fetch(`${API_BASE}/users/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });
      const data = await res.json();

      if (!res.ok) {
        showMessage(data.message || "Signup failed.", true);
        return;
      }

      showMessage("Account created! Redirecting to login…", false);
      setTimeout(() => { window.location.href = "login.html"; }, 1200);
    } catch (err) {
      console.error("Signup error:", err);
      showMessage("An error occurred. Please try again.", true);
    }
  });
})();
