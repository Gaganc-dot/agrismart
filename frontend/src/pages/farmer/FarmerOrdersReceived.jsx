/**
 * FarmerOrdersReceived — Order Management with OTP Delivery Flow
 * Farmer controls: Confirm → Pack → Ship → Out for Delivery (auto-triggers OTP)
 */
import { useState, useEffect, useCallback } from "react";
import FarmerLayout from "./FarmerLayout";
import { useTranslation } from "react-i18next";
import {
  ShoppingBag, Package, User, MapPin, Phone, CheckCircle2,
  Truck, Clock, XCircle, Loader, RefreshCw, IndianRupee,
  BadgeCheck, Lock, AlertTriangle, ChevronDown, ChevronUp,
  Star, ShieldCheck, Timer, Sparkles
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";
function getToken() {
  return localStorage.getItem("token") || sessionStorage.getItem("token");
}

// ── Status config ─────────────────────────────────────────────
const STATUS_STEPS = [
  { key:"pending",          label:"Pending",          emoji:"📋", color:"#6366f1" },
  { key:"confirmed",        label:"Confirmed",        emoji:"✅", color:"#3b82f6" },
  { key:"packed",           label:"Packed",           emoji:"📦", color:"#8b5cf6" },
  { key:"shipped",          label:"Shipped",          emoji:"🚚", color:"#f59e0b" },
  { key:"out_for_delivery", label:"Out for Delivery", emoji:"🛵", color:"#f97316" },
  { key:"otp_pending",      label:"OTP Pending",      emoji:"🔐", color:"#ef4444" },
  { key:"delivered",        label:"Delivered",        emoji:"🏠", color:"#10b981" },
  { key:"completed",        label:"Completed",        emoji:"🎉", color:"#16a34a" },
];

const STATUS_COLOR = {
  pending:          { bg:"#eff6ff", text:"#1d4ed8", border:"#bfdbfe" },
  confirmed:        { bg:"#eff6ff", text:"#1d4ed8", border:"#bfdbfe" },
  packed:           { bg:"#f5f3ff", text:"#6d28d9", border:"#ddd6fe" },
  shipped:          { bg:"#fffbeb", text:"#b45309", border:"#fde68a" },
  out_for_delivery: { bg:"#fff7ed", text:"#c2410c", border:"#fed7aa" },
  otp_pending:      { bg:"#fef2f2", text:"#dc2626", border:"#fecaca" },
  delivered:        { bg:"#f0fdf4", text:"#15803d", border:"#bbf7d0" },
  completed:        { bg:"#f0fdf4", text:"#166534", border:"#86efac" },
  cancelled:        { bg:"#fef2f2", text:"#b91c1c", border:"#fecaca" },
};

// Next status transitions farmers can trigger
const NEXT_ACTION = {
  pending:          { label:"✅ Confirm Order",       next:"confirmed",        color:"#2563eb", shadow:"rgba(37,99,235,0.3)" },
  confirmed:        { label:"📦 Mark as Packed",      next:"packed",           color:"#7c3aed", shadow:"rgba(124,58,237,0.3)" },
  packed:           { label:"🚚 Mark as Shipped",     next:"shipped",          color:"#d97706", shadow:"rgba(217,119,6,0.3)"  },
  shipped:          { label:"🛵 Out for Delivery",    next:"out_for_delivery", color:"#ea580c", shadow:"rgba(234,88,12,0.3)"  },
  out_for_delivery: null, // OTP auto-generated; farmer waits
  otp_pending:      null, // waiting for buyer to verify OTP
  delivered:        null,
  completed:        null,
  cancelled:        null,
};

// ── Mini delivery timeline (compact) ─────────────────────────
function MiniTimeline({ status }) {
  const currentIdx = STATUS_STEPS.findIndex(s => s.key === status);
  if (status === "cancelled") return (
    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
      <XCircle style={{ width:14, height:14, color:"#dc2626" }} />
      <span style={{ fontSize:11, color:"#dc2626", fontWeight:700 }}>Order Cancelled</span>
    </div>
  );
  return (
    <div style={{ display:"flex", alignItems:"center", gap:0, overflowX:"auto" }}>
      {STATUS_STEPS.slice(0, 7).map((step, i) => {
        const isDone    = currentIdx > i;
        const isCurrent = currentIdx === i;
        const isLast    = i === 6;
        return (
          <div key={step.key} style={{ display:"flex", alignItems:"center", flex: isLast ? "0 0 auto" : 1 }}>
            <div style={{
              width:24, height:24, borderRadius:"50%", flexShrink:0,
              background: isDone ? step.color : isCurrent ? `${step.color}20` : "#f1f5f9",
              border: isCurrent ? `2px solid ${step.color}` : "none",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:10,
            }}>
              {isDone
                ? <CheckCircle2 style={{ width:12, height:12, color:"#fff" }} />
                : <span>{step.emoji}</span>
              }
            </div>
            {!isLast && (
              <div style={{
                flex:1, height:2, margin:"0 1px",
                background: isDone ? step.color : "#e5e7eb",
                minWidth:6,
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Single Order Card ─────────────────────────────────────────
function OrderCard({ order, onUpdateStatus, updating }) {
  const [expanded, setExpanded] = useState(false);
  const sc         = STATUS_COLOR[order.status] || STATUS_COLOR.pending;
  const action     = NEXT_ACTION[order.status];
  const isCompleted = ["delivered","completed"].includes(order.status);
  const isOtpWaiting = ["out_for_delivery","otp_pending"].includes(order.status);

  return (
    <div style={{
      background:"#fff",
      borderRadius:24,
      border:`1px solid ${isOtpWaiting ? "#fed7aa" : isCompleted ? "#bbf7d0" : "#f1f5f9"}`,
      boxShadow: isOtpWaiting
        ? "0 0 0 3px rgba(249,115,22,0.07), 0 4px 20px rgba(0,0,0,0.05)"
        : isCompleted
          ? "0 0 0 3px rgba(22,163,74,0.06), 0 4px 20px rgba(0,0,0,0.05)"
          : "0 2px 12px rgba(0,0,0,0.04)",
      overflow:"hidden",
      transition:"all 0.3s",
    }}>

      {/* Card Header (always visible) */}
      <div
        onClick={() => setExpanded(v => !v)}
        style={{
          display:"flex", alignItems:"center", gap:16,
          padding:"20px 24px", cursor:"pointer",
        }}>

        {/* Product icon */}
        <div style={{
          width:52, height:52, borderRadius:16, flexShrink:0,
          background: isCompleted ? "#f0fdf4" : isOtpWaiting ? "#fff7ed" : "#f8fafc",
          border:`1px solid ${sc.border}`,
          display:"flex", alignItems:"center", justifyContent:"center", fontSize:22,
        }}>
          {isCompleted ? "✅" : isOtpWaiting ? "🔐" : "📦"}
        </div>

        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap" }}>
            <p style={{ fontWeight:800, fontSize:15, color:"#1f2937", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", maxWidth:200 }}>
              {order.product?.title || "Deleted Product"}
            </p>
            <span style={{
              fontSize:10, fontWeight:800, padding:"3px 10px", borderRadius:999,
              background:sc.bg, color:sc.text, border:`1px solid ${sc.border}`,
              textTransform:"uppercase", letterSpacing:"0.05em", flexShrink:0,
            }}>
              {order.status.replace(/_/g," ")}
            </span>
          </div>
          <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
            <span style={{ fontSize:12, color:"#6b7280" }}>#{String(order._id).slice(-8)}</span>
            <span style={{ fontSize:12, color:"#6b7280" }}>{order.quantity} {order.product?.unit}</span>
            <span style={{ fontSize:12, fontWeight:700, color:"#059669" }}>₹{order.totalPrice?.toLocaleString()}</span>
          </div>
        </div>

        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6, flexShrink:0 }}>
          <p style={{ fontSize:11, color:"#9ca3af" }}>
            {new Date(order.createdAt).toLocaleDateString("en-IN", { day:"2-digit", month:"short" })}
          </p>
          {expanded
            ? <ChevronUp   style={{ width:16, height:16, color:"#9ca3af" }} />
            : <ChevronDown style={{ width:16, height:16, color:"#9ca3af" }} />
          }
        </div>
      </div>

      {/* Expanded Detail */}
      {expanded && (
        <div style={{ padding:"0 24px 24px", borderTop:"1px solid #f8fafc" }}>

          {/* Delivery timeline */}
          <div style={{ paddingTop:20, marginBottom:20 }}>
            <p style={{ fontSize:10, fontWeight:700, color:"#9ca3af", marginBottom:10, textTransform:"uppercase", letterSpacing:"0.08em" }}>
              Delivery Progress
            </p>
            <MiniTimeline status={order.status} />
          </div>

          {/* Buyer Info */}
          <div style={{
            background:"#f9fafb", borderRadius:16, padding:"16px 18px", marginBottom:16,
          }}>
            <p style={{ fontSize:10, fontWeight:700, color:"#9ca3af", textTransform:"uppercase", marginBottom:12, letterSpacing:"0.08em" }}>
              Buyer Details
            </p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {[
                { icon:<User   style={{width:13,height:13}}/>, val: order.buyer?.name      || "–" },
                { icon:<Phone  style={{width:13,height:13}}/>, val: order.buyer?.phone     || "No phone" },
                { icon:<MapPin style={{width:13,height:13}}/>, val: order.deliveryAddress  || "No address", span:2 },
              ].map(({ icon, val, span }, i) => (
                <div key={i} style={{ gridColumn: span ? `span ${span}` : "auto", display:"flex", alignItems:"flex-start", gap:6 }}>
                  <span style={{ color:"#9ca3af", flexShrink:0, marginTop:1 }}>{icon}</span>
                  <p style={{ fontSize:12, color:"#374151", fontWeight:600 }}>{val}</p>
                </div>
              ))}
            </div>
          </div>

          {/* OTP Status */}
          {isOtpWaiting && (
            <div style={{
              background:"linear-gradient(135deg, #fff7ed, #fffbeb)",
              border:"1px solid #fed7aa",
              borderRadius:16, padding:"16px 18px", marginBottom:16,
              display:"flex", alignItems:"center", gap:12,
            }}>
              <div style={{
                width:40, height:40, borderRadius:12,
                background:"rgba(249,115,22,0.15)",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:18, flexShrink:0,
              }}>🔐</div>
              <div style={{ flex:1 }}>
                <p style={{ fontWeight:700, fontSize:13, color:"#c2410c" }}>OTP Sent to Buyer</p>
                <p style={{ fontSize:11, color:"#ea580c", marginTop:2 }}>
                  Waiting for buyer to share the delivery OTP. Ask buyer for their 6-digit code.
                </p>
              </div>
              <Lock style={{ width:18, height:18, color:"#f97316", flexShrink:0 }} />
            </div>
          )}

          {/* Completed — payment released */}
          {isCompleted && (
            <div style={{
              background:"linear-gradient(135deg, #f0fdf4, #dcfce7)",
              border:"1px solid #bbf7d0",
              borderRadius:16, padding:"16px 18px", marginBottom:16,
              display:"flex", alignItems:"center", gap:12,
            }}>
              <div style={{ width:40, height:40, borderRadius:12, background:"rgba(22,163,74,0.15)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>
                💰
              </div>
              <div style={{ flex:1 }}>
                <p style={{ fontWeight:700, fontSize:13, color:"#166534" }}>Payment Released ✅</p>
                <p style={{ fontSize:11, color:"#15803d", marginTop:2 }}>
                  ₹{order.totalPrice?.toLocaleString()} released after OTP verification.
                  {order.deliveredAt ? ` Delivered on ${new Date(order.deliveredAt).toLocaleDateString("en-IN", { day:"2-digit", month:"long" })}.` : ""}
                </p>
              </div>
              <BadgeCheck style={{ width:20, height:20, color:"#16a34a", flexShrink:0 }} />
            </div>
          )}

          {/* Status note (cancelled) */}
          {order.status === "cancelled" && (
            <div style={{
              background:"#fef2f2", border:"1px solid #fecaca", borderRadius:16,
              padding:"14px 18px", marginBottom:16, display:"flex", alignItems:"center", gap:10,
            }}>
              <XCircle style={{ width:18, height:18, color:"#dc2626", flexShrink:0 }} />
              <p style={{ fontSize:12, color:"#dc2626", fontWeight:600 }}>Order was cancelled</p>
            </div>
          )}

          {/* Action button */}
          {action && (
            <div>
              <button
                onClick={() => onUpdateStatus(order._id, action.next)}
                disabled={updating === order._id}
                style={{
                  width:"100%",
                  background: `linear-gradient(135deg, ${action.color}, ${action.color}dd)`,
                  border:"none", borderRadius:16,
                  padding:"14px 0",
                  color:"#fff", fontWeight:800, fontSize:14,
                  cursor: updating === order._id ? "not-allowed" : "pointer",
                  display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                  boxShadow:`0 4px 15px ${action.shadow}`,
                  opacity: updating === order._id ? 0.7 : 1,
                  transition:"all 0.2s",
                }}>
                {updating === order._id
                  ? <><Loader style={{ width:17, height:17, animation:"spin 0.9s linear infinite" }} /> Updating…</>
                  : action.label
                }
              </button>

              {/* Explain what happens next for out_for_delivery */}
              {action.next === "out_for_delivery" && (
                <p style={{ textAlign:"center", fontSize:11, color:"#9ca3af", marginTop:8 }}>
                  🔐 This will automatically generate and send a delivery OTP to the buyer
                </p>
              )}

              {/* Cancel option for pending orders */}
              {order.status === "pending" && (
                <button
                  onClick={() => onUpdateStatus(order._id, "cancelled")}
                  disabled={updating === order._id}
                  style={{
                    width:"100%", marginTop:8,
                    background:"transparent",
                    border:"1.5px solid #fecaca", borderRadius:14,
                    padding:"11px 0",
                    color:"#dc2626", fontWeight:700, fontSize:13,
                    cursor:"pointer",
                  }}>
                  ❌ Decline Order
                </button>
              )}
            </div>
          )}

          {/* Status history */}
          {order.statusHistory?.length > 0 && (
            <div style={{ marginTop:16, borderTop:"1px solid #f1f5f9", paddingTop:14 }}>
              <p style={{ fontSize:10, fontWeight:700, color:"#9ca3af", textTransform:"uppercase", marginBottom:10, letterSpacing:"0.08em" }}>
                Activity Log
              </p>
              {order.statusHistory.slice(-4).reverse().map((h, i) => (
                <div key={i} style={{ display:"flex", gap:8, marginBottom:8, alignItems:"flex-start" }}>
                  <div style={{ width:6, height:6, borderRadius:"50%", background:"#94a3b8", marginTop:4, flexShrink:0 }} />
                  <div style={{ flex:1 }}>
                    <span style={{ fontWeight:700, fontSize:11, color:"#374151", textTransform:"capitalize" }}>
                      {h.status?.replace(/_/g," ")}
                    </span>
                    {h.note ? <span style={{ fontSize:11, color:"#6b7280" }}> — {h.note}</span> : null}
                  </div>
                  <span style={{ fontSize:10, color:"#9ca3af", flexShrink:0 }}>
                    {h.changedAt ? new Date(h.changedAt).toLocaleDateString("en-IN", { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" }) : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function FarmerOrdersReceived() {
  const { t }         = useTranslation();
  const [orders,    setOrders]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [updating,  setUpdating]  = useState(null);
  const [filter,    setFilter]    = useState("all");

  const fetchOrders = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/api/orders/farmer`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setOrders(data.orders || []);
    } catch {
      toast.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, []);

  const handleUpdateStatus = async (orderId, status) => {
    setUpdating(orderId);
    try {
      await axios.put(
        `${API}/api/orders/${orderId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      const labels = {
        confirmed:        "✅ Order confirmed!",
        packed:           "📦 Marked as packed",
        shipped:          "🚚 Order shipped!",
        out_for_delivery: "🛵 Out for delivery — OTP sent to buyer",
        cancelled:        "Order declined",
      };
      toast.success(labels[status] || `Status: ${status}`);
      fetchOrders();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update status");
    } finally {
      setUpdating(null);
    }
  };

  // Filter
  const FILTERS = [
    { key:"all",       label:"All" },
    { key:"pending",   label:"⏳ Pending" },
    { key:"active",    label:"🚚 In Progress" },
    { key:"otp",       label:"🔐 OTP Sent" },
    { key:"completed", label:"✅ Completed" },
  ];

  const filtered = orders.filter(o => {
    if (filter === "all")       return true;
    if (filter === "pending")   return o.status === "pending";
    if (filter === "active")    return ["confirmed","packed","shipped"].includes(o.status);
    if (filter === "otp")       return ["out_for_delivery","otp_pending"].includes(o.status);
    if (filter === "completed") return ["delivered","completed"].includes(o.status);
    return true;
  });

  const pendingCount  = orders.filter(o => o.status === "pending").length;
  const otpCount      = orders.filter(o => ["out_for_delivery","otp_pending"].includes(o.status)).length;
  const totalEarned   = orders
    .filter(o => ["delivered","completed"].includes(o.status))
    .reduce((s, o) => s + (o.totalPrice || 0), 0);

  if (loading) {
    return (
      <FarmerLayout>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"60vh", gap:16 }}>
          <Loader style={{ width:40, height:40, color:"#16a34a", animation:"spin 0.9s linear infinite" }} />
          <p style={{ color:"#9ca3af", fontWeight:600 }}>{t("common.loading")}</p>
        </div>
      </FarmerLayout>
    );
  }

  return (
    <FarmerLayout>
      <div style={{ maxWidth:960, margin:"0 auto", paddingBottom:40 }}>

        {/* ── Hero ── */}
        <div style={{
          background:"linear-gradient(135deg, #166534 0%, #16a34a 50%, #15803d 100%)",
          borderRadius:28, padding:"32px 36px",
          color:"#fff", marginBottom:28,
          position:"relative", overflow:"hidden",
        }}>
          <div style={{ position:"absolute", top:-50, right:-50, width:200, height:200, borderRadius:"50%", background:"rgba(255,255,255,0.06)" }} />
          <div style={{ position:"relative", zIndex:1 }}>
            <h1 style={{ fontWeight:900, fontSize:28, marginBottom:8, display:"flex", alignItems:"center", gap:10 }}>
              <ShoppingBag style={{ width:28, height:28 }} /> Orders Received
            </h1>
            <p style={{ opacity:0.85, fontSize:14, marginBottom:20 }}>
              Manage your sales — confirm, pack, ship, and track OTP delivery verification.
            </p>

            {/* Stats */}
            <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
              {[
                { label:"Total Orders",    val: orders.length,                        emoji:"📦" },
                { label:"Pending Action",  val: pendingCount,                          emoji:"⏳", urgent: pendingCount > 0 },
                { label:"OTP Awaiting",    val: otpCount,                              emoji:"🔐", urgent: otpCount > 0 },
                { label:"Total Earned",    val: `₹${totalEarned.toLocaleString()}`,   emoji:"💰" },
              ].map(({ label, val, emoji, urgent }) => (
                <div key={label} style={{
                  background: urgent ? "rgba(254,215,170,0.25)" : "rgba(255,255,255,0.12)",
                  border: urgent ? "1px solid rgba(249,115,22,0.4)" : "1px solid rgba(255,255,255,0.15)",
                  borderRadius:16, padding:"12px 18px", minWidth:120,
                }}>
                  <p style={{ fontSize:10, opacity:0.75, fontWeight:600, textTransform:"uppercase", marginBottom:4 }}>
                    {emoji} {label}
                  </p>
                  <p style={{ fontWeight:900, fontSize:20 }}>{val}</p>
                </div>
              ))}

              <button
                onClick={fetchOrders}
                style={{
                  background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.25)",
                  borderRadius:16, padding:"12px 18px",
                  color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer",
                  display:"flex", alignItems:"center", gap:6, alignSelf:"flex-end",
                }}>
                <RefreshCw style={{ width:14, height:14 }} /> Refresh
              </button>
            </div>
          </div>
        </div>

        {/* ── OTP Info Banner ── */}
        {otpCount > 0 && (
          <div style={{
            background:"linear-gradient(135deg, #fff7ed, #fffbeb)",
            border:"1.5px solid #fed7aa", borderRadius:20,
            padding:"16px 20px", marginBottom:24,
            display:"flex", alignItems:"center", gap:12,
          }}>
            <div style={{
              width:44, height:44, borderRadius:14,
              background:"rgba(249,115,22,0.15)",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:22, flexShrink:0,
            }}>🔐</div>
            <div style={{ flex:1 }}>
              <p style={{ fontWeight:800, fontSize:14, color:"#c2410c" }}>
                {otpCount} order{otpCount > 1 ? "s" : ""} waiting for OTP verification
              </p>
              <p style={{ fontSize:12, color:"#ea580c", marginTop:2 }}>
                Ask your buyer for their 6-digit delivery OTP and enter it in the buyer app to confirm delivery.
              </p>
            </div>
          </div>
        )}

        {/* ── Filter Pills ── */}
        <div style={{ display:"flex", gap:8, marginBottom:24, flexWrap:"wrap" }}>
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                padding:"8px 16px", borderRadius:999,
                fontWeight:700, fontSize:12, cursor:"pointer",
                border: filter === f.key ? "none" : "1.5px solid #e5e7eb",
                background: filter === f.key ? "#16a34a" : "#fff",
                color: filter === f.key ? "#fff" : "#6b7280",
                boxShadow: filter === f.key ? "0 2px 8px rgba(22,163,74,0.3)" : "none",
                transition:"all 0.2s",
              }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* ── Orders ── */}
        {filtered.length === 0 ? (
          <div style={{
            textAlign:"center", padding:"60px 20px",
            background:"#fff", borderRadius:24, border:"2px dashed #e5e7eb",
          }}>
            <ShoppingBag style={{ width:52, height:52, color:"#d1d5db", margin:"0 auto 16px" }} />
            <p style={{ fontWeight:700, fontSize:18, color:"#6b7280", marginBottom:6 }}>No orders yet</p>
            <p style={{ fontSize:13, color:"#9ca3af" }}>
              Once buyers purchase your products, orders will appear here.
            </p>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            {filtered
              .sort((a, b) => {
                // pending first, then otp, then by date
                const rank = { pending:0, otp_pending:1, out_for_delivery:1, confirmed:2, packed:3, shipped:4, delivered:5, completed:6, cancelled:7 };
                return (rank[a.status]??5) - (rank[b.status]??5) || new Date(b.createdAt) - new Date(a.createdAt);
              })
              .map(order => (
                <OrderCard
                  key={order._id}
                  order={order}
                  onUpdateStatus={handleUpdateStatus}
                  updating={updating}
                />
              ))
            }
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </FarmerLayout>
  );
}
