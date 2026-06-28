const MandiPrice = require("../models/MandiPrice");
const { scrapeAndCacheMandiPrices } = require("../services/mandiScraper");

// ── GET /api/mandi — Paginated & Filterable Mandi Prices ──────────────────────
exports.getMandiPrices = async (req, res) => {
  try {
    const { state, commodity, district, search, page = 1, limit = 20 } = req.query;

    const query = {};

    if (state) {
      query.state = { $regex: new RegExp(`^${state.trim()}$`, "i") };
    }
    if (district) {
      query.district = { $regex: new RegExp(`^${district.trim()}$`, "i") };
    }
    if (commodity) {
      query.commodity = { $regex: new RegExp(`^${commodity.trim()}$`, "i") };
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { commodity: searchRegex },
        { state: searchRegex },
        { district: searchRegex },
        { market: searchRegex },
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skipNum = (pageNum - 1) * limitNum;

    // Fetch matching prices
    const prices = await MandiPrice.find(query)
      .sort({ commodity: 1, state: 1, market: 1 })
      .skip(skipNum)
      .limit(limitNum);

    const total = await MandiPrice.countDocuments(query);

    // Get the latest lastSyncedTime across all records to show in the UI
    const latestRecord = await MandiPrice.findOne({}).sort({ lastSyncedTime: -1 });
    const lastUpdated = latestRecord ? latestRecord.lastSyncedTime : new Date();

    res.json({
      success: true,
      data: prices.map(p => ({
        commodity: p.commodity,
        market: p.market,
        district: p.district,
        state: p.state,
        variety: p.variety,
        minPrice: p.minPrice,
        maxPrice: p.maxPrice,
        modalPrice: p.modalPrice,
        date: p.date,
        lastSyncedTime: p.lastSyncedTime
      })),
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      lastUpdated
    });
  } catch (err) {
    console.error("❌ getMandiPrices error:", err.message);
    res.status(500).json({ success: false, message: "Server error fetching mandi prices" });
  }
};

// ── POST /api/mandi/refresh — Force Sync Scraper ─────────────────────────────
exports.refreshMandiPrices = async (req, res) => {
  try {
    const result = await scrapeAndCacheMandiPrices();
    res.json({
      success: true,
      message: `Prices refreshed successfully from ${result.source}!`,
      count: result.count,
      source: result.source,
      lastUpdated: result.timestamp
    });
  } catch (err) {
    console.error("❌ refreshMandiPrices error:", err.message);
    res.status(500).json({ success: false, message: "Error triggering mandi price sync" });
  }
};

// ── GET /api/mandi/prices — Legacy grouped endpoint for backward compatibility ──
// Group by commodity so Buyer Dashboard / BuyerMarketPrices doesn't break
exports.getMandiPricesLegacy = async (req, res) => {
  try {
    const { category, search } = req.query;

    const query = {};
    if (search) {
      query.commodity = { $regex: new RegExp(search.trim(), "i") };
    }

    const allPrices = await MandiPrice.find(query);

    // Group items by commodity
    const grouped = {};
    allPrices.forEach(p => {
      // Emojis for backward compatibility UI matching
      const emojiMap = {
        Tomato: "🍅", Onion: "🧅", Potato: "🥔", Wheat: "🌾", Rice: "🍚",
        Soybean: "🫘", Groundnut: "🥜", Cotton: "🌿", Sugarcane: "🎋", Maize: "🌽",
        Chilli: "🌶️", Turmeric: "🟡", Garlic: "🧄", Banana: "🍌", Mango: "🥭",
        "Urad Dal": "🫘", "Chana Dal": "🟡", Ginger: "🫚", Mustard: "🌻", Cauliflower: "🥦"
      };

      if (!grouped[p.commodity]) {
        grouped[p.commodity] = {
          commodity: p.commodity,
          emoji: emojiMap[p.commodity] || "🌱",
          category: p.commodity === "Mango" || p.commodity === "Banana" ? "fruits" : "vegetables", // default grouping
          unit: "Quintal",
          markets: []
        };
      }

      grouped[p.commodity].markets.push({
        name: p.market,
        state: p.state,
        modal: p.modalPrice,
        min: p.minPrice,
        max: p.maxPrice
      });
    });

    const data = Object.values(grouped);

    // Filter by category if requested
    let filteredData = data;
    if (category && category !== "all") {
      // simple logic: check if items match legacy categories
      filteredData = data.filter(d => d.category === category);
    }

    const result = filteredData.map(item => {
      const modals = item.markets.map(m => m.modal);
      const bestMarket = item.markets.reduce((a, b) => b.modal > a.modal ? b : a, item.markets[0]);
      const avgModal = Math.round(modals.reduce((s, v) => s + v, 0) / modals.length) || 0;

      return {
        commodity: item.commodity,
        emoji: item.emoji,
        category: item.category,
        unit: item.unit,
        markets: item.markets,
        bestMarket: bestMarket ? bestMarket.name : "N/A",
        bestPrice: bestMarket ? bestMarket.modal : 0,
        avgPrice: avgModal,
        trend: "stable",
        suggestedSellPrice: Math.round(avgModal * 1.05),
        fetchedAt: new Date().toISOString()
      };
    });

    res.json({ success: true, data: result, total: result.length, fetchedAt: new Date().toISOString() });
  } catch (err) {
    console.error("❌ getMandiPricesLegacy error:", err.message);
    res.status(500).json({ success: false, message: "Error fetching legacy grouped prices" });
  }
};

// ── GET /api/mandi/suggest/:crop — Legacy suggestion lookup ──────────────────
exports.getMandiPriceSuggestion = async (req, res) => {
  try {
    const cropName = req.params.crop.trim().toLowerCase();
    
    // Find all markets tracking this crop
    const markets = await MandiPrice.find({
      commodity: { $regex: new RegExp(`^${cropName}$`, "i") }
    });

    if (markets.length === 0) {
      return res.json({ success: false, message: "Crop not found in mandi database", fallback: true });
    }

    const emojiMap = {
      tomato: "🍅", onion: "🧅", potato: "🥔", wheat: "🌾", rice: "🍚",
      soybean: "🫘", groundnut: "🥜", cotton: "🌿", sugarcane: "🎋", maize: "🌽",
      chilli: "🌶️", turmeric: "🟡", garlic: "🧄", banana: "🍌", mango: "🥭",
      "urad dal": "🫘", "chana dal": "🟡", ginger: "🫚", mustard: "🌻", cauliflower: "🥦"
    };

    const formattedMarkets = markets.map(m => ({
      name: m.market,
      state: m.state,
      price: m.modalPrice,
      min: m.minPrice,
      max: m.maxPrice,
      unit: "Quintal"
    }));

    const best = formattedMarkets.reduce((a, b) => b.price > a.price ? b : a, formattedMarkets[0]);
    const avg = Math.round(formattedMarkets.reduce((s, m) => s + m.price, 0) / formattedMarkets.length);
    const suggest = Math.round(avg * 1.05);

    res.json({
      success: true,
      commodity: markets[0].commodity,
      emoji: emojiMap[cropName] || "🌱",
      unit: "Quintal",
      markets: formattedMarkets,
      bestMarket: best.name,
      bestPrice: best.price,
      avgMarketPrice: avg,
      suggestedSellPrice: suggest,
      trend: "stable",
      fetchedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error("❌ getMandiPriceSuggestion error:", err.message);
    res.status(500).json({ success: false, message: "Error fetching price suggestions" });
  }
};
