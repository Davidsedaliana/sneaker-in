/* ============================================================
   SNEAKER INTERACTION — shared behaviour
   Showcase only: products + catalog. No cart. Telegram only.
   ============================================================ */
(function () {
  const TG = "https://t.me/sneaker_interaction";

  /* products via store (falls back to defaults) */
  function products() {
    return window.SI_store ? window.SI_store.getProducts() : window.SI_PRODUCTS || [];
  }
  window.SI_products = products;

  /* ---------- order link (ask for price) ---------- */
  window.SI_orderLink = function (p, size) {
    const txt = encodeURIComponent(
      `Здравствуйте! Подскажите цену и наличие:\n${p.brand} — ${p.name}\nАртикул: ${p.sku}` +
        (size ? `\nРазмер: ${size}` : ``),
    );
    return `${TG}?text=${txt}`;
  };
  window.SI_TG = TG;

  /* ---------- badge html ---------- */
  function badgeHTML(p) {
    if (p.badge === "hot") return `<span class="badge badge--hot">Дроп</span>`;
    if (p.badge === "order") return `<span class="badge badge--order">Под заказ</span>`;
    return `<span class="badge badge--stock"><span class="dot"></span>В наличии</span>`;
  }
  window.SI_badgeHTML = badgeHTML;

  /* ---------- product card ---------- */
  window.SI_card = function (p) {
    const stock = p.inStock && p.inStock.length ? "В наличии" : "Под заказ";
    return `
    <a class="card" href="product.html?id=${p.id}" data-id="${p.id}">
      <div class="card__media">
        <div class="card__badges">${badgeHTML(p)}</div>
        <img data-src="${p.img}" alt="${p.name}" decoding="async">
      </div>
      <div class="card__body">
        <div class="card__brand">${p.brand} · ${p.model}</div>
        <div class="card__name">${p.name}</div>
        <div class="card__row">
          <span class="card__avail">${stock}</span>
          <span class="card__ask">Цена по запросу</span>
        </div>
      </div>
    </a>`;
  };

  /* ---------- smart image preloading ----------
     Load product photos ~one screen ahead so they're ready
     before they scroll into view (no visible pop-in / wait). */
  const imgObserver =
    "IntersectionObserver" in window
      ? new IntersectionObserver(
          (entries, obs) => {
            entries.forEach((en) => {
              if (!en.isIntersecting) return;
              loadImg(en.target);
              obs.unobserve(en.target);
            });
          },
          { rootMargin: "900px 0px" },
        )
      : null;
  function loadImg(img) {
    const ds = img.getAttribute("data-src");
    if (!ds) return;
    img.addEventListener("load", () => img.classList.add("is-loaded"), { once: true });
    img.addEventListener("error", () => img.classList.add("is-loaded"), { once: true });
    img.src = ds;
    img.removeAttribute("data-src");
  }
  function observeImages(root) {
    const imgs = [...(root || document).querySelectorAll("img[data-src]")];
    if (!imgs.length) return;
    if (!imgObserver) {
      imgs.forEach(loadImg);
      return;
    }
    imgs.forEach((im) => imgObserver.observe(im));
    /* safety net: never leave an image permanently blank */
    clearTimeout(observeImages._t);
    observeImages._t = setTimeout(() => {
      document.querySelectorAll("img[data-src]").forEach(loadImg);
    }, 1400);
  }
  window.SI_observeImages = observeImages;
  /* eagerly resolve every pending image (used before printing) */
  window.SI_loadAllImages = function () {
    document.querySelectorAll("img[data-src]").forEach(loadImg);
  };

  /* ---------- icons ---------- */
  const ICONS = {
    search:
      '<path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.3-4.3" fill="none" stroke="currentColor" stroke-width="2"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="2"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2"/>',
    tg: '<path d="M21 5 3 12l5 2 2 6 3-4 4 3 4-14Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
    check: '<path d="M5 12l5 5 9-11" fill="none" stroke="currentColor" stroke-width="2"/>',
    close: '<path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2"/>',
    sliders:
      '<path d="M4 8h10M18 8h2M4 16h2M10 16h10M14 5v6M6 13v6" stroke="currentColor" stroke-width="2" fill="none"/>',
  };
  function icon(n) {
    return `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ""}</svg>`;
  }
  window.SI_icon = icon;

  /* ---------- toast ---------- */
  window.SI_toast = function (msg) {
    let t = document.querySelector(".si-toast");
    if (!t) {
      t = document.createElement("div");
      t.className = "si-toast";
      document.body.appendChild(t);
    }
    t.innerHTML = `${icon("check")}<span>${msg}</span>`;
    t.classList.add("show");
    clearTimeout(t._h);
    t._h = setTimeout(() => t.classList.remove("show"), 2600);
  };

  /* ---------- SEARCH OVERLAY ---------- */
  const CAT_LABELS = {
    sneakers: "Кроссовки",
    apparel: "Одежда",
    accessories: "Аксессуары",
    eyewear: "Очки",
    collectibles: "Коллекционное",
  };
  function buildSearch() {
    if (document.getElementById("siSearch")) return;
    const el = document.createElement("div");
    el.id = "siSearch";
    el.className = "si-search";
    el.innerHTML = `
      <div class="si-search__bg" data-sclose></div>
      <div class="si-search__panel" role="dialog" aria-label="Поиск по товарам">
        <div class="si-search__bar">
          <span class="si-search__ic">${icon("search")}</span>
          <input type="search" id="siSearchInput" placeholder="Поиск: бренд, модель, артикул…" autocomplete="off">
          <button class="si-search__close" data-sclose aria-label="Закрыть">${icon("close")}</button>
        </div>
        <div class="si-search__quick" id="siSearchQuick">
          <button data-sq="Nike SB">Nike SB</button>
          <button data-sq="Jordan">Jordan</button>
          <button data-sq="KITH">KITH</button>
          <button data-sq="Supreme">Supreme</button>
          <button data-sq="Oakley">Oakley</button>
        </div>
        <div class="si-search__results" id="siSearchResults"></div>
      </div>`;
    document.body.appendChild(el);

    const input = el.querySelector("#siSearchInput");
    const results = el.querySelector("#siSearchResults");

    function score(p, q) {
      const hay = [p.name, p.brand, p.model, p.colorway, p.sku, CAT_LABELS[p.cat] || ""]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    }
    function run(q) {
      q = (q || "").trim().toLowerCase();
      if (!q) {
        results.innerHTML = `<div class="si-search__hint">Начните вводить — например «dunk», «KITH», «очки» или артикул.</div>`;
        return;
      }
      const list = products()
        .filter((p) => score(p, q))
        .slice(0, 8);
      if (!list.length) {
        results.innerHTML = `<div class="si-search__hint">Ничего не найдено по запросу «${q}».</div>`;
        return;
      }
      results.innerHTML = list
        .map((p) => {
          const stock = p.inStock && p.inStock.length ? "В наличии" : "Под заказ";
          return `<a class="si-res" href="product.html?id=${p.id}">
          <span class="si-res__img"><img src="${p.img}" alt=""></span>
          <span class="si-res__txt">
            <span class="si-res__brand">${p.brand} · ${CAT_LABELS[p.cat] || ""}</span>
            <span class="si-res__name">${p.name}</span>
          </span>
          <span class="si-res__stock">${stock}</span>
        </a>`;
        })
        .join("");
    }
    input.addEventListener("input", () => run(input.value));
    el.querySelectorAll("[data-sq]").forEach((b) =>
      b.addEventListener("click", () => {
        input.value = b.dataset.sq;
        run(b.dataset.sq);
        input.focus();
      }),
    );
    el.querySelectorAll("[data-sclose]").forEach((b) => b.addEventListener("click", closeSearch));
    run("");
  }
  function openSearch() {
    buildSearch();
    const el = document.getElementById("siSearch");
    el.classList.add("open");
    document.documentElement.style.overflow = "hidden";
    setTimeout(() => document.getElementById("siSearchInput").focus(), 60);
  }
  function closeSearch() {
    const el = document.getElementById("siSearch");
    if (el) el.classList.remove("open");
    document.documentElement.style.overflow = "";
  }
  window.SI_openSearch = openSearch;
  window.SI_closeSearch = closeSearch;

  /* ---------- MOBILE MENU ---------- */
  function buildMenu() {
    if (document.getElementById("siMenu")) return;
    const el = document.createElement("div");
    el.id = "siMenu";
    el.className = "si-menu";
    el.innerHTML = `
      <div class="si-menu__bg" data-mclose></div>
      <nav class="si-menu__panel" aria-label="Меню">
        <button class="si-menu__close" data-mclose aria-label="Закрыть">${icon("close")}</button>
        <a href="index.html">Главная</a>
        <a href="catalog.html">Каталог</a>
        <a href="catalog.html?cat=sneakers">Кроссовки</a>
        <a href="catalog.html?cat=apparel">Одежда</a>
        <a href="catalog.html?cat=accessories">Аксессуары</a>
        <a href="catalog.html?cat=eyewear">Очки</a>
        <a href="catalog.html?cat=collectibles">Коллекционное</a>
        <a href="index.html#order">Как заказать</a>
        <a class="si-menu__tg" href="${TG}" target="_blank" rel="noopener">${icon("tg")} Telegram</a>
      </nav>`;
    document.body.appendChild(el);
    el.querySelectorAll("[data-mclose]").forEach((b) => b.addEventListener("click", closeMenu));
  }
  function openMenu() {
    buildMenu();
    document.getElementById("siMenu").classList.add("open");
    document.documentElement.style.overflow = "hidden";
  }
  function closeMenu() {
    const el = document.getElementById("siMenu");
    if (el) el.classList.remove("open");
    document.documentElement.style.overflow = "";
  }
  window.SI_openMenu = openMenu;

  /* ---------- global wiring ---------- */
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeSearch();
      closeMenu();
    }
  });
  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-search-open],#navSearch").forEach((b) => {
      b.addEventListener("click", (e) => {
        e.preventDefault();
        openSearch();
      });
    });
    document.querySelectorAll("[data-menu-open],#navBurger").forEach((b) => {
      b.addEventListener("click", (e) => {
        e.preventDefault();
        openMenu();
      });
    });
    /* observe existing + future product images */
    observeImages(document);
    const mo = new MutationObserver((muts) => {
      for (const m of muts) {
        if (m.addedNodes && m.addedNodes.length) {
          observeImages(document);
          break;
        }
      }
    });
    if (document.body) mo.observe(document.body, { childList: true, subtree: true });
  });

  /* strictly B/W — clear any legacy accent override */
  try {
    localStorage.removeItem("si_accent");
  } catch (e) {}
})();

/* ============================================================
   SCROLL REVEAL
   Adds a soft fade-up to key sections as they enter the viewport.
   The hidden state is applied from JS, so the page degrades to
   fully-visible content when JavaScript or IntersectionObserver
   is unavailable.
   ============================================================ */
(function () {
  function initReveal() {
    if (
      !("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const targets = document.querySelectorAll(
      ".sec-head, .cats, .edit, .order__in, .heroA__txt, .heroA__feat, .related",
    );
    if (!targets.length) return;

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("si-in");
          obs.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.05 },
    );

    targets.forEach((el) => {
      el.classList.add("si-reveal");
      observer.observe(el);
    });

    /* safety net: never leave a section permanently hidden */
    setTimeout(() => {
      document
        .querySelectorAll(".si-reveal:not(.si-in)")
        .forEach((el) => el.classList.add("si-in"));
    }, 2500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initReveal);
  } else {
    initReveal();
  }
})();
