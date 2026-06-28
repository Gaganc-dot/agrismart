const express        = require("express");
const router         = express.Router();
const protect        = require("../middleware/auth");
const Recommendation = require("../models/Recommendation");
const { callGroq, callGroqVision, getLanguageName } = require("./ai-helpers");



// ─────────────────────────────────────────────────────────────
// POST /api/ai/crop-recommendation
// ─────────────────────────────────────────────────────────────
router.post("/crop-recommendation", protect, async (req, res) => {
  try {
    const { prompt, inputs } = req.body;
    if (!prompt) return res.status(400).json({ success: false, message: "Prompt is required" });

    const langCode = (req.headers["x-user-language"] || req.user?.preferredLanguage || "en").split("-")[0].trim().toLowerCase();
    const text = await callGroq(prompt, true, langCode);

    if (text) {
      // Persist result to MongoDB (best-effort — never block the response)
      try {
        const clean  = text.replace(/^```json/m, "").replace(/^```/m, "").trim();
        const parsed = JSON.parse(clean);
        await Recommendation.findOneAndUpdate(
          { farmer: req.user.id, type: "crop" },
          { farmer: req.user.id, type: "crop", inputs: inputs || {}, result: parsed },
          { upsert: true, new: true }
        );
      } catch (_) { /* non-fatal */ }
      res.json({ success: true, text });
    } else {
      res.status(500).json({ success: false, message: "No response from AI" });
    }
  } catch (err) {
    console.error("Crop recommendation error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/ai/fertilizer-advice
// ─────────────────────────────────────────────────────────────
router.post("/fertilizer-advice", protect, async (req, res) => {
  try {
    const { prompt, inputs } = req.body;
    if (!prompt) return res.status(400).json({ success: false, message: "Prompt is required" });

    const langCode = (req.headers["x-user-language"] || req.user?.preferredLanguage || "en").split("-")[0].trim().toLowerCase();
    const text = await callGroq(prompt, true, langCode);

    if (text) {
      try {
        const clean  = text.replace(/^```json/m, "").replace(/^```/m, "").trim();
        const parsed = JSON.parse(clean);
        await Recommendation.findOneAndUpdate(
          { farmer: req.user.id, type: "fertilizer" },
          { farmer: req.user.id, type: "fertilizer", inputs: inputs || {}, result: parsed },
          { upsert: true, new: true }
        );
      } catch (_) { /* non-fatal */ }
      res.json({ success: true, text });
    } else {
      res.status(500).json({ success: false, message: "No response from AI" });
    }
  } catch (err) {
    console.error("Fertilizer advice error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/ai/disease-detection
// ─────────────────────────────────────────────────────────────
router.post("/disease-detection", protect, async (req, res) => {
  try {
    const { prompt, imageBase64, mimeType } = req.body;
    if (!prompt) return res.status(400).json({ success: false, message: "Prompt is required" });

    const langCode = (req.headers["x-user-language"] || req.user?.preferredLanguage || "en").split("-")[0].trim().toLowerCase();

    let text = "";

    if (imageBase64) {
      // Image provided — use Gemini multimodal (vision) path
      text = await callGroqVision(prompt, imageBase64, mimeType, langCode);
    } else {
      // No image — text-only path
      text = await callGroq(prompt, true, langCode);
    }

    if (text) res.json({ success: true, text });
    else res.status(500).json({ success: false, message: "No response from AI" });

  } catch (err) {
    console.error("Disease detection error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/ai/government-schemes
// ─────────────────────────────────────────────────────────────
router.post("/government-schemes", protect, async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ success: false, message: "Prompt is required" });

    const langCode = (req.headers["x-user-language"] || req.user?.preferredLanguage || "en").split("-")[0].trim().toLowerCase();
    const text = await callGroq(prompt, true, langCode);

    if (text) res.json({ success: true, text });
    else res.status(500).json({ success: false, message: "No response from AI" });
  } catch (err) {
    console.error("Government schemes error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/ai/community-reply
// ─────────────────────────────────────────────────────────────
router.post("/community-reply", protect, async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ success: false, message: "Prompt is required" });

    const langCode = (req.headers["x-user-language"] || req.user?.preferredLanguage || "en").split("-")[0].trim().toLowerCase();
    const text = await callGroq(prompt, false, langCode);

    if (text) res.json({ success: true, text });
    else res.status(500).json({ success: false, message: "No response from AI" });
  } catch (err) {
    console.error("Community reply error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/ai/suggest-price
// ─────────────────────────────────────────────────────────────
router.post("/suggest-price", protect, async (req, res) => {
  try {
    const { cropName, category, quantity, unit, location } = req.body;
    if (!cropName) return res.status(400).json({ success: false, message: "Crop name is required" });

    const prompt = `You are an expert AI market analyst for Indian agriculture.
    A farmer wants to sell:
    - Product: ${cropName}
    - Category: ${category}
    - Quantity: ${quantity} ${unit}
    - Location: ${location}

    Suggest an optimal selling price in INR (₹) per ${unit}. 
    Respond ONLY with a valid JSON object:
    {
      "suggestedPrice": 500,
      "demandLevel": "High", // High, Medium, or Low
      "reasoning": "Short explanation of why this price makes sense based on current market trends."
    }`;

    const langCode = (req.headers["x-user-language"] || req.user?.preferredLanguage || "en").split("-")[0].trim().toLowerCase();
    const text = await callGroq(prompt, true, langCode);
    if (text) res.json({ success: true, text });
    else res.status(500).json({ success: false, message: "No response from AI" });
  } catch (err) {
    console.error("Price suggestion error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/ai/profit-prediction
// ─────────────────────────────────────────────────────────────
router.post("/profit-prediction", protect, async (req, res) => {
  try {
    const { cropType, area, costPricePerUnit, sellingPricePerUnit, quantitySold, unit, expenses, marketPrice, langName } = req.body;

    // Support both legacy (area+marketPrice) and new (quantity-based) modes
    const hasQuantityData = quantitySold && sellingPricePerUnit;
    const totalRevenue    = hasQuantityData ? sellingPricePerUnit * quantitySold : null;
    const totalExpenses   = hasQuantityData && costPricePerUnit ? costPricePerUnit * quantitySold : (expenses || 0);
    const unitLabel       = unit || "kg";

    const prompt = hasQuantityData
      ? `You are an expert agricultural financial analyst.
    The farmer has provided EXACT sales data. Use these numbers PRECISELY — do NOT estimate yield.

    EXACT DATA:
    - Crop: ${cropType}
    - Quantity Sold: ${quantitySold} ${unitLabel}
    - Selling Price: ₹${sellingPricePerUnit} per ${unitLabel}
    - Cost Price: ₹${costPricePerUnit || "not provided"} per ${unitLabel}
    - Farm Area: ${area || "not specified"} acres

    REQUIRED CALCULATIONS (use EXACT formula):
    - Total Revenue = ₹${sellingPricePerUnit} × ${quantitySold} = ₹${totalRevenue}
    - Total Expenses = ₹${costPricePerUnit || 0} × ${quantitySold} = ₹${totalExpenses}
    - Net Profit = ₹${totalRevenue} - ₹${totalExpenses} = ₹${totalRevenue - totalExpenses}
    - ROI % = (Net Profit / Total Expenses) × 100

    Respond ONLY with this JSON (use the exact calculated numbers above):
    {
      "estimatedYield": "${quantitySold} ${unitLabel} (actual sold quantity)",
      "pricePerUnit": ${sellingPricePerUnit},
      "costPerUnit": ${costPricePerUnit || 0},
      "quantitySold": ${quantitySold},
      "unit": "${unitLabel}",
      "totalRevenue": ${totalRevenue},
      "totalExpenses": ${totalExpenses},
      "netProfit": ${totalRevenue - totalExpenses},
      "roiPercentage": 0,
      "breakEvenPoint": "Quantity or price needed to cover costs",
      "riskLevel": "Low/Medium/High",
      "advice": "2-3 sentences of actionable financial advice in ${langName || "English"}",
      "chartData": [
        {"name": "Revenue", "value": ${totalRevenue}},
        {"name": "Expenses", "value": ${totalExpenses}},
        {"name": "Profit", "value": ${totalRevenue - totalExpenses > 0 ? totalRevenue - totalExpenses : 0}}
      ]
    }`
      : `You are an expert agricultural financial analyst.
    Calculate estimated profit and ROI based on farm area and market price.
    - Crop: ${cropType}
    - Farm Area: ${area} acres
    - Total Estimated Expenses: ₹${expenses}
    - Expected Market Price per Quintal: ₹${marketPrice}

    IMPORTANT: totalRevenue = estimatedYieldInQuintals × marketPrice. Calculate net profit correctly.

    Respond ONLY with this JSON:
    {
      "estimatedYield": "Estimated yield in quintals with explanation",
      "totalRevenue": 0,
      "totalExpenses": ${expenses},
      "netProfit": 0,
      "roiPercentage": 0,
      "breakEvenPoint": "What yield or price is needed to cover costs",
      "riskLevel": "Low/Medium/High",
      "advice": "2-3 sentences of actionable financial advice in ${langName || "English"}",
      "chartData": [
        {"name": "Revenue", "value": 0},
        {"name": "Expenses", "value": ${expenses}},
        {"name": "Profit",  "value": 0}
      ]
    }`;

    const langCode = (req.headers["x-user-language"] || req.user?.preferredLanguage || "en").split("-")[0].trim().toLowerCase();
    const text = await callGroq(prompt, true, langCode);
    if (text) {
      try {
        const clean  = typeof text === "string"
          ? text.replace(/^```json\s*/m, "").replace(/```\s*$/m, "").trim()
          : JSON.stringify(text);
        const parsed = JSON.parse(clean);
        await Recommendation.findOneAndUpdate(
          { farmer: req.user.id, type: "profit" },
          { farmer: req.user.id, type: "profit", inputs: req.body, result: parsed },
          { upsert: true, new: true }
        );
      } catch (_) { /* non-fatal */ }
      res.json({ success: true, text });
    } else {
      res.status(500).json({ success: false, message: "No response from AI" });
    }
  } catch (err) {
    console.error("Profit prediction error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/ai/latest-recommendation?type=crop|fertilizer|profit
// ─────────────────────────────────────────────────────────────
router.get("/latest-recommendation", protect, async (req, res) => {
  try {
    const { type } = req.query;
    if (!type) return res.status(400).json({ success: false, message: "type query param required" });
    const rec = await Recommendation.findOne({ farmer: req.user.id, type }).sort({ updatedAt: -1 });
    res.json({ success: true, recommendation: rec || null });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/ai/smart-insights
// ─────────────────────────────────────────────────────────────
router.post("/smart-insights", protect, async (req, res) => {
  try {
    const { expenses, products, langName } = req.body;

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const topCategories = {};
    expenses.forEach(e => topCategories[e.category] = (topCategories[e.category] || 0) + e.amount);

    const prompt = `You are a Smart Farm Assistant AI. 
    Analyze the farmer's recent data:
    - Total Expenses: ₹${totalExpenses}
    - Expense Breakdown: ${JSON.stringify(topCategories)}
    - Active Listings: ${products.map(p => p.title).join(", ")}

    Provide 3 intelligent, actionable insights or alerts based on this data in ${langName || "English"}.
    If they are spending too much on fertilizer, warn them. If they have a lot of products listed, encourage them.
    
    Respond ONLY with a valid JSON object:
    {
      "insights": [
        {
          "type": "warning", // "warning", "success", or "info"
          "title": "Short Title",
          "message": "Detailed message",
          "action": "Suggested action (e.g., Check organic alternatives)"
        }
      ]
    }`;

    const langCode = (req.headers["x-user-language"] || req.user?.preferredLanguage || "en").split("-")[0].trim().toLowerCase();
    const text = await callGroq(prompt, true, langCode);
    if (text) res.json({ success: true, text });
    else res.status(500).json({ success: false, message: "No response from AI" });
  } catch (err) {
    console.error("Smart insights error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/ai/generate-description — AI product description for marketplace
// ─────────────────────────────────────────────────────────────
router.post("/generate-description", protect, async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ success: false, message: "Prompt is required" });
    const langCode = (req.headers["x-user-language"] || req.user?.preferredLanguage || "en").split("-")[0].trim().toLowerCase();
    const text = await callGroq(prompt, false, langCode);
    if (text) res.json({ success: true, text });
    else res.status(500).json({ success: false, message: "No response from AI" });
  } catch (err) {
    console.error("generate-description error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;