const jwt = require("jsonwebtoken");

const COOKIE_NAME = "pcshop_token";

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 8) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET у .env має бути не коротший за 8 символів");
    }
    console.warn("[auth] JWT_SECRET не задано — використовується dev-значення (лише для розробки)");
    return "pc-shop-dev-secret-min-8-chars";
  }
  return s;
}

function signToken(payload) {
  return jwt.sign(payload, secret(), { expiresIn: "7d" });
}

function verifyToken(token) {
  return jwt.verify(token, secret());
}

module.exports = { COOKIE_NAME, signToken, verifyToken };
