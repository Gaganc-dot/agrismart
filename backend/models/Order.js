const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    buyer:   { type: mongoose.Schema.Types.ObjectId, ref: "User",    required: true },
    farmer:  { type: mongoose.Schema.Types.ObjectId, ref: "User",    required: true },
    product: { type: mongoose.Schema.Types.ObjectId, refPath: "productModel", required: true },
    productModel: { type: String, required: true, enum: ["Product", "Equipment"], default: "Product" },

    quantity:        { type: Number, required: true },
    totalPrice:      { type: Number, required: true },
    deliveryAddress: { type: String, default: "" },
    note:            { type: String, default: "" },

    // ── Extended Delivery Status ──────────────────────────────
    status: {
      type: String,
      enum: [
        "pending",          // order placed, awaiting farmer
        "confirmed",        // farmer accepted
        "packed",           // farmer packed the order
        "shipped",          // order dispatched
        "out_for_delivery", // delivery partner on the way → triggers OTP
        "otp_pending",      // OTP sent, awaiting verification
        "delivered",        // OTP verified, physically delivered
        "completed",        // payment released, order complete
        "cancelled",
      ],
      default: "pending",
    },

    // ── OTP Fields ────────────────────────────────────────────
    deliveryOtp:     { type: String,  default: "" },     // bcrypt-hashed
    otpPlain:        { type: String,  default: "" },     // plain (shown to buyer only; cleared after delivery)
    otpExpiry:       { type: Date },
    otpVerified:     { type: Boolean, default: false },
    otpAttempts:     { type: Number,  default: 0 },
    otpSentAt:       { type: Date },
    otpLockedUntil:  { type: Date },                     // lock after 5 failed attempts

    deliveredAt:     { type: Date },
    completedAt:     { type: Date },

    // ── Razorpay Payment Integration Tracking ─────────────────
    razorpayOrderId:   { type: String, default: "" },
    razorpayPaymentId: { type: String, default: "" },
    paymentStatus:     { type: String, enum: ["pending", "paid", "failed"], default: "pending" },

    // ── Activity Log ──────────────────────────────────────────
    statusHistory: [
      {
        status:    { type: String },
        changedAt: { type: Date, default: Date.now },
        note:      { type: String, default: "" },
      },
    ],
  },
  { timestamps: true }
);

orderSchema.index({ buyer: 1, createdAt: -1 });
orderSchema.index({ farmer: 1, createdAt: -1 });

module.exports = mongoose.model("Order", orderSchema);
