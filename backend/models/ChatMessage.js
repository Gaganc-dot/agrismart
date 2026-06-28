const mongoose = require("mongoose");

/**
 * ChatMessage — stores AI assistant conversation history per user.
 * One document per individual message (user or assistant turn).
 */
const chatMessageSchema = new mongoose.Schema(
  {
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
    },
    role: {
      type:     String,
      enum:     ["user", "assistant"],
      required: true,
    },
    message: {
      type:     String,
      required: true,
      trim:     true,
    },
    createdAt: {
      type:    Date,
      default: Date.now,
    },
  },
  {
    // Disable automatic timestamps — we manage createdAt manually above
    timestamps: false,
    collection: "ai_chat_messages",
  }
);

// Compound index: efficient user history retrieval sorted by time
chatMessageSchema.index({ user: 1, createdAt: 1 });

module.exports = mongoose.model("ChatMessage", chatMessageSchema);
