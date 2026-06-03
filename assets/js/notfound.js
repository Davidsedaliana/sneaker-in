/* ============================================================
   404 PAGE — wire up the shared nav icons.
   Search and mobile menu behaviour come from common.js.
   ============================================================ */
(function () {
  const icon = window.SI_icon;
  document.getElementById("navSearch").innerHTML = icon("search");
  document.getElementById("navBurger").innerHTML = icon("menu");
  document.getElementById("tgFoot").href = window.SI_TG;
})();
