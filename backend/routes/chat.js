/**
 * Chat Routes — Private buyer–farmer messaging
 *
 * GET  /api/chat/conversations          — list my conversations
 * POST /api/chat/conversations          — start/get conversation with a user
 * GET  /api/chat/conversations/:id      — single conversation detail
 * GET  /api/chat/conversations/:id/messages — paginated message history
 * POST /api/chat/conversations/:id/messages — send a message (also via Socket)
 * PUT  /api/chat/conversations/:id/read     — mark all messages as read
 * GET  /api/chat/unread                 — total unread count badge
 */

const express        = require("express");
const router         = express.Router();
const protect        = require("../middleware/auth");
const { Message, Conversation } = require("../models/Chat");
const User           = require("../models/User");

// ── GET /conversations ────────────────────────────────────────
router.get("/conversations", protect, async (req, res) => {
  try {
    const convs = await Conversation.find({ participants: req.user.id })
      .populate("participants", "name role farmName")
      .populate("lastSender", "name")
      .sort({ lastMessageAt: -1 });

    // Attach unread count per conversation
    const withUnread = await Promise.all(convs.map(async (c) => {
      const unread = await Message.countDocuments({
        conversation: c._id,
        readBy: { $ne: req.user.id },
        sender: { $ne: req.user.id },
      });
      return { ...c.toObject(), unread };
    }));

    res.json({ success: true, conversations: withUnread });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /conversations — start or retrieve ───────────────────
router.post("/conversations", protect, async (req, res) => {
  try {
    const { recipientId, productRef, productTitle } = req.body;
    if (!recipientId) return res.status(400).json({ success: false, message: "recipientId required" });

    const recipient = await User.findById(recipientId);
    if (!recipient) return res.status(404).json({ success: false, message: "User not found" });

    // Prevent chat with yourself
    if (recipientId === req.user.id)
      return res.status(400).json({ success: false, message: "Cannot chat with yourself" });

    // Find existing conversation between these two users
    let conv = await Conversation.findOne({
      participants: { $all: [req.user.id, recipientId], $size: 2 },
    }).populate("participants", "name role farmName");

    if (!conv) {
      conv = await Conversation.create({
        participants: [req.user.id, recipientId],
        productRef: productRef || undefined,
        productTitle: productTitle || "",
      });
      conv = await conv.populate("participants", "name role farmName");
    }

    res.json({ success: true, conversation: conv });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /conversations/:id ────────────────────────────────────
router.get("/conversations/:id", protect, async (req, res) => {
  try {
    const conv = await Conversation.findOne({
      _id: req.params.id,
      participants: req.user.id,
    }).populate("participants", "name role farmName phone");

    if (!conv) return res.status(404).json({ success: false, message: "Conversation not found" });
    res.json({ success: true, conversation: conv });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /conversations/:id/messages ──────────────────────────
router.get("/conversations/:id/messages", protect, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;

    // Verify participant
    const conv = await Conversation.findOne({ _id: req.params.id, participants: req.user.id });
    if (!conv) return res.status(403).json({ success: false, message: "Not authorized" });

    const msgs = await Message.find({ conversation: req.params.id })
      .populate("sender", "name role")
      .sort({ createdAt: -1 })
      .skip((page - 1) * Number(limit))
      .limit(Number(limit));

    res.json({ success: true, messages: msgs.reverse() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /conversations/:id/messages ─────────────────────────
router.post("/conversations/:id/messages", protect, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ success: false, message: "Message cannot be empty" });

    const conv = await Conversation.findOne({ _id: req.params.id, participants: req.user.id });
    if (!conv) return res.status(403).json({ success: false, message: "Not authorized" });

    const msg = await Message.create({
      conversation: conv._id,
      sender: req.user.id,
      text: text.trim(),
      readBy: [req.user.id],
    });
    await msg.populate("sender", "name role");

    // Update conversation's last message
    await Conversation.findByIdAndUpdate(conv._id, {
      lastMessage:   text.trim().slice(0, 100),
      lastMessageAt: new Date(),
      lastSender:    req.user.id,
    });

    // Emit via Socket.io if available
    const io = req.app.get("io");
    if (io) {
      io.to(`chat:${conv._id}`).emit("new_message", {
        conversationId: conv._id,
        message: msg,
      });

      // Notify the other participant
      const otherId = conv.participants.find(p => p.toString() !== req.user.id.toString());
      if (otherId) {
        io.to(`user:${otherId}`).emit("chat_notification", {
          conversationId: conv._id,
          senderName: req.user.name,
          preview: text.trim().slice(0, 60),
        });
      }
    }

    res.status(201).json({ success: true, message: msg });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /conversations/:id/read ───────────────────────────────
router.put("/conversations/:id/read", protect, async (req, res) => {
  try {
    await Message.updateMany(
      { conversation: req.params.id, readBy: { $ne: req.user.id } },
      { $addToSet: { readBy: req.user.id } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /unread ───────────────────────────────────────────────
router.get("/unread", protect, async (req, res) => {
  try {
    const myConvs = await Conversation.find({ participants: req.user.id }).select("_id");
    const count = await Message.countDocuments({
      conversation: { $in: myConvs.map(c => c._id) },
      readBy: { $ne: req.user.id },
      sender: { $ne: req.user.id },
    });
    res.json({ success: true, unread: count });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
