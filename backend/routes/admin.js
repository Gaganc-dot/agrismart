const express = require("express");
const router  = express.Router();
const User    = require("../models/User");
const Product = require("../models/Product");
const Order   = require("../models/Order");
const Expense = require("../models/Expense");
const protect = require("../middleware/auth");

// ── Admin-only middleware ─────────────────────────────────────
const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin access required." });
  }
  next();
};

// ── GET /api/admin/stats — Platform-wide statistics ──────────
router.get("/stats", protect, adminOnly, async (req, res) => {
  try {
    const [
      totalUsers,
      totalFarmers,
      totalBuyers,
      totalProducts,
      totalOrders,
      pendingOrders,
      confirmedOrders,
      totalRevenue,
      recentUsers,
      recentOrders,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "farmer" }),
      User.countDocuments({ role: "buyer" }),
      Product.countDocuments(),
      Order.countDocuments(),
      Order.countDocuments({ status: "pending" }),
      Order.countDocuments({ status: "confirmed" }),
      Order.aggregate([
        { $match: { status: { $ne: "cancelled" } } },
        { $group: { _id: null, total: { $sum: "$totalPrice" } } },
      ]),
      User.find().sort({ createdAt: -1 }).limit(5).select("name email role createdAt isVerified"),
      Order.find()
        .sort({ createdAt: -1 })
        .limit(8)
        .populate("buyer",   "name")
        .populate("farmer",  "name farmName")
        .populate("product", "title"),
    ]);

    // Monthly signups for chart (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlySignups = await User.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year:  { $year:  "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const monthlyOrders = await Order.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year:  { $year:  "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count:   { $sum: 1 },
          revenue: { $sum: "$totalPrice" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

    const chartData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const yr = d.getFullYear();
      const mo = d.getMonth() + 1;
      const label = monthNames[d.getMonth()];

      const sigStat  = monthlySignups.find(s => s._id.year === yr && s._id.month === mo);
      const ordStat  = monthlyOrders.find(o => o._id.year  === yr && o._id.month  === mo);

      chartData.push({
        month:    label,
        users:    sigStat?.count   || 0,
        orders:   ordStat?.count   || 0,
        revenue:  ordStat?.revenue || 0,
      });
    }

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalFarmers,
        totalBuyers,
        totalProducts,
        totalOrders,
        pendingOrders,
        confirmedOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
      },
      chartData,
      recentUsers,
      recentOrders,
    });
  } catch (err) {
    console.error("Admin stats error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// ── GET /api/admin/users — All users with filters ────────────
router.get("/users", protect, adminOnly, async (req, res) => {
  try {
    const { role, search, page = 1, limit = 20, verified } = req.query;
    const query = {};

    if (role && role !== "all")  query.role = role;
    if (verified === "true")     query.isVerified = true;
    if (verified === "false")    query.isVerified = false;
    if (search) {
      query.$or = [
        { name:  { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select("-password -otp -otpExpire -resetPasswordToken -resetPasswordExpire")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      users,
      pagination: {
        total,
        page:  Number(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// ── PUT /api/admin/users/:id/verify — Verify a user manually ─
router.put("/users/:id/verify", protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isVerified: true },
      { new: true }
    ).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    res.json({ success: true, message: "User verified.", user });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// ── DELETE /api/admin/users/:id — Remove user ───────────────
router.delete("/users/:id", protect, adminOnly, async (req, res) => {
  try {
    if (req.params.id === req.user.id.toString()) {
      return res.status(400).json({ success: false, message: "Cannot delete your own account." });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    res.json({ success: true, message: "User removed." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// ── DELETE /api/admin/products/:id — Remove product ───────────
router.delete("/products/:id", protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found." });
    res.json({ success: true, message: "Product removed." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// ── GET /api/admin/orders — All orders ─────────────────────
router.get("/orders", protect, adminOnly, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status && status !== "all") query.status = status;

    const total  = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate("buyer",   "name email")
      .populate("farmer",  "name farmName")
      .populate("product", "title price unit")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      orders,
      pagination: {
        total,
        page:  Number(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// ── GET /api/admin/products — All products ──────────────────
router.get("/products", protect, adminOnly, async (req, res) => {
  try {
    const { status, category, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status   && status   !== "all") query.status   = status;
    if (category && category !== "all") query.category = category;

    const total    = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate("farmer", "name farmName location")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      products,
      pagination: {
        total,
        page:  Number(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// ── POST /api/admin/create-admin — Admin creates a new admin user ─
router.post("/create-admin", protect, adminOnly, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Please provide name, email, and password." });
    }

    let existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "A user with this email already exists." });
    }

    const newUser = await User.create({
      name,
      email,
      password,
      role: "admin",
      isVerified: true,
      phone: "9999999999", // default/mock phone for admin
    });

    res.status(201).json({
      success: true,
      message: "Admin user created successfully.",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
