const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth");

const fs = require("fs");
const path = require("path");
const { calculateTelemetry } = require("../scripts/telemetry_sim");

// ─────────────────────────────────────────────
// @route   GET /api/iot/sensors
// @desc    Get mock real-time sensor data
// @access  Private
// ─────────────────────────────────────────────
router.get("/sensors", protect, (req, res) => {
  try {
    const dataPath = path.join(__dirname, "../data/telemetry.json");
    if (fs.existsSync(dataPath)) {
      const raw = fs.readFileSync(dataPath, "utf-8");
      return res.json(JSON.parse(raw));
    }
  } catch (err) {
    console.error("Failed to read telemetry file, falling back to calculation:", err.message);
  }

  res.json({
    success: true,
    data: calculateTelemetry()
  });
});

// ─────────────────────────────────────────────
// @route   GET /api/iot/weather
// @desc    Get mock localized weather data
// @access  Private
// ─────────────────────────────────────────────
router.get("/weather", protect, (req, res) => {
  // In a real app, this would call OpenWeatherAPI or similar based on user location
  res.json({
    success: true,
    data: {
      condition: ["Sunny", "Partly Cloudy", "Rainy", "Clear"][Math.floor(Math.random() * 4)],
      temperature: Math.floor(Math.random() * 15 + 20), // 20 - 35 C
      windSpeed: Math.floor(Math.random() * 10 + 5), // 5 - 15 km/h
      forecast: "Expect light showers over the next 48 hours."
    }
  });
});

module.exports = router;
