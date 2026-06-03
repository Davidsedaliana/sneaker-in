/* ============================================================
   SNEAKER INTERACTION — каталог
   Фильтры, поиск, сортировка. Состояние хранится в одном
   объекте и синхронизируется с URL (ссылки можно шарить,
   работает кнопка «Назад»). Пока товары грузятся из облака —
   показываем скелетоны.
   ============================================================ */
(function () {
  const results = document.getElementById("results");

  // скелетоны на время загрузки каталога
  function skeletons(n) {
    let s = "";
    for (let i = 0; i < n; i++) {
      s +=
        '<div class="card-skel"><div class="card-skel__media"></div>' +
        '<div class="card-skel__line"></div><div class="card-skel__line short"></div></div>';
    }
    return s;
  }
  results.innerHTML = skeletons(9);

  window.SI_store.ready().then(function () {
    const P = window.SI_products(),
      icon = window.SI_icon,
      CATS = window.SI_CATS;

    document
      .querySelectorAll("[data-icon]")
      .forEach((el) => (el.innerHTML = icon(el.dataset.icon)));
    document.getElementById("navSearch").innerHTML = icon("search");
    document.getElementById("navBurger").innerHTML = icon("menu");
    document.getElementById("fClose").innerHTML = icon("close");
    document.getElementById("tgFoot").href = SI_TG;

    const CAT_LABELS = {};
    Object.keys(CATS).forEach((k) => (CAT_LABELS[k] = CATS[k].label));

    /* ---------- состояние ---------- */
    const state = {
      cats: new Set(),
      brands: new Set(),
      sizes: new Set(),
      stock: false,
      drop: false,
      q: "",
      sort: "featured",
    };

    function readURL() {
      const u = new URLSearchParams(location.search);
      state.cats = new Set((u.get("cat") || "").split(",").filter((k) => k && CATS[k]));
      state.brands = new Set((u.get("brand") || "").split(",").filter(Boolean));
      state.sizes = new Set((u.get("size") || "").split(",").filter(Boolean));
      state.stock = u.get("stock") === "1";
      state.drop = u.get("drop") === "1";
      state.q = u.get("q") || "";
      state.sort = u.get("sort") || "featured";
    }
    function writeURL() {
      const u = new URLSearchParams();
      if (state.cats.size) u.set("cat", [...state.cats].join(","));
      if (state.brands.size) u.set("brand", [...state.brands].join(","));
      if (state.sizes.size) u.set("size", [...state.sizes].join(","));
      if (state.stock) u.set("stock", "1");
      if (state.drop) u.set("drop", "1");
      if (state.q) u.set("q", state.q);
      if (state.sort !== "featured") u.set("sort", state.sort);
      const qs = u.toString();
      history.replaceState(null, "", qs ? "?" + qs : location.pathname);
    }
    readURL();

    /* ---------- построение боковых фильтров ---------- */
    const catKeys = Object.keys(CATS);
    function buildCats() {
      document.getElementById("fCat").innerHTML = catKeys
        .map((k) => {
          const n = P.filter((p) => p.cat === k).length;
          return `<label class="fopt"><input type="checkbox" value="${k}" ${
            state.cats.has(k) ? "checked" : ""
          }> ${CATS[k].label}<span class="c">${n}</span></label>`;
        })
        .join("");
    }
    const brands = [...new Set(P.map((p) => p.brand))].sort((a, b) => a.localeCompare(b, "ru"));
    function buildBrands() {
      document.getElementById("fBrand").innerHTML = brands
        .map((b) => {
          const n = P.filter((p) => p.brand === b).length;
          return `<label class="fopt"><input type="checkbox" value="${b}" ${
            state.brands.has(b) ? "checked" : ""
          }> ${b}<span class="c">${n}</span></label>`;
        })
        .join("");
    }
    function buildSizes() {
      const pool = state.cats.size ? P.filter((p) => state.cats.has(p.cat)) : P;
      const types = [...new Set(pool.map((p) => p.sizeType))];
      const grp = document.getElementById("sizeGroup");
      if (types.length === 1 && types[0] === "one") {
        grp.style.display = "none";
        return;
      }
      grp.style.display = "";
      const sneaker = pool.some((p) => p.sizeType === "eu");
      const appar = pool.some((p) => p.sizeType === "apparel");
      document.getElementById("sizeHead").textContent =
        sneaker && !appar ? "Размер · EU" : "Размер";
      const set = new Set();
      pool.forEach((p) => {
        if (p.sizeType !== "one") p.sizes.forEach((s) => set.add(s));
      });
      const order = ["XS", "S", "M", "L", "XL", "XXL"];
      const sizes = [...set].sort((a, b) => {
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

    /* ---------- доп. интерфейс (поиск, активные фильтры, drawer) ---------- */
    const toolbar = document.querySelector(".toolbar");
    const sortSel = document.getElementById("sort");

    // строка поиска
    const searchWrap = document.createElement("div");
    searchWrap.className = "cat-search";
    searchWrap.innerHTML =
      `<span class="cat-search__ic">${icon("search")}</span>` +
      `<input type="search" id="catSearch" placeholder="Поиск по каталогу…" autocomplete="off">`;
    toolbar.insertBefore(searchWrap, sortSel);

    // доп. вариант сортировки
    const optBrand = document.createElement("option");
    optBrand.value = "brand";
    optBrand.textContent = "По бренду: А → Я";
    sortSel.appendChild(optBrand);

    // панель активных фильтров
    const active = document.createElement("div");
    active.className = "active-filters";
    active.id = "activeFilters";
    results.parentNode.insertBefore(active, results);

    // кнопка «Показать N» в мобильном drawer
    const filters = document.getElementById("filters");
    const applyBtn = document.createElement("button");
    applyBtn.className = "drawer-apply";
    applyBtn.id = "drawerApply";
    filters.appendChild(applyBtn);

    // затемнение под drawer
    const backdrop = document.createElement("div");
    backdrop.className = "filters-backdrop";
    backdrop.id = "filtersBackdrop";
    document.body.appendChild(backdrop);

    const searchInput = document.getElementById("catSearch");
    searchInput.value = state.q;

    /* ---------- фильтрация ---------- */
    function matches(p) {
      if (state.cats.size && !state.cats.has(p.cat)) return false;
      if (state.brands.size && !state.brands.has(p.brand)) return false;
      if (
        state.sizes.size &&
        !(p.sizeType !== "one" && p.sizes.some((s) => state.sizes.has(String(s))))
      )
        return false;
      if (state.stock && !(p.inStock && p.inStock.length)) return false;
      if (state.drop && !p.drop) return false;
      if (state.q) {
        const hay = [p.name, p.brand, p.model, p.colorway, p.sku, CAT_LABELS[p.cat] || ""]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(state.q.toLowerCase())) return false;
      }
      return true;
    }
    function currentList() {
      const list = P.filter(matches);
      if (state.sort === "new") list.sort((a, b) => b.year - a.year);
      else if (state.sort === "stock")
        list.sort(
          (a, b) =>
            (b.inStock && b.inStock.length ? 1 : 0) - (a.inStock && a.inStock.length ? 1 : 0),
        );
      else if (state.sort === "brand") list.sort((a, b) => a.brand.localeCompare(b.brand, "ru"));
      return list;
    }
    function activeCount() {
      return (
        state.cats.size +
        state.brands.size +
        state.sizes.size +
        (state.stock ? 1 : 0) +
        (state.drop ? 1 : 0) +
        (state.q ? 1 : 0)
      );
    }

    /* ---------- активные фильтры-чипы ---------- */
    function renderActive() {
      const items = [];
      state.cats.forEach((c) => items.push({ t: "cat", v: c, label: CATS[c].label }));
      state.brands.forEach((b) => items.push({ t: "brand", v: b, label: b }));
      state.sizes.forEach((s) => items.push({ t: "size", v: s, label: "Размер " + s }));
      if (state.stock) items.push({ t: "stock", v: "1", label: "В наличии" });
      if (state.drop) items.push({ t: "drop", v: "1", label: "Дропы" });
      if (state.q) items.push({ t: "q", v: state.q, label: "«" + state.q + "»" });
      if (!items.length) {
        active.innerHTML = "";
        active.classList.remove("on");
        return;
      }
      active.classList.add("on");
      active.innerHTML =
        items
          .map(
            (it) =>
              `<button class="afilter" data-t="${it.t}" data-v="${String(it.v).replace(/"/g, "&quot;")}">${it.label}<span class="x">×</span></button>`,
          )
          .join("") + `<button class="afilter afilter--clear" data-t="clear">Сбросить всё</button>`;
    }

    /* ---------- синхронизация контролов с состоянием ---------- */
    function syncControls() {
      document
        .querySelectorAll("#fCat input")
        .forEach((i) => (i.checked = state.cats.has(i.value)));
      document
        .querySelectorAll("#fBrand input")
        .forEach((i) => (i.checked = state.brands.has(i.value)));
      document
        .querySelectorAll("#fSizes .sz")
        .forEach((b) => b.setAttribute("aria-pressed", state.sizes.has(String(b.dataset.sz))));
      document.getElementById("fStock").checked = state.stock;
      document.getElementById("fDrop").checked = state.drop;
      sortSel.value = state.sort;
      if (searchInput.value !== state.q) searchInput.value = state.q;
      document.querySelectorAll("[data-quick]").forEach((c) => {
        const v = c.dataset.quick;
        let on = false;
        if (v === "all") on = activeCount() === 0;
        else if (v === "drop") on = state.drop && !state.cats.size && !state.brands.size;
        else on = state.cats.size === 1 && state.cats.has(v) && !state.brands.size && !state.drop;
        c.setAttribute("aria-pressed", on);
      });
    }

    function plural(n) {
      const a = Math.abs(n) % 100,
        b = n % 10;
      if (a > 10 && a < 20) return "товаров";
      if (b > 1 && b < 5) return "товара";
      if (b === 1) return "товар";
      return "товаров";
    }

    /* ---------- основной рендер ---------- */
    function render() {
      const list = currentList();
      results.innerHTML = list.length
        ? list.map(SI_card).join("")
        : `<div class="empty">Ничего не найдено.<br>Измените или сбросьте фильтры.</div>`;
      document.getElementById("count").textContent = `${list.length} ${plural(list.length)}`;
      applyBtn.textContent = list.length
        ? `Показать ${list.length} ${plural(list.length)}`
        : "Ничего не найдено";

      let t = "Каталог";
      if (state.q) t = "Поиск";
      else if (state.drop && !state.cats.size && !state.brands.size) t = "Дропы";
      else if (state.cats.size === 1 && !state.brands.size) t = CATS[[...state.cats][0]].label;
      else if (state.brands.size === 1 && !state.cats.size) t = [...state.brands][0];
      document.getElementById("catTitle").textContent = t;
      document.getElementById("crumbLast").textContent = t;

      renderActive();
      syncControls();
      writeURL();
    }

    /* ---------- слушатели ---------- */
    document.getElementById("fCat").addEventListener("change", (e) => {
      const v = e.target.value;
      e.target.checked ? state.cats.add(v) : state.cats.delete(v);
      state.sizes.clear();
      buildSizes();
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
      state.sizes.has(s) ? state.sizes.delete(s) : state.sizes.add(s);
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
    sortSel.addEventListener("change", (e) => {
      state.sort = e.target.value;
      render();
    });

    let searchTimer;
    searchInput.addEventListener("input", (e) => {
      clearTimeout(searchTimer);
      const v = e.target.value;
      searchTimer = setTimeout(() => {
        state.q = v.trim();
        render();
      }, 180);
    });

    function resetAll() {
      state.cats.clear();
      state.brands.clear();
      state.sizes.clear();
      state.stock = false;
      state.drop = false;
      state.q = "";
      state.sort = "featured";
      buildSizes();
      render();
    }
    document.getElementById("fReset").addEventListener("click", resetAll);

    document.querySelectorAll("[data-quick]").forEach((c) =>
      c.addEventListener("click", () => {
        const v = c.dataset.quick;
        state.cats.clear();
        state.brands.clear();
        state.sizes.clear();
        state.drop = false;
        if (v === "drop") state.drop = true;
        else if (v !== "all") state.cats.add(v);
        buildSizes();
        render();
      }),
    );

    active.addEventListener("click", (e) => {
      const b = e.target.closest(".afilter");
      if (!b) return;
      const t = b.dataset.t,
        v = b.dataset.v;
      if (t === "clear") return resetAll();
      if (t === "cat") {
        state.cats.delete(v);
        state.sizes.clear();
        buildSizes();
      } else if (t === "brand") state.brands.delete(v);
      else if (t === "size") state.sizes.delete(v);
      else if (t === "stock") state.stock = false;
      else if (t === "drop") state.drop = false;
      else if (t === "q") state.q = "";
      render();
    });

    /* ---------- мобильный drawer ---------- */
    function openDrawer() {
      filters.classList.add("open");
      filters.querySelector(".filters__close").style.display = "flex";
      backdrop.classList.add("on");
      document.documentElement.style.overflow = "hidden";
    }
    function closeDrawer() {
      filters.classList.remove("open");
      backdrop.classList.remove("on");
      document.documentElement.style.overflow = "";
    }
    document.getElementById("mOpen").addEventListener("click", openDrawer);
    document.getElementById("fClose").addEventListener("click", closeDrawer);
    backdrop.addEventListener("click", closeDrawer);
    applyBtn.addEventListener("click", closeDrawer);

    /* ---------- кнопка «Назад»/«Вперёд» ---------- */
    window.addEventListener("popstate", () => {
      readURL();
      buildCats();
      buildBrands();
      buildSizes();
      render();
    });

    /* ---------- старт ---------- */
    buildCats();
    buildBrands();
    buildSizes();
    render();
  });
})();
