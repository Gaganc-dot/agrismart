const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: [
        "new_bid",              // seller: buyer placed a bid
        "bid_increased",        // seller: buyer raised their bid
        "outbid",               // buyer: someone bid higher
        "bid_accepted",         // buyer: seller accepted their bid
        "auction_won",          // buyer: they won the auction
        "auction_ending",       // all watchers: auction ends in 10 min
        "auction_closed",       // all watchers: auction ended
        "order_confirmed",      // buyer: order confirmed
        "payment_pending",      // buyer: payment needed
        "new_order",            // farmer: new order received
        "order_status_update",  // buyer: status changed (packed/shipped etc.)
        "delivery_otp",         // buyer: OTP for delivery verification
        "delivery_confirmed",   // buyer: delivery confirmed by OTP
        "payment_released",     // farmer: payment released after OTP
        "general",
      ],
      default: "general",
    },
    title:     { type: String, required: true },
    message:   { type: String, required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    orderId:   { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    amount:    { type: Number },        // bid / order amount
    isRead:    { type: Boolean, default: false, index: true },
    meta:      { type: mongoose.Schema.Types.Mixed }, // extra payload
  },
  { timestamps: true }
);

// Auto-delete notifications older than 30 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 3600 });

module.exports = mongoose.model("Notification", notificationSchema);
