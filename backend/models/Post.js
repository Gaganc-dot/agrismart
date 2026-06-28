const mongoose = require("mongoose");

const replySchema = new mongoose.Schema(
  {
    author:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content:  { type: String, required: true },
    isAI:     { type: Boolean, default: false },
  },
  { timestamps: true }
);

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    content: {
      type: String,
      required: [true, "Content is required"],
    },
    category: {
      type: String,
      enum: ["Crop Advice", "Pest & Disease", "Weather", "Market Prices", "Schemes", "Equipment", "Seeds", "General"],
      default: "General",
    },
    tags:    { type: [String], default: [] },
    likes:   { type: Number, default: 0 },
    views:   { type: Number, default: 0 },
    replies: [replySchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Post", postSchema);