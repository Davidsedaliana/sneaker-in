const P = window.SI_products(),
  fmt = window.SI_FMT,
  icon = window.SI_icon;

/* fill data-icon placeholders */
document.querySelectorAll("[data-icon]").forEach((el) => (el.innerHTML = icon(el.dataset.icon)));
document.getElementById("navSearch").innerHTML = icon("search");
document.getElementById("navBurger").innerHTML = icon("menu");
/* contact links */
document.getElementById("tgBtn").href = SI_TG;
document.getElementById("tgFoot").href = SI_TG;

/* drops grid (badge hot or drop:true), 4 */
const drops = P.filter((p) => p.drop).slice(0, 4);
document.getElementById("dropsGrid").innerHTML = drops.map(SI_card).join("");

/* all grid — mix across categories (8) */
const mixIds = [
  "parra-sb",
  "tee-venom",
  "sun-black",
  "hoodie-supreme",
  "jarritos-sb",
  "tee-sopranos",
  "ball-green",
  "cap-superman",
];
const mix = mixIds.map((id) => P.find((p) => p.id === id)).filter(Boolean);
document.getElementById("allGrid").innerHTML = mix.map(SI_card).join("");

/* marquee */
const words = [
  "Nike SB",
  "★",
  "Air Jordan",
  "★",
  "KITH",
  "★",
  "Supreme",
  "★",
  "Oakley",
  "★",
  "Parra",
  "★",
  "Travis Scott",
  "★",
  "NBA",
  "★",
];
const marqHTML = `<span>${words.map((w) => (w === "★" ? '<span class="star">✦</span>' : w)).join("</span><span>")}</span>`;
document.getElementById("marq").innerHTML = marqHTML + marqHTML;
