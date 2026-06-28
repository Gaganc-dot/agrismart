/**
 * AI Chat Routes — /api/ai-chat
 *
 * Why NOT SSE here:
 *   The existing SSE system (lib/sse.js + lib/notify.js) is designed for
 *   server-initiated push notifications (auction events, order alerts, crop
 *   calendar reminders). AI chat is conversational request-response — the
 *   user sends a message, we call Gemini, we return the reply. A plain
 *   authenticated POST is the correct transport; SSE would add open-connection
 *   overhead with no benefit for a synchronous back-and-forth pattern.
 *
 * Routes:
 *   POST   /           — send a message, get AI reply
 *   GET    /history    — last 50 messages, oldest first
 *   DELETE /history    — clear all history for this user
 */

const express     = require("express");
const router      = express.Router();
const protect     = require("../middleware/auth");
const ChatMessage = require("../models/ChatMessage");
const { callGeminiChat, getLanguageName } = require("./ai-helpers");

// ── System prompt factory ─────────────────────────────────────
function buildSystemPrompt(userRole, languageName) {
  const roleContext = userRole === "farmer"
    ? "You are talking to a FARMER. Tailor your advice to crop growing, soil management, pest control, weather, government subsidies, input costs, and selling produce."
    : userRole === "buyer"
    ? "You are talking to a BUYER/trader. Tailor your advice to sourcing crops, evaluating quality, negotiating prices, understanding mandi rates, and placing orders on the platform."
    : "You are talking to a platform user.";

  return (
    `You are the AI assistant for Agri Smart Connect, an Indian agricultural marketplace and smart farming platform. ` +
    `${roleContext} ` +
    `The platform features you can explain or guide users through: ` +
    `Crop Recommendation (AI, soil/weather based), ` +
    `Fertilizer Advice (AI, crop-specific), ` +
    `Disease Detection (AI vision — upload a leaf photo), ` +
    `Live Mandi Prices (real government market data), ` +
    `Crop Calendar & Reminders (stage-based farming schedule with automatic alerts), ` +
    `Expense Tracker (income/expense log with monthly summary), ` +
    `Profit Prediction (AI financial analysis), ` +
    `Government Schemes (AI-curated central and state subsidies), ` +
    `Agri Marketplace (buy/sell crops and equipment, live auctions), ` +
    `Weather Widget (real-time local forecast), ` +
    `Community Forum (farmer Q&A with AI-suggested replies), ` +
    `and this AI Chat assistant. ` +
    `Always give concise, practical, India-specific answers. ` +
    `Respond completely in ${languageName}. Do not mix scripts or use English phonetics in non-English responses. ` +
    `If you do not know something, say so clearly rather than inventing facts. ` +
    `Keep answers friendly and within 3-4 short paragraphs unless more detail is genuinely needed.`
  );
}

// ── POST / — Send a message, get AI reply ─────────────────────
router.post("/", protect, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ success: false, message: "Message is required" });
    }

    const userMsg  = message.trim();
    const langCode = (req.headers["x-user-language"] || req.user?.preferredLanguage || "en")
      .split("-")[0].trim().toLowerCase();
    const langName = getLanguageName(langCode);

    // 1. Persist the user's turn first
    await ChatMessage.create({ user: req.user.id, role: "user", message: userMsg });

    // 2. Fetch the last 20 messages (10 exchanges) for context, oldest first
    const history = await ChatMessage.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(21)   // 21 = 20 history + the one we just saved
      .lean();
    history.reverse();

    // 3. Build conversation string from history (exclude the new message — it's the prompt)
    const prior = history.slice(0, -1); // everything except the last (current) message
    const conversationHistory = prior
      .map(m => `${m.role === "user" ? "User" : "Assistant"}: ${m.message}`)
      .join("\n");

    const promptForGemini = conversationHistory.length > 0
      ? `--- Previous conversation ---\n${conversationHistory}\n\nUser: ${userMsg}`
      : `User: ${userMsg}`;

    // 4. Call Gemini with a clean system prompt + conversation context
    const systemPrompt = buildSystemPrompt(req.user.role, langName);
    const reply = await callGeminiChat(systemPrompt, promptForGemini, langCode);

    // 5. Persist the assistant's reply
    await ChatMessage.create({ user: req.user.id, role: "assistant", message: reply });

    res.json({ success: true, reply });
  } catch (err) {
    console.error("AI chat error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /history — Last 50 messages, oldest first ─────────────
router.get("/history", protect, async (req, res) => {
  try {
    const messages = await ChatMessage.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json({ success: true, messages: messages.reverse() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELETE /history — Clear all chat history for this user ────
router.delete("/history", protect, async (req, res) => {
  try {
    await ChatMessage.deleteMany({ user: req.user.id });
    res.json({ success: true, message: "Chat history cleared" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
