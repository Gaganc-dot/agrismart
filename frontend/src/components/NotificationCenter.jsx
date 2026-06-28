/**
 * NotificationCenter
 * Bell icon with animated badge → dropdown notification list.
 * Uses SSE for instant push; falls back to polling on error.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import useSSE from "../hooks/useSSE";
import {
  Bell, X, CheckCheck, Trash2, Gavel, TrendingUp,
  ShieldCheck, AlertCircle, Info, Package, IndianRupee,
  Sparkles, Clock
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const TYPE_META = {
  new_bid:        { icon: Gavel,        color: "text-purple-600 bg-purple-50",  border: "border-purple-100" },
  bid_increased:  { icon: TrendingUp,   color: "text-blue-600 bg-blue-50",      border: "border-blue-100" },
  outbid:         { icon: AlertCircle,  color: "text-red-500 bg-red-50",        border: "border-red-100" },
  bid_accepted:   { icon: ShieldCheck,  color: "text-green-600 bg-green-50",    border: "border-green-100" },
  auction_won:    { icon: Sparkles,     color: "text-amber-600 bg-amber-50",    border: "border-amber-100" },
  auction_ending: { icon: Clock,        color: "text-orange-500 bg-orange-50",  border: "border-orange-100" },
  auction_closed: { icon: X,            color: "text-gray-500 bg-gray-100",     border: "border-gray-100" },
  order_confirmed:{ icon: Package,      color: "text-teal-600 bg-teal-50",      border: "border-teal-100" },
  payment_pending:{ icon: IndianRupee,  color: "text-yellow-600 bg-yellow-50",  border: "border-yellow-100" },
  general:        { icon: Info,         color: "text-indigo-600 bg-indigo-50",  border: "border-indigo-100" },
};

export default function NotificationCenter() {
  const [open,          setOpen]    = useState(false);
  const [notifications, setNotes]   = useState([]);
  const [unread,        setUnread]  = useState(0);
  const [loading,       setLoading] = useState(false);
  const dropdownRef = useRef();
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");

  // ── Fetch from API ───────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const { data } = await axios.get(`${API}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotes(data.notifications || []);
      setUnread(data.unreadCount || 0);
    } catch { /* ignore */ }
  }, [token]);

  useEffect(() => {
    fetchNotifications();
    // Refresh every 60 s as a fallback (in case SSE drops)
    const iv = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(iv);
  }, [fetchNotifications]);

  // ── SSE real-time push ───────────────────────────────────────
  useSSE("/api/notifications/stream", {
    notification: (data) => {
      setNotes(prev => [data, ...prev].slice(0, 50));
      setUnread(prev => prev + 1);
      // Show a toast
      const meta = TYPE_META[data.type] || TYPE_META.general;
      toast(data.message, {
        icon: "🔔",
        style: { borderLeft: "4px solid #6366f1", maxWidth: "360px" },
        duration: 5000,
      });
    },
  });

  // ── Close on outside click ───────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markAllRead = async () => {
    try {
      await axios.put(`${API}/api/notifications/read-all`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotes(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnread(0);
    } catch { toast.error("Failed to mark as read"); }
  };

  const markRead = async (id) => {
    try {
      await axios.put(`${API}/api/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotes(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnread(prev => Math.max(0, prev - 1));
    } catch { /* ignore */ }
  };

  const deleteNote = async (e, id) => {
    e.stopPropagation();
    try {
      await axios.delete(`${API}/api/notifications/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotes(prev => prev.filter(n => n._id !== id));
      setUnread(prev => {
        const wasUnread = notifications.find(n => n._id === id && !n.isRead);
        return wasUnread ? Math.max(0, prev - 1) : prev;
      });
    } catch { /* ignore */ }
  };

  const handleOpen = async () => {
    setOpen(o => !o);
    if (!open) await fetchNotifications();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center px-1 animate-pulse">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[9999] overflow-hidden"
          style={{ maxHeight: "520px" }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-indigo-600" />
              <span className="font-bold text-gray-800 text-sm">Notifications</span>
              {unread > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unread}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button onClick={markAllRead}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition">
                  <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 transition">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto" style={{ maxHeight: "420px" }}>
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 text-gray-300">
                <Bell className="w-10 h-10 opacity-30" />
                <p className="text-sm font-bold text-gray-400">No notifications yet</p>
                <p className="text-xs text-gray-300">Bids, orders & alerts appear here</p>
              </div>
            ) : (
              notifications.map((note) => {
                const meta = TYPE_META[note.type] || TYPE_META.general;
                const Icon = meta.icon;
                return (
                  <div
                    key={note._id}
                    onClick={() => !note.isRead && markRead(note._id)}
                    className={`flex items-start gap-3 px-4 py-3.5 border-b border-gray-50 cursor-pointer transition hover:bg-gray-50 ${!note.isRead ? "bg-indigo-50/40" : ""}`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${meta.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-bold leading-snug ${note.isRead ? "text-gray-600" : "text-gray-800"}`}>
                          {note.title}
                        </p>
                        <button onClick={(e) => deleteNote(e, note._id)}
                          className="text-gray-300 hover:text-red-400 transition flex-shrink-0 mt-0.5">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2">{note.message}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{timeAgo(note.createdAt)}</p>
                    </div>
                    {!note.isRead && (
                      <div className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
