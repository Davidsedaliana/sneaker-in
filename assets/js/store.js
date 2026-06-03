/* ============================================================
   SNEAKER INTERACTION — хранилище каталога
   ------------------------------------------------------------
   Единый источник товаров для витрины и админки.

   Два режима, переключаются автоматически:
   • Облако (Supabase) — если в config.js заданы реальные ключи.
     Каталог общий для всех, правки модератора видны сразу.
     Фото товаров заливаются в Supabase Storage (бакет ниже),
     а в товар пишется короткая публичная ссылка. Если бакет не
     создан — мягкий фолбэк: фото хранится как data URL в товаре.
   • Локальный фолбэк — если ключей нет. Каталог берётся из
     data.js и хранится в localStorage этого браузера.

   Большинство методов асинхронные (возвращают Promise), потому
   что в облачном режиме ходят в сеть. Перед первым рендером
   страницы вызывайте SI_store.ready().
   ============================================================ */
(function () {
  const KEY = "si_products_v3";
  const BUCKET = "product-images"; // бакет Supabase Storage для фото товаров
  const cfg = window.SI_CONFIG || {};

  // облако активно только при заданных и непустых (не плейсхолдерных) ключах
  const hasKeys =
    !!cfg.SUPABASE_URL &&
    !!cfg.SUPABASE_ANON_KEY &&
    !/YOUR-|REPLACE/i.test(cfg.SUPABASE_URL + cfg.SUPABASE_ANON_KEY);
  const sdkReady = !!(window.supabase && typeof window.supabase.createClient === "function");
  const CLOUD = hasKeys && sdkReady;

  let client = null;
  if (CLOUD) {
    client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
  } else if (hasKeys && !sdkReady) {
    console.warn("SI_store: ключи Supabase заданы, но SDK не загрузился — работаю локально.");
  }

  function defaults() {
    return JSON.parse(JSON.stringify(window.SI_PRODUCTS || []));
  }

  /* ---------- работа с изображением ---------- */
  // ужать картинку через canvas; вернуть Blob (для Storage) или dataURL (локально)
  function processImage(file, asBlob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Не удалось прочитать файл"));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error("Не удалось открыть изображение"));
        img.onload = () => {
          const max = 1200;
          const scale = Math.min(1, max / Math.max(img.width, img.height));
          const w = Math.round(img.width * scale);
          const h = Math.round(img.height * scale);
          if (!w || !h) return reject(new Error("Пустое изображение"));
          const cv = document.createElement("canvas");
          cv.width = w;
          cv.height = h;
          const ctx = cv.getContext("2d");
          ctx.fillStyle = "#fff";
          ctx.fillRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);
          if (asBlob) {
            cv.toBlob(
              (b) => (b ? resolve(b) : reject(new Error("Не удалось сжать изображение"))),
              "image/jpeg",
              0.85,
            );
          } else {
            resolve(cv.toDataURL("image/jpeg", 0.85));
          }
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  /* ---------- локальный режим ---------- */
  function loadLocal() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr) && arr.length) return arr;
      }
    } catch (e) {}
    return defaults();
  }
  function persistLocal() {
    try {
      localStorage.setItem(KEY, JSON.stringify(cache));
      return true;
    } catch (e) {
      console.warn("SI_store: localStorage переполнен", e);
      alert(
        "Не удалось сохранить — память браузера переполнена. Уменьшите число фото или их размер.",
      );
      return false;
    }
  }

  let cache = CLOUD ? [] : loadLocal();
  let readyPromise = null;

  function makeId(name) {
    const base =
      (name || "item")
        .toLowerCase()
        .replace(/[^a-z0-9а-я]+/gi, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 28) || "item";
    let id = base,
      n = 2;
    while (cache.some((p) => p.id === id)) {
      id = base + "-" + n;
      n++;
    }
    return id;
  }

  /* ---------- облачный режим ---------- */
  async function loadCloud() {
    try {
      const { data, error } = await client.from("products").select("id,data").order("id");
      if (error) throw error;
      const rows = (data || []).map((r) => r.data).filter(Boolean);
      // пока облако пустое — показываем стартовый каталог из data.js
      cache = rows.length ? rows : defaults();
    } catch (e) {
      console.warn("SI_store: не удалось загрузить каталог из облака, использую data.js", e);
      cache = defaults();
    }
    return cache;
  }

  const Store = {
    cloud: CLOUD,

    /* дождаться загрузки каталога (вызывать до первого рендера) */
    ready() {
      if (!readyPromise) {
        readyPromise = CLOUD ? loadCloud() : Promise.resolve(cache);
      }
      return readyPromise;
    },

    /* перечитать каталог из облака */
    async refresh() {
      if (CLOUD) await loadCloud();
      return cache.slice();
    },

    getProducts() {
      return cache.slice();
    },
    getAll() {
      return cache.slice();
    },
    get(id) {
      return cache.find((p) => p.id === id) || null;
    },

    /* загрузка фото: в облаке пробуем Storage (вернёт ссылку); если бакета нет
       или Storage недоступен — мягкий фолбэк на data URL в самом товаре */
    async uploadImage(file) {
      if (CLOUD) {
        try {
          const blob = await processImage(file, true);
          const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
          const { error } = await client.storage.from(BUCKET).upload(name, blob, {
            contentType: "image/jpeg",
            cacheControl: "31536000",
            upsert: false,
          });
          if (error) throw error;
          const { data } = client.storage.from(BUCKET).getPublicUrl(name);
          return data.publicUrl;
        } catch (e) {
          console.warn("SI_store: Storage недоступен, сохраняю фото как data URL", e);
          return processImage(file, false);
        }
      }
      return processImage(file, false);
    },

    /* создать или обновить товар */
    async save(prod) {
      if (!prod.id) prod.id = makeId(prod.name);
      if (CLOUD) {
        const { error } = await client.from("products").upsert({ id: prod.id, data: prod });
        if (error) throw error;
      }
      const i = cache.findIndex((p) => p.id === prod.id);
      if (i >= 0) cache[i] = prod;
      else cache.unshift(prod);
      if (!CLOUD) persistLocal();
      return prod.id;
    },
    upsert(prod) {
      return this.save(prod);
    },

    async remove(id) {
      if (CLOUD) {
        const { error } = await client.from("products").delete().eq("id", id);
        if (error) throw error;
      }
      cache = cache.filter((p) => p.id !== id);
      if (!CLOUD) persistLocal();
      return true;
    },

    /* вернуть исходный каталог из data.js
       (в облаке — только перечитать, облако не трогаем) */
    async reset() {
      if (CLOUD) {
        await loadCloud();
      } else {
        cache = defaults();
        try {
          localStorage.removeItem(KEY);
        } catch (e) {}
      }
      return true;
    },

    isCustomized() {
      if (CLOUD) return true;
      try {
        return !!localStorage.getItem(KEY);
      } catch (e) {
        return false;
      }
    },

    exportJSON() {
      return JSON.stringify(cache, null, 2);
    },
    async importJSON(json) {
      const arr = typeof json === "string" ? JSON.parse(json) : json;
      if (!Array.isArray(arr)) throw new Error("Ожидался массив товаров");
      if (!arr.length) throw new Error("Пустой каталог");
      if (CLOUD) {
        const rows = arr.map((p) => ({ id: p.id || makeId(p.name), data: p }));
        const { error } = await client.from("products").upsert(rows);
        if (error) throw error;
        await loadCloud();
      } else {
        cache = arr;
        persistLocal();
      }
      return true;
    },

    /* первичная заливка стартового каталога (54 товара) в облако */
    async seedCloud() {
      if (!CLOUD) throw new Error("Облако не настроено");
      const rows = defaults().map((p) => ({ id: p.id, data: p }));
      const { error } = await client.from("products").upsert(rows);
      if (error) throw error;
      await loadCloud();
      return cache.length;
    },

    /* ---------- аутентификация модератора ---------- */
    auth: {
      enabled: CLOUD,
      async signIn(email, password) {
        if (!CLOUD) throw new Error("Облако не настроено");
        const { data, error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data.user;
      },
      async signOut() {
        if (CLOUD) await client.auth.signOut();
      },
      async user() {
        if (!CLOUD) return null;
        const { data } = await client.auth.getUser();
        return data ? data.user : null;
      },
    },

    makeId,
  };

  window.SI_store = Store;
})();
