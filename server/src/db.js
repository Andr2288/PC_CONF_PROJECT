const mysql = require("mysql2/promise");
require("dotenv").config();

function poolConfig() {
  return {
    host: process.env.DB_HOST || "127.0.0.1",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD ?? "",
    database: process.env.DB_NAME || "pc_shop_mvp",
    waitForConnections: true,
    connectionLimit: 10,
    namedPlaceholders: true,
  };
}

let pool;

function getPool() {
  if (!pool) {
    pool = mysql.createPool(poolConfig());
  }
  return pool;
}

async function ping() {
  const p = getPool();
  const [rows] = await p.query("SELECT 1 AS ok");
  return rows[0]?.ok === 1;
}

module.exports = { getPool, ping, poolConfig };
