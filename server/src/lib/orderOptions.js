const PAYMENT_METHODS = ["Картка онлайн", "Готівка при отриманні"];
const SHIPPING_METHODS = ["Нова Пошта", "Самовивіз з магазину"];

function isAllowedPayment(v) {
  return PAYMENT_METHODS.includes(String(v || "").trim());
}

function isAllowedShipping(v) {
  return SHIPPING_METHODS.includes(String(v || "").trim());
}

module.exports = {
  PAYMENT_METHODS,
  SHIPPING_METHODS,
  isAllowedPayment,
  isAllowedShipping,
};
