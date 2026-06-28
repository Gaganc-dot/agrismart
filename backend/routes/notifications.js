const express      = require("express");
const router       = express.Router();
const Notification = require("../models/Notification");
const protect      = require("../middleware/auth");
const sse          = require("../lib/sse");

// ── SSE Subscribe ─────────────────────────────────────────────
// GET /api/notifications/stream  (EventSource in browser)
router.get("/stream", protect, (req, res) => {
  const userId = req.user.id;
  sse.subscribe(res, [`user:${userId}`]);
  // Never call next() — keep the SSE connection open
});

// ── GET /api/notifications — list (newest 50, unread first) ──
router.get("/", protect, async (req, res) => {
  try {
    const notes = await Notification.find({ user: req.user.id })
      .sort({ isRead: 1, createdAt: -1 })
      .limit(50)
      .lean();
    const unreadCount = await Notification.countDocuments({ user: req.user.id, isRead: false });
    res.json({ success: true, notifications: notes, unreadCount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/notifications/read-all ──────────────────────────
router.put("/read-all", protect, async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user.id, isRead: false }, { isRead: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/notifications/:id/read ──────────────────────────
router.put("/:id/read", protect, async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { isRead: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELETE /api/notifications/:id ────────────────────────────
router.delete("/:id", protect, async (req, res) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELETE /api/notifications ─────────────────────────────────
router.delete("/", protect, async (req, res) => {
  try {
    await Notification.deleteMany({ user: req.user.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
