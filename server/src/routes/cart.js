const express = require("express");
const { getPool } = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT ci.product_id, ci.quantity,
            p.name, p.slug, p.price, p.stock, p.image_url
     FROM cart_items ci
     INNER JOIN products p ON p.id = ci.product_id
     WHERE ci.user_id = :uid
     ORDER BY p.name ASC`,
    { uid: req.userId }
  );

  let totalPrice = 0;
  let totalQty = 0;
  const items = rows.map((row) => {
    const price = Number(row.price);
    const quantity = Number(row.quantity);
    const line = price * quantity;
    totalPrice += line;
    totalQty += quantity;
    return {
      product_id: row.product_id,
      quantity,
      name: row.name,
      slug: row.slug,
      price,
      stock: Number(row.stock),
      image_url: row.image_url,
      line_total: line,
    };
  });

  res.json({ items, totalQty, totalPrice });
});

router.post("/items", requireAuth, async (req, res) => {
  const productId = Number(req.body?.product_id);
  const addQty = Math.min(99, Math.max(1, parseInt(req.body?.quantity, 10) || 1));
  const fromCatalog = Boolean(req.body?.from_catalog);

  if (!productId) {
    return res.status(400).json({ error: "Некоректний товар" });
  }

  const pool = getPool();
  const [products] = await pool.query(
    `SELECT id, stock FROM products WHERE id = :id LIMIT 1`,
    { id: productId }
  );
  const product = products[0];
  if (!product) {
    return res.status(404).json({ error: "Товар не знайдено" });
  }

  const [cartRows] = await pool.query(
    `SELECT quantity FROM cart_items WHERE user_id = :uid AND product_id = :pid LIMIT 1`,
    { uid: req.userId, pid: productId }
  );
  const existing = cartRows[0];

  if (fromCatalog) {
    if (existing) {
      return res.json({ ok: true, alreadyInCart: true });
    }
    if (Number(product.stock) < 1) {
      return res.status(400).json({ error: "Немає в наявності" });
    }
    await pool.query(
      `INSERT INTO cart_items (user_id, product_id, quantity) VALUES (:uid, :pid, 1)`,
      { uid: req.userId, pid: productId }
    );
    return res.status(201).json({ ok: true });
  }

  const current = existing ? Number(existing.quantity) : 0;
  if (current + addQty > Number(product.stock)) {
    return res.status(400).json({ error: "Недостатньо товару на складі" });
  }

  await pool.query(
    `INSERT INTO cart_items (user_id, product_id, quantity) VALUES (:uid, :pid, :qty)
     ON DUPLICATE KEY UPDATE quantity = quantity + :inc`,
    { uid: req.userId, pid: productId, qty: addQty, inc: addQty }
  );

  res.status(201).json({ ok: true });
});

router.patch("/items/:productId", requireAuth, async (req, res) => {
  const productId = Number(req.params.productId);
  const qty = parseInt(req.body?.quantity, 10);
  if (!productId || Number.isNaN(qty) || qty < 1 || qty > 99) {
    return res.status(400).json({ error: "Некоректна кількість" });
  }

  const pool = getPool();
  const [products] = await pool.query(`SELECT stock FROM products WHERE id = :id LIMIT 1`, { id: productId });
  const product = products[0];
  if (!product) {
    return res.status(404).json({ error: "Товар не знайдено" });
  }
  if (qty > Number(product.stock)) {
    return res.status(400).json({ error: "Недостатньо на складі" });
  }

  const [r] = await pool.query(
    `UPDATE cart_items SET quantity = :qty WHERE user_id = :uid AND product_id = :pid`,
    { qty, uid: req.userId, pid: productId }
  );
  if (r.affectedRows === 0) {
    return res.status(404).json({ error: "Позиції немає в кошику" });
  }

  res.json({ ok: true });
});

router.delete("/items/:productId", requireAuth, async (req, res) => {
  const productId = Number(req.params.productId);
  if (!productId) {
    return res.status(400).json({ error: "Некоректний товар" });
  }
  const pool = getPool();
  await pool.query(`DELETE FROM cart_items WHERE user_id = :uid AND product_id = :pid`, {
    uid: req.userId,
    pid: productId,
  });
  res.json({ ok: true });
});

module.exports = router;
