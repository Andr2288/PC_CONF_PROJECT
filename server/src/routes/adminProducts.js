const express = require("express");
const { getPool } = require("../db");

const router = express.Router();

function parseSpecsInput(raw) {
  if (raw == null || raw === "") return null;
  if (typeof raw === "object") return raw;
  const s = String(raw).trim();
  if (!s) return null;
  try {
    return JSON.parse(s);
  } catch {
    throw new Error("JSON");
  }
}

function slugOk(s) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(s || "").trim());
}

router.get("/", async (_req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT p.id, p.category_id, p.name, p.slug, p.description, p.price, p.stock, p.image_url, p.specs, p.is_active, p.created_at,
              c.name AS category_name, c.slug AS category_slug
       FROM products p
       INNER JOIN categories c ON c.id = p.category_id
       ORDER BY p.id DESC`
    );
    const items = rows.map((r) => {
      let specs = null;
      if (r.specs != null) {
        try {
          specs = typeof r.specs === "string" ? JSON.parse(r.specs) : r.specs;
        } catch {
          specs = null;
        }
      }
      return {
        ...r,
        price: Number(r.price),
        stock: Number(r.stock),
        is_active: Number(r.is_active) === 1,
        specs,
      };
    });
    res.json({ items });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Не вдалося завантажити товари" });
  }
});

router.post("/", async (req, res) => {
  const category_id = Number(req.body?.category_id);
  const name = String(req.body?.name || "").trim();
  const slug = String(req.body?.slug || "").trim().toLowerCase();
  const description = String(req.body?.description || "").trim();
  const price = Number(req.body?.price);
  const stock = parseInt(req.body?.stock, 10);
  const image_url = String(req.body?.image_url || "").trim().slice(0, 512);

  if (!category_id || !name || !slug || !description) {
    return res.status(400).json({ error: "Заповніть категорію, назву, slug та опис" });
  }
  if (!slugOk(slug)) {
    return res.status(400).json({ error: "Slug: лише малі літери, цифри та дефіси" });
  }
  if (Number.isNaN(price) || price < 0) {
    return res.status(400).json({ error: "Некоректна ціна" });
  }
  if (Number.isNaN(stock) || stock < 0) {
    return res.status(400).json({ error: "Некоректний залишок" });
  }

  let specs = null;
  try {
    specs = parseSpecsInput(req.body?.specs);
  } catch {
    return res.status(400).json({ error: "Характеристики (specs) мають бути валідним JSON" });
  }

  const pool = getPool();
  try {
    const [r] = await pool.query(
      `INSERT INTO products (category_id, name, slug, description, price, stock, image_url, specs)
       VALUES (:cid, :name, :slug, :desc, :price, :stock, :img, :specs)`,
      {
        cid: category_id,
        name,
        slug,
        desc: description,
        price,
        stock,
        img: image_url,
        specs: specs == null ? null : JSON.stringify(specs),
      }
    );
    res.status(201).json({ id: r.insertId });
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Товар з таким slug вже є" });
    }
    if (e.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({ error: "Некоректна категорія" });
    }
    console.error(e);
    res.status(500).json({ error: "Не вдалося створити товар" });
  }
});

router.patch("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "Некоректний id" });
  }

  const category_id = req.body?.category_id != null ? Number(req.body.category_id) : null;
  const name = req.body?.name != null ? String(req.body.name).trim() : null;
  const slug = req.body?.slug != null ? String(req.body.slug).trim().toLowerCase() : null;
  const description = req.body?.description != null ? String(req.body.description).trim() : null;
  const price = req.body?.price != null ? Number(req.body.price) : null;
  const stock = req.body?.stock != null ? parseInt(req.body.stock, 10) : null;
  const image_url = req.body?.image_url != null ? String(req.body.image_url).trim().slice(0, 512) : null;

  if (slug != null && !slugOk(slug)) {
    return res.status(400).json({ error: "Slug: лише малі літери, цифри та дефіси" });
  }
  if (price != null && (Number.isNaN(price) || price < 0)) {
    return res.status(400).json({ error: "Некоректна ціна" });
  }
  if (stock != null && (Number.isNaN(stock) || stock < 0)) {
    return res.status(400).json({ error: "Некоректний залишок" });
  }

  let specsUpdate = undefined;
  if (Object.prototype.hasOwnProperty.call(req.body, "specs")) {
    try {
      specsUpdate = parseSpecsInput(req.body.specs);
    } catch {
      return res.status(400).json({ error: "Характеристики (specs) мають бути валідним JSON" });
    }
  }

  const fields = [];
  const params = { id };

  if (category_id != null) {
    fields.push("category_id = :category_id");
    params.category_id = category_id;
  }
  if (name != null) {
    fields.push("name = :name");
    params.name = name;
  }
  if (slug != null) {
    fields.push("slug = :slug");
    params.slug = slug;
  }
  if (description != null) {
    fields.push("description = :description");
    params.description = description;
  }
  if (price != null) {
    fields.push("price = :price");
    params.price = price;
  }
  if (stock != null) {
    fields.push("stock = :stock");
    params.stock = stock;
  }
  if (image_url != null) {
    fields.push("image_url = :image_url");
    params.image_url = image_url;
  }
  if (specsUpdate !== undefined) {
    fields.push("specs = :specs");
    params.specs = specsUpdate == null ? null : JSON.stringify(specsUpdate);
  }

  if (!fields.length) {
    return res.status(400).json({ error: "Немає полів для оновлення" });
  }

  const pool = getPool();
  try {
    const [r] = await pool.query(`UPDATE products SET ${fields.join(", ")} WHERE id = :id`, params);
    if (r.affectedRows === 0) {
      return res.status(404).json({ error: "Товар не знайдено" });
    }
    res.json({ ok: true });
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Товар з таким slug вже є" });
    }
    console.error(e);
    res.status(500).json({ error: "Не вдалося оновити товар" });
  }
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "Некоректний id" });
  }

  const pool = getPool();
  const [existing] = await pool.query(`SELECT id, is_active FROM products WHERE id = :id LIMIT 1`, { id });
  if (!existing[0]) {
    return res.status(404).json({ error: "Товар не знайдено" });
  }

  if (Number(existing[0].is_active) === 0) {
    await pool.query(`DELETE FROM cart_items WHERE product_id = :id`, { id });
    return res.json({ ok: true, archived: true, alreadyArchived: true });
  }

  try {
    const [r] = await pool.query(`DELETE FROM products WHERE id = :id`, { id });
    if (r.affectedRows === 1) {
      return res.json({ ok: true });
    }
    return res.status(404).json({ error: "Товар не знайдено" });
  } catch (e) {
    if (e.errno !== 1451 && e.code !== "ER_ROW_IS_REFERENCED_2") {
      console.error(e);
      return res.status(500).json({ error: "Не вдалося видалити товар" });
    }
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [u] = await conn.query(
      `UPDATE products SET is_active = 0, slug = CONCAT(LEFT(slug, 170), '-a', id) WHERE id = :id AND is_active = 1`,
      { id }
    );
    await conn.query(`DELETE FROM cart_items WHERE product_id = :id`, { id });
    await conn.commit();
    return res.json({ ok: true, archived: true, slugChanged: u.affectedRows === 1 });
  } catch (e) {
    await conn.rollback().catch(() => {});
    console.error(e);
    return res.status(500).json({ error: "Не вдалося зняти товар з продажу" });
  } finally {
    conn.release();
  }
});

module.exports = router;
