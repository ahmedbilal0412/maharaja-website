/**
 * Home page (index) only: UAE modal and country card behavior.
 * Run after DOM ready; modal and cards are always in the page.
 */
(function () {
  function openUaeModal() {
    var modal = document.getElementById('uaeModal');
    if (!modal) return;
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    setTimeout(function () {
      modal.style.animation = 'fadeIn 0.3s ease';
    }, 10);
  }

  function closeUaeModal() {
    var modal = document.getElementById('uaeModal');
    if (!modal) return;
    modal.style.animation = 'fadeOut 0.3s ease';
    setTimeout(function () {
      modal.style.display = 'none';
      document.body.style.overflow = 'auto';
    }, 300);
  }

  function init() {
    var modal = document.getElementById('uaeModal');
    if (modal) {
      modal.addEventListener('click', function (e) {
        if (e.target === this) closeUaeModal();
      });
    }
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeUaeModal();
    });

    document.querySelectorAll('.country-card').forEach(function (card) {
      card.addEventListener('click', function (e) {
        if (!e.target.closest('button') && !e.target.closest('a')) {
          if (this.classList.contains('pakistan-card')) {
            window.location.href = 'buy-pakistan.html';
          } else if (this.classList.contains('uae-card')) {
            openUaeModal();
          }
        }
      });
    });
  }

  window.openUaeModal = openUaeModal;
  window.closeUaeModal = closeUaeModal;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
