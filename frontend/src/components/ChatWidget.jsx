/**
 * ChatWidget.jsx
 * ─────────────────────────────────────────────────────────────────
 * Floating AI assistant chat bubble available on every page for
 * both farmer and buyer roles (mounted in their respective Layouts).
 *
 * UI pattern mirrors NotificationCenter.jsx — fixed-position button
 * that opens a floating panel — adapted for a conversational interface.
 *
 * Transport: plain POST /api/ai-chat per message (not SSE).
 * The existing SSE system is for server-initiated push notifications;
 * chat is request-response, so a fetch per send is the right fit.
 *
 * i18n: The widget sends the user's active language code in the
 * X-User-Language header so Gemini responds in their preferred language.
 * ─────────────────────────────────────────────────────────────────
 */
import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import {
  MessageCircle, X, Send, Trash2, Bot, User,
  Loader2, Sparkles, ChevronDown,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

// ── Helpers ───────────────────────────────────────────────────
function getToken() {
  return localStorage.getItem("token") || sessionStorage.getItem("token");
}

function getLangCode() {
  return localStorage.getItem("agri_lang") || "en";
}

function authHeaders() {
  return {
    Authorization: `Bearer ${getToken()}`,
    "X-User-Language": getLangCode(),
  };
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60)  return "just now";
  const m = Math.floor(s / 60);
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

// Renders assistant markdown-lite: bold (**text**) and line breaks
function AssistantText({ text }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <p className="text-sm leading-relaxed whitespace-pre-wrap">
      {parts.map((part, i) =>
        /^\*\*[^*]+\*\*$/.test(part)
          ? <strong key={i}>{part.slice(2, -2)}</strong>
          : part
      )}
    </p>
  );
}

// ── Suggestion chips shown on first open ─────────────────────
const SUGGESTIONS = [
  "What fertilizer should I use for wheat?",
  "How do I detect crop disease early?",
  "Explain the PM-KISAN scheme",
  "How do I list my crop for sale?",
  "What are current onion mandi prices?",
  "How does the Crop Calendar work?",
];

export default function ChatWidget() {
  const [open,     setOpen]     = useState(false);
  const [messages, setMessages] = useState([]);   // { role, message, createdAt, _id? }
  const [input,    setInput]    = useState("");
  const [loading,  setLoading]  = useState(false); // fetching history
  const [sending,  setSending]  = useState(false); // waiting for AI reply
  const [histLoaded, setHistLoaded] = useState(false);

  const bottomRef    = useRef(null);
  const inputRef     = useRef(null);
  const widgetRef    = useRef(null);

  // ── Fetch history on first open ──────────────────────────────
  const fetchHistory = useCallback(async () => {
    if (!getToken()) return;
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/api/ai-chat/history`, {
        headers: authHeaders(),
      });
      setMessages(data.messages || []);
    } catch (err) {
      console.error("ChatWidget: failed to load history", err.message);
    } finally {
      setLoading(false);
      setHistLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (open && !histLoaded) fetchHistory();
  }, [open, histLoaded, fetchHistory]);

  // ── Auto-scroll to bottom on new messages ────────────────────
  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open, sending]);

  // ── Focus input when opened ───────────────────────────────────
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  // ── Close on outside click ────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (widgetRef.current && !widgetRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Send message ──────────────────────────────────────────────
  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg || sending) return;
    setInput("");

    // Optimistic user bubble
    const optimisticUser = { role: "user", message: msg, createdAt: new Date().toISOString(), _opt: true };
    setMessages(prev => [...prev, optimisticUser]);
    setSending(true);

    try {
      const { data } = await axios.post(
        `${API}/api/ai-chat`,
        { message: msg },
        { headers: { ...authHeaders(), "Content-Type": "application/json" } }
      );
      const assistantBubble = {
        role: "assistant",
        message: data.reply,
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantBubble]);
    } catch (err) {
      const errBubble = {
        role: "assistant",
        message: "Sorry, I couldn't get a response right now. Please try again.",
        createdAt: new Date().toISOString(),
        _error: true,
      };
      setMessages(prev => [...prev, errBubble]);
    } finally {
      setSending(false);
    }
  };

  // ── Clear history ─────────────────────────────────────────────
  const clearHistory = async () => {
    try {
      await axios.delete(`${API}/api/ai-chat/history`, { headers: authHeaders() });
      setMessages([]);
    } catch {
      /* ignore */
    }
  };

  // ── Key handler ───────────────────────────────────────────────
  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const isEmpty = messages.length === 0 && !loading;

  return (
    <div ref={widgetRef} className="fixed bottom-6 right-6 z-50">

      {/* ── Chat Panel ─────────────────────────────────────── */}
      {open && (
        <div
          className="absolute bottom-[72px] right-0 w-[360px] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden"
          style={{ height: "520px" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-green-700 to-green-600 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-sm leading-tight">Agri Assistant</p>
                <p className="text-green-200 text-[10px]">Powered by Gemini AI</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="p-1.5 rounded-lg text-green-200 hover:bg-white/20 hover:text-white transition"
                  title="Clear chat"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-green-200 hover:bg-white/20 hover:text-white transition"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

            {loading && (
              <div className="flex items-center gap-2 justify-center py-8 text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Loading history…</span>
              </div>
            )}

            {/* Welcome / suggestion chips when empty */}
            {isEmpty && !loading && (
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-green-600" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-gray-800 text-sm">Ask me anything</p>
                  <p className="text-gray-400 text-xs mt-1">Farming, market prices, schemes, and more</p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="text-xs bg-green-50 text-green-700 border border-green-100 rounded-full px-3 py-1.5 hover:bg-green-100 transition font-medium text-left"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message bubbles */}
            {messages.map((msg, i) => {
              const isUser = msg.role === "user";
              return (
                <div key={msg._id || i} className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : ""}`}>
                  {/* Avatar */}
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    isUser
                      ? "bg-green-600"
                      : msg._error
                        ? "bg-red-100"
                        : "bg-gray-100"
                  }`}>
                    {isUser
                      ? <User className="w-3.5 h-3.5 text-white" />
                      : <Bot className={`w-3.5 h-3.5 ${msg._error ? "text-red-400" : "text-gray-500"}`} />
                    }
                  </div>

                  {/* Bubble */}
                  <div className={`max-w-[78%] flex flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>
                    <div className={`px-3.5 py-2.5 rounded-2xl ${
                      isUser
                        ? "bg-green-600 text-white rounded-tr-sm"
                        : msg._error
                          ? "bg-red-50 border border-red-100 text-red-600 rounded-tl-sm"
                          : "bg-gray-100 text-gray-800 rounded-tl-sm"
                    }`}>
                      {isUser
                        ? <p className="text-sm leading-relaxed">{msg.message}</p>
                        : <AssistantText text={msg.message} />
                      }
                    </div>
                    <span className="text-[10px] text-gray-400 px-1">{timeAgo(msg.createdAt)}</span>
                  </div>
                </div>
              );
            })}

            {/* Typing indicator */}
            {sending && (
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5 text-gray-500" />
                </div>
                <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1 items-center">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t border-gray-100 flex-shrink-0">
            <div className="flex items-end gap-2 bg-gray-50 rounded-xl border border-gray-200 px-3 py-2 focus-within:border-green-400 focus-within:bg-white transition">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Ask about crops, prices, schemes…"
                disabled={sending}
                rows={1}
                className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 resize-none outline-none max-h-28 leading-relaxed"
                style={{ minHeight: "24px" }}
                onInput={(e) => {
                  e.target.style.height = "auto";
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 112)}px`;
                }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || sending}
                className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white hover:bg-green-700 transition disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
              >
                {sending
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Send className="w-3.5 h-3.5" />
                }
              </button>
            </div>
            <p className="text-[10px] text-gray-400 text-center mt-1.5">
              Press Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      )}

      {/* ── Floating Bubble Button ──────────────────────────── */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`relative w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 ${
          open
            ? "bg-gray-700 hover:bg-gray-800"
            : "bg-green-600 hover:bg-green-700 hover:scale-110"
        }`}
        title="Agri AI Assistant"
        id="chat-widget-toggle"
      >
        {open
          ? <X className="w-5 h-5 text-white" />
          : <MessageCircle className="w-6 h-6 text-white" />
        }
        {/* Pulse ring when closed to draw attention */}
        {!open && (
          <span className="absolute w-14 h-14 rounded-full bg-green-500 opacity-30 animate-ping" />
        )}
      </button>

    </div>
  );
}
