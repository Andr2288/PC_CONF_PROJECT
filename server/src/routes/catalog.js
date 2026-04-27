const express = require("express");
const { getPool } = require("../db");

const router = express.Router();

router.get("/categories", async (_req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT id, name, slug, sort_order FROM categories ORDER BY sort_order ASC, id ASC`
    );
    res.json({ categories: rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Не вдалося завантажити категорії" });
  }
});

router.get("/products", async (req, res) => {
  const categorySlug = typeof req.query.category === "string" ? req.query.category.trim() : "";
  const searchRaw = typeof req.query.search === "string" ? req.query.search.trim() : "";
  const search = searchRaw.slice(0, 120);

  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 12));
  const offset = (page - 1) * limit;

  let where = "1=1";
  const params = {};
  if (categorySlug) {
    where += " AND c.slug = :categorySlug";
    params.categorySlug = categorySlug;
  }
  if (search) {
    where += " AND p.name LIKE :searchLike";
    params.searchLike = `%${search}%`;
  }

  try {
    const pool = getPool();
    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS n
       FROM products p
       INNER JOIN categories c ON c.id = p.category_id
       WHERE ${where}`,
      params
    );
    const total = Number(countRows[0]?.n || 0);
    const pages = Math.max(1, Math.ceil(total / limit));

    const [items] = await pool.query(
      `SELECT p.id, p.name, p.slug, p.price, p.stock, p.image_url, p.specs,
              c.slug AS category_slug, c.name AS category_name
       FROM products p
       INNER JOIN categories c ON c.id = p.category_id
       WHERE ${where}
       ORDER BY p.id DESC
       LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
      params
    );

    const normalized = items.map((row) => {
      let specs = null;
      if (row.specs != null) {
        try {
          specs = typeof row.specs === "string" ? JSON.parse(row.specs) : row.specs;
        } catch {
          specs = null;
        }
      }
      return {
        ...row,
        price: Number(row.price),
        specs,
      };
    });

    res.json({
      items: normalized,
      total,
      page,
      limit,
      pages,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Не вдалося завантажити товари" });
  }
});

module.exports = router;
