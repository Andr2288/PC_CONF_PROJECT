/** Те саме правило, що на сервері: ≥5 літер або цифр у рядку. */
export function deliveryAddressIsPlausible(s) {
  const t = String(s || "").trim();
  const meaningful = t.match(/\p{L}|\p{N}/gu);
  return meaningful != null && meaningful.length >= 5;
}
