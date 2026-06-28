const express  = require("express");
const router   = express.Router();
const Expense  = require("../models/Expense");
const protect  = require("../middleware/auth");

// GET /api/expenses — get all expenses for this farmer
router.get("/", protect, async (req, res) => {
  try {
    const { month, year } = req.query;
    const query = { farmer: req.user.id };

    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end   = new Date(year, month, 0, 23, 59, 59);
      query.date  = { $gte: start, $lte: end };
    }

    const expenses = await Expense.find(query).sort({ date: -1 });
    res.json({ success: true, expenses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/expenses — add new expense/income
router.post("/", protect, async (req, res) => {
  try {
    const expense = await Expense.create({
      ...req.body,
      farmer: req.user.id,
    });
    res.status(201).json({ success: true, expense });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/expenses/:id — delete expense
router.delete("/:id", protect, async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({
      _id: req.params.id,
      farmer: req.user.id,
    });
    if (!expense)
      return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/expenses/:id — edit expense
router.put("/:id", protect, async (req, res) => {
  try {
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, farmer: req.user.id },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!expense)
      return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, expense });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/expenses/summary — monthly summary
router.get("/summary", protect, async (req, res) => {
  try {
    const expenses = await Expense.find({ farmer: req.user.id });

    const totalIncome  = expenses.filter((e) => e.type === "income").reduce((s, e) => s + e.amount, 0);
    const totalExpense = expenses.filter((e) => e.type === "expense").reduce((s, e) => s + e.amount, 0);
    const balance      = totalIncome - totalExpense;

    // Category breakdown
    const byCategory = {};
    expenses.forEach((e) => {
      if (!byCategory[e.category]) byCategory[e.category] = { income: 0, expense: 0 };
      byCategory[e.category][e.type] += e.amount;
    });

    res.json({ success: true, totalIncome, totalExpense, balance, byCategory });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;