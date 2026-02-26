(function () {  
  const metaTag = document.querySelector('meta[name="api-base"]');
  
  var base =
    (typeof window !== "undefined" && window.__API_BASE__) ||
    (typeof document !== "undefined" &&
      metaTag &&
      metaTag.getAttribute("content")) ||
    "http://localhost:5000/api";
  
  if (typeof window !== "undefined") window.API_BASE = base.replace(/\/$/, "");
  
})();