const { getPool } = require("../db");

async function requireAdmin(req, res, next) {
  if (!req.userId) {
    return res.status(401).json({ error: "Потрібна авторизація" });
  }
  try {
    const pool = getPool();
    const [rows] = await pool.query(`SELECT role FROM users WHERE id = :id LIMIT 1`, { id: req.userId });
    const role = rows[0]?.role;
    if (role !== "admin") {
      return res.status(403).json({ error: "Доступ лише для адміністратора" });
    }
    next();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Помилка перевірки прав" });
  }
}

module.exports = { requireAdmin };
