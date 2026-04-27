export const ORDER_STATUS_UA = {
  pending: "Очікує підтвердження",
  processing: "В обробці",
  shipped: "Відправлено",
  delivered: "Доставлено",
  cancelled: "Скасовано",
};

export function orderStatusLabel(status) {
  return ORDER_STATUS_UA[status] || status;
}
