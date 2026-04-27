const path = require("path");
const fs = require("fs");
const multer = require("multer");

const uploadDir = path.join(__dirname, "../../uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase().slice(0, 8);
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext || ".bin"}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.mimetype);
    if (!ok) {
      cb(new Error("Лише зображення: JPEG, PNG, WebP або GIF"));
      return;
    }
    cb(null, true);
  },
});

function uploadAdminImage(req, res) {
  upload.single("file")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || "Помилка завантаження" });
    }
    if (!req.file) {
      return res.status(400).json({ error: "Файл не отримано (поле file)" });
    }
    const port = Number(process.env.PORT) || 3001;
    const base = (process.env.PUBLIC_API_URL || "").replace(/\/$/, "") || `http://127.0.0.1:${port}`;
    const url = `${base}/uploads/${req.file.filename}`;
    res.json({ url });
  });
}

module.exports = { uploadAdminImage };
