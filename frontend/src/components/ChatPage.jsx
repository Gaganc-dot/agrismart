/**
 * ChatPage — Shared premium real-time chat UI
 * Used by both FarmerChat and BuyerChat pages.
 * Props: Layout (FarmerLayout | BuyerLayout), accentColor
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import useChat from "../hooks/useChat";
import { ChatPageSkeleton } from "./SkeletonLoader";
import {
  Send, Search, MessageCircle, ArrowLeft, Phone, MoreVertical,
  CheckCheck, Check, Circle, Loader, User, ShieldCheck, X, Wifi,
  WifiOff, RefreshCw
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

function getToken()  { return localStorage.getItem("token") || sessionStorage.getItem("token"); }
function getUser()   { return JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "{}"); }

// ── Format time ───────────────────────────────────────────────
function fmtTime(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7)  return d.toLocaleDateString("en-IN", { weekday: "short" });
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

// ── Avatar ────────────────────────────────────────────────────
function Avatar({ name = "?", size = 40, bg = "#16a34a" }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff", fontWeight: 700,
      fontSize: size * 0.38,
      flexShrink: 0,
    }}>
      {name[0]?.toUpperCase() || "?"}
    </div>
  );
}

// ── Conversation List Item ────────────────────────────────────
function ConvItem({ conv, me, isActive, onClick, accent }) {
  const other    = conv.participants?.find(p => p._id !== me._id) || {};
  const unread   = conv.unread || 0;
  const preview  = conv.lastMessage || "Start a conversation…";
  const roleTag  = other.role === "farmer" ? "🌾 Farmer" : "🛒 Buyer";

  return (
    <div onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "12px 16px", cursor: "pointer",
        background: isActive ? `${accent}15` : "transparent",
        borderLeft: isActive ? `3px solid ${accent}` : "3px solid transparent",
        transition: "all 0.2s",
      }}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "#f8fafc"; }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}>
      <Avatar name={other.name || "?"} size={44}
        bg={other.role === "farmer" ? "#16a34a" : "#d97706"} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
          <p style={{ fontWeight: 600, fontSize: 14, color: "#1f2937", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 140 }}>
            {other.name || "User"}
          </p>
          <span style={{ fontSize: 11, color: "#9ca3af", flexShrink: 0 }}>
            {conv.lastMessageAt ? fmtTime(conv.lastMessageAt) : ""}
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ fontSize: 12, color: "#6b7280", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 150 }}>
            {preview}
          </p>
          {unread > 0 && (
            <span style={{
              background: accent, color: "#fff",
              fontSize: 10, fontWeight: 700,
              borderRadius: 999, padding: "2px 7px",
              flexShrink: 0, marginLeft: 4,
            }}>{unread}</span>
          )}
        </div>
        <p style={{ fontSize: 10, color: "#9ca3af", marginTop: 1 }}>{roleTag}</p>
      </div>
    </div>
  );
}

// ── Bubble ────────────────────────────────────────────────────
function Bubble({ msg, isMine, accent }) {
  const read = msg.readBy?.length > 1;
  return (
    <div style={{
      display: "flex",
      flexDirection: isMine ? "row-reverse" : "row",
      alignItems: "flex-end",
      gap: 8,
      marginBottom: 4,
    }}>
      {!isMine && <Avatar name={msg.sender?.name || "?"} size={30}
        bg={msg.sender?.role === "farmer" ? "#16a34a" : "#d97706"} />}

      <div style={{
        maxWidth: "68%",
        background: isMine ? accent : "#f1f5f9",
        color: isMine ? "#fff" : "#1f2937",
        borderRadius: isMine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
        padding: "10px 14px",
        fontSize: 14,
        lineHeight: 1.5,
        wordBreak: "break-word",
      }}>
        {!isMine && (
          <p style={{ fontSize: 10, fontWeight: 700, opacity: 0.7, marginBottom: 3 }}>
            {msg.sender?.name}
          </p>
        )}
        <p>{msg.text}</p>
        <div style={{
          display: "flex", justifyContent: "flex-end", alignItems: "center",
          gap: 3, marginTop: 4,
        }}>
          <span style={{ fontSize: 10, opacity: 0.65 }}>{fmtTime(msg.createdAt)}</span>
          {isMine && (
            read
              ? <CheckCheck style={{ width: 12, height: 12, opacity: 0.9 }} />
              : <Check style={{ width: 12, height: 12, opacity: 0.6 }} />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────
function EmptyState({ accent }) {
  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: 16, padding: 40,
    }}>
      <div style={{
        width: 80, height: 80, borderRadius: "50%",
        background: `${accent}15`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <MessageCircle style={{ width: 36, height: 36, color: accent }} />
      </div>
      <div style={{ textAlign: "center" }}>
        <p style={{ fontWeight: 700, fontSize: 18, color: "#1f2937", marginBottom: 6 }}>
          Select a conversation
        </p>
        <p style={{ fontSize: 13, color: "#9ca3af", maxWidth: 260 }}>
          Choose a conversation from the left or start a new one from the marketplace.
        </p>
      </div>
    </div>
  );
}

// ── Main ChatPage ─────────────────────────────────────────────
export default function ChatPage({ Layout, accent = "#16a34a", basePath = "/farmer" }) {
  const { conversationId } = useParams();
  const navigate           = useNavigate();
  const me                 = getUser();

  const [conversations, setConversations]   = useState([]);
  const [activeConv,    setActiveConv]      = useState(null);
  const [messages,      setMessages]        = useState([]);
  const [text,          setText]            = useState("");
  const [loadingConvs,  setLoadingConvs]    = useState(true);
  const [loadingMsgs,   setLoadingMsgs]     = useState(false);
  const [sending,       setSending]         = useState(false);
  const [search,        setSearch]          = useState("");
  const [otherTyping,   setOtherTyping]     = useState(false);
  const [mobileView,    setMobileView]      = useState("list"); // "list" | "chat"

  const messagesEndRef = useRef(null);
  const typingTimer    = useRef(null);
  const inputRef       = useRef(null);

  const headers = { Authorization: `Bearer ${getToken()}` };

  // ── Socket.io chat hook ──────────────────────────────────────
  const { connected, emitTyping } = useChat({
    conversationId: activeConv?._id,
    onNewMessage: (msg) => {
      setMessages(prev => {
        if (prev.some(m => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
      // Mark as read immediately
      if (activeConv) markRead(activeConv._id);
    },
    onTyping: ({ isTyping }) => {
      setOtherTyping(isTyping);
      if (isTyping) setTimeout(() => setOtherTyping(false), 3000);
    },
  });

  // ── Fetch conversations ──────────────────────────────────────
  const fetchConvs = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/api/chat/conversations`, { headers });
      setConversations(data.conversations || []);
    } catch { /* silent */ }
    finally { setLoadingConvs(false); }
  }, []);

  useEffect(() => { fetchConvs(); }, []);

  // Auto-open conversation from URL param
  useEffect(() => {
    if (conversationId && conversations.length && activeConv?._id !== conversationId) {
      const c = conversations.find(c => c._id === conversationId);
      if (c) openConversation(c);
    }
  }, [conversationId, conversations, activeConv]);

  // ── Open conversation ────────────────────────────────────────
  const openConversation = async (conv) => {
    setActiveConv(conv);
    setMessages([]);
    setMobileView("chat");
    navigate(`${basePath}/chat/${conv._id}`, { replace: true });
    setLoadingMsgs(true);
    try {
      const { data } = await axios.get(`${API}/api/chat/conversations/${conv._id}/messages`, { headers });
      setMessages(data.messages || []);
      markRead(conv._id);
      // Clear unread on local state
      setConversations(prev => prev.map(c => c._id === conv._id ? { ...c, unread: 0 } : c));
    } catch { toast.error("Failed to load messages"); }
    finally { setLoadingMsgs(false); }
  };

  const markRead = async (convId) => {
    try { await axios.put(`${API}/api/chat/conversations/${convId}/read`, {}, { headers }); }
    catch { /* silent */ }
  };

  // ── Auto-scroll ──────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, otherTyping]);

  // ── Send message ─────────────────────────────────────────────
  const sendMessage = async (e) => {
    e?.preventDefault();
    if (!text.trim() || !activeConv || sending) return;
    const msgText = text.trim();
    setText("");
    setSending(true);
    emitTyping(false);

    // Optimistic bubble
    const optimistic = {
      _id: `opt_${Date.now()}`,
      text: msgText,
      sender: { _id: me._id, name: me.name, role: me.role },
      readBy: [me._id],
      createdAt: new Date().toISOString(),
      optimistic: true,
    };
    setMessages(prev => [...prev, optimistic]);

    try {
      const { data } = await axios.post(
        `${API}/api/chat/conversations/${activeConv._id}/messages`,
        { text: msgText }, { headers }
      );
      // Replace optimistic with real
      setMessages(prev => prev.map(m => m._id === optimistic._id ? data.message : m));
      // Update conv list preview
      setConversations(prev => prev.map(c =>
        c._id === activeConv._id
          ? { ...c, lastMessage: msgText, lastMessageAt: new Date() }
          : c
      ));
    } catch (err) {
      toast.error("Failed to send message");
      setMessages(prev => prev.filter(m => m._id !== optimistic._id));
      setText(msgText);
    } finally { setSending(false); }
  };

  // ── Typing detection ─────────────────────────────────────────
  const handleTextChange = (e) => {
    setText(e.target.value);
    emitTyping(true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => emitTyping(false), 2000);
  };

  // ── Filtered convs ───────────────────────────────────────────
  const filteredConvs = conversations.filter(c => {
    const other = c.participants?.find(p => p._id !== me._id);
    return !search || other?.name?.toLowerCase().includes(search.toLowerCase());
  });

  const otherUser = activeConv?.participants?.find(p => p._id !== me._id);

  return (
    <Layout>
      <div style={{
        display: "flex",
        height: "calc(100vh - 120px)",
        minHeight: 500,
        background: "#fff",
        borderRadius: 20,
        border: "1px solid #f1f5f9",
        overflow: "hidden",
        boxShadow: "0 4px 24px rgba(0,0,0,0.04)",
      }}>

        {/* ── Conversation Sidebar ── */}
        <div
          className={`chat-sidebar${mobileView === "list" ? " show-list" : ""}`}
          style={{
            width: 300,
            borderRight: "1px solid #f1f5f9",
            display: "flex",
            flexDirection: "column",
            flexShrink: 0,
          }}
        >
          {/* Header */}
          <div style={{ padding: "16px", borderBottom: "1px solid #f1f5f9" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <p style={{ fontWeight: 700, fontSize: 16, color: "#1f2937" }}>Messages</p>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: connected ? "#16a34a" : "#d1d5db",
                  flexShrink: 0,
                }} />
                <span style={{ fontSize: 10, color: "#9ca3af" }}>{connected ? "Live" : "Connecting…"}</span>
                <button onClick={fetchConvs} style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "#9ca3af", padding: 4,
                }}>
                  <RefreshCw style={{ width: 13, height: 13 }} />
                </button>
              </div>
            </div>

            {/* Search */}
            <div style={{ position: "relative" }}>
              <Search style={{
                position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
                width: 14, height: 14, color: "#9ca3af",
              }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search conversations…"
                style={{
                  width: "100%", paddingLeft: 32, paddingRight: 12,
                  paddingTop: 8, paddingBottom: 8,
                  border: "1px solid #e5e7eb", borderRadius: 10,
                  fontSize: 13, outline: "none",
                  background: "#f9fafb", color: "#1f2937",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {/* Conv list */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {loadingConvs ? (
              <div style={{ padding: 20, textAlign: "center" }}>
                <div style={{
                  width: 32, height: 32,
                  border: `3px solid ${accent}30`,
                  borderTopColor: accent,
                  borderRadius: "50%",
                  animation: "spin 0.9s linear infinite",
                  margin: "0 auto 8px",
                }} />
                <p style={{ fontSize: 12, color: "#9ca3af" }}>Loading conversations…</p>
              </div>
            ) : filteredConvs.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center" }}>
                <MessageCircle style={{ width: 36, height: 36, color: "#d1d5db", margin: "0 auto 12px" }} />
                <p style={{ fontSize: 13, color: "#6b7280", fontWeight: 600 }}>No conversations yet</p>
                <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>
                  Contact a seller from the marketplace to start chatting.
                </p>
              </div>
            ) : (
              filteredConvs.map(conv => (
                <ConvItem
                  key={conv._id}
                  conv={conv}
                  me={me}
                  isActive={activeConv?._id === conv._id}
                  onClick={() => openConversation(conv)}
                  accent={accent}
                />
              ))
            )}
          </div>
        </div>

        {/* ── Chat Area ── */}
        <div
          className={mobileView === "list" ? "chat-area-mobile-hidden" : ""}
          style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}
        >
          {!activeConv ? (
            <EmptyState accent={accent} />
          ) : (
            <>
              {/* Chat Header */}
              <div style={{
                padding: "14px 20px",
                borderBottom: "1px solid #f1f5f9",
                display: "flex", alignItems: "center", gap: 12,
                background: "#fafafa",
              }}>
                <button
                  onClick={() => { setMobileView("list"); navigate(`${basePath}/chat`, { replace: true }); }}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: "#6b7280", padding: 4, display: "flex", alignItems: "center",
                  }}
                >
                  <ArrowLeft style={{ width: 18, height: 18 }} />
                </button>
                <Avatar
                  name={otherUser?.name || "?"}
                  size={40}
                  bg={otherUser?.role === "farmer" ? "#16a34a" : "#d97706"}
                />
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 700, fontSize: 15, color: "#1f2937" }}>
                    {otherUser?.name || "User"}
                  </p>
                  <p style={{ fontSize: 11, color: "#9ca3af" }}>
                    {otherUser?.role === "farmer" ? "🌾 Farmer" : "🛒 Buyer"}
                    {otherUser?.farmName ? ` · ${otherUser.farmName}` : ""}
                    {activeConv.productTitle ? ` · Re: ${activeConv.productTitle}` : ""}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {otherUser?.phone && (
                    <a href={`tel:${otherUser.phone}`} style={{
                      width: 34, height: 34, borderRadius: 10,
                      background: `${accent}15`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: accent, textDecoration: "none",
                    }}>
                      <Phone style={{ width: 15, height: 15 }} />
                    </a>
                  )}
                  <div style={{
                    display: "flex", alignItems: "center", gap: 4,
                    fontSize: 10, color: connected ? "#16a34a" : "#9ca3af",
                    background: connected ? "#f0fdf4" : "#f9fafb",
                    padding: "4px 8px", borderRadius: 20,
                  }}>
                    {connected
                      ? <><Wifi style={{ width: 10, height: 10 }} /> Live</>
                      : <><WifiOff style={{ width: 10, height: 10 }} /> Reconnecting</>
                    }
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 8px" }}>
                {loadingMsgs ? (
                  <div style={{ display: "flex", justifyContent: "center", paddingTop: 40 }}>
                    <div style={{
                      width: 36, height: 36,
                      border: `3px solid ${accent}30`,
                      borderTopColor: accent,
                      borderRadius: "50%",
                      animation: "spin 0.9s linear infinite",
                    }} />
                  </div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: "center", paddingTop: 60, color: "#9ca3af" }}>
                    <MessageCircle style={{ width: 32, height: 32, margin: "0 auto 10px", opacity: 0.3 }} />
                    <p style={{ fontSize: 13 }}>No messages yet. Say hello! 👋</p>
                  </div>
                ) : (
                  <>
                    {messages.map((msg) => (
                      <Bubble
                        key={msg._id}
                        msg={msg}
                        isMine={msg.sender?._id === me._id || msg.sender === me._id}
                        accent={accent}
                      />
                    ))}

                    {/* Typing indicator */}
                    {otherTyping && (
                      <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginTop: 4 }}>
                        <Avatar name={otherUser?.name || "?"} size={30}
                          bg={otherUser?.role === "farmer" ? "#16a34a" : "#d97706"} />
                        <div style={{
                          background: "#f1f5f9",
                          borderRadius: "18px 18px 18px 4px",
                          padding: "10px 14px",
                          display: "flex", gap: 4, alignItems: "center",
                        }}>
                          {[0, 1, 2].map(i => (
                            <div key={i} style={{
                              width: 6, height: 6, borderRadius: "50%",
                              background: "#9ca3af",
                              animation: `typingDot 1.2s ease-in-out ${i * 0.2}s infinite`,
                            }} />
                          ))}
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input */}
              <form onSubmit={sendMessage} style={{
                padding: "12px 16px",
                borderTop: "1px solid #f1f5f9",
                display: "flex", gap: 10, alignItems: "flex-end",
                background: "#fafafa",
              }}>
                <div style={{
                  flex: 1,
                  background: "#fff",
                  border: "1.5px solid #e5e7eb",
                  borderRadius: 14,
                  display: "flex", alignItems: "flex-end",
                  padding: "8px 12px",
                  gap: 8,
                  transition: "border-color 0.2s",
                }}>
                  <textarea
                    ref={inputRef}
                    value={text}
                    onChange={handleTextChange}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Type a message… (Enter to send)"
                    rows={1}
                    style={{
                      flex: 1, border: "none", outline: "none",
                      resize: "none", fontSize: 14,
                      background: "transparent", color: "#1f2937",
                      fontFamily: "inherit", lineHeight: 1.5,
                      maxHeight: 120, overflowY: "auto",
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!text.trim() || sending}
                  style={{
                    width: 46, height: 46,
                    borderRadius: 14,
                    background: text.trim() ? accent : "#e5e7eb",
                    border: "none",
                    cursor: text.trim() ? "pointer" : "not-allowed",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: text.trim() ? "#fff" : "#9ca3af",
                    transition: "all 0.2s",
                    flexShrink: 0,
                  }}>
                  {sending
                    ? <Loader style={{ width: 18, height: 18, animation: "spin 0.9s linear infinite" }} />
                    : <Send style={{ width: 18, height: 18 }} />
                  }
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes typingDot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
        /* Mobile: sidebar toggle */
        @media (max-width: 767px) {
          .chat-sidebar { display: none !important; }
          .chat-sidebar.show-list { display: flex !important; }
          .chat-area-mobile-hidden { display: none !important; }
        }
        /* Desktop: always show both panes */
        @media (min-width: 768px) {
          .chat-sidebar { display: flex !important; }
          .chat-area-mobile-hidden { display: flex !important; }
        }
      `}</style>
    </Layout>
  );
}
