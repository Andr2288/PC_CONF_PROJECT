require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { ping } = require("./db");
const { requireAuth } = require("./middleware/auth");
const { requireAdmin } = require("./middleware/admin");
const authRoutes = require("./routes/auth");
const adminProductsRoutes = require("./routes/adminProducts");
const { uploadAdminImage } = require("./routes/adminUpload");
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

app.use("/uploads", express.static(path.join(__dirname, "../uploads"), { maxAge: "7d" }));

app.use("/api/auth", authRoutes);
app.use("/api/catalog", catalogRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/admin/products", requireAuth, requireAdmin, adminProductsRoutes);
app.post("/api/admin/upload", requireAuth, requireAdmin, uploadAdminImage);

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
