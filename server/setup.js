/* setup: npm run setup (з папки server) */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const readline = require("readline");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");

const DB_HOST = process.env.DB_HOST || "127.0.0.1";
const DB_USER = process.env.DB_USER || "root";
const DB_PASSWORD = process.env.DB_PASSWORD ?? "";
const DB_NAME = process.env.DB_NAME || "pc_shop_mvp";

const sqlDir = path.join(__dirname, "sql");

function baseConfig(withoutDatabase) {
  const cfg = {
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    multipleStatements: true,
  };
  if (!withoutDatabase) cfg.database = DB_NAME;
  return cfg;
}

async function connect(withoutDatabase) {
  return mysql.createConnection(baseConfig(withoutDatabase));
}

async function databaseExists(conn) {
  const [rows] = await conn.query("SHOW DATABASES LIKE ?", [DB_NAME]);
  return rows.length > 0;
}

async function dropAllTables(conn) {
  await conn.query("SET FOREIGN_KEY_CHECKS = 0");
  const [tables] = await conn.query(
    "SELECT TABLE_NAME AS t FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?",
    [DB_NAME]
  );
  for (const row of tables) {
    await conn.query(`DROP TABLE IF EXISTS \`${row.t}\``);
  }
  await conn.query("SET FOREIGN_KEY_CHECKS = 1");
}

async function ensureDatabase(connNoDb) {
  await connNoDb.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
}

async function runSqlFile(conn, filename) {
  const full = path.join(sqlDir, filename);
  const sql = fs.readFileSync(full, "utf8");
  await conn.query(sql);
}

async function seedUsers(conn) {
  const hash = bcrypt.hashSync("password123", 10);
  await conn.query(
    `INSERT INTO users (email, password_hash, full_name, phone, role) VALUES
      ('admin@shop.local', ?, 'Адміністратор', '', 'admin'),
      ('demo@shop.local', ?, 'Демо клієнт', '+380501112233', 'customer')
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), full_name = VALUES(full_name), role = VALUES(role)`,
    [hash, hash]
  );
}

async function checkState() {
  let conn;
  try {
    conn = await connect(true);
    const exists = await databaseExists(conn);
    if (!exists) {
      console.log(`База "${DB_NAME}" не знайдена. Оберіть "Ініціалізувати БД".`);
      return;
    }
    await conn.end();
    conn = await connect(false);
    const [tables] = await conn.query("SHOW TABLES");
    const names = tables.map((row) => Object.values(row)[0]);
    console.log(`База "${DB_NAME}" існує. Таблиць: ${names.length}`);
    for (const t of names) {
      const [c] = await conn.query(`SELECT COUNT(*) AS n FROM \`${t}\``);
      console.log(`  - ${t}: ${c[0].n} рядків`);
    }
  } catch (e) {
    console.error("Помилка перевірки:", e.message);
  } finally {
    if (conn) await conn.end().catch(() => {});
  }
}

async function initDatabase() {
  let connNoDb = null;
  let conn = null;
  try {
    connNoDb = await connect(true);
    await ensureDatabase(connNoDb);
    await connNoDb.end();
    connNoDb = null;

    conn = await connect(false);
    console.log("Скидання таблиць…");
    await dropAllTables(conn);
    console.log("Створення схеми…");
    await runSqlFile(conn, "schema.sql");
    console.log("Заповнення мок-даними…");
    await runSqlFile(conn, "seed.sql");
    await seedUsers(conn);
    console.log("Готово. Користувачі: admin@shop.local / demo@shop.local, пароль: password123");
  } catch (e) {
    console.error("Помилка ініціалізації:", e.message);
  } finally {
    if (connNoDb) await connNoDb.end().catch(() => {});
    if (conn) await conn.end().catch(() => {});
  }
}


async function deleteDatabase() {
  let conn;
  try {
    conn = await connect(true);
    await conn.query(`DROP DATABASE IF EXISTS \`${DB_NAME}\``);
    console.log(`Базу "${DB_NAME}" видалено.`);
  } catch (e) {
    console.error("Помилка видалення:", e.message);
  } finally {
    if (conn) await conn.end().catch(() => {});
  }
}

function prompt(rl, q) {
  return new Promise((resolve) => rl.question(q, resolve));
}

async function main() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    while (true) {
      console.log(`
--- PC Shop / MySQL ---
1 — Перевірити стан БД
2 — Ініціалізувати БД (+ мок-дані)
3 — Видалити базу даних
0 — Вихід
`);
      const a = (await prompt(rl, "Оберіть: ")).trim();
      if (a === "1") await checkState();
      else if (a === "2") await initDatabase();
      else if (a === "3") {
        const ok = (await prompt(rl, `Це видалить "${DB_NAME}". Введіть YES: `)).trim();
        if (ok === "YES") await deleteDatabase();
        else console.log("Скасовано.");
      } else if (a === "0") break;
      else console.log("Невідома опція.");
    }
  } finally {
    rl.close();
  }
}

main();
