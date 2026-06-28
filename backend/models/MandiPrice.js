const mongoose = require("mongoose");

const MandiPriceSchema = new mongoose.Schema(
  {
    commodity: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    district: {
      type: String,
      required: true,
      trim: true,
    },
    market: {
      type: String,
      required: true,
      trim: true,
    },
    variety: {
      type: String,
      default: "FAQ",
      trim: true,
    },
    minPrice: {
      type: Number,
      required: true,
    },
    maxPrice: {
      type: Number,
      required: true,
    },
    modalPrice: {
      type: Number,
      required: true,
    },
    date: {
      type: String, // YYYY-MM-DD format for consistency
      required: true,
    },
    lastSyncedTime: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: "mandi_prices",
  }
);

// Compound index to prevent duplicate entries for the same crop, region, market, and variety
MandiPriceSchema.index(
  { commodity: 1, state: 1, district: 1, market: 1, variety: 1 },
  { unique: true }
);

module.exports = mongoose.model("MandiPrice", MandiPriceSchema);
