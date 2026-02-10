/**
 * Mobile navbar toggle. Runs after DOM ready; listens for componentsLoaded
 * so that injected navbar markup is present.
 */
(function () {
  function initMobileNav() {
    var mobileMenuToggle = document.getElementById('mobileMenuToggle');
    var mobileMenu = document.getElementById('mobileMenu');
    if (!mobileMenuToggle || !mobileMenu) return;

    function closeMenu() {
      mobileMenu.classList.remove('active');
      mobileMenuToggle.classList.remove('active');
      mobileMenuToggle.innerHTML = '<i class="fas fa-bars"></i>';
      document.body.style.overflow = 'auto';
    }

    function openMenu() {
      mobileMenu.classList.add('active');
      mobileMenuToggle.classList.add('active');
      mobileMenuToggle.innerHTML = '<i class="fas fa-times"></i>';
      document.body.style.overflow = 'hidden';
    }

    function toggleMenu(e) {
      e.stopPropagation();
      if (mobileMenu.classList.contains('active')) {
        closeMenu();
      } else {
        openMenu();
      }
    }

    mobileMenuToggle.addEventListener('click', toggleMenu);

    mobileMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });

    document.addEventListener('click', function (e) {
      if (mobileMenu.classList.contains('active') &&
          !mobileMenu.contains(e.target) &&
          !mobileMenuToggle.contains(e.target)) {
        closeMenu();
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mobileMenu.classList.contains('active')) {
        closeMenu();
      }
    });
  }

  function run() {
    initMobileNav();
    if (typeof updateNavbarForAuth === "function") updateNavbarForAuth();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }

  document.addEventListener('componentsLoaded', run);
})();
