/**
 * BrowseProducts — Buyer Marketplace
 * Tabs: Crops/Auctions | Farm Equipment
 * Features: live bid feed (SSE), countdown timer, outbid alerts,
 * bid history, equipment browse with contact modal.
 */
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import BuyerLayout from "./BuyerLayout";
import {
  Search, Filter, MapPin, ShieldCheck, Gavel, Loader, ShoppingBag,
  X, Heart, Bell, Timer, TrendingUp, Users, Zap, Eye, BarChart2,
  ChevronDown, RotateCcw, Package, Activity, Trophy, Clock,
  ArrowUpRight, CheckCircle2, AlertCircle, Flame, Star, IndianRupee,
  Tractor, Phone, Tag, Wrench, Info, ChevronRight, MessageCircle
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import useSSE from "../../hooks/useSSE";
import SkeletonLoader from "../../components/SkeletonLoader";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";
const CROP_CATEGORIES = ["All","Crops","Vegetables","Fruits","Seeds","Fertilizers","Tools","Dairy","Spices","Other"];
const EQUIP_CATEGORIES = [
  { id:"all",        label:"All",        emoji:"🏪" },
  { id:"tractor",    label:"Tractor",    emoji:"🚜" },
  { id:"harvester",  label:"Harvester",  emoji:"🌾" },
  { id:"sprayer",    label:"Sprayer",    emoji:"💧" },
  { id:"rotavator",  label:"Rotavator",  emoji:"⚙️" },
  { id:"seeder",     label:"Seeder",     emoji:"🌱" },
  { id:"cultivator", label:"Cultivator", emoji:"🔧" },
  { id:"plough",     label:"Plough",     emoji:"🪵" },
  { id:"pump",       label:"Water Pump", emoji:"⛽" },
  { id:"irrigation", label:"Irrigation", emoji:"🚿" },
  { id:"tools",      label:"Tools",      emoji:"🛠️" },
  { id:"trolley",    label:"Trolley",    emoji:"🛒" },
  { id:"thresher",   label:"Thresher",   emoji:"🌀" },
  { id:"other",      label:"Other",      emoji:"📦" },
];

// ── Countdown ────────────────────────────────────────────────
function Countdown({ endTime, compact = false }) {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    const tick = () => setLeft(Math.max(0, new Date(endTime) - Date.now()));
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [endTime]);

  const d = Math.floor(left / 86400000);
  const h = Math.floor((left % 86400000) / 3600000);
  const m = Math.floor((left % 3600000) / 60000);
  const s = Math.floor((left % 60000) / 1000);

  if (left === 0) return <span className="text-red-500 font-bold text-xs">ENDED</span>;
  const urgent = left < 3600000;

  if (compact) return (
    <span className={`text-xs font-bold tabular-nums ${urgent ? "text-red-500 animate-pulse" : "text-gray-500"}`}>
      {d > 0 ? `${d}d ` : ""}{String(h).padStart(2,"0")}:{String(m).padStart(2,"0")}:{String(s).padStart(2,"0")}
    </span>
  );

  return (
    <div className={`flex items-center gap-3 ${urgent ? "text-red-600" : "text-indigo-700"}`}>
      {[
        { v: d, label: "Days" },
        { v: h, label: "Hrs" },
        { v: m, label: "Min" },
        { v: s, label: "Sec" },
      ].map(({ v, label }) => (
        <div key={label} className={`text-center w-14 py-2 rounded-xl border font-extrabold tabular-nums ${urgent ? "bg-red-50 border-red-200" : "bg-indigo-50 border-indigo-100"}`}>
          <p className="text-2xl leading-none">{String(v).padStart(2,"0")}</p>
          <p className="text-[9px] font-bold opacity-60 mt-0.5">{label}</p>
        </div>
      ))}
    </div>
  );
}

// ── Product Card ─────────────────────────────────────────────
function ProductCard({ product, onOpen, isWishlisted, onWishlist }) {
  const bids         = product.bids || [];
  const highestBid   = bids.length ? Math.max(...bids.map(b => b.amount)) : product.price;
  const isAuction    = product.isAuction;
  const isEnded      = product.auctionEndTime && new Date(product.auctionEndTime) < new Date();
  const isSold       = product.status === "sold" || product.status === "expired";

  return (
    <div
      onClick={() => !isSold && onOpen(product)}
      className={`bg-white rounded-[1.5rem] border overflow-hidden shadow-sm group transition-all ${isSold ? "opacity-60 cursor-not-allowed" : "hover:shadow-xl hover:-translate-y-1 cursor-pointer border-gray-100 hover:border-gray-200"}`}
    >
      <div className="relative h-52 bg-gray-100 overflow-hidden">
        {product.images?.[0] ? (
          <img src={product.images[0]} alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="w-10 h-10 text-gray-200" /></div>
        )}

        <div className="absolute top-2 left-2 flex gap-1.5 flex-wrap">
          {isAuction && !isSold && !isEnded && (
            <div className="bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
              <Activity className="w-2.5 h-2.5" /> LIVE
            </div>
          )}
          {isSold && <div className="bg-gray-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">SOLD</div>}
        </div>

        <button onClick={e => { e.stopPropagation(); onWishlist(product._id); }}
          className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition ${isWishlisted ? "bg-red-500 text-white" : "bg-white/90 text-gray-400 hover:text-red-400"}`}>
          <Heart className={`w-4 h-4 ${isWishlisted ? "fill-current" : ""}`} />
        </button>

        <div className="absolute bottom-2 left-2 flex gap-1.5">
          <div className="bg-white/90 backdrop-blur text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1">
            <MapPin className="w-2.5 h-2.5 text-emerald-600" /> {product.location || "India"}
          </div>
          {isAuction && bids.length > 0 && (
            <div className="bg-purple-600/90 backdrop-blur text-white text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1">
              <Users className="w-2.5 h-2.5" /> {bids.length}
            </div>
          )}
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-bold text-gray-800 text-sm mb-1.5 line-clamp-1">{product.title}</h3>

        {isAuction ? (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-bold text-purple-600 uppercase">
                {bids.length > 0 ? "Current Bid" : "Starting Bid"}
              </p>
              {product.auctionEndTime && !isSold && (
                <Countdown endTime={product.auctionEndTime} compact />
              )}
            </div>
            <p className="text-purple-800 font-extrabold text-xl">
              ₹{highestBid.toLocaleString()}
              <span className="text-xs text-purple-400 font-normal"> /{product.unit}</span>
            </p>
          </div>
        ) : (
          <p className="text-emerald-700 font-extrabold text-xl mb-3">
            ₹{product.price?.toLocaleString()}
            <span className="text-sm text-gray-400 font-normal"> /{product.unit}</span>
          </p>
        )}

        <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
          <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-xs font-bold">
            {(product.farmer?.name || "F")[0]}
          </div>
          <span className="text-xs text-gray-500 truncate flex-1">{product.farmer?.name || "Verified Farmer"}</span>
          <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
        </div>
      </div>
    </div>
  );
}

// ── Equipment Card ────────────────────────────────────────────
const CONDITION_STYLE = {
  new:        { bg:"bg-emerald-100", text:"text-emerald-700", label:"New" },
  used:       { bg:"bg-amber-100",   text:"text-amber-700",   label:"Used" },
  refurbished:{ bg:"bg-blue-100",    text:"text-blue-700",    label:"Refurbished" },
};

function EquipmentCard({ item, onContact }) {
  const cond = CONDITION_STYLE[item.condition] || CONDITION_STYLE.used;
  const catEmoji = EQUIP_CATEGORIES.find(c => c.id === item.category)?.emoji || "🚜";

  return (
    <div className="bg-white rounded-[1.5rem] border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group cursor-pointer"
      onClick={() => onContact(item)}>
      <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
        {item.images?.[0] ? (
          <img src={item.images[0]} alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <span className="text-5xl">{catEmoji}</span>
            <span className="text-xs font-bold text-gray-400">{item.category}</span>
          </div>
        )}

        <div className="absolute top-2 left-2 flex gap-1.5 flex-wrap">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cond.bg} ${cond.text}`}>
            {cond.label}
          </span>
          {item.isRental && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-700">
              For Rent
            </span>
          )}
        </div>

        {item.negotiable && (
          <div className="absolute top-2 right-2 bg-white/90 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
            Negotiable
          </div>
        )}

        <div className="absolute bottom-2 left-2">
          <div className="bg-white/90 backdrop-blur text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1">
            <MapPin className="w-2.5 h-2.5 text-orange-500" /> {item.location || "India"}
          </div>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-bold text-gray-800 text-sm mb-1 line-clamp-1">{item.name}</h3>
        {(item.brand || item.yearOfManufacture) && (
          <p className="text-xs text-gray-400 mb-2">
            {item.brand}{item.brand && item.yearOfManufacture ? " · " : ""}{item.yearOfManufacture}
          </p>
        )}

        <div className="mb-3">
          <p className="text-orange-700 font-extrabold text-xl">
            ₹{item.price?.toLocaleString()}
          </p>
          {item.isRental && (item.rentalPricePerDay || item.rentalPricePerHour) && (
            <p className="text-xs text-cyan-600 font-bold">
              {item.rentalPricePerDay ? `₹${item.rentalPricePerDay}/day` : ""}
              {item.rentalPricePerDay && item.rentalPricePerHour ? " · " : ""}
              {item.rentalPricePerHour ? `₹${item.rentalPricePerHour}/hr` : ""}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
          <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 text-xs font-bold">
            {(item.farmer?.name || "F")[0]}
          </div>
          <span className="text-xs text-gray-500 truncate flex-1">{item.farmer?.name || "Verified Farmer"}</span>
          <button
            onClick={e => { e.stopPropagation(); onContact(item); }}
            className="text-[10px] font-bold bg-orange-50 text-orange-600 px-2 py-1 rounded-lg hover:bg-orange-100 transition flex items-center gap-1">
            <Phone className="w-2.5 h-2.5" /> Contact
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Equipment Contact Modal ───────────────────────────────────
function EquipmentModal({ item, onClose, onStartChat, onBuy }) {
  if (!item) return null;
  const cond = CONDITION_STYLE[item.condition] || CONDITION_STYLE.used;
  const catEmoji = EQUIP_CATEGORIES.find(c => c.id === item.category)?.emoji || "🚜";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-gray-900/60 backdrop-blur-sm"
      onClick={onClose}>
      <div className="bg-white rounded-t-[2rem] sm:rounded-[2rem] w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}>

        {/* Image */}
        <div className="relative h-56 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden rounded-t-[2rem]">
          {item.images?.[0] ? (
            <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3">
              <span className="text-7xl">{catEmoji}</span>
            </div>
          )}
          <button onClick={onClose}
            className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow hover:bg-white transition">
            <X className="w-4 h-4 text-gray-600" />
          </button>
          <div className="absolute top-3 left-3 flex gap-1.5">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cond.bg} ${cond.text}`}>{cond.label}</span>
            {item.isRental && <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-cyan-100 text-cyan-700">For Rent</span>}
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Header */}
          <div>
            <h2 className="font-display font-bold text-2xl text-gray-800 mb-1">{item.name}</h2>
            <div className="flex flex-wrap gap-2 text-xs">
              {item.brand && <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-lg font-bold">{item.brand}</span>}
              {item.yearOfManufacture && <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-lg font-bold">{item.yearOfManufacture}</span>}
              {item.hoursUsed && <span className="bg-amber-50 text-amber-600 px-2 py-0.5 rounded-lg font-bold">{item.hoursUsed} hrs used</span>}
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4">
            <p className="text-xs font-bold text-orange-500 mb-1 uppercase">Sale Price</p>
            <p className="font-display font-extrabold text-3xl text-orange-700">₹{item.price?.toLocaleString()}</p>
            {item.negotiable && <p className="text-xs font-bold text-orange-400 mt-0.5">Price is negotiable</p>}
            {item.isRental && (
              <div className="mt-3 pt-3 border-t border-orange-100">
                <p className="text-xs font-bold text-cyan-600 mb-1">Rental Options</p>
                <div className="flex gap-3">
                  {item.rentalPricePerDay && (
                    <div className="bg-cyan-50 rounded-xl px-3 py-1.5 text-center">
                      <p className="font-extrabold text-cyan-700">₹{item.rentalPricePerDay}</p>
                      <p className="text-[10px] text-cyan-500">per day</p>
                    </div>
                  )}
                  {item.rentalPricePerHour && (
                    <div className="bg-cyan-50 rounded-xl px-3 py-1.5 text-center">
                      <p className="font-extrabold text-cyan-700">₹{item.rentalPricePerHour}</p>
                      <p className="text-[10px] text-cyan-500">per hour</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Category",  val: item.category },
              { label: "Condition", val: item.condition },
              { label: "Location",  val: item.location || "Not specified" },
              { label: "Status",    val: item.status },
            ].map(({ label, val }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">{label}</p>
                <p className="text-sm font-bold text-gray-700 capitalize">{val}</p>
              </div>
            ))}
          </div>

          {/* Features */}
          {item.features?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-500 mb-2">Features</p>
              <div className="flex flex-wrap gap-2">
                {item.features.map(f => (
                  <span key={f} className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-full font-bold">
                    ✓ {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {item.description && (
            <div className="bg-gray-50 rounded-2xl p-4">
              <p className="text-xs font-bold text-gray-400 mb-1">Description</p>
              <p className="text-sm text-gray-700 leading-relaxed">{item.description}</p>
            </div>
          )}

          {/* Seller + Contact */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <p className="text-xs font-bold text-gray-400 mb-3">Seller Details</p>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 bg-orange-100 rounded-full flex items-center justify-center text-orange-700 font-bold text-lg">
                {(item.farmer?.name || "F")[0]}
              </div>
              <div>
                <p className="font-bold text-gray-800 flex items-center gap-1">
                  {item.farmer?.name || "Verified Farmer"}
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                </p>
                {item.farmer?.farmName && (
                  <p className="text-xs text-gray-400">{item.farmer.farmName}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2.5">
              {/* Direct Purchase Button */}
              {item.status === "available" && (
                <button
                  onClick={() => onBuy?.("buy")}
                  className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl transition shadow-md">
                  🛒 Buy Now (₹{item.price?.toLocaleString()})
                </button>
              )}
              {/* Direct Rent Buttons */}
              {item.status === "available" && item.isRental && (
                <div className="flex gap-2">
                  {item.rentalPricePerDay && (
                    <button
                      onClick={() => onBuy?.("day")}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3.5 rounded-xl transition shadow-md text-sm">
                      🕒 Rent/Day (₹{item.rentalPricePerDay})
                    </button>
                  )}
                  {item.rentalPricePerHour && (
                    <button
                      onClick={() => onBuy?.("hour")}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3.5 rounded-xl transition shadow-md text-sm">
                      🕒 Rent/Hr (₹{item.rentalPricePerHour})
                    </button>
                  )}
                </div>
              )}
              {/* In-app chat — always show if farmer exists */}
              {item.farmer?._id && (
                <button
                  onClick={() => onStartChat?.(item.farmer._id, { productRef: item._id, productTitle: item.name })}
                  className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition shadow-md">
                  <MessageCircle className="w-4 h-4" /> Chat with Seller
                </button>
              )}
              {(item.contactPhone || item.farmer?.phone) && (
                <a href={`tel:${item.contactPhone || item.farmer?.phone}`}
                  className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 rounded-xl transition shadow-md">
                  <Phone className="w-4 h-4" /> Call Seller
                </a>
              )}
              {(item.contactPhone || item.farmer?.phone) && (
                <a href={`https://wa.me/91${(item.contactPhone || item.farmer?.phone || "").replace(/\D/g,"")}`}
                  target="_blank" rel="noreferrer"
                  className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3.5 rounded-xl transition shadow-md">
                  💬 WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Bid History Row ──────────────────────────────────────────
function BidHistoryRow({ bid, rank, isTop, isYours }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all ${isTop ? "bg-purple-50 border-purple-200" : isYours ? "bg-blue-50 border-blue-200" : "bg-white border-gray-100"}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold flex-shrink-0 ${isTop ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-500"}`}>
        {isTop ? <Trophy className="w-3.5 h-3.5" /> : `#${rank}`}
      </div>
      <div className="flex-1">
        <p className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
          {bid.buyer?.name || bid.buyerName || "Bidder"}
          {isYours && <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-bold">You</span>}
        </p>
        <p className="text-[10px] text-gray-400">{new Date(bid.time).toLocaleString()}</p>
      </div>
      <p className={`font-extrabold ${isTop ? "text-purple-700 text-lg" : "text-gray-700"}`}>
        ₹{Number(bid.amount).toLocaleString()}
      </p>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function BrowseProducts() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab]   = useState(
    searchParams.get("tab") === "equipment" ? "equipment" : "crops"
  );

  // Sync activeTab whenever the URL ?tab= param changes (e.g. sidebar nav)
  useEffect(() => {
    const tabFromUrl = searchParams.get("tab") === "equipment" ? "equipment" : "crops";
    setActiveTab(tabFromUrl);
  }, [searchParams]);

  // ── Crop state ────────────────────────────────────────────
  const [products,  setProducts]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [category,  setCategory]  = useState("All");
  const [sortBy,    setSortBy]    = useState("newest");
  const [wishlist,  setWishlist]  = useState(() => {
    try { return JSON.parse(localStorage.getItem("buyer_wishlist") || "[]"); } catch { return []; }
  });

  // Modal / detail state (crops)
  const [selected,      setSelected]      = useState(null);
  const [bidAmount,     setBidAmount]     = useState("");
  const [buyQuantity,   setBuyQuantity]   = useState(1);
  const [actionLoading, setActionLoading] = useState(false);
  const [bidTab,        setBidTab]        = useState("bid");
  const [liveBids,      setLiveBids]      = useState([]);
  const [liveHighest,   setLiveHighest]   = useState(0);
  const [priceFlash,    setPriceFlash]    = useState(false);
  const [isOutbid,      setIsOutbid]      = useState(false);

  // ── Equipment state ───────────────────────────────────────
  const [equipment,    setEquipment]    = useState([]);
  const [equipLoading, setEquipLoading] = useState(false);
  const [equipSearch,  setEquipSearch]  = useState("");
  const [equipCat,     setEquipCat]     = useState("all");
  const [equipRental,  setEquipRental]  = useState("all"); // "all"|"sale"|"rental"
  const [selectedEquip,setSelectedEquip]= useState(null);

  const navigate = useNavigate();
  const token    = localStorage.getItem("token") || sessionStorage.getItem("token");
  const user     = JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "{}");

  // Update URL param on tab switch
  const switchTab = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab }, { replace: true });
  };

  // ── SSE ───────────────────────────────────────────────────
  useSSE(
    selected?.isAuction && selected?.status === "available" ? `/api/auction/${selected._id}/stream` : null,
    {
      new_bid: (data) => {
        const bid = data.bid;
        setLiveBids(prev => prev.some(b => b._id === bid._id) ? prev : [bid, ...prev]);
        setLiveHighest(data.highestBid);
        setPriceFlash(true);
        setTimeout(() => setPriceFlash(false), 1500);
        if (bid.buyerId !== user._id) {
          const myBids = liveBids.filter(b => b.buyerId === user._id);
          if (myBids.length > 0) {
            setIsOutbid(true);
            toast("⚡ You've been outbid! Bid again to stay in the lead.", {
              style: { borderLeft: "4px solid #ef4444" }, duration: 6000,
            });
          }
        } else { setIsOutbid(false); }
      },
      auction_closed: (data) => {
        setSelected(p => p ? { ...p, status: data.status || "sold" } : p);
        setProducts(prev => prev.map(p => p._id === data.productId ? { ...p, status: data.status || "sold" } : p));
        toast("Auction has ended.", { icon: "🔔" });
      },
    }
  );

  // ── Fetch Crops ───────────────────────────────────────────
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      let url = `${API}/api/products?`;
      if (category !== "All") url += `category=${category}&`;
      if (search)             url += `search=${encodeURIComponent(search)}`;
      const { data } = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      setProducts(data.products || []);
    } catch { toast.error("Failed to fetch products."); }
    finally { setLoading(false); }
  }, [category, search, token]);

  useEffect(() => { fetchProducts(); }, [category]);

  // ── Fetch Equipment ───────────────────────────────────────
  const fetchEquipment = useCallback(async () => {
    setEquipLoading(true);
    try {
      let url = `${API}/api/equipment?`;
      if (equipCat !== "all")     url += `category=${equipCat}&`;
      if (equipSearch)            url += `search=${encodeURIComponent(equipSearch)}&`;
      if (equipRental === "sale")   url += `isRental=false&`;
      if (equipRental === "rental") url += `isRental=true&`;
      const { data } = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      setEquipment(data.equipment || []);
    } catch { toast.error("Failed to fetch equipment."); }
    finally { setEquipLoading(false); }
  }, [equipCat, equipSearch, equipRental, token]);

  useEffect(() => {
    if (activeTab === "equipment") fetchEquipment();
  }, [activeTab, equipCat, equipRental]);

  // ── Start private chat with a farmer ────────────────────────
  const startChatWithSeller = async (farmerId, { productRef, productTitle } = {}) => {
    if (!farmerId) return toast.error("Seller info unavailable");
    try {
      const { data } = await axios.post(
        `${API}/api/chat/conversations`,
        { recipientId: farmerId, productRef, productTitle },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigate(`/buyer/chat/${data.conversation._id}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not start chat");
    }
  };

  // ── Bid helpers ───────────────────────────────────────────
  const fetchBids = async (productId) => {
    try {
      const { data } = await axios.get(`${API}/api/auction/${productId}/bids`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLiveBids(data.bids || []);
      setLiveHighest(data.highestBid || 0);
    } catch { /* ignore */ }
  };

  const openDetail = (product) => {
    setSelected(product);
    setLiveBids([]);
    setLiveHighest(product.bids?.length ? Math.max(...product.bids.map(b => b.amount)) : product.price);
    setBidAmount("");
    setBuyQuantity(product.quantity || 1);
    setBidTab("bid");
    setIsOutbid(false);
    if (product.isAuction) fetchBids(product._id);
  };

  const toggleWishlist = (id) => {
    const updated = wishlist.includes(id) ? wishlist.filter(i => i !== id) : [...wishlist, id];
    setWishlist(updated);
    localStorage.setItem("buyer_wishlist", JSON.stringify(updated));
  };

  const handleBid = async () => {
    if (!bidAmount || Number(bidAmount) <= liveHighest)
      return toast.error(`Bid must be above ₹${liveHighest.toLocaleString()}`);
    setActionLoading(true);
    try {
      const { data } = await axios.post(`${API}/api/products/${selected._id}/bid`,
        { amount: Number(bidAmount) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLiveHighest(data.highestBid);
      setIsOutbid(false);
      toast.success(`✅ Bid of ₹${Number(bidAmount).toLocaleString()} placed!`);
      setBidAmount("");
      fetchBids(selected._id);
    } catch (err) {
      toast.error(err.response?.data?.message || "Bid failed.");
    } finally { setActionLoading(false); }
  };

  const handleBuyNow = async () => {
    setActionLoading(true);
    try {
      const { data: orderData } = await axios.post(`${API}/api/orders/create-razorpay-order`,
        { productId: selected._id, quantity: Number(buyQuantity) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!orderData.success) throw new Error("Order creation failed");

      if (orderData.mock) {
        await verifyPayment({ razorpay_order_id: orderData.orderId, razorpay_payment_id: "mock_pay_123", razorpay_signature: "mock_sig_123" });
        return;
      }

      const options = {
        key:         orderData.key || "rzp_test_mock",
        amount:      orderData.amount,
        currency:    orderData.currency,
        name:        "Agri-Smart Connect",
        description: `Purchase of ${selected.title}`,
        order_id:    orderData.orderId,
        handler:     (response) => verifyPayment(response),
        prefill:     { name: user.name, email: user.email },
        theme:       { color: "#16a34a" },
      };
      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", r => { toast.error("Payment failed: " + r.error.description); setActionLoading(false); });
      rzp.open();
    } catch { toast.error("Checkout failed."); setActionLoading(false); }
  };

  const verifyPayment = async (paymentResponse) => {
    try {
      await axios.post(`${API}/api/orders/verify-payment`,
        { ...paymentResponse, productId: selected._id, quantity: Number(buyQuantity), deliveryAddress: "" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("🎉 Order confirmed!");
      setSelected(null);
      fetchProducts();
      navigate("/buyer/orders");
    } catch { toast.error("Payment verification failed."); setActionLoading(false); }
  };

  const handleEquipmentCheckout = async (equipItem, rentOption = "buy") => {
    setActionLoading(true);
    try {
      const { data: orderData } = await axios.post(`${API}/api/orders/create-razorpay-order`,
        { productId: equipItem._id, quantity: 1, rentOption },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!orderData.success) throw new Error("Order creation failed");

      if (orderData.mock) {
        await verifyEquipmentPayment({ razorpay_order_id: orderData.orderId, razorpay_payment_id: "mock_pay_123", razorpay_signature: "mock_sig_123" }, equipItem, rentOption);
        return;
      }

      const options = {
        key:         orderData.key || "rzp_test_mock",
        amount:      orderData.amount,
        currency:    orderData.currency,
        name:        "Agri-Smart Connect",
        description: `${rentOption === "buy" ? "Purchase" : "Rent"} of ${equipItem.name}`,
        order_id:    orderData.orderId,
        handler:     (response) => verifyEquipmentPayment(response, equipItem, rentOption),
        prefill:     { name: user.name, email: user.email },
        theme:       { color: "#ca8a04" },
      };
      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", r => { toast.error("Payment failed: " + r.error.description); setActionLoading(false); });
      rzp.open();
    } catch { toast.error("Checkout failed."); setActionLoading(false); }
  };

  const verifyEquipmentPayment = async (paymentResponse, equipItem, rentOption) => {
    try {
      await axios.post(`${API}/api/orders/verify-payment`,
        { ...paymentResponse, productId: equipItem._id, quantity: 1, deliveryAddress: "", rentOption },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(rentOption === "buy" ? "🎉 Equipment purchased successfully!" : "🎉 Equipment rented successfully!");
      setSelectedEquip(null);
      fetchEquipment();
      navigate("/buyer/orders");
    } catch { toast.error("Payment verification failed."); setActionLoading(false); }
  };

  const displayProducts = useMemo(() => {
    let list = products;
    if (sortBy === "price_asc")  list = [...list].sort((a, b) => a.price - b.price);
    if (sortBy === "price_desc") list = [...list].sort((a, b) => b.price - a.price);
    if (sortBy === "bids")       list = [...list].sort((a, b) => (b.bids?.length || 0) - (a.bids?.length || 0));
    if (sortBy === "ending")     list = [...list].sort((a, b) => {
      if (!a.auctionEndTime) return 1;
      if (!b.auctionEndTime) return -1;
      return new Date(a.auctionEndTime) - new Date(b.auctionEndTime);
    });
    return list;
  }, [products, sortBy]);

  const liveAuctions = products.filter(p => p.isAuction && p.status === "available");

  // ── Render ─────────────────────────────────────────────────
  return (
    <BuyerLayout>
      <div className="max-w-7xl mx-auto space-y-6 relative">

        {/* Hero */}
        <div className={`rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden transition-all duration-500 ${
          activeTab === "equipment"
            ? "bg-gradient-to-br from-orange-700 via-amber-700 to-yellow-800"
            : "bg-gradient-to-br from-emerald-700 via-teal-700 to-cyan-800"
        }`}>
          <div className="absolute top-0 right-0 opacity-10 text-[180px] leading-none pointer-events-none select-none">
            {activeTab === "equipment" ? "🚜" : "🌾"}
          </div>
          <div className="relative z-10">
            <h2 className="font-display text-3xl font-extrabold mb-1">
              {activeTab === "equipment" ? "Farm Equipment" : "Agri Marketplace"}
            </h2>
            <p className={`text-sm mb-5 ${activeTab === "equipment" ? "text-orange-100" : "text-emerald-100"}`}>
              {activeTab === "equipment"
                ? "Buy, sell & rent farm machinery · Verified listings"
                : "Buy direct from farmers · Live auctions · Verified quality"}
            </p>
            <div className="flex gap-4 flex-wrap mb-6">
              {(activeTab === "equipment" ? [
                { label: `${equipment.length} Listings`,                         icon: Tractor },
                { label: `${equipment.filter(e => e.isRental).length} For Rent`, icon: Tag },
              ] : [
                { label: `${products.length} Products`,          icon: Package },
                { label: `${liveAuctions.length} Live Auctions`, icon: Flame },
                { label: `${wishlist.length} Saved`,             icon: Heart },
              ]).map(({ label, icon: Icon }) => (
                <div key={label} className="flex items-center gap-1.5 text-xs font-bold bg-white/20 px-3 py-1.5 rounded-full">
                  <Icon className="w-3.5 h-3.5" /> {label}
                </div>
              ))}
            </div>


            {/* Search */}
            <form onSubmit={e => { e.preventDefault(); activeTab === "equipment" ? fetchEquipment() : fetchProducts(); }}
              className="flex gap-3 bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20 max-w-2xl">
              <div className="flex-1 flex items-center bg-white rounded-xl px-4 overflow-hidden">
                <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  value={activeTab === "equipment" ? equipSearch : search}
                  onChange={e => activeTab === "equipment" ? setEquipSearch(e.target.value) : setSearch(e.target.value)}
                  placeholder={activeTab === "equipment" ? "Search tractors, harvesters…" : "Search crops, seeds…"}
                  className="w-full py-3 px-3 outline-none text-gray-800 text-sm"
                />
                {(activeTab === "equipment" ? equipSearch : search) && (
                  <button type="button"
                    onClick={() => activeTab === "equipment" ? setEquipSearch("") : setSearch("")}
                    className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                )}
              </div>
              <button type="submit"
                className={`px-6 rounded-xl font-bold transition shadow-lg text-sm text-white ${activeTab === "equipment" ? "bg-orange-500 hover:bg-orange-600" : "bg-emerald-500 hover:bg-emerald-600"}`}>
                Search
              </button>
            </form>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 bg-gray-100 p-1.5 rounded-2xl w-fit">
          {[
            { id:"crops",     label:"🌾 Crops & Auctions", active:"bg-white text-emerald-700 shadow-sm" },
            { id:"equipment", label:"🚜 Farm Equipment",    active:"bg-white text-orange-600 shadow-sm" },
          ].map(tab => (
            <button key={tab.id} onClick={() => switchTab(tab.id)}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id ? tab.active : "text-gray-400 hover:text-gray-600"}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── CROPS & AUCTIONS TAB ── */}
        {activeTab === "crops" && (
          <>
            {/* Filters */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide flex-1">
                {CROP_CATEGORIES.map(cat => (
                  <button key={cat} onClick={() => setCategory(cat)}
                    className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition ${category === cat ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-gray-600 border-gray-200 hover:border-emerald-300"}`}>
                    {cat}
                  </button>
                ))}
              </div>
              <div className="relative flex-shrink-0">
                <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                  className="appearance-none border border-gray-200 bg-white rounded-xl px-4 py-2 text-xs font-bold text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-400 pr-8 transition">
                  <option value="newest">Newest First</option>
                  <option value="price_asc">Price ↑</option>
                  <option value="price_desc">Price ↓</option>
                  <option value="bids">Most Bids</option>
                  <option value="ending">Ending Soon</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              </div>
              <button onClick={fetchProducts} className="p-2.5 border border-gray-200 bg-white rounded-xl text-gray-400 hover:text-emerald-600 hover:border-emerald-200 transition">
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {loading ? (
              <SkeletonLoader variant="product" count={8} />
            ) : displayProducts.length === 0 ? (
              <div className="bg-white rounded-[2rem] p-16 border border-gray-100 flex flex-col items-center gap-4 text-gray-300">
                <ShoppingBag className="w-16 h-16 opacity-20" />
                <p className="font-bold text-gray-400 text-lg">No products found</p>
                <p className="text-sm text-gray-300">Try adjusting your filters.</p>
              </div>
            ) : (
              <>
                <p className="text-sm font-bold text-gray-400"><span className="text-emerald-600">{displayProducts.length}</span> products</p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {displayProducts.map(p => (
                    <ProductCard key={p._id} product={p} onOpen={openDetail}
                      isWishlisted={wishlist.includes(p._id)} onWishlist={toggleWishlist} />
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* ── EQUIPMENT TAB ── */}
        {activeTab === "equipment" && (
          <>
            {/* Category pills */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {EQUIP_CATEGORIES.map(cat => (
                <button key={cat.id} onClick={() => setEquipCat(cat.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition flex-shrink-0 ${equipCat === cat.id ? "bg-orange-600 text-white border-orange-600" : "bg-white text-gray-600 border-gray-200 hover:border-orange-300"}`}>
                  <span>{cat.emoji}</span> {cat.label}
                </button>
              ))}
            </div>

            {/* Sale / Rental filter */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex bg-gray-100 p-1 rounded-xl gap-1">
                {[
                  { id:"all",    label:"All" },
                  { id:"sale",   label:"🏷️ For Sale" },
                  { id:"rental", label:"🔑 For Rent" },
                ].map(f => (
                  <button key={f.id} onClick={() => setEquipRental(f.id)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${equipRental === f.id ? "bg-white text-orange-600 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}>
                    {f.label}
                  </button>
                ))}
              </div>
              <button onClick={fetchEquipment} className="p-2.5 border border-gray-200 bg-white rounded-xl text-gray-400 hover:text-orange-600 hover:border-orange-200 transition">
                <RotateCcw className="w-4 h-4" />
              </button>
              <p className="text-sm font-bold text-gray-400 ml-auto">
                <span className="text-orange-600">{equipment.length}</span> listings
              </p>
            </div>

            {equipLoading ? (
              <SkeletonLoader variant="product" count={8} />
            ) : equipment.length === 0 ? (
              <div className="bg-white rounded-[2rem] p-16 border border-gray-100 flex flex-col items-center gap-4">
                <Tractor className="w-16 h-16 text-gray-200" />
                <p className="font-bold text-gray-400 text-lg">No equipment found</p>
                <p className="text-sm text-gray-300">Try a different category or filter.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {equipment.map(item => (
                  <EquipmentCard key={item._id} item={item} onContact={setSelectedEquip} />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── CROP DETAIL MODAL ── */}
        {selected && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-gray-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-t-[2rem] sm:rounded-[2rem] w-full sm:max-w-5xl max-h-[96vh] overflow-hidden shadow-2xl flex flex-col sm:flex-row">

              {/* Left: Image + info */}
              <div className="sm:w-2/5 flex flex-col bg-gray-50">
                <div className="relative flex-shrink-0">
                  {selected.images?.[0] ? (
                    <img src={selected.images[0]} alt={selected.title} className="w-full h-56 sm:h-72 object-cover" />
                  ) : (
                    <div className="w-full h-56 sm:h-72 flex items-center justify-center bg-gray-100">
                      <ShoppingBag className="w-16 h-16 text-gray-200" />
                    </div>
                  )}
                  <button onClick={() => setSelected(null)}
                    className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow hover:bg-white transition">
                    <X className="w-4 h-4 text-gray-600" />
                  </button>
                  <button onClick={() => toggleWishlist(selected._id)}
                    className={`absolute top-3 left-3 w-8 h-8 rounded-full flex items-center justify-center shadow transition ${wishlist.includes(selected._id) ? "bg-red-500 text-white" : "bg-white/90 text-gray-400"}`}>
                    <Heart className={`w-4 h-4 ${wishlist.includes(selected._id) ? "fill-current" : ""}`} />
                  </button>
                </div>

                <div className="p-5 overflow-y-auto flex-1">
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-100">{selected.category}</span>
                    {selected.isAuction && (
                      <span className="text-[10px] font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full border border-purple-100 flex items-center gap-0.5">
                        <Gavel className="w-2.5 h-2.5" /> Auction
                      </span>
                    )}
                  </div>
                  <h2 className="font-display font-bold text-xl text-gray-800 mb-1">{selected.title}</h2>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                    <MapPin className="w-3.5 h-3.5 text-emerald-500" /> {selected.location || "India"}
                    <span>·</span>
                    <span>{selected.quantity} {selected.unit}</span>
                  </div>

                  <div className="bg-white border border-gray-100 rounded-2xl p-3 mb-3 flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold">
                      {(selected.farmer?.name || "F")[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800 flex items-center gap-1">
                        {selected.farmer?.name || "Farmer"} <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                      </p>
                      <p className="text-xs text-gray-400">{selected.farmer?.phone || "Verified"}</p>
                    </div>
                  </div>

                  {selected.description && (
                    <p className="text-xs text-gray-600 leading-relaxed">{selected.description}</p>
                  )}
                </div>
              </div>

              {/* Right: Bidding / Buy */}
              <div className="sm:w-3/5 flex flex-col">
                <div className="flex border-b border-gray-100 bg-gray-50 flex-shrink-0">
                  {(selected.isAuction
                    ? [{ id: "bid", label: selected.status === "available" ? "Place Bid" : "Auction Ended" }, { id: "history", label: `Bids (${liveBids.length})` }, { id: "info", label: "Details" }]
                    : [{ id: "buy", label: "Buy Now" }, { id: "info", label: "Details" }]
                  ).map(tab => (
                    <button key={tab.id} onClick={() => setBidTab(tab.id)}
                      className={`flex-1 py-3.5 text-xs font-bold border-b-2 transition ${bidTab === tab.id ? "border-purple-500 text-purple-700 bg-white" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="flex-1 overflow-y-auto p-5">
                  {/* BID TAB */}
                  {bidTab === "bid" && selected.isAuction && (
                    <div className="space-y-4">
                      <div className={`rounded-2xl p-5 border transition-all ${priceFlash ? "bg-purple-100 border-purple-300 scale-[1.01]" : "bg-purple-50 border-purple-100"}`}>
                        <p className="text-xs font-bold text-purple-600 mb-1">
                          {liveBids.length > 0 ? "Current Highest Bid" : "Starting Bid"}
                        </p>
                        <div className="flex items-end gap-2 flex-wrap">
                          <p className={`font-display font-extrabold text-4xl transition-all ${priceFlash ? "text-purple-900" : "text-purple-700"}`}>
                            ₹{liveHighest.toLocaleString()}
                          </p>
                          <span className="text-sm text-purple-500 font-bold mb-1">/ {selected.unit}</span>
                        </div>
                        <div className="mt-2 bg-white/60 rounded-xl px-3 py-2 text-xs">
                          <span className="text-purple-600 font-bold">
                            ₹{liveHighest.toLocaleString()}/{selected.unit} × {selected.quantity} {selected.unit} =&nbsp;
                          </span>
                          <span className="font-extrabold text-purple-800">
                            ₹{(liveHighest * (selected.quantity || 1)).toLocaleString()} total
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-xs text-purple-500">
                          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {liveBids.length} bids</span>
                          {selected.auctionEndTime && <Countdown endTime={selected.auctionEndTime} compact />}
                          <span className="flex items-center gap-1 ml-auto">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Live
                          </span>
                        </div>
                      </div>

                      {isOutbid && (
                        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-2xl p-3 text-sm">
                          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                          <p className="font-bold text-red-600">You've been outbid! Place a higher bid to stay in the lead.</p>
                        </div>
                      )}

                      {selected.auctionEndTime && selected.status === "available" && (
                        <div className="text-center">
                          <p className="text-xs font-bold text-gray-500 mb-2">Auction Ends In</p>
                          <Countdown endTime={selected.auctionEndTime} />
                        </div>
                      )}

                      {selected.status === "available" ? (
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">
                              Your Bid (₹ per {selected.unit})
                            </label>
                            <div className="flex gap-2">
                              <div className="relative flex-1">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                                <input type="number" value={bidAmount} onChange={e => setBidAmount(e.target.value)}
                                  placeholder={`Min ₹${(liveHighest + 1).toLocaleString()}`}
                                  className="w-full border border-gray-200 bg-gray-50 rounded-xl pl-8 pr-4 py-3.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white transition" />
                              </div>
                              <button onClick={handleBid} disabled={actionLoading || !bidAmount}
                                className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-5 py-3.5 rounded-xl transition shadow-md disabled:opacity-60 flex items-center gap-1.5">
                                {actionLoading ? <Loader className="w-4 h-4 animate-spin" /> : <><Gavel className="w-4 h-4" /> Bid</>}
                              </button>
                            </div>
                            {bidAmount && Number(bidAmount) > 0 && (
                              <div className="mt-2 bg-purple-50 border border-purple-100 rounded-xl px-3 py-2 text-xs text-purple-700">
                                <span className="font-bold">₹{Number(bidAmount).toLocaleString()}/{selected.unit} × {selected.quantity} {selected.unit} =&nbsp;</span>
                                <span className="font-extrabold">₹{(Number(bidAmount) * (selected.quantity || 1)).toLocaleString()} total if accepted</span>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {[1, 2, 5, 10].map(inc => (
                              <button key={inc} type="button"
                                onClick={() => setBidAmount(String(liveHighest + inc))}
                                className="flex-1 text-xs font-bold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-100 py-2 rounded-xl transition">
                                +₹{inc}
                              </button>
                            ))}
                          </div>
                          <p className="text-[10px] text-gray-400 text-center">
                            Bids are binding. By placing a bid you agree to complete the purchase if accepted.
                          </p>
                        </div>
                      ) : (
                        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 text-center">
                          <p className="font-bold text-gray-600">This auction has ended</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* BUY NOW TAB */}
                  {(bidTab === "buy" || (bidTab === "bid" && !selected.isAuction)) && !selected.isAuction && (
                    <div className="space-y-4">
                      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
                        <p className="text-xs font-bold text-emerald-600 mb-1">Price per {selected.unit}</p>
                        <p className="font-display font-extrabold text-4xl text-emerald-700">₹{selected.price?.toLocaleString()}</p>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Quantity ({selected.unit})</label>
                        <input type="number" min="1" max={selected.quantity} value={buyQuantity} disabled
                          className="w-full border border-gray-200 bg-gray-100 rounded-xl px-4 py-3 text-sm font-bold text-gray-500 cursor-not-allowed" />
                        <p className="text-[10px] text-gray-400 mt-1">Note: You must buy the entire available quantity listed by the farmer.</p>
                      </div>
                      <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between">
                        <span className="font-bold text-gray-600">Total</span>
                        <span className="font-extrabold text-xl text-emerald-700">₹{(selected.price * buyQuantity).toLocaleString()}</span>
                      </div>
                      <button onClick={handleBuyNow} disabled={actionLoading}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl transition shadow-lg flex items-center justify-center gap-2 text-base disabled:opacity-60">
                        {actionLoading ? <Loader className="w-5 h-5 animate-spin" /> : <><ShieldCheck className="w-5 h-5" /> Buy Securely</>}
                      </button>
                      {selected.farmer?._id && (
                        <button
                          onClick={() => startChatWithSeller(selected.farmer._id, { productRef: selected._id, productTitle: selected.title })}
                          className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold py-3 rounded-2xl transition flex items-center justify-center gap-2 text-sm">
                          <MessageCircle className="w-4 h-4" /> Chat with Farmer
                        </button>
                      )}
                      <p className="text-center text-[10px] text-gray-400 flex items-center justify-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Razorpay secured payment
                      </p>
                    </div>
                  )}

                  {/* BID HISTORY TAB */}
                  {bidTab === "history" && (
                    <div className="space-y-2">
                      {liveBids.length === 0 ? (
                        <div className="py-10 text-center text-gray-300">
                          <Gavel className="w-8 h-8 mx-auto mb-2 opacity-30" />
                          <p className="text-sm font-bold text-gray-400">No bids yet — be the first!</p>
                        </div>
                      ) : (
                        [...liveBids]
                          .sort((a, b) => b.amount - a.amount)
                          .map((bid, i) => (
                            <BidHistoryRow key={bid._id || i} bid={bid} rank={i + 1}
                              isTop={i === 0}
                              isYours={bid.buyerId === user._id || bid.buyer?._id === user._id} />
                          ))
                      )}
                    </div>
                  )}

                  {/* INFO TAB */}
                  {bidTab === "info" && (
                    <div className="space-y-3">
                      {[
                        { label: "Category",           val: selected.category },
                        { label: "Quantity Available", val: `${selected.quantity} ${selected.unit}` },
                        { label: "Location",           val: selected.location || "Not specified" },
                        { label: "Seller",             val: selected.farmer?.name || "Verified Farmer" },
                      ].map(({ label, val }) => (
                        <div key={label} className="flex justify-between items-center py-2.5 border-b border-gray-50">
                          <span className="text-sm font-bold text-gray-500">{label}</span>
                          <span className="text-sm font-bold text-gray-800">{val}</span>
                        </div>
                      ))}
                      {selected.description && (
                        <div className="bg-gray-50 rounded-2xl p-4 mt-2">
                          <p className="text-xs font-bold text-gray-500 mb-1">Description</p>
                          <p className="text-sm text-gray-700 leading-relaxed">{selected.description}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── EQUIPMENT DETAIL MODAL ── */}
        {selectedEquip && (
          <EquipmentModal
            item={selectedEquip}
            onClose={() => setSelectedEquip(null)}
            onStartChat={startChatWithSeller}
            onBuy={(rentOption) => handleEquipmentCheckout(selectedEquip, rentOption)}
          />
        )}

      </div>
    </BuyerLayout>
  );
}
