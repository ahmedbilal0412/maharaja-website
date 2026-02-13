/**
 * Frontend config. API base can be overridden via:
 * - <meta name="api-base" content="http://localhost:5000/api"> in the page, or
 * - window.__API_BASE__ set before this script runs.
 */
(function () {
  var base =
    (typeof window !== "undefined" && window.__API_BASE__) ||
    (typeof document !== "undefined" &&
      document.querySelector('meta[name="api-base"]') &&
      document.querySelector('meta[name="api-base"]').getAttribute("content")) ||
    "https://maharaja-website.onrender.com";
  if (typeof window !== "undefined") window.API_BASE = base.replace(/\/$/, "");
})();
