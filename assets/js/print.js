const P = window.SI_products(),
  icon = window.SI_icon,
  CATS = window.SI_CATS;
document.querySelectorAll("[data-icon]").forEach((el) => (el.innerHTML = icon(el.dataset.icon)));
document.getElementById("navSearch").innerHTML = icon("search");
document.getElementById("navBurger").innerHTML = icon("menu");
document.getElementById("fClose").innerHTML = icon("close");
document.getElementById("tgFoot").href = SI_TG;

/* state */
const state = {
  cats: new Set(),
  brands: new Set(),
  sizes: new Set(),
  stock: false,
  drop: false,
  sort: "featured",
};

/* preset from query */
const q = new URLSearchParams(location.search);
if (q.get("cat") && CATS[q.get("cat")]) state.cats.add(q.get("cat"));
if (q.get("brand")) state.brands.add(q.get("brand"));
if (q.get("drop")) state.drop = true;

/* build category filter */
const catKeys = Object.keys(CATS);
document.getElementById("fCat").innerHTML = catKeys
  .map((k) => {
    const n = P.filter((p) => p.cat === k).length;
    return `<label class="fopt"><input type="checkbox" data-cat value="${k}" ${state.cats.has(k) ? "checked" : ""}> ${CATS[k].label}<span class="c">${n}</span></label>`;
  })
  .join("");

/* build brand filter */
const brands = [...new Set(P.map((p) => p.brand))];
function renderBrands() {
  document.getElementById("fBrand").innerHTML = brands
    .map((b) => {
      const n = P.filter((p) => p.brand === b).length;
      return `<label class="fopt"><input type="checkbox" value="${b}" ${state.brands.has(b) ? "checked" : ""}> ${b}<span class="c">${n}</span></label>`;
    })
    .join("");
}
renderBrands();

/* build sizes (depends on active categories) */
function renderSizes() {
  const pool = state.cats.size ? P.filter((p) => state.cats.has(p.cat)) : P;
  const types = [...new Set(pool.map((p) => p.sizeType))];
  let sizes;
  if (types.length === 1 && types[0] === "one") {
    document.getElementById("sizeGroup").style.display = "none";
    return;
  }
  document.getElementById("sizeGroup").style.display = "";
  // collect sizes from non-'one' products
  const sneaker = pool.some((p) => p.sizeType === "eu");
  const appar = pool.some((p) => p.sizeType === "apparel");
  document.getElementById("sizeHead").textContent =
    sneaker && !appar ? "Размер · EU" : appar && !sneaker ? "Размер" : "Размер";
  const set = new Set();
  pool.forEach((p) => {
    if (p.sizeType !== "one") p.sizes.forEach((s) => set.add(s));
  });
  const order = ["XS", "S", "M", "L", "XL", "XXL"];
  sizes = [...set].sort((a, b) => {
    const ai = order.indexOf(a),
      bi = order.indexOf(b);
    if (ai >= 0 && bi >= 0) return ai - bi;
    if (ai >= 0) return -1;
    if (bi >= 0) return 1;
    return +a - +b;
  });
  document.getElementById("fSizes").innerHTML = sizes
    .map(
      (s) =>
        `<button class="sz" data-sz="${s}" aria-pressed="${state.sizes.has(String(s))}">${s}</button>`,
    )
    .join("");
}
renderSizes();
document.getElementById("fDrop").checked = state.drop;

/* listeners */
document.getElementById("fCat").addEventListener("change", (e) => {
  const v = e.target.value;
  e.target.checked ? state.cats.add(v) : state.cats.delete(v);
  state.sizes.clear();
  renderSizes();
  render();
});
document.getElementById("fBrand").addEventListener("change", (e) => {
  const v = e.target.value;
  e.target.checked ? state.brands.add(v) : state.brands.delete(v);
  render();
});
document.getElementById("fSizes").addEventListener("click", (e) => {
  const b = e.target.closest(".sz");
  if (!b) return;
  const s = String(b.dataset.sz);
  const on = b.getAttribute("aria-pressed") === "true";
  b.setAttribute("aria-pressed", !on);
  on ? state.sizes.delete(s) : state.sizes.add(s);
  render();
});
document.getElementById("fStock").addEventListener("change", (e) => {
  state.stock = e.target.checked;
  render();
});
document.getElementById("fDrop").addEventListener("change", (e) => {
  state.drop = e.target.checked;
  render();
});
document.getElementById("sort").addEventListener("change", (e) => {
  state.sort = e.target.value;
  render();
});
document.getElementById("fReset").addEventListener("click", () => {
  state.cats.clear();
  state.brands.clear();
  state.sizes.clear();
  state.stock = false;
  state.drop = false;
  document.querySelectorAll("#fCat input,#fBrand input").forEach((i) => (i.checked = false));
  document.getElementById("fStock").checked = false;
  document.getElementById("fDrop").checked = false;
  document
    .querySelectorAll("[data-quick]")
    .forEach((c) => c.setAttribute("aria-pressed", c.dataset.quick === "all"));
  renderSizes();
  render();
});
/* quick chips */
document.querySelectorAll("[data-quick]").forEach((c) =>
  c.addEventListener("click", () => {
    document
      .querySelectorAll("[data-quick]")
      .forEach((x) => x.setAttribute("aria-pressed", "false"));
    c.setAttribute("aria-pressed", "true");
    state.cats.clear();
    state.brands.clear();
    state.drop = false;
    state.sizes.clear();
    document.querySelectorAll("#fBrand input").forEach((i) => (i.checked = false));
    const v = c.dataset.quick;
    if (v === "drop") state.drop = true;
    else if (v !== "all") state.cats.add(v);
    document.querySelectorAll("#fCat input").forEach((i) => (i.checked = state.cats.has(i.value)));
    renderSizes();
    render();
  }),
);
/* mobile drawer (filters) */
function openDrawer() {
  const f = document.getElementById("filters");
  f.classList.add("open");
  f.querySelector(".filters__close").style.display = "flex";
}
document.getElementById("mOpen").addEventListener("click", openDrawer);
document
  .getElementById("fClose")
  .addEventListener("click", () => document.getElementById("filters").classList.remove("open"));
/* (search + mobile menu handled globally by site.js) */

function render() {
  let list = P.filter((p) => {
    if (state.cats.size && !state.cats.has(p.cat)) return false;
    if (state.brands.size && !state.brands.has(p.brand)) return false;
    if (
      state.sizes.size &&
      !(p.sizeType !== "one" && p.sizes.some((s) => state.sizes.has(String(s))))
    )
      return false;
    if (state.stock && !(p.inStock && p.inStock.length)) return false;
    if (state.drop && !p.drop) return false;
    return true;
  });
  if (state.sort === "new") list.sort((a, b) => b.year - a.year);
  if (state.sort === "stock")
    list.sort(
      (a, b) => (b.inStock && b.inStock.length ? 1 : 0) - (a.inStock && a.inStock.length ? 1 : 0),
    );
  document.getElementById("count").textContent = `${list.length} ${plural(list.length)}`;
  const r = document.getElementById("results");
  r.innerHTML = list.length
    ? list.map(SI_card).join("")
    : `<div class="empty">Ничего не найдено. Сбросьте фильтры.</div>`;
  // title
  let t = "Каталог";
  if (state.drop && !state.cats.size && !state.brands.size) t = "Дропы";
  else if (state.cats.size === 1) t = CATS[[...state.cats][0]].label;
  else if (state.brands.size === 1) t = [...state.brands][0];
  document.getElementById("catTitle").textContent = t;
  document.getElementById("crumbLast").textContent = t;
}
function plural(n) {
  const a = Math.abs(n) % 100,
    b = n % 10;
  if (a > 10 && a < 20) return "товаров";
  if (b > 1 && b < 5) return "товара";
  if (b === 1) return "товар";
  return "товаров";
}
render();

/* ---- auto-print: force-load ALL images, wait for fonts, then print ---- */
(function () {
  if (window.SI_loadAllImages) window.SI_loadAllImages();
  function imagesReady() {
    const imgs = [...document.querySelectorAll("#results img, .print-head img")];
    if (!imgs.length) return Promise.resolve();
    return Promise.all(
      imgs.map((im) =>
        im.complete
          ? Promise.resolve()
          : new Promise((r) => {
              im.onload = im.onerror = r;
            }),
      ),
    );
  }
  function go() {
    setTimeout(() => window.print(), 500);
  }
  Promise.resolve(document.fonts && document.fonts.ready)
    .then(() => imagesReady())
    .then(() => {
      if (document.readyState === "complete") go();
      else window.addEventListener("load", go, { once: true });
    });
})();
