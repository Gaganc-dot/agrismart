/**
 * BuyerDashboard — Premium buyer control center
 * Live mandi prices · Active auctions · Order tracker · Market comparison
 */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import BuyerLayout from "./BuyerLayout";
import { useBuyerLang, bt } from "./BuyerLayout";
import { DashboardSkeleton } from "../../components/SkeletonLoader";
import {
  ShoppingBag, ArrowRight, Package, TrendingUp, IndianRupee,
  Clock, CheckCircle2, XCircle, Loader, Search, ChevronRight,
  BarChart2, Gavel, Activity, Flame, Heart, Tractor, Users,
  RefreshCw, MapPin, AlertCircle, Star, Zap, TrendingDown,
  ShieldCheck, Bell, ArrowUpRight, Eye
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line, Area, AreaChart } from "recharts";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";
function getToken() { return localStorage.getItem("token") || sessionStorage.getItem("token"); }

// ── Mini Stat Card ────────────────────────────────────────────
function StatCard({ title, value, icon, color, bg, sub, trend }) {
  return (
    <div className="bg-white rounded-[1.5rem] border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{title}</p>
        <div className={`w-9 h-9 ${bg} rounded-2xl flex items-center justify-center ${color}`}>{icon}</div>
      </div>
      <h4 className={`text-2xl font-display font-extrabold ${color}`}>{value}</h4>
      <div className="flex items-center gap-1 mt-1">
        {trend === "up" && <TrendingUp className="w-3 h-3 text-emerald-500" />}
        {trend === "down" && <TrendingDown className="w-3 h-3 text-red-400" />}
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
      </div>
    </div>
  );
}

// ── Live Auction Card ─────────────────────────────────────────
function AuctionCard({ product }) {
  const bids       = product.bids || [];
  const highest    = bids.length ? Math.max(...bids.map(b => b.amount)) : product.price;
  const [left, setLeft] = useState(0);

  useEffect(() => {
    if (!product.auctionEndTime) return;
    const tick = () => setLeft(Math.max(0, new Date(product.auctionEndTime) - Date.now()));
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [product.auctionEndTime]);

  const h = Math.floor(left / 3600000);
  const m = Math.floor((left % 3600000) / 60000);
  const s = Math.floor((left % 60000) / 1000);
  const urgent = left < 3600000 && left > 0;
  const ended  = left === 0;

  return (
    <Link to="/buyer/browse"
      className="bg-white rounded-[1.5rem] border border-gray-100 p-4 hover:shadow-lg hover:-translate-y-1 transition-all group block">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center flex-shrink-0 text-xl">
          {product.images?.[0]
            ? <img src={product.images[0]} alt="" className="w-full h-full object-cover rounded-2xl" />
            : "🌾"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-800 text-sm truncate">{product.title}</p>
          <p className="text-xs text-gray-400">{product.farmer?.name || "Farmer"} · {product.location || "India"}</p>
          <div className="flex items-center gap-2 mt-2">
            <p className="font-extrabold text-purple-700 text-lg">₹{highest.toLocaleString()}</p>
            <span className="text-xs text-gray-400">/{product.unit}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Users className="w-3 h-3" /> {bids.length} bids
        </div>
        {!ended ? (
          <span className={`text-xs font-bold tabular-nums flex items-center gap-1 ${urgent ? "text-red-500" : "text-purple-600"}`}>
            {urgent && <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
            {String(h).padStart(2,"0")}:{String(m).padStart(2,"0")}:{String(s).padStart(2,"0")}
          </span>
        ) : (
          <span className="text-xs font-bold text-red-500">ENDED</span>
        )}
      </div>
    </Link>
  );
}

// ── Mandi Price Row ───────────────────────────────────────────
function MandiRow({ item }) {
  const trend = item.trend;
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center text-base flex-shrink-0">
        {item.emoji || "🌾"}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-800 capitalize truncate">{item.name}</p>
        <p className="text-[10px] text-gray-400">{item.bestMarket} · {item.category}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="font-extrabold text-gray-800">₹{item.bestPrice?.toLocaleString()}</p>
        <div className={`flex items-center gap-0.5 text-[10px] font-bold justify-end ${trend === "up" ? "text-emerald-500" : trend === "down" ? "text-red-400" : "text-gray-400"}`}>
          {trend === "up" ? <TrendingUp className="w-2.5 h-2.5" /> : trend === "down" ? <TrendingDown className="w-2.5 h-2.5" /> : <span>—</span>}
          {trend === "up" ? "Rising" : trend === "down" ? "Falling" : "Stable"}
        </div>
      </div>
    </div>
  );
}

const CROP_EMOJIS = {
  tomato:"🍅", onion:"🧅", potato:"🥔", wheat:"🌾", rice:"🍚", corn:"🌽",
  cotton:"☁️", sugarcane:"🍬", soybean:"🫘", groundnut:"🥜",
  chilli:"🌶️", garlic:"🧄", ginger:"🫚", banana:"🍌", mango:"🥭",
  cauliflower:"🥦", cabbage:"🥬", brinjal:"🍆", cucumber:"🥒", peas:"🫛",
};

function DashboardContent() {
  const lang = useBuyerLang();
  const t    = bt[lang] || bt.en;
  const getUser = () => {
    try {
      const uStr = localStorage.getItem("user") || sessionStorage.getItem("user");
      return uStr && uStr !== "undefined" && uStr !== "null" ? JSON.parse(uStr) : {};
    } catch {
      return {};
    }
  };
  const user    = getUser();

  const [orders,    setOrders]    = useState([]);
  const [auctions,  setAuctions]  = useState([]);
  const [mandi,     setMandi]     = useState([]);
  const [wishlist,  setWishlist]  = useState(() => {
    try { return JSON.parse(localStorage.getItem("buyer_wishlist") || "[]"); } catch { return []; }
  });
  const [loading,   setLoading]   = useState(true);
  const [mandiLoad, setMandiLoad] = useState(false);

  useEffect(() => { fetchData(); fetchMandi(); }, []);

  const fetchData = async () => {
    try {
      const headers = { Authorization: `Bearer ${getToken()}` };
      const [prodRes, ordRes] = await Promise.all([
        axios.get(`${API}/api/products`, { headers }),
        axios.get(`${API}/api/orders/buyer`, { headers }),
      ]);
      const products = prodRes.data.products || [];
      setAuctions(products.filter(p => p.isAuction && p.status === "available").slice(0, 4));
      setOrders(ordRes.data.orders || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  const fetchMandi = async () => {
    setMandiLoad(true);
    try {
      const { data } = await axios.get(`${API}/api/mandi/prices`);
      const items = (data.data || []).map(p => ({
        ...p,
        name: p.name || p.commodity,
        emoji: CROP_EMOJIS[(p.name || p.commodity)?.toLowerCase()] || "🌾",
      }));
      setMandi(items.slice(0, 8));
    } catch { /* silent */ }
    finally { setMandiLoad(false); }
  };

  // Stats
  const totalOrders     = orders.length;
  const pendingOrders   = orders.filter(o => o.status === "pending").length;
  const confirmedOrders = orders.filter(o => ["confirmed","shipped","delivered"].includes(o.status)).length;
  const totalSpent      = orders.filter(o => o.status !== "cancelled").reduce((s,o) => s + o.totalPrice, 0);

  // Status chart data (last 5 orders by status)
  const statusCount = {};
  orders.forEach(o => { statusCount[o.status] = (statusCount[o.status] || 0) + 1; });
  const statusChart = Object.entries(statusCount).map(([name, val]) => ({ name, val }));

  // Recent orders
  const recentOrders = orders.slice(0, 5);

  const statusStyle = {
    pending:   "bg-yellow-100 text-yellow-700",
    confirmed: "bg-blue-100 text-blue-700",
    shipped:   "bg-purple-100 text-purple-700",
    delivered: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-red-100 text-red-700",
  };

  if (loading) return <DashboardSkeleton role="buyer" />;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">

      {/* ── Welcome Banner ── */}
      <div className="bg-gradient-to-br from-amber-800 via-yellow-900 to-amber-950 rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 text-[160px] leading-none pointer-events-none select-none">🛒</div>
        <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-yellow-500/10" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p className="text-yellow-300 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
              {new Date().toLocaleDateString("en-IN", { weekday:"long", month:"long", day:"numeric" })}
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-extrabold mb-2">
              {t.hello}, {user.name?.split(" ")[0] || t.buyer}! 🛒
            </h2>
            <p className="text-yellow-200 text-sm mb-6 max-w-sm leading-relaxed">
              {lang === "hi"
                ? "किसानों से सीधे ताजी उपज खरीदें — उचित कीमत, बेहतरीन गुणवत्ता।"
                : "Source fresh produce directly from verified farmers. Fair prices, guaranteed quality."}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/buyer/browse"
                className="inline-flex items-center gap-2 bg-white text-amber-800 font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-yellow-50 transition shadow-lg">
                <ShoppingBag className="w-4 h-4" /> {lang === "hi" ? "उत्पाद देखें" : "Browse Marketplace"} <ArrowRight className="w-4 h-4" />
              </Link>
              {auctions.length > 0 && (
                <Link to="/buyer/browse"
                  className="inline-flex items-center gap-2 bg-purple-600/80 text-white font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-purple-600 transition">
                  <Gavel className="w-4 h-4" /> {auctions.length} Live Auctions
                </Link>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Orders"  value={totalOrders}     icon={<Package className="w-5 h-5" />}      color="text-blue-600"   bg="bg-blue-50"    sub="All time" />
        <StatCard title="Pending"       value={pendingOrders}   icon={<Clock className="w-5 h-5" />}        color="text-amber-600"  bg="bg-amber-50"   sub="Awaiting confirmation" />
        <StatCard title="Confirmed"     value={confirmedOrders} icon={<CheckCircle2 className="w-5 h-5" />} color="text-emerald-600" bg="bg-emerald-50" sub="In progress" trend="up" />
        <StatCard title="Wishlist"      value={wishlist.length} icon={<Heart className="w-5 h-5" />}        color="text-red-500"    bg="bg-red-50"     sub="Saved items" />
      </div>

      {/* ── Quick Actions ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { emoji:"🌾", label:"Browse Crops",   path:"/buyer/browse",                    bg:"from-emerald-500 to-teal-600" },
          { emoji:"🚜", label:"Farm Equipment",  path:"/buyer/browse?tab=equipment",       bg:"from-orange-500 to-amber-600" },
          { emoji:"🏷️", label:"Live Auctions",   path:"/buyer/browse",                    bg:"from-purple-500 to-violet-600" },
          { emoji:"📊", label:"Market Prices",   path:"/buyer/market-prices",              bg:"from-blue-500 to-indigo-600" },
          { emoji:"📦", label:"My Orders",       path:"/buyer/orders",                    bg:"from-gray-500 to-slate-600" },
        ].map(card => (
          <Link key={card.label} to={card.path}
            className={`bg-gradient-to-br ${card.bg} rounded-[1.25rem] p-4 text-white text-center hover:opacity-90 hover:scale-[1.02] transition-all shadow-md group`}>
            <div className="text-2xl mb-2">{card.emoji}</div>
            <p className="text-xs font-bold leading-tight">{card.label}</p>
          </Link>
        ))}
      </div>

      {/* ── Main Grid ── */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Live Mandi Prices */}
        <div className="bg-white rounded-[1.5rem] border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-50 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-800">Live Mandi Prices</h3>
              <p className="text-xs text-gray-400">Best market rates across India</p>
            </div>
            <button onClick={fetchMandi} className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition">
              <RefreshCw className={`w-4 h-4 ${mandiLoad ? "animate-spin" : ""}`} />
            </button>
          </div>
          <div className="p-4">
            {mandiLoad ? (
              <div className="py-8 text-center text-gray-300">
                <div className="w-8 h-8 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs">Fetching prices…</p>
              </div>
            ) : mandi.length > 0 ? (
              <>
                {mandi.map((item, i) => <MandiRow key={i} item={item} />)}
                <Link to="/buyer/market-prices"
                  className="mt-4 block text-center text-xs font-bold text-emerald-600 hover:text-emerald-700 py-2 hover:bg-emerald-50 rounded-xl transition">
                  View All Market Prices →
                </Link>
              </>
            ) : (
              <div className="py-8 text-center text-gray-300">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">Unable to fetch prices</p>
              </div>
            )}
          </div>
        </div>

        {/* Live Auctions */}
        <div className="bg-white rounded-[1.5rem] border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-50 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                Live Auctions
              </h3>
              <p className="text-xs text-gray-400">Bid before time runs out</p>
            </div>
            <Link to="/buyer/browse" className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1">
              All <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-4 space-y-3">
            {auctions.length === 0 ? (
              <div className="py-8 text-center text-gray-300">
                <Gavel className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p className="text-sm font-bold text-gray-400">No active auctions</p>
                <Link to="/buyer/browse" className="text-xs text-purple-600 hover:underline mt-1 inline-block">Browse products →</Link>
              </div>
            ) : (
              auctions.map(p => <AuctionCard key={p._id} product={p} />)
            )}
          </div>
        </div>

        {/* Order Summary + Recent Orders */}
        <div className="space-y-4">
          {/* Order Status Chart */}
          {statusChart.length > 0 && (
            <div className="bg-white rounded-[1.5rem] border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-gray-800 mb-4 text-sm">Order Status</h3>
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusChart} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill:"#9ca3af", fontSize:9 }} />
                    <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill:"#6b7280", fontSize:9 }} width={60} />
                    <Tooltip contentStyle={{ borderRadius:"10px", border:"none", boxShadow:"0 4px 20px rgba(0,0,0,0.08)", fontSize:11 }} />
                    <Bar dataKey="val" radius={[0,6,6,0]} barSize={16}>
                      {statusChart.map((_,i) => (
                        <Cell key={i} fill={["#f59e0b","#3b82f6","#8b5cf6","#16a34a","#ef4444"][i % 5]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Recent Orders */}
          <div className="bg-white rounded-[1.5rem] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-50 flex items-center justify-between">
              <h3 className="font-bold text-gray-800 text-sm">Recent Orders</h3>
              <Link to="/buyer/orders" className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1">
                All <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            {recentOrders.length === 0 ? (
              <div className="p-8 text-center text-gray-300">
                <Package className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p className="text-sm font-bold text-gray-400">No orders yet</p>
                <Link to="/buyer/browse" className="text-xs text-amber-700 hover:underline mt-1 inline-block">Shop now →</Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {recentOrders.map(o => (
                  <div key={o._id} className="flex items-center gap-3 p-3.5">
                    <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center text-sm flex-shrink-0">🌾</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-800 truncate">{o.product?.title || "–"}</p>
                      <p className="text-xs text-gray-400">{o.quantity} {o.product?.unit} · ₹{o.totalPrice?.toLocaleString()}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${statusStyle[o.status] || "bg-gray-100 text-gray-500"}`}>
                      {o.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Featured Quick Links ── */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-700 rounded-[1.5rem] p-6 text-white relative overflow-hidden group hover:shadow-xl transition-all">
          <div className="absolute -right-4 -bottom-4 text-6xl opacity-20">🌾</div>
          <p className="font-bold text-emerald-100 text-xs mb-1 uppercase tracking-wider">Fresh Produce</p>
          <h3 className="font-display font-extrabold text-xl mb-3">Buy Directly<br />from Farmers</h3>
          <Link to="/buyer/browse" className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-4 py-2 rounded-xl transition">
            Shop Now <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-amber-700 rounded-[1.5rem] p-6 text-white relative overflow-hidden group hover:shadow-xl transition-all">
          <div className="absolute -right-4 -bottom-4 text-6xl opacity-20">🚜</div>
          <p className="font-bold text-orange-100 text-xs mb-1 uppercase tracking-wider">Equipment</p>
          <h3 className="font-display font-extrabold text-xl mb-3">Buy or Rent<br />Farm Machinery</h3>
          <Link to="/buyer/browse?tab=equipment" className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-4 py-2 rounded-xl transition">
            Browse <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-gradient-to-br from-purple-600 to-violet-800 rounded-[1.5rem] p-6 text-white relative overflow-hidden group hover:shadow-xl transition-all">
          <div className="absolute -right-4 -bottom-4 text-6xl opacity-20">🏷️</div>
          <p className="font-bold text-purple-200 text-xs mb-1 uppercase tracking-wider">Live Bidding</p>
          <h3 className="font-display font-extrabold text-xl mb-3">Win Auctions at<br />Best Prices</h3>
          <Link to="/buyer/browse" className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-4 py-2 rounded-xl transition">
            Bid Now <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

    </div>
  );
}

export default function BuyerDashboard() {
  return <BuyerLayout><DashboardContent /></BuyerLayout>;
}
