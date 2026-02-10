/**
 * Custom toast and confirm – use instead of alert() and confirm().
 * Usage: showToast("Message"), showToast("Error", "error"), showConfirm("Are you sure?", function() { ... })
 */
(function (root) {
  var TOAST_DURATION = 4000;

  function ensureContainer() {
    var id = "notify-toast-container";
    var el = document.getElementById(id);
    if (!el) {
      el = document.createElement("div");
      el.id = id;
      el.className = "notify-toast-container";
      document.body.appendChild(el);
    }
    return el;
  }

  function showToast(message, type) {
    type = type || "info";
    var container = ensureContainer();
    var toast = document.createElement("div");
    toast.className = "notify-toast " + type;
    var icons = { success: "✓", error: "✕", info: "ℹ" };
    toast.innerHTML =
      '<span class="notify-icon">' +
      (icons[type] || icons.info) +
      "</span><span class=\"notify-message\">" +
      escapeHtml(String(message)) +
      "</span>";
    container.appendChild(toast);

    setTimeout(function () {
      toast.classList.add("hiding");
      setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 260);
    }, TOAST_DURATION);
  }

  function showConfirm(message, onConfirm, onCancel) {
    var overlay = document.createElement("div");
    overlay.className = "notify-modal-overlay";
    overlay.innerHTML =
      '<div class="notify-modal">' +
      '<p class="notify-modal-message">' +
      escapeHtml(String(message)) +
      "</p>" +
      '<div class="notify-modal-actions">' +
      '<button type="button" class="notify-modal-btn-cancel">Cancel</button>' +
      '<button type="button" class="notify-modal-btn-confirm">OK</button>' +
      "</div></div>";
    var modal = overlay.querySelector(".notify-modal");
    var btnCancel = overlay.querySelector(".notify-modal-btn-cancel");
    var btnConfirm = overlay.querySelector(".notify-modal-btn-confirm");

    function close(result) {
      overlay.remove();
      if (result && typeof onConfirm === "function") onConfirm();
      if (!result && typeof onCancel === "function") onCancel();
    }

    btnCancel.addEventListener("click", function () { close(false); });
    btnConfirm.addEventListener("click", function () { close(true); });
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) close(false);
    });
    document.body.appendChild(overlay);
  }

  function escapeHtml(s) {
    if (s == null) return "";
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  root.showToast = showToast;
  root.showConfirm = showConfirm;
})(typeof window !== "undefined" ? window : this);
