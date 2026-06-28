/**
 * Orders Routes — with OTP-based Delivery Verification
 *
 * GET  /api/orders/buyer               — buyer's orders
 * GET  /api/orders/farmer              — farmer's received orders
 * POST /api/orders                     — place order (COD)
 * POST /api/orders/create-razorpay-order
 * POST /api/orders/verify-payment
 * PUT  /api/orders/:id/status          — farmer updates status (auto-OTP on out_for_delivery)
 * POST /api/orders/:id/resend-otp      — buyer resends OTP
 * POST /api/orders/:id/verify-otp      — verify OTP → mark delivered
 * PUT  /api/orders/:id/cancel          — buyer cancels pending order
 */

const express        = require("express");
const router         = express.Router();
const crypto         = require("crypto");
const bcrypt         = require("bcryptjs");
const Order          = require("../models/Order");
const Product        = require("../models/Product");
const Notification   = require("../models/Notification");
const protect        = require("../middleware/auth");
const sse            = require("../lib/sse");
const mailer         = require("../lib/mailer");
const Razorpay       = require("razorpay");

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID     || "rzp_test_mock",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "rzp_secret_mock",
});

function validatePurchaseActor(product, user) {
  const listingType = product.listingType || "crop";
  const sellerId = product.farmer?.toString() || product.farmer;

  if (sellerId === user.id) {
    return "You cannot buy your own listing";
  }
  if (listingType === "equipment") {
    return user.role === "farmer" ? null : "Only farmers can buy equipment listings";
  }
  return user.role === "buyer" ? null : "Only buyers can buy crop listings";
}

// ── OTP helpers ───────────────────────────────────────────────

/** Generate a random 6-digit OTP string */
function generateOtpPlain() {
  return String(crypto.randomInt(100000, 999999));
}

/** Hash an OTP for secure storage */
async function hashOtp(plain) {
  return bcrypt.hash(plain, 10);
}

/** Compare plain OTP against stored hash */
async function verifyOtpHash(plain, hash) {
  return bcrypt.compare(plain, hash);
}

/**
 * createAndSendOtp — generate, hash, store, and notify buyer via SSE + Socket.io
 * Returns the plain OTP (stored once in order.otpPlain for display; hashed in deliveryOtp).
 */
async function createAndSendOtp(order, io) {
  const plain    = generateOtpPlain();
  const hashed   = await hashOtp(plain);
  const expiry   = new Date(Date.now() + 30 * 60 * 1000); // 30 min

  order.deliveryOtp    = hashed;
  order.otpPlain       = plain;     // shown to buyer in their order view; cleared after delivery
  order.otpExpiry      = expiry;
  order.otpVerified    = false;
  order.otpAttempts    = 0;
  order.otpLockedUntil = null;
  order.otpSentAt      = new Date();
  order.status         = "otp_pending";
  order.statusHistory.push({ status: "otp_pending", note: "OTP generated — sent via email + in-app" });
  await order.save();

  // Resolve buyer details (may be ObjectId or populated object)
  const buyer       = order.buyer;
  const buyerId     = buyer._id  || buyer;
  const buyerEmail  = buyer.email || null;
  const buyerName   = buyer.name  || "Customer";
  const productTitle = order.product?.title || order.product?.name || "";

  // ── 1. Email (fire-and-forget) ─────────────────────────────
  if (buyerEmail) {
    mailer.sendOtpEmail({
      to:           buyerEmail,
      buyerName,
      otp:          plain,
      orderId:      order._id,
      productTitle,
    });
  }

  // ── 2. In-app notification (SSE) ──────────────────────────
  const note = await Notification.create({
    user:    buyerId,
    type:    "delivery_otp",
    title:   "🔐 Delivery OTP",
    message: `Your delivery OTP is: ${plain}. Share it with the delivery person ONLY after receiving your order. Expires in 30 minutes.`,
    orderId: order._id,
    meta:    { otp: plain, expiry: expiry.toISOString() },
  });

  sse.broadcast(`user:${buyerId}`, "delivery_otp", {
    orderId:  order._id,
    otp:      plain,
    expiry:   expiry.toISOString(),
    message:  note.message,
  });

  // ── 3. Socket.io real-time push ────────────────────────────
  if (io) {
    io.to(`user:${buyerId}`).emit("delivery_otp", {
      type:    "delivery_otp",
      title:   "🔐 Your Delivery OTP",
      message: `OTP: ${plain} — Share only after receiving your order`,
      otp:     plain,
      expiry:  expiry.toISOString(),
      orderId: order._id,
    });
  }

  console.log(`🔐 OTP generated for order ${order._id}: [REDACTED] → buyer ${buyerEmail || buyerId}`);
  return plain;
}

// ── GET /buyer ─────────────────────────────────────────────────
router.get("/buyer", protect, async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.user.id })
      .populate("farmer",  "name farmName location phone")
      .populate("product", "name title unit price category listingType condition equipmentCategory")
      .sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /farmer ────────────────────────────────────────────────
router.get("/farmer", protect, async (req, res) => {
  try {
    const orders = await Order.find({ farmer: req.user.id })
      .populate("buyer",   "name email phone companyName")
      .populate("product", "name title unit price listingType condition equipmentCategory")
      .sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST / — place order (COD) ─────────────────────────────────
router.post("/", protect, async (req, res) => {
  try {
    const { productId, quantity, deliveryAddress, note } = req.body;

    const product = await Product.findById(productId);
    if (!product)
      return res.status(404).json({ success: false, message: "Product not found" });
    if (product.status !== "available")
      return res.status(400).json({ success: false, message: "Product not available" });
    const authError = validatePurchaseActor(product, req.user);
    if (authError) return res.status(403).json({ success: false, message: authError });

    const totalPrice = product.price * quantity;

    const order = await Order.create({
      buyer:           req.user.id,
      farmer:          product.farmer,
      product:         productId,
      quantity,
      totalPrice,
      deliveryAddress: deliveryAddress || "",
      note:            note || "",
      statusHistory:   [{ status: "pending", note: "Order placed" }],
    });

    product.quantity = Math.max(0, product.quantity - quantity);
    if (product.quantity <= 0) {
      product.status = "sold";
    }
    await product.save();

    const populated = await Order.findById(order._id)
      .populate("farmer",  "name farmName")
      .populate("product", "title unit price");

    // Notify farmer via SSE
    const farmerId = product.farmer?.toString() || product.farmer;
    await Notification.create({
      user:    farmerId,
      type:    "new_order",
      title:   "📦 New Order Received",
      message: `${req.user.name} ordered ${quantity} ${product.unit} of "${product.title}".`,
      orderId: order._id,
    });
    sse.broadcast(`user:${farmerId}`, "new_order", { orderId: order._id });

    res.status(201).json({ success: true, order: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /create-razorpay-order ────────────────────────────────
router.post("/create-razorpay-order", protect, async (req, res) => {
  try {
    const { productId, quantity, rentOption } = req.body;
    let product = await Product.findById(productId);
    let isEquipment = false;
    let price = 0;

    if (product) {
      price = product.price;
    } else {
      const Equipment = require("../models/Equipment");
      product = await Equipment.findById(productId);
      if (!product || product.status !== "available")
        return res.status(400).json({ success: false, message: "Product/Equipment unavailable" });
      isEquipment = true;
      if (rentOption === "hour") price = product.rentalPricePerHour || product.price;
      else if (rentOption === "day") price = product.rentalPricePerDay || product.price;
      else price = product.price;
    }

    const authError = validatePurchaseActor(product, req.user);
    if (authError) return res.status(403).json({ success: false, message: authError });

    const amount = price * quantity * 100;
    if (!process.env.RAZORPAY_KEY_ID) {
      return res.json({ success: true, orderId: `order_mock_${Date.now()}`, amount, currency: "INR", mock: true });
    }
    const order = await razorpay.orders.create({ amount, currency: "INR", receipt: `receipt_${Date.now()}` });
    res.json({ success: true, orderId: order.id, amount: order.amount, currency: order.currency, key: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /verify-payment ───────────────────────────────────────
router.post("/verify-payment", protect, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, productId, quantity, deliveryAddress, note, rentOption } = req.body;

    if (process.env.RAZORPAY_KEY_ID) {
      const sign = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSign = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(sign).digest("hex");
      if (razorpay_signature !== expectedSign)
        return res.status(400).json({ success: false, message: "Invalid payment signature" });
    }

    let product = await Product.findById(productId);
    let isEquipment = false;
    let price = 0;

    if (product) {
      price = product.price;
    } else {
      const Equipment = require("../models/Equipment");
      product = await Equipment.findById(productId);
      if (!product) return res.status(404).json({ success: false, message: "Product/Equipment not found" });
      if (product.status !== "available")
        return res.status(400).json({ success: false, message: "Product/Equipment unavailable" });
      isEquipment = true;
      if (rentOption === "hour") price = product.rentalPricePerHour || product.price;
      else if (rentOption === "day") price = product.rentalPricePerDay || product.price;
      else price = product.price;
    }

    const authError = validatePurchaseActor(product, req.user);
    if (authError) return res.status(403).json({ success: false, message: authError });

    const totalPrice = price * quantity;
    const order = await Order.create({
      buyer:           req.user.id,
      farmer:          product.farmer,
      product:         productId,
      productModel:    isEquipment ? "Equipment" : "Product",
      quantity,
      totalPrice,
      status:          "confirmed",
      deliveryAddress: deliveryAddress || "",
      note:            note || (rentOption ? `Rental: ${rentOption}` : ""),
      razorpayOrderId:   razorpay_order_id || "",
      razorpayPaymentId: razorpay_payment_id || "",
      paymentStatus:     "paid",
      statusHistory:   [
        { status: "pending",   note: "Order placed" },
        { status: "confirmed", note: "Payment verified" },
      ],
    });

    if (!isEquipment) {
      product.quantity = Math.max(0, product.quantity - quantity);
      if (product.quantity <= 0) {
        product.status = "sold";
      }
    } else {
      product.status = rentOption ? "rented" : "sold";
    }
    await product.save();

    res.json({ success: true, message: "Payment verified successfully", order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /:id/status — farmer updates delivery status ───────────
router.put("/:id/status", protect, async (req, res) => {
  try {
    const { status, note = "" } = req.body;

    const VALID_FARMER_STATUSES = ["confirmed", "packed", "shipped", "out_for_delivery", "cancelled"];
    if (!VALID_FARMER_STATUSES.includes(status))
      return res.status(400).json({ success: false, message: "Invalid status for farmer update" });

    const order = await Order.findOne({ _id: req.params.id, farmer: req.user.id })
      .populate("buyer", "name email phone");
    if (!order)
      return res.status(404).json({ success: false, message: "Order not found" });

    // Prevent going backwards
    const STATUS_RANK = { pending:0, confirmed:1, packed:2, shipped:3, out_for_delivery:4, otp_pending:5, delivered:6, completed:7, cancelled:-1 };
    if (STATUS_RANK[status] <= STATUS_RANK[order.status] && status !== "cancelled")
      return res.status(400).json({ success: false, message: `Cannot move from "${order.status}" to "${status}"` });

    const io = req.app.get("io");

    // Auto-generate OTP when out for delivery
    if (status === "out_for_delivery") {
      order.status = "out_for_delivery";
      order.statusHistory.push({ status: "out_for_delivery", note: note || "Order out for delivery" });
      await createAndSendOtp(order, io);  // also saves order with otp_pending status

      // Notify buyer via SSE of status change
      sse.broadcast(`user:${order.buyer._id || order.buyer}`, "order_status", {
        orderId: order._id,
        status:  "out_for_delivery",
      });
    } else {
      order.status = status;
      order.statusHistory.push({ status, note: note || `Status updated to ${status}` });
      await order.save();

      // Notify buyer
      const buyerId = order.buyer._id || order.buyer;
      const statusLabels = {
        confirmed: "✅ Order Confirmed",
        packed:    "📦 Order Packed",
        shipped:   "🚚 Order Shipped",
        cancelled: "❌ Order Cancelled",
      };
      await Notification.create({
        user:    buyerId,
        type:    "order_status_update",
        title:   statusLabels[status] || "Order Update",
        message: `Your order status has been updated to: ${status.replace(/_/g, " ")}.`,
        orderId: order._id,
      });
      sse.broadcast(`user:${buyerId}`, "order_status", { orderId: order._id, status });
      if (io) {
        io.to(`user:${buyerId}`).emit("order_status_update", { orderId: order._id, status });
      }
    }

    const updated = await Order.findById(order._id)
      .populate("buyer",   "name email phone")
      .populate("product", "title unit price");
    res.json({ success: true, order: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /:id/resend-otp — buyer requests new OTP ──────────────
router.post("/:id/resend-otp", protect, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, buyer: req.user.id })
      .populate("buyer", "name email phone");
    if (!order)
      return res.status(404).json({ success: false, message: "Order not found" });

    if (!["otp_pending", "out_for_delivery"].includes(order.status))
      return res.status(400).json({ success: false, message: "OTP resend not applicable for this order status" });

    // Cooldown: 60 seconds between resends
    if (order.otpSentAt && (Date.now() - order.otpSentAt.getTime()) < 60_000)
      return res.status(429).json({
        success: false,
        message: "Please wait 60 seconds before requesting another OTP",
        retryAfter: Math.ceil((60_000 - (Date.now() - order.otpSentAt.getTime())) / 1000),
      });

    const io = req.app.get("io");
    await createAndSendOtp(order, io);

    res.json({ success: true, message: "OTP resent successfully. Check your notifications." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /:id/verify-otp — delivery person submits OTP ─────────
router.post("/:id/verify-otp", protect, async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp?.trim())
      return res.status(400).json({ success: false, message: "OTP is required" });

    // Allow both farmer (delivery person) and buyer themselves to verify
    const order = await Order.findOne({
      _id: req.params.id,
      $or: [{ farmer: req.user.id }, { buyer: req.user.id }],
    }).populate("buyer",   "name email phone")
      .populate("farmer",  "name email phone")
      .populate("product", "title name unit price");

    if (!order)
      return res.status(404).json({ success: false, message: "Order not found" });

    if (order.status !== "otp_pending")
      return res.status(400).json({ success: false, message: `Cannot verify OTP for order in status: ${order.status}` });

    if (order.otpVerified)
      return res.status(400).json({ success: false, message: "OTP already verified — order is complete" });

    // Check locked (too many failed attempts)
    if (order.otpLockedUntil && order.otpLockedUntil > new Date())
      return res.status(423).json({
        success: false,
        message: "Too many failed attempts. OTP locked temporarily.",
        lockedUntil: order.otpLockedUntil,
      });

    // Check expiry
    if (!order.otpExpiry || order.otpExpiry < new Date()) {
      return res.status(400).json({ success: false, message: "OTP has expired. Please request a new one." });
    }

    // Verify hash
    const isMatch = await verifyOtpHash(otp.trim(), order.deliveryOtp);
    if (!isMatch) {
      order.otpAttempts += 1;
      // Lock after 5 failed attempts for 10 minutes
      if (order.otpAttempts >= 5) {
        order.otpLockedUntil = new Date(Date.now() + 10 * 60 * 1000);
        await order.save();
        return res.status(423).json({
          success: false,
          message: "Too many failed attempts. OTP locked for 10 minutes.",
          lockedUntil: order.otpLockedUntil,
        });
      }
      await order.save();
      return res.status(400).json({
        success: false,
        message: `Incorrect OTP. ${5 - order.otpAttempts} attempt(s) remaining.`,
        attemptsLeft: 5 - order.otpAttempts,
      });
    }

    // ✅ OTP correct — mark as delivered + completed
    const now = new Date();
    order.otpVerified    = true;
    order.otpAttempts    = order.otpAttempts + 1;
    order.deliveryOtp    = "";   // invalidate
    order.otpPlain       = "";   // clear plain text
    order.deliveredAt    = now;
    order.completedAt    = now;
    order.status         = "delivered";
    order.statusHistory.push({ status: "delivered",  note: "OTP verified — delivery confirmed" });
    order.statusHistory.push({ status: "completed",  note: "Payment released to farmer" });
    await order.save();

    // Immediately mark completed
    order.status = "completed";
    await order.save();

    const io = req.app.get("io");
    const buyer   = order.buyer;
    const farmer  = order.farmer;
    const buyerId  = buyer._id  || buyer;
    const farmerId = farmer._id || farmer;
    const productTitle = order.product?.title || order.product?.name || "";

    // ── Notify buyer (in-app + SSE + Socket + email) ───────────
    await Notification.create({
      user:    buyerId,
      type:    "delivery_confirmed",
      title:   "✅ Delivery Confirmed!",
      message: "Your order has been delivered and payment released to the farmer. Thank you!",
      orderId: order._id,
    });
    sse.broadcast(`user:${buyerId}`, "delivery_confirmed", { orderId: order._id });
    if (io) io.to(`user:${buyerId}`).emit("delivery_confirmed", { orderId: order._id });

    // Email to buyer (fire-and-forget)
    if (buyer.email) {
      mailer.sendDeliveryConfirmedEmail({
        to:           buyer.email,
        buyerName:    buyer.name,
        orderId:      order._id,
        productTitle,
        totalPrice:   order.totalPrice,
      });
    }

    // ── Notify farmer (in-app + SSE + Socket + email) ──────────
    await Notification.create({
      user:    farmerId,
      type:    "payment_released",
      title:   "💰 Payment Released!",
      message: `Delivery for order #${String(order._id).slice(-8).toUpperCase()} confirmed. ₹${order.totalPrice} released.`,
      orderId: order._id,
      amount:  order.totalPrice,
    });
    sse.broadcast(`user:${farmerId}`, "payment_released", { orderId: order._id, amount: order.totalPrice });
    if (io) io.to(`user:${farmerId}`).emit("payment_released", { orderId: order._id, amount: order.totalPrice });

    // Email to farmer (fire-and-forget)
    if (farmer.email) {
      mailer.sendPaymentReleasedEmail({
        to:           farmer.email,
        farmerName:   farmer.name,
        orderId:      order._id,
        productTitle,
        amount:       order.totalPrice,
      });
    }

    const updated = await Order.findById(order._id)
      .populate("buyer farmer", "name email phone")
      .populate("product", "title unit price");

    res.json({
      success: true,
      message: "🎉 Delivery verified! Order completed and payment released.",
      order:   updated,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /:id/cancel ────────────────────────────────────────────
router.put("/:id/cancel", protect, async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, buyer: req.user.id, status: { $in: ["pending"] } },
      {
        status: "cancelled",
        $push:  { statusHistory: { status: "cancelled", note: "Cancelled by buyer" } },
      },
      { new: true }
    );
    if (!order)
      return res.status(404).json({ success: false, message: "Cannot cancel this order" });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
