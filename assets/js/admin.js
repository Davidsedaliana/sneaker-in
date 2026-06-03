/* ============================================================
   SNEAKER INTERACTION — админ-панель
   ------------------------------------------------------------
   В облачном режиме (Supabase настроен) требует входа модератора
   и пишет правки в общую базу. Без облака работает как локальный
   редактор каталога (localStorage), вход не запрашивается.
   ============================================================ */
(function () {
  const icon = window.SI_icon,
    CATS = window.SI_CATS,
    store = window.SI_store;

  document.getElementById("addIc").innerHTML = icon("arrow");
  document.getElementById("searchIc").innerHTML = icon("search");
  document.getElementById("mCloseIc").innerHTML = icon("close");
  document.getElementById("iCloseIc").innerHTML = icon("close");
  document.getElementById("noteIc").innerHTML = icon("check");

  let filter = "all",
    query = "";

  const CAT_DEFAULT_SIZES = {
    sneakers: ["40", "41", "42", "43", "44", "45", "46"],
    apparel: ["S", "M", "L", "XL", "XXL"],
    accessories: ["One Size"],
    eyewear: ["One Size"],
    collectibles: ["One Size"],
  };
  function sizeTypeFor(cat) {
    return cat === "sneakers" ? "eu" : cat === "apparel" ? "apparel" : "one";
  }

  /* ---------- отрисовка списка ---------- */
  function render() {
    const all = store.getProducts();
    let list = all.filter((p) => {
      if (filter !== "all" && p.cat !== filter) return false;
      if (query) {
        const hay = [p.name, p.brand, p.model, p.sku, p.colorway].join(" ").toLowerCase();
        if (!hay.includes(query)) return false;
      }
      return true;
    });
    document.getElementById("count").textContent = `${list.length} из ${all.length} товаров`;
    document.getElementById("subline").textContent = store.cloud
      ? "Облачный каталог — правки видны всем"
      : store.isCustomized()
        ? "Каталог изменён — сохранён в браузере"
        : "Исходный каталог";
    const el = document.getElementById("list");
    if (!list.length) {
      el.innerHTML = `<div class="adm-empty">Ничего не найдено.</div>`;
      return;
    }
    el.innerHTML = list
      .map((p) => {
        const inN = (p.inStock || []).length,
          total = (p.sizes || []).length;
        const stock = inN
          ? `<span class="in">В наличии${total ? " · " + inN + "/" + total : ""}</span>`
          : `<span class="out">Под заказ</span>`;
        return `<div class="adm-row">
      <div class="adm-row__img"><img src="${p.img}" alt="" onerror="this.style.opacity=.2"></div>
      <div class="adm-row__main">
        <div class="adm-row__brand">${p.brand || ""} · ${p.model || ""}</div>
        <div class="adm-row__name">${p.name || "—"}</div>
        <div class="adm-row__sku">${p.sku || ""}</div>
      </div>
      <div class="adm-row__cat">${(CATS[p.cat] || {}).label || p.cat || ""}</div>
      <div class="adm-row__stock">${stock}</div>
      <div class="adm-row__act">
        <button class="adm-mini" data-edit="${p.id}">Изменить</button>
        <button class="adm-mini adm-mini--del" data-del="${p.id}">✕</button>
      </div>
    </div>`;
      })
      .join("");
  }

  /* ---------- фильтры ---------- */
  document.getElementById("catFilter").addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    filter = b.dataset.f;
    document
      .querySelectorAll("#catFilter button")
      .forEach((x) => x.setAttribute("aria-pressed", x === b));
    render();
  });
  document.getElementById("search").addEventListener("input", (e) => {
    query = e.target.value.trim().toLowerCase();
    render();
  });

  /* ---------- действия в списке ---------- */
  document.getElementById("list").addEventListener("click", async (e) => {
    const ed = e.target.closest("[data-edit]"),
      del = e.target.closest("[data-del]");
    if (ed) openEdit(ed.dataset.edit);
    if (del) {
      const p = store.get(del.dataset.del);
      if (confirm(`Удалить «${p.name}»?`)) {
        try {
          await store.remove(del.dataset.del);
          render();
          SI_toast("Товар удалён");
        } catch (err) {
          alert("Ошибка удаления: " + err.message);
        }
      }
    }
  });

  /* ---------- модалка ---------- */
  const modal = document.getElementById("modal");
  let curImg = "",
    curSizes = [],
    curStock = new Set();

  function openEdit(id) {
    const p = id ? store.get(id) : null;
    document.getElementById("modalTitle").textContent = p ? "Редактировать товар" : "Новый товар";
    document.getElementById("f_id").value = p ? p.id : "";
    document.getElementById("f_cat").value = p ? p.cat : "sneakers";
    document.getElementById("f_badge").value = p ? p.badge || "stock" : "stock";
    document.getElementById("f_brand").value = p ? p.brand : "";
    document.getElementById("f_model").value = p ? p.model : "";
    document.getElementById("f_name").value = p ? p.name : "";
    document.getElementById("f_sku").value = p ? p.sku || "" : "";
    document.getElementById("f_colorway").value = p ? p.colorway || "" : "";
    curImg = p ? p.img : "";
    curSizes = p ? (p.sizes || []).map(String) : CAT_DEFAULT_SIZES[p ? p.cat : "sneakers"].slice();
    curStock = new Set(p ? (p.inStock || []).map(String) : []);
    document.getElementById("f_sizes").value = curSizes.join(", ");
    document.getElementById("f_img").value = curImg && !curImg.startsWith("data:") ? curImg : "";
    document.getElementById("deleteBtn").style.display = p ? "inline-flex" : "none";
    paintImg();
    paintSizeKind();
    paintChips();
    modal.classList.add("open");
  }
  function closeModal() {
    modal.classList.remove("open");
  }
  document
    .querySelectorAll("[data-mclose]")
    .forEach((b) => b.addEventListener("click", closeModal));
  document.getElementById("addBtn").addEventListener("click", () => openEdit(null));

  function paintImg() {
    const prev = document.getElementById("imgPrev");
    prev.innerHTML = curImg ? `<img src="${curImg}" alt="">` : `<span>Нет фото</span>`;
  }
  function paintSizeKind() {
    const cat = document.getElementById("f_cat").value;
    const t = sizeTypeFor(cat);
    document.getElementById("sizeKind").textContent =
      t === "eu" ? "· EU" : t === "apparel" ? "· S–XXL" : "· один размер";
  }
  function paintChips() {
    const wrap = document.getElementById("stockChips");
    wrap.innerHTML =
      curSizes
        .map(
          (s) =>
            `<span class="adm-chip" data-sz="${s}" data-on="${curStock.has(String(s))}">${s}</span>`,
        )
        .join("") || '<span class="hint">Укажите размеры выше</span>';
  }
  document.getElementById("stockChips").addEventListener("click", (e) => {
    const c = e.target.closest(".adm-chip");
    if (!c) return;
    const s = String(c.dataset.sz);
    if (curStock.has(s)) curStock.delete(s);
    else curStock.add(s);
    c.dataset.on = curStock.has(s);
  });
  document.getElementById("f_sizes").addEventListener("input", (e) => {
    curSizes = e.target.value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    curStock = new Set([...curStock].filter((s) => curSizes.includes(s)));
    paintChips();
  });
  document.getElementById("f_cat").addEventListener("change", (e) => {
    paintSizeKind();
    if (!document.getElementById("f_sizes").value.trim()) {
      curSizes = CAT_DEFAULT_SIZES[e.target.value].slice();
      document.getElementById("f_sizes").value = curSizes.join(", ");
      paintChips();
    }
  });

  /* изображение: поле ссылки */
  document.getElementById("f_img").addEventListener("input", (e) => {
    const v = e.target.value.trim();
    if (v) {
      curImg = v;
      paintImg();
    }
  });
  /* изображение: загрузка файла → сжатие → dataURL */
  document.getElementById("f_file").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 900,
          scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale),
          h = Math.round(img.height * scale);
        const cv = document.createElement("canvas");
        cv.width = w;
        cv.height = h;
        const ctx = cv.getContext("2d");
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        curImg = cv.toDataURL("image/jpeg", 0.82);
        document.getElementById("f_img").value = "";
        paintImg();
        SI_toast("Фото загружено");
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

  /* сохранение */
  document.getElementById("form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("f_name").value.trim();
    if (!name) {
      SI_toast("Введите название");
      return;
    }
    if (!curImg) {
      SI_toast("Добавьте фото");
      return;
    }
    const cat = document.getElementById("f_cat").value;
    const id = document.getElementById("f_id").value;
    const badge = document.getElementById("f_badge").value;
    const sizes =
      sizeTypeFor(cat) === "one" ? (curSizes.length ? curSizes : ["One Size"]) : curSizes;
    const prod = {
      id: id || undefined,
      cat,
      sizeType: sizeTypeFor(cat),
      brand: document.getElementById("f_brand").value.trim() || "—",
      model: document.getElementById("f_model").value.trim() || "",
      name,
      sku: document.getElementById("f_sku").value.trim() || "—",
      colorway: document.getElementById("f_colorway").value.trim() || "",
      badge,
      img: curImg,
      gallery: [curImg],
      sizes,
      inStock: sizeTypeFor(cat) === "one" ? (badge !== "order" ? sizes : []) : [...curStock],
      year: new Date().getFullYear(),
      drop: badge === "hot",
    };
    try {
      await store.save(prod);
      closeModal();
      render();
      SI_toast(id ? "Сохранено" : "Товар добавлен");
    } catch (err) {
      alert("Ошибка сохранения: " + err.message);
    }
  });
  document.getElementById("deleteBtn").addEventListener("click", async () => {
    const id = document.getElementById("f_id").value;
    const p = store.get(id);
    if (p && confirm(`Удалить «${p.name}»?`)) {
      try {
        await store.remove(id);
        closeModal();
        render();
        SI_toast("Товар удалён");
      } catch (err) {
        alert("Ошибка удаления: " + err.message);
      }
    }
  });

  /* экспорт / импорт / сброс */
  document.getElementById("exportBtn").addEventListener("click", () => {
    const blob = new Blob([store.exportJSON()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "sneaker-interaction-catalog.json";
    a.click();
    SI_toast("Каталог выгружен");
  });
  const impModal = document.getElementById("impModal");
  document.getElementById("importBtn").addEventListener("click", () => {
    document.getElementById("impText").value = "";
    impModal.classList.add("open");
  });
  document
    .querySelectorAll("[data-iclose]")
    .forEach((b) => b.addEventListener("click", () => impModal.classList.remove("open")));
  document.getElementById("impApply").addEventListener("click", async () => {
    try {
      await store.importJSON(document.getElementById("impText").value);
      impModal.classList.remove("open");
      render();
      SI_toast("Каталог загружен");
    } catch (err) {
      alert("Ошибка: " + err.message);
    }
  });
  document.getElementById("resetBtn").addEventListener("click", async () => {
    const msg = store.cloud
      ? "Перечитать каталог из облака? Несохранённые локальные изменения пропадут."
      : "Вернуть исходный каталог? Все ваши изменения удалятся.";
    if (confirm(msg)) {
      await store.reset();
      render();
      SI_toast(store.cloud ? "Обновлено из облака" : "Каталог сброшен");
    }
  });

  /* первичная заливка стартового каталога в облако */
  const seedBtn = document.getElementById("seedBtn");
  if (seedBtn) {
    seedBtn.addEventListener("click", async () => {
      if (
        !confirm(
          "Залить стартовый каталог (54 товара) в облако? Существующие товары с теми же ID будут перезаписаны.",
        )
      )
        return;
      try {
        const n = await store.seedCloud();
        render();
        SI_toast(`Залито товаров: ${n}`);
      } catch (err) {
        alert("Ошибка заливки: " + err.message);
      }
    });
  }

  /* ---------- вход / выход ---------- */
  const gate = document.getElementById("loginGate");
  const logoutBtn = document.getElementById("logoutBtn");

  async function enterApp() {
    if (gate) gate.style.display = "none";
    if (logoutBtn) logoutBtn.style.display = "inline-flex";
    if (seedBtn) seedBtn.style.display = "inline-flex";
    await store.ready();
    render();
  }

  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const errEl = document.getElementById("loginErr");
      errEl.textContent = "";
      const email = document.getElementById("loginEmail").value.trim();
      const pass = document.getElementById("loginPass").value;
      try {
        await store.auth.signIn(email, pass);
        await enterApp();
      } catch (err) {
        errEl.textContent = "Не удалось войти. Проверьте e-mail и пароль.";
      }
    });
  }
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await store.auth.signOut();
      location.reload();
    });
  }

  /* ---------- старт ---------- */
  (async function boot() {
    if (!store.auth.enabled) {
      // локальный режим — без входа
      await store.ready();
      render();
      return;
    }
    // облачный режим — нужна сессия
    const user = await store.auth.user();
    if (user) await enterApp();
    else if (gate) gate.style.display = "flex";
  })();
})();
