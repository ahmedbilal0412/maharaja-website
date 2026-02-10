document.addEventListener("DOMContentLoaded", function () {
  const contactForm = document.getElementById("contactForm");
  const messageEl = document.getElementById("contact-message");

  function showMessage(text, isError) {
    if (!messageEl) return;
    messageEl.textContent = text;
    messageEl.className = "form-message " + (isError ? "error" : "success");
    messageEl.style.display = text ? "block" : "none";
  }

  contactForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const requiredFields = ["firstName", "lastName", "email", "subject", "message"];
    let isValid = true;
    requiredFields.forEach(function (fieldId) {
      const field = document.getElementById(fieldId);
      if (!field.value.trim()) {
        field.style.borderColor = "#e74c3c";
        isValid = false;
      } else {
        field.style.borderColor = "";
      }
    });

    const emailField = document.getElementById("email");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailField.value && !emailRegex.test(emailField.value)) {
      emailField.style.borderColor = "#e74c3c";
      isValid = false;
    }

    if (!isValid) {
      showMessage("Please fill in all required fields correctly.", true);
      return;
    }

    showMessage("Thank you for your message! We have received your inquiry and will get back to you within 24 hours.", false);
    contactForm.reset();
    requiredFields.forEach(function (fieldId) {
      document.getElementById(fieldId).style.borderColor = "";
    });
  });

  contactForm.querySelectorAll("input, textarea").forEach(function (input) {
    input.addEventListener("input", function () {
      if (this.value.trim()) this.style.borderColor = "";
    });
  });
});
