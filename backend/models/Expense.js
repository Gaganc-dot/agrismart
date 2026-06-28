const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
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
    amount: {
      type: Number,
      required: [true, "Amount is required"],
    },
    type: {
      type: String,
      enum: ["expense", "income"],
      default: "expense",
    },
    category: {
      type: String,
      enum: [
        // Income categories
        "crop_sale", "livestock", "government_subsidy", "rental", "other_income",
        // Expense categories
        "seeds", "fertilizer", "pesticide", "labour", "irrigation",
        "machinery", "fuel", "transport", "storage", "loan_repayment", "other_expense",
        // Legacy values (kept for backward-compat with existing DB records)
        "equipment", "harvest", "sale", "subsidy", "loan", "other",
      ],
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Expense", expenseSchema);