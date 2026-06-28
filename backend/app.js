/**
 * app.js — Pure Express application (no server.listen, no cron, no DB connect).
 * Imported by server.js (which adds the HTTP server + DB) and by tests (which
 * supply their own in-memory MongoDB via mongodb-memory-server).
 */
const express   = require("express");
const cors      = require("cors");
const rateLimit = require("express-rate-limit");

const app = express();

// ── Security Headers ──────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' http://localhost:* ws://localhost:*"
  );
  next();
});

// ── CORS ──────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || /^http:\/\/localhost(:\d+)?$/.test(origin) || origin === process.env.CLIENT_URL) {
      return callback(null, true);
    }
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// ── Body Parsers ──────────────────────────────────────────────
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// ── Input Sanitizer (XSS / NoSQL injection) ───────────────────
app.use((req, res, next) => {
  const sanitize = (obj) => {
    if (!obj || typeof obj !== "object") return obj;
    Object.keys(obj).forEach((key) => {
      if (key.startsWith("$") || key.includes(".")) {
        delete obj[key];
      } else if (typeof obj[key] === "string") {
        obj[key] = obj[key].replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
      } else if (typeof obj[key] === "object") {
        sanitize(obj[key]);
      }
    });
    return obj;
  };
  if (req.body)   sanitize(req.body);
  if (req.query)  sanitize(req.query);
  if (req.params) sanitize(req.params);
  next();
});

// ── Rate Limiters (disabled / lenient in test env) ────────────
const isTest = process.env.NODE_ENV === "test";

const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: isTest ? 1000 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please try again after 1 minute." },
});

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: isTest ? 1000 : 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Rate limit exceeded. Slow down." },
});

app.use("/api/", apiLimiter);

// ── DB Ready Guard (skip in test — tests manage their own connection) ──
app.use("/api", (req, res, next) => {
  if (req.path === "/health") return next();
  if (isTest) return next(); // in-memory DB is always ready
  const mongoose = require("mongoose");
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: "Database is connecting — please try again in a few seconds.",
    });
  }
  next();
});

// ── Routes ────────────────────────────────────────────────────
app.use("/api/auth",         authLimiter, require("./routes/auth"));
app.use("/api/ai",                        require("./routes/ai"));
app.use("/api/products",                  require("./routes/products"));
app.use("/api/expenses",                  require("./routes/expenses"));
app.use("/api/forum",                     require("./routes/forum"));
app.use("/api/orders",                    require("./routes/orders"));
app.use("/api/iot",                       require("./routes/iot"));
app.use("/api/admin",                     require("./routes/admin"));
app.use("/api/auction",                   require("./routes/auction"));
app.use("/api/notifications",             require("./routes/notifications"));
app.use("/api/equipment",                 require("./routes/equipment"));
app.use("/api/mandi",                     require("./routes/mandiRoutes"));
app.use("/api/chat",                      require("./routes/chat"));
app.use("/api/calendar",                  require("./routes/calendar"));

// ── Health Check ──────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    success:   true,
    message:   "Agri-Smart Connect API ✅",
    version:   "2.0.0",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/health", (req, res) => {
  const mongoose = require("mongoose");
  res.json({
    success:   true,
    db:        mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    uptime:    process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ── 404 ───────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} not found` });
});

// ── Global Error Handler ──────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error("❌ Unhandled error:", err);
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ success: false, message: messages.join(". ") });
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({ success: false, message: `${field} already exists.` });
  }
  if (err.name === "JsonWebTokenError")  return res.status(401).json({ success: false, message: "Invalid token." });
  if (err.name === "TokenExpiredError")  return res.status(401).json({ success: false, message: "Token expired." });
  if (err.name === "CastError")          return res.status(400).json({ success: false, message: "Invalid ID format." });
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === "production" ? "An unexpected error occurred." : err.message,
  });
});

module.exports = app;
