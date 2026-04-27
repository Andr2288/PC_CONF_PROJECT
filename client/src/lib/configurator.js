/** localStorage: чернетка конфігуратора — окремо для гостя і для кожного `user.id`. */

const LEGACY = {
  items: "pcshop_configurator_items",
  a: "pcshop_configurator_slot_a",
  b: "pcshop_configurator_slot_b",
};

const PREFIX = {
  items: "pcshop_configurator_items_",
  a: "pcshop_configurator_slot_a_",
  b: "pcshop_configurator_slot_b_",
};

/** @param {null|{ id?: string|number|undefined }|undefined} user */
function suffixFromUser(user) {
  if (user == null) return "guest";
  const id = user.id;
  if (id === null || id === undefined || id === "") return "guest";
  const n = Number(id);
  return Number.isFinite(n) ? `u${n}` : `u${String(id)}`;
}

function keyItems(suf) {
  return `${PREFIX.items}${suf}`;
}
function keySlot(slot, suf) {
  return slot === "b" ? `${PREFIX.b}${suf}` : `${PREFIX.a}${suf}`;
}

/** `!==` після JSON часто ламає видалення: number vs string. */
function sameId(a, b) {
  return a != null && b != null && String(a) === String(b);
}

function normalizeItemId(id) {
  if (id === null || id === undefined) return id;
  const n = Number(id);
  return id !== "" && String(id).trim() !== "" && Number.isFinite(n) ? n : id;
}

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const v = JSON.parse(raw);
    return v;
  } catch {
    return fallback;
  }
}

function readItemsWithMigrate(suf) {
  const k = keyItems(suf);
  const raw = readJson(k, null);
  const arr = Array.isArray(raw) ? raw : null;
  if (suf === "guest" && (arr == null || arr.length === 0)) {
    const legacy = readJson(LEGACY.items, null);
    if (Array.isArray(legacy) && legacy.length) {
      try {
        localStorage.setItem(k, JSON.stringify(legacy));
        localStorage.removeItem(LEGACY.items);
      } catch {
        /* ignore */
      }
      return legacy;
    }
  }
  return Array.isArray(arr) ? arr : [];
}

function readSlotWithMigrate(slot, suf) {
  const k = keySlot(slot, suf);
  const raw = readJson(k, null);
  const arr = Array.isArray(raw) ? raw : null;
  if (suf === "guest" && (arr == null || arr.length === 0) && (slot === "a" || slot === "b")) {
    const legKey = slot === "a" ? LEGACY.a : LEGACY.b;
    const legacy = readJson(legKey, null);
    if (Array.isArray(legacy) && legacy.length) {
      try {
        localStorage.setItem(k, JSON.stringify(legacy));
        localStorage.removeItem(legKey);
      } catch {
        /* ignore */
      }
      return legacy;
    }
  }
  return Array.isArray(arr) ? arr : [];
}

/** @param {null|{ id?: string|number }} [user] */
export function getConfiguratorItems(user) {
  return readItemsWithMigrate(suffixFromUser(user));
}

/** @param {null|{ id?: string|number }} [user] */
export function setConfiguratorItems(items, user) {
  localStorage.setItem(keyItems(suffixFromUser(user)), JSON.stringify(items));
}

function normalizeItem(item) {
  const { id, name, price, category_slug, specs } = item;
  const o = {
    id: normalizeItemId(id),
    name,
    price,
    category_slug,
  };
  if (specs && typeof specs === "object" && !Array.isArray(specs)) o.specs = specs;
  return o;
}

/** @param {null|{ id?: string|number }} [user] */
export function addToConfiguratorDraft(item, user) {
  const n = normalizeItem(item);
  const list = getConfiguratorItems(user).filter((x) => !sameId(x.id, n.id));
  list.push(n);
  setConfiguratorItems(list, user);
}

/** @param {null|{ id?: string|number }} [user] */
export function removeConfiguratorItem(id, user) {
  setConfiguratorItems(
    getConfiguratorItems(user).filter((x) => !sameId(x.id, id)),
    user
  );
}

/** @param {null|{ id?: string|number }} [user] */
export function clearConfigurator(user) {
  try {
    localStorage.removeItem(keyItems(suffixFromUser(user)));
  } catch {
    /* ignore */
  }
}

/** @param {"a"|"b"} slot @param {null|{ id?: string|number }} [user] */
export function getSlotItems(slot, user) {
  return readSlotWithMigrate(slot, suffixFromUser(user));
}

/** @param {"a"|"b"} slot @param {null|{ id?: string|number }} [user] */
export function setSlotItems(slot, items, user) {
  localStorage.setItem(keySlot(slot, suffixFromUser(user)), JSON.stringify(items));
}

/** Порожні масиви вважаються рівними. Порівняння: id, категорія, ціна, name, specs (нормалізовано). */
export function isSameBuild(itemsA, itemsB) {
  if (!Array.isArray(itemsA) || !Array.isArray(itemsB)) return false;
  if (itemsA.length === 0 && itemsB.length === 0) return true;
  if (itemsA.length !== itemsB.length) return false;
  const snap = (items) =>
    [...items]
      .map((x) => ({
        id: normalizeItemId(x.id),
        name: String(x.name || ""),
        price: Number(x.price) || 0,
        category_slug: String(x.category_slug || ""),
        specs: x.specs && typeof x.specs === "object" ? x.specs : null,
      }))
      .sort((a, b) => String(a.id).localeCompare(String(b.id), undefined, { numeric: true }));
  return JSON.stringify(snap(itemsA)) === JSON.stringify(snap(itemsB));
}

/**
 * Копіювати в слот, лише якщо чернетка не дублює **іншу** збережену збірку (A vs B).
 * @returns {boolean} true якщо збережено, false — якщо сховище не змінювали
 */
export function tryCopyCurrentToSlot(slot, user) {
  const other = slot === "b" ? "a" : "b";
  const current = getConfiguratorItems(user);
  const inOther = getSlotItems(other, user);
  if (inOther.length > 0 && isSameBuild(current, inOther)) {
    return false;
  }
  setSlotItems(slot, current, user);
  return true;
}

/** @param {"a"|"b"} slot @param {null|{ id?: string|number }} [user] */
export function clearSlot(slot, user) {
  try {
    localStorage.removeItem(keySlot(slot, suffixFromUser(user)));
  } catch {
    /* ignore */
  }
}
