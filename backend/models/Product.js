const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
    },
    unit: {
      type: String,
      enum: ["kg", "quintal", "ton", "litre", "dozen", "piece", "bag"],
      default: "kg",
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
    },
    location: {
      type: String,
      default: "",
    },
    images: {
      type: [String],
      default: [],
    },
    isAuction: {
      type: Boolean,
      default: false,
    },
    auctionEndTime: {
      type: Date,
    },
    bids: [
      {
        buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        amount: { type: Number },
        time: { type: Date, default: Date.now },
      }
    ],
    aiSuggestedPrice: {
      type: Number,
    },
    status: {
      type: String,
      enum: ["available", "sold", "reserved", "active", "pending", "expired"],
      default: "available",
    },
    contactPhone: {
      type: String,
      default: "",
    },
    listingType: {
      type: String,
      enum: ["crop"],
      default: "crop",
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
