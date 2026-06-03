/* Дожидаемся загрузки каталога (из облака или data.js), затем рендерим. */
window.SI_store.ready().then(function () {
  const P = window.SI_products(),
    icon = window.SI_icon;
  document.getElementById("navSearch").innerHTML = icon("search");
  document.getElementById("navBurger").innerHTML = icon("menu");
  document.getElementById("scClose").innerHTML = icon("close");
  document.getElementById("tgFoot").href = SI_TG;

  const id = new URLSearchParams(location.search).get("id") || P[0].id;
  const p = P.find((x) => x.id === id) || P[0];
  let selSize = null,
    mainIdx = 0;

  document.title = `${p.name} — Sneaker Interaction`;

  const galleryThumbs = p.gallery.length > 1 ? p.gallery : [p.img];

  document.getElementById("app").innerHTML = `
  <div class="crumb"><a href="index.html">Главная</a> / <a href="catalog.html?cat=${p.cat}">${(window.SI_CATS[p.cat] || {}).label || p.brand}</a> / ${p.name}</div>
  <div class="pd">
    <div class="gallery">
      <div class="thumbs" id="thumbs">
        ${galleryThumbs.map((g, i) => `<div class="thumb" data-i="${i}" aria-pressed="${i === 0}"><img src="${g}" alt=""></div>`).join("")}
      </div>
      <div class="main-img">
        <div class="badges">${SI_badgeHTML(p)}</div>
        <img id="mainImg" src="${galleryThumbs[0]}" alt="${p.name}">
      </div>
    </div>
    <div class="info">
      <div class="brand">${p.brand} · ${p.model}</div>
      <h1>${p.name}</h1>
      <div class="meta">
        <span>Артикул <b>${p.sku}</b></span>
        <span>Расцветка <b>${p.colorway}</b></span>
        <span>Год <b>${p.year}</b></span>
      </div>
      <div class="price-block">
        <span class="now">Цена по запросу</span>
        <span class="note">${p.inStock && p.inStock.length ? "в наличии" : "под заказ · 7–14 дней"}</span>
      </div>
      <p style="font-family:var(--mono);font-size:12px;color:var(--gray-1);line-height:1.6;margin:8px 0 0;max-width:42ch">${p.sizeType === "one" ? "Актуальную цену и наличие уточняйте в Telegram — ответим за пару минут." : "Цена зависит от размера и курса — напишите нам в Telegram, ответим за пару минут."}</p>

      ${
        p.sizeType === "one"
          ? ""
          : `
      <div class="size-head">
        <h3>${p.sizeType === "eu" ? "Размер · EU" : "Размер"}</h3>
        ${p.sizeType === "eu" ? '<button id="openSC">Размерная сетка ↗</button>' : ""}
      </div>
      <div class="size-grid" id="sizeGrid">
        ${p.sizes
          .map((s) => {
            const inS = p.inStock.includes(s);
            return `<button class="sz" data-sz="${s}" ${inS ? "" : "disabled"} aria-pressed="false">${s}</button>`;
          })
          .join("")}
      </div>
      <div class="size-note">
        <span><i style="background:var(--ink)"></i> в наличии</span>
        <span><i style="background:repeating-linear-gradient(135deg,#fff,#fff 3px,#eee 3px,#eee 6px);border:1px solid var(--line)"></i> под заказ</span>
      </div>`
      }

      <div class="actions">
        <a class="btn btn--lg btn--tg btn--block" id="orderTG" target="_blank" rel="noopener"><span id="tgIc"></span> Узнать цену в Telegram</a>
      </div>

      <div class="trust">
        <div><b>100% оригинал</b><span>Проверка перед отправкой</span></div>
        <div><b>Доставка 1–3 дня</b><span>СДЭК и курьер, по всей России</span></div>
      </div>

      <div class="acc">
        <details open><summary>Описание <span class="pm">+</span></summary>
          <div class="body">${p.brand} ${p.model} — ${p.name}. Оригинал. Расцветка ${p.colorway}. Состояние — новое, с бирками${p.cat === "sneakers" ? " и фирменной коробкой" : ""}.</div>
        </details>
        ${
          p.sizeType === "eu"
            ? `
        <details><summary>Размерная таблица <span class="pm">+</span></summary>
          <div class="body">
            <table>
              <tr><th>EU</th><th>US</th><th>UK</th><th>CM</th></tr>
              <tr><td>40</td><td>7</td><td>6</td><td>25.0</td></tr>
              <tr><td>42</td><td>8.5</td><td>7.5</td><td>26.5</td></tr>
              <tr><td>44</td><td>10</td><td>9</td><td>28.0</td></tr>
              <tr><td>46</td><td>12</td><td>11</td><td>30.0</td></tr>
            </table>
          </div>
        </details>`
            : ""
        }
        <details><summary>Доставка и оплата <span class="pm">+</span></summary>
          <div class="body">Москва — курьер в день заказа. Регионы — СДЭК 1–3 дня. Оплата при получении или переводом. Бронь после подтверждения наличия.</div>
        </details>
        <details><summary>Проверка оригинала <span class="pm">+</span></summary>
          <div class="body">Каждая пара проходит аутентификацию: проверка бирок, кода, качества пошива и коробки. По запросу пришлём фото и видео реальной пары.</div>
        </details>
      </div>
    </div>
  </div>

  <section class="related">
    <div class="sec-head"><div class="sec-head__t"><span class="eyebrow">Похожее</span><h2 class="display h-l">С этим берут</h2></div>
      <a class="link-arrow" href="catalog.html">Весь каталог <span id="arrIc"></span></a></div>
    <div class="grid" id="related"></div>
  </section>
`;

  document.getElementById("tgIc").innerHTML = icon("tg");
  document.getElementById("arrIc").innerHTML = icon("arrow");

  /* gallery */
  document.getElementById("thumbs").addEventListener("click", (e) => {
    const t = e.target.closest(".thumb");
    if (!t) return;
    mainIdx = +t.dataset.i;
    document.getElementById("mainImg").src = galleryThumbs[mainIdx];
    document.querySelectorAll(".thumb").forEach((x) => x.setAttribute("aria-pressed", x === t));
  });

  /* sizes */
  const grid = document.getElementById("sizeGrid");
  if (grid)
    grid.addEventListener("click", (e) => {
      const b = e.target.closest(".sz");
      if (!b || b.disabled) return;
      selSize = b.dataset.sz;
      document
        .querySelectorAll("#sizeGrid .sz")
        .forEach((x) => x.setAttribute("aria-pressed", x === b));
      updateLinks();
    });
  function updateLinks() {
    document.getElementById("orderTG").href = SI_orderLink(p, selSize);
  }
  updateLinks();

  /* order guard */
  function guard(e) {
    if (p.sizeType !== "one" && !selSize) {
      e.preventDefault();
      SI_toast("Выберите размер");
      document.querySelector(".size-head")?.scrollIntoView({ block: "center" });
      return false;
    }
    return true;
  }
  document.getElementById("orderTG").addEventListener("click", guard);

  /* size chart modal (sneakers only) */
  const modal = document.getElementById("scModal");
  function openSC() {
    modal.classList.add("open");
  }
  function closeSC() {
    modal.classList.remove("open");
  }
  document.getElementById("openSC")?.addEventListener("click", openSC);
  document.getElementById("scLink")?.addEventListener("click", (e) => {
    e.preventDefault();
    openSC();
  });
  modal.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", closeSC));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeSC();
  });

  /* related — same category first */
  const rel = P.filter((x) => x.id !== p.id && x.cat === p.cat).slice(0, 4);
  const fill = P.filter((x) => x.id !== p.id && !rel.includes(x));
  while (rel.length < 4 && fill.length) rel.push(fill.shift());
  document.getElementById("related").innerHTML = rel.map(SI_card).join("");

  /* (search + mobile menu handled globally by site.js) */
});
