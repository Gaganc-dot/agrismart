const express = require("express");
const router = express.Router();
const mandiController = require("../controllers/mandiController");

// ── GET /api/mandi — Paginated and filterable mandi prices
router.get("/", mandiController.getMandiPrices);

// ── POST /api/mandi/refresh — Sync scraper to MongoDB
router.post("/refresh", mandiController.refreshMandiPrices);

// ── GET /api/mandi/prices — Legacy grouped endpoint (backward compatibility)
router.get("/prices", mandiController.getMandiPricesLegacy);

// ── GET /api/mandi/suggest/:crop — Legacy price suggestions (backward compatibility)
router.get("/suggest/:crop", mandiController.getMandiPriceSuggestion);

module.exports = router;
