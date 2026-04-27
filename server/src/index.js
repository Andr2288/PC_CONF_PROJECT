require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { ping } = require("./db");
const authRoutes = require("./routes/auth");
const catalogRoutes = require("./routes/catalog");
const cartRoutes = require("./routes/cart");
const ordersRoutes = require("./routes/orders");

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/catalog", catalogRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", ordersRoutes);

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
