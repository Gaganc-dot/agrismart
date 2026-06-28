/**
 * MyOrders — Buyer Order Tracking with OTP Delivery Verification
 * Premium UI: 8-step timeline, OTP display, live status, resend cooldown
 */
import { useState, useEffect, useCallback, useRef } from "react";
import BuyerLayout from "./BuyerLayout";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Package, ShieldCheck, MapPin, CheckCircle2, Truck, Loader,
  RefreshCw, Clock, X, Lock, Key, Eye, EyeOff, Send,
  AlertTriangle, Star, ChevronDown, ChevronUp, Phone,
  ArrowRight, Sparkles, Timer, RotateCcw, BadgeCheck
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

function getToken() {
  return localStorage.getItem("token") || sessionStorage.getItem("token");
}

// ── Status config ─────────────────────────────────────────────
const STATUS_STEPS = [
  { key: "pending",          label: "Placed",           emoji: "📋", color: "#6366f1" },
  { key: "confirmed",        label: "Confirmed",        emoji: "✅", color: "#3b82f6" },
  { key: "packed",           label: "Packed",           emoji: "📦", color: "#8b5cf6" },
  { key: "shipped",          label: "Shipped",          emoji: "🚚", color: "#f59e0b" },
  { key: "out_for_delivery", label: "Out for Delivery", emoji: "🛵", color: "#f97316" },
  { key: "otp_pending",      label: "OTP Pending",      emoji: "🔐", color: "#ef4444" },
  { key: "delivered",        label: "Delivered",        emoji: "🏠", color: "#10b981" },
  { key: "completed",        label: "Completed",        emoji: "🎉", color: "#16a34a" },
];

function getStepIndex(status) {
  const idx = STATUS_STEPS.findIndex(s => s.key === status);
  return idx >= 0 ? idx : 0;
}

const STATUS_COLOR = {
  pending:          { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" },
  confirmed:        { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" },
  packed:           { bg: "#f5f3ff", text: "#6d28d9", border: "#ddd6fe" },
  shipped:          { bg: "#fffbeb", text: "#b45309", border: "#fde68a" },
  out_for_delivery: { bg: "#fff7ed", text: "#c2410c", border: "#fed7aa" },
  otp_pending:      { bg: "#fef2f2", text: "#dc2626", border: "#fecaca" },
  delivered:        { bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0" },
  completed:        { bg: "#f0fdf4", text: "#166534", border: "#86efac" },
  cancelled:        { bg: "#fef2f2", text: "#b91c1c", border: "#fecaca" },
};

// ── Countdown timer hook ──────────────────────────────────────
function useCountdown(expiryDate) {
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    if (!expiryDate) return;
    const tick = () => {
      const left = Math.max(0, new Date(expiryDate) - Date.now());
      setRemaining(left);
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [expiryDate]);
  const m = Math.floor(remaining / 60000);
  const s = Math.floor((remaining % 60000) / 1000);
  return { remaining, formatted: `${m}:${String(s).padStart(2, "0")}`, expired: remaining === 0 };
}

// ── OTP Display Card ──────────────────────────────────────────
function OtpCard({ order, onVerify, onResend, verifying, resending }) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [showPlain, setShowPlain] = useState(true);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef([]);
  const { remaining, formatted, expired } = useCountdown(order.otpExpiry);

  useEffect(() => {
    if (resendCooldown > 0) {
      const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendCooldown]);

  const handleDigit = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 5) inputRefs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
    if (e.key === "Enter") handleSubmit();
  };

  const handlePaste = (e) => {
    const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (paste.length === 6) {
      setOtp(paste.split(""));
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = () => {
    const code = otp.join("");
    if (code.length !== 6) return toast.error("Please enter all 6 digits");
    onVerify(order._id, code);
  };

  const handleResend = async () => {
    await onResend(order._id);
    setResendCooldown(60);
    setOtp(["", "", "", "", "", ""]);
  };

  const urgentExpiry = remaining > 0 && remaining < 5 * 60 * 1000;

  return (
    <div style={{
      background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e3a5f 100%)",
      borderRadius: 24,
      padding: 28,
      color: "#fff",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Decorative blobs */}
      <div style={{ position:"absolute", top:-40, right:-40, width:160, height:160, borderRadius:"50%", background:"rgba(255,255,255,0.05)" }} />
      <div style={{ position:"absolute", bottom:-30, left:-30, width:100, height:100, borderRadius:"50%", background:"rgba(255,255,255,0.04)" }} />

      <div style={{ position:"relative", zIndex:1 }}>
        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{
              width:42, height:42, borderRadius:12,
              background:"rgba(251,191,36,0.2)",
              display:"flex", alignItems:"center", justifyContent:"center",
            }}>
              <Key style={{ width:20, height:20, color:"#fbbf24" }} />
            </div>
            <div>
              <p style={{ fontWeight:800, fontSize:17, lineHeight:1.2 }}>Delivery OTP</p>
              <p style={{ fontSize:11, opacity:0.7 }}>Share with delivery person</p>
            </div>
          </div>
          {/* Expiry timer */}
          {order.otpExpiry && !expired && (
            <div style={{
              background: urgentExpiry ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.1)",
              borderRadius:10, padding:"6px 12px",
              display:"flex", alignItems:"center", gap:5,
              border: urgentExpiry ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(255,255,255,0.15)",
            }}>
              <Timer style={{ width:12, height:12, color: urgentExpiry ? "#fca5a5" : "#fbbf24" }} />
              <span style={{ fontSize:12, fontWeight:700, color: urgentExpiry ? "#fca5a5" : "#fbbf24" }}>
                {formatted}
              </span>
            </div>
          )}
          {expired && (
            <div style={{ background:"rgba(239,68,68,0.3)", borderRadius:10, padding:"6px 12px" }}>
              <span style={{ fontSize:11, fontWeight:700, color:"#fca5a5" }}>EXPIRED</span>
            </div>
          )}
        </div>

        {/* Your OTP display (buyer sees their own OTP) */}
        {order.otpPlain && !expired && (
          <div style={{
            background:"rgba(255,255,255,0.1)",
            borderRadius:16,
            padding:"16px 20px",
            marginBottom:20,
            border:"1px solid rgba(255,255,255,0.15)",
          }}>
            <p style={{ fontSize:11, opacity:0.7, marginBottom:8, fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase" }}>
              Your OTP Code
            </p>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <p style={{
                fontSize: 40, fontWeight:900, letterSpacing:12,
                fontFamily:"monospace",
                filter: showPlain ? "none" : "blur(8px)",
                transition:"filter 0.3s",
                color:"#fbbf24",
              }}>
                {order.otpPlain}
              </p>
              <button
                onClick={() => setShowPlain(v => !v)}
                style={{ background:"none", border:"none", cursor:"pointer", color:"rgba(255,255,255,0.7)", padding:4 }}>
                {showPlain
                  ? <EyeOff style={{ width:18, height:18 }} />
                  : <Eye    style={{ width:18, height:18 }} />
                }
              </button>
            </div>
            <p style={{ fontSize:11, opacity:0.6, marginTop:6 }}>
              🔒 Share this only after physically receiving your order
            </p>
          </div>
        )}

        {/* OTP entry box (for delivery person or manual verify) */}
        <div style={{ marginBottom:16 }}>
          <p style={{ fontSize:12, fontWeight:700, marginBottom:12, opacity:0.85 }}>
            Enter OTP to confirm delivery:
          </p>
          <div style={{ display:"flex", gap:8, justifyContent:"center", marginBottom:16 }}>
            {otp.map((d, i) => (
              <input
                key={i}
                ref={el => inputRefs.current[i] = el}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={e => handleDigit(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                onPaste={i === 0 ? handlePaste : undefined}
                disabled={expired}
                style={{
                  width:44, height:52,
                  textAlign:"center",
                  fontSize:22, fontWeight:900,
                  fontFamily:"monospace",
                  borderRadius:12,
                  border: d ? "2px solid #fbbf24" : "2px solid rgba(255,255,255,0.25)",
                  background: d ? "rgba(251,191,36,0.2)" : "rgba(255,255,255,0.1)",
                  color:"#fff",
                  outline:"none",
                  transition:"all 0.15s",
                  cursor: expired ? "not-allowed" : "text",
                  opacity: expired ? 0.5 : 1,
                }}
              />
            ))}
          </div>

          <button
            onClick={handleSubmit}
            disabled={verifying || expired || otp.join("").length !== 6}
            style={{
              width:"100%",
              background: otp.join("").length === 6 && !expired
                ? "linear-gradient(135deg, #fbbf24, #f59e0b)"
                : "rgba(255,255,255,0.1)",
              border:"none",
              borderRadius:14,
              padding:"14px 0",
              fontWeight:800,
              fontSize:15,
              color: otp.join("").length === 6 && !expired ? "#1e1b4b" : "rgba(255,255,255,0.4)",
              cursor: otp.join("").length === 6 && !expired && !verifying ? "pointer" : "not-allowed",
              display:"flex", alignItems:"center", justifyContent:"center", gap:8,
              transition:"all 0.2s",
            }}>
            {verifying
              ? <><Loader style={{ width:18, height:18, animation:"spin 0.9s linear infinite" }} /> Verifying…</>
              : <><BadgeCheck style={{ width:18, height:18 }} /> Confirm Delivery</>
            }
          </button>
        </div>

        {/* Resend */}
        <div style={{ textAlign:"center" }}>
          <button
            onClick={handleResend}
            disabled={resending || resendCooldown > 0}
            style={{
              background:"none", border:"none", cursor: resendCooldown > 0 ? "not-allowed" : "pointer",
              color: resendCooldown > 0 ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.7)",
              fontSize:12, fontWeight:600,
              display:"flex", alignItems:"center", gap:5, margin:"0 auto",
            }}>
            <RotateCcw style={{ width:13, height:13 }} />
            {resendCooldown > 0
              ? `Resend in ${resendCooldown}s`
              : resending ? "Sending…" : "Resend OTP"
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Delivery Timeline Stepper ─────────────────────────────────
function DeliveryTimeline({ status, history = [] }) {
  const currentIdx = getStepIndex(status);
  const isCancelled = status === "cancelled";

  if (isCancelled) {
    return (
      <div style={{
        background:"#fef2f2", border:"1px solid #fecaca",
        borderRadius:16, padding:"16px 20px",
        display:"flex", alignItems:"center", gap:10,
      }}>
        <X style={{ width:20, height:20, color:"#dc2626" }} />
        <div>
          <p style={{ fontWeight:700, color:"#dc2626", fontSize:14 }}>Order Cancelled</p>
          <p style={{ fontSize:12, color:"#ef4444", opacity:0.8 }}>This order has been cancelled</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Step dots */}
      <div style={{ display:"flex", alignItems:"flex-start", gap:0, overflowX:"auto", paddingBottom:4 }}>
        {STATUS_STEPS.map((step, i) => {
          const isDone    = currentIdx > i;
          const isCurrent = currentIdx === i;
          const isFuture  = currentIdx < i;
          const isLast    = i === STATUS_STEPS.length - 1;

          return (
            <div key={step.key} style={{ display:"flex", alignItems:"center", flex: isLast ? "0 0 auto" : 1, minWidth:0 }}>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6, minWidth:52 }}>
                <div style={{
                  width:38, height:38, borderRadius:"50%",
                  background: isDone ? step.color : isCurrent ? `${step.color}20` : "#f1f5f9",
                  border: isCurrent ? `2.5px solid ${step.color}` : isDone ? "none" : "2px solid #e2e8f0",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:16,
                  boxShadow: isCurrent ? `0 0 0 4px ${step.color}25` : "none",
                  transition:"all 0.3s",
                  flexShrink:0,
                }}>
                  {isDone
                    ? <CheckCircle2 style={{ width:18, height:18, color:"#fff" }} />
                    : <span>{step.emoji}</span>
                  }
                </div>
                <p style={{
                  fontSize:9, fontWeight:700,
                  textAlign:"center",
                  color: isDone || isCurrent ? step.color : "#9ca3af",
                  whiteSpace:"nowrap",
                  letterSpacing:"0.04em",
                  textTransform:"uppercase",
                }}>
                  {step.label}
                </p>
              </div>
              {!isLast && (
                <div style={{
                  flex:1, height:2, margin:"0 2px", marginBottom:20,
                  background: isDone ? step.color : "#e2e8f0",
                  borderRadius:2, minWidth:8,
                  transition:"background 0.4s",
                }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Status history log */}
      {history.length > 0 && (
        <div style={{ marginTop:16 }}>
          {history.slice(-3).reverse().map((h, i) => (
            <div key={i} style={{
              display:"flex", alignItems:"center", gap:8,
              padding:"6px 0",
              borderBottom: i < Math.min(history.length, 3) - 1 ? "1px solid #f1f5f9" : "none",
            }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background:"#94a3b8", flexShrink:0 }} />
              <p style={{ fontSize:11, color:"#6b7280", flex:1 }}>
                <span style={{ fontWeight:700, color:"#374151", textTransform:"capitalize" }}>
                  {h.status?.replace(/_/g," ")}
                </span>
                {h.note ? ` — ${h.note}` : ""}
              </p>
              <p style={{ fontSize:10, color:"#9ca3af", flexShrink:0 }}>
                {h.changedAt ? new Date(h.changedAt).toLocaleDateString("en-IN", { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" }) : ""}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Completed Delivery Banner ─────────────────────────────────
function CompletedBanner({ order }) {
  return (
    <div style={{
      background:"linear-gradient(135deg, #16a34a, #15803d)",
      borderRadius:20,
      padding:"20px 24px",
      color:"#fff",
      display:"flex", alignItems:"center", gap:16,
    }}>
      <div style={{
        width:52, height:52, borderRadius:"50%",
        background:"rgba(255,255,255,0.2)",
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:26, flexShrink:0,
      }}>🎉</div>
      <div style={{ flex:1 }}>
        <p style={{ fontWeight:800, fontSize:16 }}>Delivery Confirmed!</p>
        <p style={{ fontSize:12, opacity:0.85, marginTop:2 }}>
          Order completed on {order.deliveredAt
            ? new Date(order.deliveredAt).toLocaleDateString("en-IN", { day:"2-digit", month:"long", year:"numeric" })
            : "–"
          }. Payment released to farmer. ✅
        </p>
      </div>
      <BadgeCheck style={{ width:32, height:32, opacity:0.8, flexShrink:0 }} />
    </div>
  );
}

// ── Single Order Card ─────────────────────────────────────────
function OrderCard({ order, onVerify, onResend, verifying, resending }) {
  const [expanded, setExpanded] = useState(false);
  const sc = STATUS_COLOR[order.status] || STATUS_COLOR.pending;
  const isOtpActive  = ["out_for_delivery", "otp_pending"].includes(order.status);
  const isCompleted  = ["delivered", "completed"].includes(order.status);
  const isCancelled  = order.status === "cancelled";

  // Auto-expand for OTP-active orders
  useEffect(() => {
    if (isOtpActive) setExpanded(true);
  }, [isOtpActive]);

  return (
    <div style={{
      background:"#fff",
      borderRadius:24,
      border:`1px solid ${isOtpActive ? "#fca5a5" : isCompleted ? "#bbf7d0" : "#f1f5f9"}`,
      boxShadow: isOtpActive
        ? "0 0 0 3px rgba(239,68,68,0.08), 0 4px 20px rgba(0,0,0,0.06)"
        : "0 2px 12px rgba(0,0,0,0.04)",
      overflow:"hidden",
      transition:"all 0.3s",
    }}>
      {/* Card Header */}
      <div
        style={{ padding:"20px 24px", cursor:"pointer", display:"flex", alignItems:"center", gap:16 }}
        onClick={() => setExpanded(v => !v)}>

        {/* Product icon */}
        <div style={{
          width:52, height:52, borderRadius:16,
          background: isCompleted ? "#f0fdf4" : isOtpActive ? "#fef2f2" : "#f8fafc",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:22, flexShrink:0,
          border:`1px solid ${sc.border}`,
        }}>
          {isCancelled ? "❌" : isCompleted ? "✅" : isOtpActive ? "🔐" : "📦"}
        </div>

        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap" }}>
            <p style={{ fontWeight:800, fontSize:15, color:"#1f2937", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", maxWidth:220 }}>
              {order.product?.title || "Product"}
            </p>
            <span style={{
              fontSize:10, fontWeight:800, padding:"3px 10px", borderRadius:999,
              background:sc.bg, color:sc.text, border:`1px solid ${sc.border}`,
              textTransform:"uppercase", letterSpacing:"0.06em", flexShrink:0,
            }}>
              {order.status.replace(/_/g," ")}
            </span>
            {isOtpActive && (
              <span style={{
                fontSize:9, fontWeight:800, padding:"2px 7px", borderRadius:999,
                background:"#fef2f2", color:"#dc2626", border:"1px solid #fecaca",
                animation:"pulse 1.5s ease-in-out infinite",
                flexShrink:0,
              }}>
                ⚡ ACTION REQUIRED
              </span>
            )}
          </div>
          <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
            <p style={{ fontSize:12, color:"#6b7280" }}>
              #{String(order._id).slice(-8)} · {order.quantity} {order.product?.unit}
            </p>
            <p style={{ fontSize:12, color:"#059669", fontWeight:700 }}>₹{order.totalPrice?.toLocaleString()}</p>
          </div>
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
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

          {/* Delivery Timeline */}
          <div style={{ marginBottom:20, paddingTop:20 }}>
            <p style={{ fontSize:11, fontWeight:700, color:"#9ca3af", marginBottom:12, textTransform:"uppercase", letterSpacing:"0.08em" }}>
              Delivery Tracking
            </p>
            <DeliveryTimeline status={order.status} history={order.statusHistory} />
          </div>

          {/* OTP Card (only when active) */}
          {isOtpActive && !order.otpVerified && (
            <div style={{ marginBottom:20 }}>
              <OtpCard
                order={order}
                onVerify={onVerify}
                onResend={onResend}
                verifying={verifying === order._id}
                resending={resending === order._id}
              />
            </div>
          )}

          {/* Completed banner */}
          {isCompleted && <CompletedBanner order={order} />}

          {/* Order Info Grid */}
          <div style={{
            display:"grid", gridTemplateColumns:"1fr 1fr",
            gap:12, marginTop:20,
          }}>
            {[
              { label:"Farmer",   val: order.farmer?.name || "–",            icon:"🌾" },
              { label:"Farm",     val: order.farmer?.farmName || "–",         icon:"🏡" },
              { label:"Phone",    val: order.farmer?.phone || "Not shared",   icon:"📞" },
              { label:"Address",  val: order.deliveryAddress || "Not set",    icon:"📍" },
            ].map(({ label, val, icon }) => (
              <div key={label} style={{
                background:"#f9fafb", borderRadius:14, padding:"12px 14px",
              }}>
                <p style={{ fontSize:10, fontWeight:700, color:"#9ca3af", textTransform:"uppercase", marginBottom:3 }}>
                  {icon} {label}
                </p>
                <p style={{ fontSize:13, fontWeight:600, color:"#374151" }}>{val}</p>
              </div>
            ))}
          </div>

          {order.note && (
            <div style={{ marginTop:12, background:"#fffbeb", borderRadius:12, padding:"10px 14px", border:"1px solid #fde68a" }}>
              <p style={{ fontSize:11, fontWeight:700, color:"#92400e", marginBottom:2 }}>Note</p>
              <p style={{ fontSize:12, color:"#78350f" }}>{order.note}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function MyOrders() {
  const [orders,    setOrders]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [verifying, setVerifying] = useState(null);  // orderId
  const [resending, setResending] = useState(null);
  const [filter,    setFilter]    = useState("all");

  const fetchOrders = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/api/orders/buyer`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setOrders(data.orders || []);
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, []);

  // Poll every 15s for live status updates
  useEffect(() => {
    const iv = setInterval(fetchOrders, 15_000);
    return () => clearInterval(iv);
  }, [fetchOrders]);

  const handleVerifyOtp = async (orderId, otp) => {
    setVerifying(orderId);
    try {
      const { data } = await axios.post(
        `${API}/api/orders/${orderId}/verify-otp`,
        { otp },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      toast.success(data.message || "🎉 Delivery confirmed!");
      fetchOrders();
    } catch (err) {
      const msg = err?.response?.data?.message || "OTP verification failed";
      toast.error(msg);
    } finally {
      setVerifying(null);
    }
  };

  const handleResendOtp = async (orderId) => {
    setResending(orderId);
    try {
      const { data } = await axios.post(
        `${API}/api/orders/${orderId}/resend-otp`,
        {},
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      toast.success("OTP resent to your notifications!");
      fetchOrders();
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to resend OTP";
      toast.error(msg);
    } finally {
      setResending(null);
    }
  };

  // Filter
  const FILTERS = [
    { key:"all",      label:"All Orders" },
    { key:"active",   label:"Active" },
    { key:"otp",      label:"⚡ OTP Pending" },
    { key:"completed",label:"Completed" },
    { key:"cancelled",label:"Cancelled" },
  ];

  const filtered = orders.filter(o => {
    if (filter === "all")       return true;
    if (filter === "otp")       return ["out_for_delivery","otp_pending"].includes(o.status);
    if (filter === "active")    return ["pending","confirmed","packed","shipped","out_for_delivery","otp_pending"].includes(o.status);
    if (filter === "completed") return ["delivered","completed"].includes(o.status);
    if (filter === "cancelled") return o.status === "cancelled";
    return true;
  });

  const otpCount = orders.filter(o => ["out_for_delivery","otp_pending"].includes(o.status)).length;

  if (loading) {
    return (
      <BuyerLayout>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"60vh", gap:16 }}>
          <Loader style={{ width:40, height:40, color:"#d97706", animation:"spin 0.9s linear infinite" }} />
          <p style={{ color:"#9ca3af", fontWeight:600 }}>Loading your orders…</p>
        </div>
      </BuyerLayout>
    );
  }

  return (
    <BuyerLayout>
      <div style={{ maxWidth:900, margin:"0 auto", paddingBottom:40 }}>

        {/* ── Hero ── */}
        <div style={{
          background:"linear-gradient(135deg, #1e40af 0%, #4338ca 50%, #1e3a5f 100%)",
          borderRadius:28,
          padding:"32px 36px",
          color:"#fff",
          marginBottom:28,
          position:"relative", overflow:"hidden",
        }}>
          <div style={{ position:"absolute", top:-50, right:-50, width:200, height:200, borderRadius:"50%", background:"rgba(255,255,255,0.05)" }} />
          <div style={{ position:"relative", zIndex:1, display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:16 }}>
            <div>
              <h1 style={{ fontWeight:900, fontSize:28, marginBottom:6, display:"flex", alignItems:"center", gap:10 }}>
                <Package style={{ width:28, height:28 }} /> My Orders
              </h1>
              <p style={{ opacity:0.8, fontSize:14 }}>
                {orders.length} order{orders.length !== 1 ? "s" : ""} · Track your deliveries in real time
              </p>
            </div>
            <div style={{ display:"flex", gap:12, alignItems:"center", flexWrap:"wrap" }}>
              {otpCount > 0 && (
                <div style={{
                  background:"rgba(239,68,68,0.3)",
                  border:"1px solid rgba(239,68,68,0.5)",
                  borderRadius:14, padding:"10px 16px",
                  display:"flex", alignItems:"center", gap:8,
                }}>
                  <Lock style={{ width:14, height:14, color:"#fca5a5" }} />
                  <span style={{ fontWeight:700, fontSize:13, color:"#fca5a5" }}>
                    {otpCount} OTP verification pending
                  </span>
                </div>
              )}
              <button
                onClick={fetchOrders}
                style={{
                  background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.25)",
                  borderRadius:12, padding:"10px 16px",
                  color:"#fff", fontWeight:700, fontSize:13,
                  cursor:"pointer", display:"flex", alignItems:"center", gap:6,
                }}>
                <RefreshCw style={{ width:14, height:14 }} /> Refresh
              </button>
            </div>
          </div>
        </div>

        {/* ── Filter Pills ── */}
        <div style={{ display:"flex", gap:8, marginBottom:24, flexWrap:"wrap" }}>
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                padding:"8px 16px", borderRadius:999,
                fontWeight:700, fontSize:12,
                border: filter === f.key ? "none" : "1.5px solid #e5e7eb",
                background: filter === f.key ? "#1e40af" : "#fff",
                color: filter === f.key ? "#fff" : "#6b7280",
                cursor:"pointer", transition:"all 0.2s",
                boxShadow: filter === f.key ? "0 2px 8px rgba(30,64,175,0.3)" : "none",
              }}>
              {f.label}
              {f.key === "otp" && otpCount > 0 && (
                <span style={{
                  marginLeft:6, background:"#ef4444", color:"#fff",
                  borderRadius:999, padding:"1px 6px", fontSize:9, fontWeight:900,
                }}>
                  {otpCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Orders List ── */}
        {filtered.length === 0 ? (
          <div style={{
            textAlign:"center", padding:"60px 20px",
            background:"#fff", borderRadius:24,
            border:"2px dashed #e5e7eb",
          }}>
            <Package style={{ width:52, height:52, color:"#d1d5db", margin:"0 auto 16px" }} />
            <p style={{ fontWeight:700, fontSize:18, color:"#6b7280", marginBottom:6 }}>
              {filter === "all" ? "No orders yet" : `No ${filter} orders`}
            </p>
            <p style={{ fontSize:13, color:"#9ca3af" }}>
              {filter === "all" ? "Head to the marketplace to make your first purchase." : "Try a different filter."}
            </p>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            {/* OTP-pending orders first */}
            {filtered
              .sort((a, b) => {
                const aOtp = ["out_for_delivery","otp_pending"].includes(a.status) ? 0 : 1;
                const bOtp = ["out_for_delivery","otp_pending"].includes(b.status) ? 0 : 1;
                return aOtp - bOtp || new Date(b.createdAt) - new Date(a.createdAt);
              })
              .map(order => (
                <OrderCard
                  key={order._id}
                  order={order}
                  onVerify={handleVerifyOtp}
                  onResend={handleResendOtp}
                  verifying={verifying}
                  resending={resending}
                />
              ))
            }
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </BuyerLayout>
  );
}
