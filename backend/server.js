const express   = require("express");
const http      = require("http");
const mongoose  = require("mongoose");
const cors      = require("cors");
const rateLimit = require("express-rate-limit");
const jwt       = require("jsonwebtoken");
require("dotenv").config();

const app        = express();
const httpServer = http.createServer(app);

// ── Socket.io — optional (graceful fallback to SSE if not installed) ──
let io = null;

try {
  const { Server: SocketServer } = require("socket.io");

  io = new SocketServer(httpServer, {
    cors: {
      origin: (origin, cb) => {
        if (!origin || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return cb(null, true);
        cb(new Error("Not allowed by CORS"));
      },
      credentials: true,
    },
  });

  // JWT auth middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error("Authentication required"));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id || decoded._id || decoded.userId;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const uid = socket.userId;
    if (!uid) return socket.disconnect();

    socket.join(`user:${uid}`);
    console.log(`💬 Socket connected: ${uid}`);

    socket.on("join_conversation",  (cid) => socket.join(`chat:${cid}`));
    socket.on("leave_conversation", (cid) => socket.leave(`chat:${cid}`));

    socket.on("typing", ({ conversationId, isTyping }) => {
      socket.to(`chat:${conversationId}`).emit("user_typing", { userId: uid, isTyping });
    });

    socket.on("disconnect", () => {
      console.log(`💬 Socket disconnected: ${uid}`);
    });
  });

  console.log("💬 Socket.io loaded ✅");
} catch (err) {
  console.warn("⚠️  socket.io not installed — real-time chat uses SSE fallback.");
  console.warn("    Run: cd backend && npm install socket.io");
  // no-op mock so routes that call io?.to(...).emit(...) never crash
  io = null;
}

// Expose io (or null) on app so routes can use it safely via: req.app.get("io")
app.set("io", io);

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
    if (!origin || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) || origin === process.env.CLIENT_URL) {
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

// ── Request Logger ────────────────────────────────────────────
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const ms    = Date.now() - start;
    const color = res.statusCode >= 500 ? "\x1b[31m"
                : res.statusCode >= 400 ? "\x1b[33m"
                : res.statusCode >= 300 ? "\x1b[36m"
                : "\x1b[32m";
    console.log(`${color}${req.method}\x1b[0m ${req.originalUrl} ${res.statusCode} \x1b[90m${ms}ms\x1b[0m`);
  });
  next();
});

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

// ── Rate Limiters ─────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please try again after 15 minutes." },
});

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Rate limit exceeded. Slow down." },
});

app.use("/api/", apiLimiter);

// ── DB Ready Guard ────────────────────────────────────────────
app.use("/api", (req, res, next) => {
  if (req.path === "/health") return next();
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: "Database is connecting — please try again in a few seconds.",
    });
  }
  next();
});

// ── Routes ────────────────────────────────────────────
app.use("/api/auth",          authLimiter, require("./routes/auth"));
app.use("/api/ai",                         require("./routes/ai"));
app.use("/api/ai-chat",                    require("./routes/aiChat"));
app.use("/api/products",                   require("./routes/products"));
app.use("/api/expenses",                   require("./routes/expenses"));
app.use("/api/forum",                      require("./routes/forum"));
app.use("/api/orders",                     require("./routes/orders"));
app.use("/api/iot",                        require("./routes/iot"));
app.use("/api/admin",                      require("./routes/admin"));
// Auction bidding handled by POST /api/products/:id/bid in products.js
app.use("/api/notifications",              require("./routes/notifications"));
app.use("/api/equipment",                  require("./routes/equipment"));
app.use("/api/mandi",                      require("./routes/mandiRoutes"));
app.use("/api/chat",                       require("./routes/chat"));
app.use("/api/calendar",                   require("./routes/calendar"));

// ── Health Check ──────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    success:   true,
    message:   "Agri-Smart Connect API ✅",
    version:   "2.0.0",
    socketio:  io ? "active" : "unavailable (install socket.io)",
    uptime:    `${Math.floor(process.uptime())}s`,
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success:     true,
    db:          mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    socketio:    io ? "active" : "unavailable",
    uptime:      process.uptime(),
    memoryUsage: process.memoryUsage(),
    timestamp:   new Date().toISOString(),
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

// ── DB Connect + Start ────────────────────────────────────────
const PORT = process.env.PORT || 8000;

const connectWithRetry = (attempt = 1) => {
  const MAX = 10;
  console.log(`🔄 MongoDB connecting… (attempt ${attempt}/${MAX})`);
  mongoose
    .connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 45000,
    })
    .then(() => console.log("✅ MongoDB connected"))
    .catch((err) => {
      console.error(`❌ DB error: ${err.message}`);
      if (attempt < MAX) {
        console.log(`⏳ Retrying in 5s…`);
        setTimeout(() => connectWithRetry(attempt + 1), 5000);
      } else {
        console.error("❌ Could not connect to MongoDB after 10 attempts.");
      }
    });
};

httpServer.listen(PORT, () => {
  console.log(`✅ Server running → http://localhost:${PORT}`);
  connectWithRetry();

  // Start telemetry simulator process
  try {
    const { fork } = require("child_process");
    const path = require("path");
    const telemetryPath = path.join(__dirname, "scripts/telemetry_sim.js");
    fork(telemetryPath);
    console.log("📡 Telemetry simulator daemon started");
  } catch (err) {
    console.error("Failed to start telemetry daemon:", err.message);
  }

  // Initialize Daily Cron Scheduler for Crop Calendar milestones
  try {
    const { initCron } = require("./lib/cron");
    initCron();
  } catch (err) {
    console.error("Failed to initialize cron scheduler:", err.message);
  }
});
