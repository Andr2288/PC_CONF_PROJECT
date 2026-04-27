const MAP = {
  cpu: "Процесор",
  motherboard: "Материнська плата",
  ram: "Пам'ять",
  gpu: "Відеокарта",
  storage: "Накопичувач",
  psu: "Блок живлення",
};

export function partCategoryLabel(slug) {
  if (!slug) return "";
  return MAP[slug] || slug;
}
