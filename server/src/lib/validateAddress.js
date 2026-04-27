/**
 * Мінімальна «змістовність» адреси: не лише слеші/пробіли (≥5 літер або цифр).
 * @param {string} s
 */
function deliveryAddressIsPlausible(s) {
  const t = String(s || "").trim();
  const meaningful = t.match(/\p{L}|\p{N}/gu);
  return meaningful != null && meaningful.length >= 5;
}

module.exports = { deliveryAddressIsPlausible };
