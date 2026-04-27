const KEY = "pcshop_configurator_items";

export function getConfiguratorItems() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function setConfiguratorItems(items) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

/** Додає товар у чернетку конфігуратора (локально). */
export function addToConfiguratorDraft(item) {
  const { id, name, price, category_slug } = item;
  const list = getConfiguratorItems().filter((x) => x.id !== id);
  list.push({ id, name, price, category_slug });
  setConfiguratorItems(list);
}

export function removeConfiguratorItem(id) {
  setConfiguratorItems(getConfiguratorItems().filter((x) => x.id !== id));
}

export function clearConfigurator() {
  localStorage.removeItem(KEY);
}
