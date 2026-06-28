const express   = require("express");
const router    = express.Router();
const Equipment = require("../models/Equipment");
const protect   = require("../middleware/auth");

const farmerOnly = (req, res, next) => {
  if (req.user.role !== "farmer")
    return res.status(403).json({ success: false, message: "Farmers only" });
  next();
};

// ──────────────────────────────────────────────────────────────
// GET /api/equipment — browse all available listings
// ──────────────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const { category, search, isRental, minPrice, maxPrice } = req.query;
    const query = { status: "available" };

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      try {
        const token = req.headers.authorization.split(" ")[1];
        const decoded = require("jsonwebtoken").verify(token, process.env.JWT_SECRET);
        if (decoded && decoded.id) {
          query.farmer = { $ne: decoded.id };
        }
      } catch (e) {
        // Ignore invalid token
      }
    }

    if (category && category !== "all") query.category = category;
    if (search) {
      query.$or = [
        { name:        { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { location:    { $regex: search, $options: "i" } },
      ];
    }
    if (isRental === "true")  query.isRental = true;
    if (isRental === "false") query.isRental = false;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    const equipment = await Equipment.find(query)
      .populate("farmer", "name farmName location phone")
      .sort({ createdAt: -1 });

    res.json({ success: true, equipment, total: equipment.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// ──────────────────────────────────────────────────────────────
// GET /api/equipment/my — farmer's own listings
// ──────────────────────────────────────────────────────────────
router.get("/my", protect, farmerOnly, async (req, res) => {
  try {
    const equipment = await Equipment.find({ farmer: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, equipment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ──────────────────────────────────────────────────────────────
// GET /api/equipment/:id — single listing (increments views)
// ──────────────────────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const item = await Equipment.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    ).populate("farmer", "name farmName location phone");

    if (!item) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, equipment: item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ──────────────────────────────────────────────────────────────
// POST /api/equipment — create listing
// ──────────────────────────────────────────────────────────────
router.post("/", protect, farmerOnly, async (req, res) => {
  try {
    const item = await Equipment.create({ ...req.body, farmer: req.user.id });
    res.status(201).json({ success: true, equipment: item });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ──────────────────────────────────────────────────────────────
// PUT /api/equipment/:id — update listing
// ──────────────────────────────────────────────────────────────
router.put("/:id", protect, farmerOnly, async (req, res) => {
  try {
    const item = await Equipment.findOneAndUpdate(
      { _id: req.params.id, farmer: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ success: false, message: "Not found or not authorized" });
    res.json({ success: true, equipment: item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ──────────────────────────────────────────────────────────────
// DELETE /api/equipment/:id — delete listing
// ──────────────────────────────────────────────────────────────
router.delete("/:id", protect, farmerOnly, async (req, res) => {
  try {
    const item = await Equipment.findOneAndDelete({ _id: req.params.id, farmer: req.user.id });
    if (!item) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, message: "Equipment listing deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
