const express = require("express");
const { getPool } = require("../db");
const { requireAuth } = require("../middleware/auth");
const { isAllowedPayment, isAllowedShipping, PAYMENT_METHODS, SHIPPING_METHODS } = require("../lib/orderOptions");
const { deliveryAddressIsPlausible } = require("../lib/validateAddress");

const router = express.Router();

router.get("/form-options", (_req, res) => {
  res.json({
    payment_methods: PAYMENT_METHODS,
    shipping_methods: SHIPPING_METHODS,
  });
});

router.get("/", requireAuth, async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT o.id, o.status, o.total, o.created_at, o.delivery_address, o.payment_method, o.shipping_method,
              (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS item_count
       FROM orders o
       WHERE o.user_id = :uid
       ORDER BY o.created_at DESC`,
      { uid: req.userId }
    );
    const orders = rows.map((r) => ({
      id: r.id,
      status: r.status,
      total: Number(r.total),
      created_at: r.created_at,
      delivery_address: r.delivery_address,
      payment_method: r.payment_method,
      shipping_method: r.shipping_method,
      item_count: Number(r.item_count),
    }));
    res.json({ orders });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Не вдалося завантажити замовлення" });
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "Некоректний id" });
  }
  try {
    const pool = getPool();
    const [orders] = await pool.query(
      `SELECT id, user_id, status, total, created_at, delivery_address, payment_method, shipping_method
       FROM orders WHERE id = :id LIMIT 1`,
      { id }
    );
    const order = orders[0];
    if (!order || Number(order.user_id) !== req.userId) {
      return res.status(404).json({ error: "Замовлення не знайдено" });
    }

    const [items] = await pool.query(
      `SELECT oi.product_id, oi.quantity, oi.price_at_purchase, p.name, p.slug
       FROM order_items oi
       INNER JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id = :oid
       ORDER BY oi.id ASC`,
      { oid: id }
    );

    res.json({
      order: {
        id: order.id,
        status: order.status,
        total: Number(order.total),
        created_at: order.created_at,
        delivery_address: order.delivery_address,
        payment_method: order.payment_method,
        shipping_method: order.shipping_method,
        items: items.map((r) => ({
          product_id: r.product_id,
          name: r.name,
          slug: r.slug,
          quantity: Number(r.quantity),
          price_at_purchase: Number(r.price_at_purchase),
          line_total: Number(r.quantity) * Number(r.price_at_purchase),
        })),
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Не вдалося завантажити замовлення" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  const delivery_address = String(req.body?.delivery_address || "").trim();
  const payment_method = String(req.body?.payment_method || "").trim();
  const shipping_method = String(req.body?.shipping_method || "").trim();

  if (delivery_address.length < 10) {
    return res.status(400).json({ error: "Адреса доставки мінімум 10 символів" });
  }
  if (delivery_address.length > 500) {
    return res.status(400).json({ error: "Адреса занадто довга" });
  }
  if (!deliveryAddressIsPlausible(delivery_address)) {
    return res.status(400).json({
      error: "Вкажіть змістовну адресу (місто, відділення або вулиця, будинок — мінімум 5 літер чи цифр загалом)",
    });
  }
  if (!isAllowedPayment(payment_method)) {
    return res.status(400).json({ error: "Оберіть спосіб оплати зі списку" });
  }
  if (!isAllowedShipping(shipping_method)) {
    return res.status(400).json({ error: "Оберіть спосіб доставки зі списку" });
  }

  const pool = getPool();
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const [lines] = await conn.query(
      `SELECT ci.product_id, ci.quantity, p.price, p.stock
       FROM cart_items ci
       INNER JOIN products p ON p.id = ci.product_id AND p.is_active = 1
       WHERE ci.user_id = :uid`,
      { uid: req.userId }
    );

    if (!lines.length) {
      await conn.rollback();
      return res.status(400).json({ error: "Кошик порожній" });
    }

    let total = 0;
    for (const row of lines) {
      const qty = Number(row.quantity);
      const stock = Number(row.stock);
      const price = Number(row.price);
      if (qty > stock || qty < 1) {
        await conn.rollback();
        return res.status(400).json({ error: "Недостатньо товару на складі для оформлення" });
      }
      total += price * qty;
    }

    const [ins] = await conn.query(
      `INSERT INTO orders (user_id, status, delivery_address, payment_method, shipping_method, total)
       VALUES (:uid, 'pending', :addr, :pay, :ship, :total)`,
      {
        uid: req.userId,
        addr: delivery_address,
        pay: payment_method,
        ship: shipping_method,
        total,
      }
    );
    const orderId = ins.insertId;

    for (const row of lines) {
      const qty = Number(row.quantity);
      const price = Number(row.price);
      const pid = row.product_id;

      await conn.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
         VALUES (:oid, :pid, :qty, :price)`,
        { oid: orderId, pid, qty, price }
      );

      const [upd] = await conn.query(
        `UPDATE products SET stock = stock - :q WHERE id = :pid AND stock >= :q`,
        { q: qty, pid }
      );
      if (upd.affectedRows !== 1) {
        await conn.rollback();
        return res.status(400).json({ error: "Не вдалося зарезервувати товар (склад)" });
      }
    }

    await conn.query(`DELETE FROM cart_items WHERE user_id = :uid`, { uid: req.userId });
    await conn.commit();

    res.status(201).json({
      order: {
        id: orderId,
        status: "pending",
        total,
      },
    });
  } catch (e) {
    if (conn) await conn.rollback().catch(() => {});
    console.error(e);
    res.status(500).json({ error: "Не вдалося оформити замовлення" });
  } finally {
    if (conn) conn.release();
  }
});

module.exports = router;
