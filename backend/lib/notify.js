/**
 * notify(userId, payload)
 * Creates a Notification document and simultaneously pushes it
 * over SSE to any open browser tab for that user.
 */
const Notification = require("../models/Notification");
const sse          = require("./sse");

async function notify(userId, { type, title, message, productId, orderId, amount, meta } = {}) {
  try {
    const doc = await Notification.create({
      user: userId,
      type:      type      || "general",
      title:     title     || "Notification",
      message:   message   || "",
      productId: productId || undefined,
      orderId:   orderId   || undefined,
      amount:    amount    || undefined,
      meta:      meta      || undefined,
    });

    // Push over SSE immediately (non-blocking)
    sse.broadcast(`user:${userId}`, "notification", {
      _id:       doc._id,
      type:      doc.type,
      title:     doc.title,
      message:   doc.message,
      productId: doc.productId,
      amount:    doc.amount,
      isRead:    false,
      createdAt: doc.createdAt,
    });

    return doc;
  } catch (err) {
    console.error("notify() failed:", err.message);
  }
}

module.exports = notify;
