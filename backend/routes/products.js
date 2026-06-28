const express  = require("express");
const router   = express.Router();
const Product  = require("../models/Product");
const protect  = require("../middleware/auth");
const notify   = require("../lib/notify");
const sse      = require("../lib/sse");

// ── Farmer only middleware ────────────────────────────────────
const farmerOnly = (req, res, next) => {
  if (req.user.role !== "farmer")
    return res.status(403).json({ success: false, message: "Farmers only" });
  next();
};

// ─────────────────────────────────────────────────────────────
// GET /api/products — all available products (for buyers too)
// ─────────────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const { category, search } = req.query;
    const query = { status: "available", listingType: { $ne: "equipment" } };

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

    if (category) query.category = category;
    if (search)   query.title = { $regex: search, $options: "i" };

    const products = await Product.find(query)
      .populate("farmer", "name farmName location phone")
      .populate("bids.buyer", "name")
      .sort({ createdAt: -1 });

    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/products/my — farmer's own listings
// ─────────────────────────────────────────────────────────────
router.get("/my", protect, farmerOnly, async (req, res) => {
  try {
    const products = await Product.find({ farmer: req.user.id })
      .populate("bids.buyer", "name")
      .sort({ createdAt: -1 });
    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/products — create new listing
// ─────────────────────────────────────────────────────────────
router.post("/", protect, farmerOnly, async (req, res) => {
  try {
    const listingType = req.body.listingType || "crop";
    if (listingType !== "crop") {
      return res.status(400).json({ success: false, message: "Invalid listing type" });
    }

    const product = await Product.create({
      ...req.body,
      listingType,
      farmer: req.user.id,
    });
    res.status(201).json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// PUT /api/products/:id — update listing
// ─────────────────────────────────────────────────────────────
router.put("/:id", protect, farmerOnly, async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, farmer: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!product)
      return res.status(404).json({ success: false, message: "Product not found" });
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// DELETE /api/products/:id — delete listing
// ─────────────────────────────────────────────────────────────
router.delete("/:id", protect, farmerOnly, async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({
      _id: req.params.id,
      farmer: req.user.id,
    });
    if (!product)
      return res.status(404).json({ success: false, message: "Product not found" });
    res.json({ success: true, message: "Listing deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/products/:id/bid — place a bid on an auction
// ─────────────────────────────────────────────────────────────
router.post("/:id/bid", protect, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || isNaN(amount))
      return res.status(400).json({ success: false, message: "Bid amount is required" });

    const product = await Product.findById(req.params.id)
      .populate("farmer", "name")
      .populate("bids.buyer", "name");

    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    if (!product.isAuction) return res.status(400).json({ success: false, message: "This product is not up for auction." });
    if (product.status !== "available") return res.status(400).json({ success: false, message: "Auction has been closed." });

    if (product.auctionEndTime && new Date() > new Date(product.auctionEndTime)) {
      // Auto-close expired auctions
      product.status = "expired";
      await product.save();
      return res.status(400).json({ success: false, message: "Auction has ended." });
    }

    if (product.farmer._id.toString() === req.user.id)
      return res.status(400).json({ success: false, message: "You cannot bid on your own product." });

    const prevHighestBid = product.bids.length > 0 ? Math.max(...product.bids.map(b => b.amount)) : product.price;
    const prevHighestBidder = product.bids.length > 0
      ? product.bids.reduce((top, b) => b.amount > top.amount ? b : top, product.bids[0])
      : null;

    if (Number(amount) <= prevHighestBid)
      return res.status(400).json({ success: false, message: `Bid must exceed current highest: ₹${prevHighestBid.toLocaleString()}` });

    const bidderName = req.user.name || "A buyer";
    const isIncrease = product.bids.some(b => (b.buyer._id?.toString() || b.buyer.toString()) === req.user.id);

    product.bids.push({ buyer: req.user.id, amount: Number(amount) });
    await product.save();

    const bidDoc = product.bids[product.bids.length - 1];

    // ── Real-time: broadcast to auction room ──────────────────
    const auctionUpdate = {
      productId:  product._id.toString(),
      bid: {
        _id:       bidDoc._id,
        amount:    Number(amount),
        buyerName: bidderName,
        buyerId:   req.user.id,
        time:      bidDoc.time,
      },
      highestBid:   Number(amount),
      totalBids:    product.bids.length,
    };
    sse.broadcast(`auction:${product._id}`, "new_bid", auctionUpdate);

    // ── Notify seller ─────────────────────────────────────────
    await notify(product.farmer._id.toString(), {
      type:      isIncrease ? "bid_increased" : "new_bid",
      title:     isIncrease ? `📈 Bid increased to ₹${Number(amount).toLocaleString()}` : `🔔 New bid: ₹${Number(amount).toLocaleString()}`,
      message:   `${bidderName} ${isIncrease ? "raised their bid to" : "placed a bid of"} ₹${Number(amount).toLocaleString()} on "${product.title}"`,
      productId: product._id,
      amount:    Number(amount),
    });

    // ── Notify outbid buyer (if different from current bidder) ─
    if (prevHighestBidder) {
      const outbidId = prevHighestBidder.buyer._id?.toString() || prevHighestBidder.buyer.toString();
      if (outbidId !== req.user.id) {
        await notify(outbidId, {
          type:      "outbid",
          title:     "⚡ You've been outbid!",
          message:   `Someone bid ₹${Number(amount).toLocaleString()} on "${product.title}". Bid now to stay in the lead!`,
          productId: product._id,
          amount:    Number(amount),
        });
      }
    }

    res.json({ success: true, message: "Bid placed!", bid: bidDoc, highestBid: Number(amount), totalBids: product.bids.length });
  } catch (err) {
    console.error("bid error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
