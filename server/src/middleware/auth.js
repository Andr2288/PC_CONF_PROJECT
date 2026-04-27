const { COOKIE_NAME, verifyToken } = require("../lib/authToken");

function requireAuth(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ error: "Потрібна авторизація" });
  }
  try {
    const payload = verifyToken(token);
    req.userId = Number(payload.sub);
    if (!req.userId) {
      return res.status(401).json({ error: "Недійсний токен" });
    }
    next();
  } catch {
    return res.status(401).json({ error: "Недійсний або прострочений токен" });
  }
}

module.exports = { requireAuth };
