const mongoose = require("mongoose");

// ── Message Schema ────────────────────────────────────────────
const messageSchema = new mongoose.Schema({
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true },
  sender:       { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  text:         { type: String, required: true, maxlength: 2000 },
  readBy:       [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  attachmentUrl:{ type: String, default: "" },
}, { timestamps: true });

messageSchema.index({ conversation: 1, createdAt: -1 });

// ── Conversation Schema ───────────────────────────────────────
const conversationSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],
  // Denormalised last message for list view
  lastMessage: { type: String, default: "" },
  lastMessageAt: { type: Date, default: Date.now },
  lastSender:  { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  // optional: link to a product the chat started from
  productRef:  { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  productTitle:{ type: String, default: "" },
}, { timestamps: true });

conversationSchema.index({ participants: 1, lastMessageAt: -1 });

const Message      = mongoose.model("Message",      messageSchema);
const Conversation = mongoose.model("Conversation", conversationSchema);

module.exports = { Message, Conversation };
