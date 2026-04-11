(function () {
  // Detect if we're on localhost
  const isLocal = window.location.hostname === 'localhost' || 
                  window.location.hostname === '127.0.0.1';
  
  // Set base URL based on environment
  let base = isLocal 
    ? 'http://localhost:5000/api' 
    : 'https://maharajabuilders.pk/api';
  
  
  // Allow override via window.__API_BASE__ (highest priority)
  if (typeof window !== "undefined" && window.__API_BASE__) {
    base = window.__API_BASE__;
  }
  
  // Set the global variable
  if (typeof window !== "undefined") {
    window.API_BASE = base.replace(/\/$/, "");
  }
})();