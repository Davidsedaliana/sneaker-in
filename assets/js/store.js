/* ============================================================
   SNEAKER INTERACTION — data store
   Single source of truth for products. Seeds from data.js
   defaults into localStorage; admin panel reads/writes here.
   ============================================================ */
(function () {
  const KEY = "si_products_v3";

  function defaults() {
    return JSON.parse(JSON.stringify(window.SI_PRODUCTS || []));
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr) && arr.length) return arr;
      }
    } catch (e) {}
    return defaults();
  }

  let cache = load();

  function persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify(cache));
      return true;
    } catch (e) {
      console.warn("SI_store: localStorage full", e);
      alert(
        "Не удалось сохранить — память браузера переполнена. Уменьшите число фото или их размер.",
      );
      return false;
    }
  }

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

  const Store = {
    getProducts() {
      return cache.slice();
    },
    getAll() {
      return cache.slice();
    },
    get(id) {
      return cache.find((p) => p.id === id) || null;
    },

    /* create or update. New product (no id) gets a generated id. */
    save(prod) {
      if (!prod.id) {
        prod.id = makeId(prod.name);
      }
      const i = cache.findIndex((p) => p.id === prod.id);
      if (i >= 0) cache[i] = prod;
      else cache.unshift(prod);
      persist();
      return prod.id;
    },
    upsert(prod) {
      return this.save(prod);
    },

    remove(id) {
      cache = cache.filter((p) => p.id !== id);
      return persist();
    },

    reset() {
      cache = defaults();
      try {
        localStorage.removeItem(KEY);
      } catch (e) {}
      return true;
    },

    isCustomized() {
      try {
        return !!localStorage.getItem(KEY);
      } catch (e) {
        return false;
      }
    },

    exportJSON() {
      return JSON.stringify(cache, null, 2);
    },
    importJSON(json) {
      const arr = typeof json === "string" ? JSON.parse(json) : json;
      if (!Array.isArray(arr)) throw new Error("Ожидался массив товаров");
      if (!arr.length) throw new Error("Пустой каталог");
      cache = arr;
      persist();
      return true;
    },

    makeId,
  };

  window.SI_store = Store;
})();
