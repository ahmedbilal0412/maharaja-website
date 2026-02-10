/**
 * Loads HTML partials into elements with data-include="path/to/file.html".
 * Run once on DOMContentLoaded. Ensures navbar/footer are loaded before navbar.js runs.
 */
(function () {
  function loadIncludes() {
    var placeholders = document.querySelectorAll('[data-include]');
    var promises = [];

    placeholders.forEach(function (el) {
      var path = el.getAttribute('data-include');
      if (!path) return;
      var promise = fetch(path)
        .then(function (res) {
          if (!res.ok) throw new Error('Failed to load ' + path);
          return res.text();
        })
        .then(function (html) {
          el.innerHTML = html;
          /* Update footer year if present */
          var yearEl = document.querySelector('.footer .current-year');
          if (yearEl) yearEl.textContent = new Date().getFullYear();
        })
        .catch(function (err) {
          console.error(err);
        });
      promises.push(promise);
    });

    return Promise.all(promises);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      loadIncludes().then(function () {
        document.dispatchEvent(new CustomEvent('componentsLoaded'));
      });
    });
  } else {
    loadIncludes().then(function () {
      document.dispatchEvent(new CustomEvent('componentsLoaded'));
    });
  }
})();
