/**
 * BuyerMarketPrices — Live Mandi Price Intelligence
 * Shows real-time Indian mandi prices with multi-market comparison,
 * trend indicators, AI buy recommendations, and farmer price benchmarks.
 */
import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import BuyerLayout from "./BuyerLayout";
import { useBuyerLang } from "./BuyerLayout";
import {
  TrendingUp, TrendingDown, Minus, Search, RefreshCw,
  MapPin, ChevronDown, ArrowRight, Zap, Star, ShieldCheck,
  Info, BarChart2, Package, AlertCircle, CheckCircle2
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from "recharts";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

const CROP_EMOJIS = {
  tomato:"🍅", onion:"🧅", potato:"🥔", wheat:"🌾", rice:"🍚", corn:"🌽",
  cotton:"☁️", sugarcane:"🍬", soybean:"🫘", groundnut:"🥜",
  chilli:"🌶️", garlic:"🧄", ginger:"🫚", banana:"🍌", mango:"🥭",
  cauliflower:"🥦", cabbage:"🥬", brinjal:"🍆", cucumber:"🥒", peas:"🫛",
};

const CATEGORY_COLORS = {
  vegetables:"bg-emerald-100 text-emerald-700",
  grains:    "bg-amber-100 text-amber-700",
  fruits:    "bg-pink-100 text-pink-700",
  oilseeds:  "bg-yellow-100 text-yellow-700",
  "cash crops":"bg-purple-100 text-purple-700",
  spices:    "bg-red-100 text-red-700",
  pulses:    "bg-orange-100 text-orange-700",
  other:     "bg-gray-100 text-gray-600",
};

const CATEGORIES = ["All","vegetables","grains","fruits","oilseeds","cash crops","spices","pulses"];

// ── Trend Indicator ───────────────────────────────────────────
function TrendBadge({ trend }) {
  if (trend === "up")     return <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full"><TrendingUp className="w-3 h-3" /> Rising</span>;
  if (trend === "down")   return <span className="flex items-center gap-1 text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full"><TrendingDown className="w-3 h-3" /> Falling</span>;
  return <span className="flex items-center gap-1 text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full"><Minus className="w-3 h-3" /> Stable</span>;
}

// ── Price Card ────────────────────────────────────────────────
function PriceCard({ item, onSelect, isSelected }) {
  const emoji   = CROP_EMOJIS[item.name?.toLowerCase()] || "🌾";
  const catCls  = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.other;
  const savings = item.avgPrice ? Math.round((item.avgPrice - item.bestPrice) / item.avgPrice * 100) : 0;

  return (
    <div onClick={() => onSelect(item)}
      className={`bg-white rounded-[1.5rem] border cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 overflow-hidden ${isSelected ? "border-emerald-400 ring-2 ring-emerald-100" : "border-gray-100"}`}>

      {/* Header */}
      <div className="p-5 pb-3">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gray-50 rounded-2xl flex items-center justify-center text-2xl">{emoji}</div>
            <div>
              <h3 className="font-bold text-gray-800 capitalize">{item.name}</h3>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${catCls}`}>{item.category}</span>
            </div>
          </div>
          <TrendBadge trend={item.trend} />
        </div>

        {/* Best price */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-3 mb-3">
          <p className="text-[10px] font-bold text-emerald-600 uppercase mb-0.5">Best Mandi Price</p>
          <div className="flex items-end gap-1.5">
            <p className="font-display font-extrabold text-3xl text-emerald-700">₹{item.bestPrice?.toLocaleString()}</p>
            <p className="text-xs text-emerald-500 mb-1">/ {item.unit || "quintal"}</p>
          </div>
          <p className="text-[10px] text-emerald-500 flex items-center gap-1">
            <MapPin className="w-2.5 h-2.5" /> {item.bestMarket}
            {savings > 0 && <span className="ml-2 bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold">{savings}% below avg</span>}
          </p>
        </div>

        {/* Avg + suggested */}
        <div className="flex gap-2">
          <div className="flex-1 bg-gray-50 rounded-xl p-2.5 text-center">
            <p className="text-[10px] text-gray-400 font-bold mb-0.5">Avg Price</p>
            <p className="font-bold text-gray-700 text-sm">₹{item.avgPrice?.toLocaleString()}</p>
          </div>
          <div className="flex-1 bg-blue-50 rounded-xl p-2.5 text-center">
            <p className="text-[10px] text-blue-400 font-bold mb-0.5">Suggested Buy</p>
            <p className="font-bold text-blue-700 text-sm">≤₹{Math.round(item.avgPrice * 0.95)?.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Market count */}
      <div className="px-5 py-3 border-t border-gray-50 flex items-center justify-between">
        <p className="text-xs text-gray-400">{item.markets?.length || 0} markets tracked</p>
        <p className="text-xs font-bold text-emerald-600 flex items-center gap-1">
          View details <ArrowRight className="w-3 h-3" />
        </p>
      </div>
    </div>
  );
}

// ── Market Detail Panel ───────────────────────────────────────
function MarketDetailPanel({ item, onClose }) {
  if (!item) return null;
  const emoji   = CROP_EMOJIS[item.name?.toLowerCase()] || "🌾";
  const markets = item.markets || [];

  const chartData = markets.map(m => ({
    name:  m.name.length > 12 ? m.name.slice(0, 12) + "…" : m.name,
    price: m.modal,
    min:   m.min,
    max:   m.max,
  }));

  const bestIdx  = markets.reduce((bi, m, i) => m.modal < markets[bi].modal ? i : bi, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-gray-900/60 backdrop-blur-sm"
      onClick={onClose}>
      <div className="bg-white rounded-t-[2rem] sm:rounded-[2rem] w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{emoji}</span>
              <div>
                <h2 className="font-display font-bold text-xl text-gray-800 capitalize">{item.name}</h2>
                <TrendBadge trend={item.trend} />
              </div>
            </div>
            <button onClick={onClose}
              className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition">
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Price summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center">
              <p className="text-[10px] font-bold text-emerald-500 mb-1 uppercase">Best Price</p>
              <p className="font-display font-extrabold text-2xl text-emerald-700">₹{item.bestPrice?.toLocaleString()}</p>
              <p className="text-[10px] text-emerald-400">{item.bestMarket}</p>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-center">
              <p className="text-[10px] font-bold text-blue-500 mb-1 uppercase">Avg Price</p>
              <p className="font-display font-extrabold text-2xl text-blue-700">₹{item.avgPrice?.toLocaleString()}</p>
              <p className="text-[10px] text-blue-400">across markets</p>
            </div>
            <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 text-center">
              <p className="text-[10px] font-bold text-purple-500 mb-1 uppercase">Farmer Price</p>
              <p className="font-display font-extrabold text-2xl text-purple-700">₹{item.suggestedSellPrice?.toLocaleString()}</p>
              <p className="text-[10px] text-purple-400">typical ask</p>
            </div>
          </div>

          {/* Bar chart */}
          {chartData.length > 0 && (
            <div>
              <h3 className="font-bold text-gray-700 text-sm mb-3">Market Comparison</h3>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill:"#6b7280", fontSize:10 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill:"#9ca3af", fontSize:10 }} />
                    <Tooltip contentStyle={{ borderRadius:"12px", border:"none", boxShadow:"0 10px 30px rgba(0,0,0,0.08)", fontSize:11 }} />
                    <Bar dataKey="price" radius={[6,6,0,0]} barSize={32} label={{ position:"top", fontSize:9, fill:"#6b7280" }}>
                      {chartData.map((_,i) => (
                        <Cell key={i} fill={i === bestIdx ? "#16a34a" : "#93c5fd"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[10px] text-center text-gray-400 mt-1">🟢 Best price market highlighted</p>
            </div>
          )}

          {/* Market table */}
          <div>
            <h3 className="font-bold text-gray-700 text-sm mb-3">All Market Prices</h3>
            <div className="space-y-2">
              {markets.map((m, i) => (
                <div key={i}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border ${i === bestIdx ? "bg-emerald-50 border-emerald-100" : "bg-gray-50 border-gray-100"}`}>
                  {i === bestIdx && (
                    <Star className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="font-bold text-gray-800 text-sm">{m.name}</p>
                    <p className="text-xs text-gray-400">{m.state}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-extrabold ${i === bestIdx ? "text-emerald-700" : "text-gray-700"}`}>₹{m.modal?.toLocaleString()}</p>
                    <p className="text-[10px] text-gray-400">₹{m.min}–{m.max}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Buy Tip */}
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-4">
            <div className="flex items-start gap-2.5">
              <Zap className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-700 mb-1">AI Buying Tip</p>
                <p className="text-xs text-amber-600 leading-relaxed">
                  {item.trend === "down"
                    ? `${item.name} prices are falling. Consider buying now or waiting for further dip. Best market: ${item.bestMarket}.`
                    : item.trend === "up"
                      ? `${item.name} prices are rising. Buy soon at ${item.bestMarket} (₹${item.bestPrice?.toLocaleString()}) to lock in the best rate.`
                      : `${item.name} prices are stable. ${item.bestMarket} offers the best rate at ₹${item.bestPrice?.toLocaleString()}. Good time to buy.`}
                </p>
              </div>
            </div>
          </div>

          <Link to="/buyer/browse"
            className="flex items-center justify-center gap-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-2xl transition">
            <ShieldCheck className="w-4 h-4" /> Find Farmers Selling {item.name}
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────
function MarketContent() {
  const lang = useBuyerLang();

  const [prices,   setPrices]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [category, setCategory] = useState("All");
  const [sortBy,   setSortBy]   = useState("name");
  const [selected, setSelected] = useState(null);

  const fetchPrices = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const { data } = await axios.get(`${API}/api/mandi/prices`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPrices(data.data || []);
    } catch {
      // fallback static data
      setPrices([]);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchPrices(); }, []);

  const filtered = useMemo(() => {
    let list = prices;
    if (search)          list = list.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()));
    if (category !== "All") list = list.filter(p => p.category === category);
    if (sortBy === "price_asc")  list = [...list].sort((a,b) => a.bestPrice - b.bestPrice);
    if (sortBy === "price_desc") list = [...list].sort((a,b) => b.bestPrice - a.bestPrice);
    if (sortBy === "name")       list = [...list].sort((a,b) => a.name?.localeCompare(b.name));
    return list;
  }, [prices, search, category, sortBy]);

  const rising  = prices.filter(p => p.trend === "up").length;
  const falling = prices.filter(p => p.trend === "down").length;
  const stable  = prices.filter(p => p.trend === "stable").length;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">

      {/* Hero */}
      <div className="bg-gradient-to-br from-amber-800 via-yellow-900 to-amber-950 rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 text-[160px] leading-none pointer-events-none select-none">📊</div>
        <div className="relative z-10">
          <h2 className="font-display text-3xl font-extrabold mb-1">Live Mandi Prices</h2>
          <p className="text-yellow-200 text-sm mb-5">
            {lang === "hi"
              ? "बेहतर खरीदारी के लिए भारत की सभी मंडियों के ताज़े बाज़ार भाव"
              : "Real-time commodity prices across Indian mandis to help you buy smarter"}
          </p>

          {/* Trend pills */}
          <div className="flex gap-3 flex-wrap mb-6">
            <div className="flex items-center gap-1.5 text-xs font-bold bg-emerald-500/30 border border-emerald-400/30 px-3 py-1.5 rounded-full">
              <TrendingUp className="w-3.5 h-3.5" /> {rising} Rising
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold bg-red-500/30 border border-red-400/30 px-3 py-1.5 rounded-full">
              <TrendingDown className="w-3.5 h-3.5" /> {falling} Falling
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold bg-white/20 border border-white/20 px-3 py-1.5 rounded-full">
              <Minus className="w-3.5 h-3.5" /> {stable} Stable
            </div>
          </div>

          {/* Search */}
          <div className="flex gap-3 bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20 max-w-xl">
            <div className="flex-1 flex items-center bg-white rounded-xl px-4 overflow-hidden">
              <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder={lang === "hi" ? "फसल का नाम खोजें…" : "Search crop name…"}
                className="w-full py-3 px-3 outline-none text-gray-800 text-sm" />
            </div>
            <button onClick={fetchPrices}
              className="bg-amber-500 hover:bg-amber-600 px-5 rounded-xl font-bold transition flex items-center gap-2 text-sm">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { emoji:"📊", val: prices.length, label:"Commodities",   color:"text-blue-600",   bg:"bg-blue-50"   },
          { emoji:"🏪", val: 4,             label:"Markets/Crop",  color:"text-emerald-600", bg:"bg-emerald-50" },
          { emoji:"⏱️", val: "Live",        label:"Price Updates", color:"text-purple-600", bg:"bg-purple-50" },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-[1.5rem] border border-gray-100 p-5 shadow-sm text-center">
            <div className={`w-10 h-10 ${s.bg} rounded-2xl flex items-center justify-center text-xl mx-auto mb-2`}>{s.emoji}</div>
            <p className={`font-display font-extrabold text-2xl ${s.color}`}>{s.val}</p>
            <p className="text-xs text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide flex-1">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition ${category === cat ? "bg-amber-700 text-white border-amber-700" : "bg-white text-gray-600 border-gray-200 hover:border-amber-300"}`}>
              {cat === "All" ? "🌍 All" : cat}
            </button>
          ))}
        </div>
        <div className="relative flex-shrink-0">
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="appearance-none border border-gray-200 bg-white rounded-xl px-4 py-2 text-xs font-bold text-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-400 pr-8 transition">
            <option value="name">A → Z</option>
            <option value="price_asc">Price ↑</option>
            <option value="price_desc">Price ↓</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Info strip */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 flex items-center gap-2 text-xs text-blue-700">
        <Info className="w-4 h-4 flex-shrink-0" />
        Prices shown in ₹/quintal (100 kg). Live variation applied on each refresh. Click any card for multi-market comparison.
      </div>

      {/* Grid */}
      {loading ? (
        <div className="bg-white rounded-[2rem] p-16 border border-gray-100 flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-amber-100 border-t-amber-600 rounded-full animate-spin" />
          <p className="text-amber-700 font-bold animate-pulse">Fetching live mandi prices…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-[2rem] p-16 border border-gray-100 flex flex-col items-center gap-3 text-center">
          <BarChart2 className="w-16 h-16 text-gray-200" />
          <p className="font-bold text-gray-400 text-lg">No prices found</p>
          <button onClick={() => { setSearch(""); setCategory("All"); }}
            className="text-xs font-bold bg-amber-50 text-amber-700 px-4 py-2 rounded-xl hover:bg-amber-100 transition">
            Clear Filters
          </button>
        </div>
      ) : (
        <>
          <p className="text-sm font-bold text-gray-400">
            <span className="text-amber-700">{filtered.length}</span> commodities
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((item, i) => (
              <PriceCard key={i} item={item}
                onSelect={setSelected}
                isSelected={selected?.name === item.name} />
            ))}
          </div>
        </>
      )}

      {/* Detail modal */}
      {selected && <MarketDetailPanel item={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

export default function BuyerMarketPrices() {
  return <BuyerLayout><MarketContent /></BuyerLayout>;
}
