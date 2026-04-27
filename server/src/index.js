require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { ping } = require("./db");

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(cors({ origin: true }));
app.use(express.json());

app.get("/api/health", async (_req, res) => {
  try {
    const dbOk = await ping();
    res.json({ ok: true, db: dbOk ? "up" : "down" });
  } catch {
    res.status(503).json({ ok: false, db: "down" });
  }
});

app.listen(PORT, () => {
  console.log(`API http://localhost:${PORT}`);
});
