const express = require("express");
const bcrypt = require("bcryptjs");
const { getPool } = require("../db");
const { COOKIE_NAME, signToken } = require("../lib/authToken");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

function isEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || "").trim());
}

router.post("/register", async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");
  const full_name = String(req.body?.full_name || "").trim();
  const phone = String(req.body?.phone || "").trim();

  if (!isEmail(email)) {
    return res.status(400).json({ error: "Некоректний email" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Пароль мінімум 6 символів" });
  }
  if (full_name.length < 2) {
    return res.status(400).json({ error: "Вкажіть ім’я (мінімум 2 символи)" });
  }

  const hash = bcrypt.hashSync(password, 10);
  const pool = getPool();
  try {
    const [r] = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, phone, role) VALUES (:email, :hash, :full_name, :phone, 'customer')`,
      { email, hash, full_name, phone }
    );
    const id = r.insertId;
    const token = signToken({ sub: String(id) });
    res.cookie(COOKIE_NAME, token, COOKIE_OPTS);
    return res.status(201).json({
      user: { id, email, full_name, phone, role: "customer" },
    });
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Користувач з таким email вже є" });
    }
    console.error(e);
    return res.status(500).json({ error: "Помилка сервера" });
  }
});

router.post("/login", async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");
  if (!email || !password) {
    return res.status(400).json({ error: "Email і пароль обов’язкові" });
  }

  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT id, email, password_hash, full_name, phone, role FROM users WHERE email = :email LIMIT 1`,
    { email }
  );
  const user = rows[0];
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: "Невірний email або пароль" });
  }

  const token = signToken({ sub: String(user.id) });
  res.cookie(COOKIE_NAME, token, COOKIE_OPTS);
  return res.json({
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      phone: user.phone,
      role: user.role,
    },
  });
});

router.post("/logout", (_req, res) => {
  res.clearCookie(COOKIE_NAME, { path: "/", httpOnly: true, sameSite: "lax" });
  res.json({ ok: true });
});

router.get("/me", requireAuth, async (req, res) => {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT id, email, full_name, phone, role FROM users WHERE id = :id LIMIT 1`,
    { id: req.userId }
  );
  const user = rows[0];
  if (!user) {
    res.clearCookie(COOKIE_NAME, { path: "/", httpOnly: true, sameSite: "lax" });
    return res.status(401).json({ error: "Користувача не знайдено" });
  }
  res.json({
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      phone: user.phone,
      role: user.role,
    },
  });
});

module.exports = router;
