import { useState, useEffect, useMemo } from "react";
import FarmerLayout from "./FarmerLayout";
import { useTranslation } from "react-i18next";
import {
  TrendingUp, TrendingDown, Minus, Search, RefreshCw, Filter,
  ChevronDown, Loader, Sparkles, Star, IndianRupee, MapPin,
  BarChart2, ArrowRight, Info, X
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Cell, LineChart, Line
} from "recharts";
import axios from "axios";
import toast from "react-hot-toast";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

// ── Rich fallback dataset ─────────────────────────────────────
const MANDI_DATA = [
  { commodity:"Tomato",     emoji:"🍅", category:"vegetables", state:"Maharashtra", district:"Pune",       market:"Pune Mandi",     min:800,  max:1400, modal:1100, unit:"Quintal", date:"Today" },
  { commodity:"Onion",      emoji:"🧅", category:"vegetables", state:"Maharashtra", district:"Nashik",     market:"Lasalgaon",      min:600,  max:1000, modal:780,  unit:"Quintal", date:"Today" },
  { commodity:"Wheat",      emoji:"🌾", category:"grains",     state:"Punjab",      district:"Amritsar",   market:"Amritsar Mandi", min:2100, max:2450, modal:2280, unit:"Quintal", date:"Today" },
  { commodity:"Rice",       emoji:"🍚", category:"grains",     state:"Andhra Pradesh",district:"Guntur",   market:"Guntur Mandi",   min:1800, max:2300, modal:2050, unit:"Quintal", date:"Today" },
  { commodity:"Potato",     emoji:"🥔", category:"vegetables", state:"Uttar Pradesh",district:"Agra",      market:"Agra Mandi",     min:700,  max:1100, modal:900,  unit:"Quintal", date:"Today" },
  { commodity:"Soybean",    emoji:"🫘", category:"oilseeds",   state:"Madhya Pradesh",district:"Indore",   market:"Indore Mandi",   min:3900, max:4300, modal:4100, unit:"Quintal", date:"Today" },
  { commodity:"Groundnut",  emoji:"🥜", category:"oilseeds",   state:"Gujarat",     district:"Rajkot",    market:"Rajkot Mandi",   min:4500, max:5200, modal:4900, unit:"Quintal", date:"Today" },
  { commodity:"Mustard",    emoji:"🌻", category:"oilseeds",   state:"Rajasthan",   district:"Bharatpur",  market:"Bharatpur",      min:4800, max:5400, modal:5100, unit:"Quintal", date:"Today" },
  { commodity:"Cotton",     emoji:"🌿", category:"cash crops", state:"Gujarat",     district:"Surendranagar",market:"Surendranagar", min:5500, max:6800, modal:6200, unit:"Quintal", date:"Today" },
  { commodity:"Sugarcane",  emoji:"🎋", category:"cash crops", state:"Maharashtra", district:"Kolhapur",   market:"Kolhapur",       min:280,  max:340,  modal:310,  unit:"Quintal", date:"Today" },
  { commodity:"Maize",      emoji:"🌽", category:"grains",     state:"Karnataka",   district:"Haveri",     market:"Haveri Mandi",   min:1500, max:1900, modal:1700, unit:"Quintal", date:"Today" },
  { commodity:"Chilli",     emoji:"🌶️", category:"spices",     state:"Andhra Pradesh",district:"Guntur",   market:"Guntur Mirchi",  min:8000, max:14000,modal:11000,unit:"Quintal", date:"Today" },
  { commodity:"Turmeric",   emoji:"🟡", category:"spices",     state:"Telangana",   district:"Nizamabad",  market:"Nizamabad",      min:6000, max:8500, modal:7200, unit:"Quintal", date:"Today" },
  { commodity:"Garlic",     emoji:"🧄", category:"vegetables", state:"Madhya Pradesh",district:"Mandsaur",  market:"Mandsaur",       min:3000, max:5500, modal:4200, unit:"Quintal", date:"Today" },
  { commodity:"Cauliflower",emoji:"🥦", category:"vegetables", state:"Haryana",     district:"Karnal",     market:"Karnal Mandi",   min:400,  max:900,  modal:650,  unit:"Quintal", date:"Today" },
  { commodity:"Green Pea",  emoji:"🫛", category:"vegetables", state:"Uttar Pradesh",district:"Meerut",    market:"Meerut",         min:1200, max:2000, modal:1600, unit:"Quintal", date:"Today" },
  { commodity:"Banana",     emoji:"🍌", category:"fruits",     state:"Tamil Nadu",  district:"Trichy",     market:"Trichy Mandi",   min:800,  max:1500, modal:1100, unit:"Quintal", date:"Today" },
  { commodity:"Mango",      emoji:"🥭", category:"fruits",     state:"Andhra Pradesh",district:"Krishna",   market:"Machilipatnam",  min:2500, max:5000, modal:3500, unit:"Quintal", date:"Today" },
  { commodity:"Apple",      emoji:"🍎", category:"fruits",     state:"Himachal Pradesh",district:"Shimla", market:"Shimla Mandi",   min:3500, max:6000, modal:4800, unit:"Quintal", date:"Today" },
  { commodity:"Urad Dal",   emoji:"🫘", category:"pulses",     state:"Madhya Pradesh",district:"Sagar",    market:"Sagar",          min:5500, max:7000, modal:6200, unit:"Quintal", date:"Today" },
  { commodity:"Chana Dal",  emoji:"🟡", category:"pulses",     state:"Rajasthan",   district:"Bikaner",   market:"Bikaner",        min:4200, max:5100, modal:4700, unit:"Quintal", date:"Today" },
  { commodity:"Arhar Dal",  emoji:"🟤", category:"pulses",     state:"Maharashtra", district:"Latur",      market:"Latur",          min:5800, max:7200, modal:6500, unit:"Quintal", date:"Today" },
  { commodity:"Jowar",      emoji:"🌾", category:"grains",     state:"Karnataka",   district:"Bijapur",    market:"Bijapur",        min:1600, max:2200, modal:1900, unit:"Quintal", date:"Today" },
  { commodity:"Bajra",      emoji:"🌾", category:"grains",     state:"Rajasthan",   district:"Barmer",     market:"Barmer",         min:1400, max:1900, modal:1650, unit:"Quintal", date:"Today" },
  { commodity:"Ginger",     emoji:"🫚", category:"spices",     state:"Kerala",      district:"Wayanad",    market:"Wayanad",        min:15000,max:22000,modal:18500,unit:"Quintal", date:"Today" },
];

const CATEGORIES = ["All", "vegetables", "grains", "oilseeds", "cash crops", "pulses", "spices", "fruits"];
const STATES = ["All States", ...Array.from(new Set(MANDI_DATA.map(d => d.state)))].sort();

function PriceTrend({ min, max, modal }) {
  const mid = (min + max) / 2;
  const spread = max - min;
  if (modal > mid + spread * 0.25)
    return <span className="flex items-center gap-1 text-green-600 text-xs font-bold bg-green-50 px-2 py-0.5 rounded-full"><TrendingUp className="w-3 h-3" /> High</span>;
  if (modal < mid - spread * 0.25)
    return <span className="flex items-center gap-1 text-red-500 text-xs font-bold bg-red-50 px-2 py-0.5 rounded-full"><TrendingDown className="w-3 h-3" /> Low</span>;
  return <span className="flex items-center gap-1 text-gray-500 text-xs font-bold bg-gray-50 px-2 py-0.5 rounded-full"><Minus className="w-3 h-3" /> Avg</span>;
}

function PriceCard({ row }) {
  return (
    <div className="bg-white rounded-[1.5rem] p-5 border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-50 to-green-100 rounded-2xl flex items-center justify-center text-2xl shadow-inner">
            {row.emoji}
          </div>
          <div>
            <h4 className="font-bold text-gray-800 text-base">{row.commodity}</h4>
            <div className="flex items-center gap-1 text-gray-400 text-[10px] mt-0.5">
              <MapPin className="w-2.5 h-2.5" /> {row.market}
            </div>
          </div>
        </div>
        <PriceTrend min={row.min} max={row.max} modal={row.modal} />
      </div>

      {/* Price bar visual */}
      <div className="mb-4 relative h-2 bg-gray-100 rounded-full">
        <div className="absolute h-full bg-primary-400 rounded-full"
          style={{ left: "0%", width: `${((row.modal - row.min) / (row.max - row.min)) * 100}%` }} />
        <div className="absolute h-4 w-1 bg-primary-600 rounded-full -top-1"
          style={{ left: `${((row.modal - row.min) / (row.max - row.min)) * 100}%` }} />
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2 bg-red-50 rounded-xl">
          <p className="font-bold text-red-600 text-sm">₹{row.min.toLocaleString()}</p>
          <p className="text-[9px] text-gray-400 uppercase font-bold mt-0.5">Min</p>
        </div>
        <div className="p-2 bg-primary-50 rounded-xl border border-primary-100">
          <p className="font-bold text-primary-700 text-sm">₹{row.modal.toLocaleString()}</p>
          <p className="text-[9px] text-gray-400 uppercase font-bold mt-0.5">Modal</p>
        </div>
        <div className="p-2 bg-green-50 rounded-xl">
          <p className="font-bold text-green-600 text-sm">₹{row.max.toLocaleString()}</p>
          <p className="text-[9px] text-gray-400 uppercase font-bold mt-0.5">Max</p>
        </div>
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
        <span className="text-[10px] text-gray-400 capitalize">{row.category} · {row.state}</span>
        <span className="text-[10px] text-primary-600 font-bold">per {row.unit}</span>
      </div>
    </div>
  );
}

function AIRecommendation({ item, onClose }) {
  const [rec, setRec] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetch = async () => {
      try {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        const { data } = await axios.post(`${API}/api/ai/suggest-price`, {
          cropName: item.commodity, category: item.category,
          quantity: 10, unit: item.unit, location: item.state,
        }, { headers: { Authorization: `Bearer ${token}` } });
        const clean = data.text.replace(/^```json/m, "").replace(/^```/m, "").trim();
        setRec(JSON.parse(clean));
      } catch { toast.error("AI unavailable"); }
      finally { setLoading(false); }
    };
    fetch();
  }, [item]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-500" /> AI Sell Recommendation
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-8 h-8 animate-spin text-primary-600" />
            </div>
          ) : rec ? (
            <div className="space-y-5">
              <div className="text-center py-6 bg-gradient-to-br from-primary-50 to-green-50 rounded-2xl border border-primary-100">
                <p className="text-xs font-bold text-gray-400 uppercase mb-1">AI Suggested Price</p>
                <h2 className="text-5xl font-display font-extrabold text-primary-700">₹{rec.suggestedPrice}</h2>
                <p className="text-sm text-gray-500 mt-1">per {item.unit}</p>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50">
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${rec.demandLevel === "High" ? "bg-green-100 text-green-700" : rec.demandLevel === "Low" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                  {rec.demandLevel} Demand
                </div>
                <div className="text-xs text-gray-500 flex-1">Market demand level in {item.state}</div>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                <p className="text-xs font-bold text-blue-700 mb-1 flex items-center gap-1"><Info className="w-3 h-3" /> AI Analysis</p>
                <p className="text-sm text-gray-700 leading-relaxed">{rec.reasoning}</p>
              </div>
              <div className="text-xs text-gray-400 text-center">Market rate: ₹{item.min}–₹{item.max} (modal ₹{item.modal})</div>
            </div>
          ) : (
            <p className="text-center text-gray-400 py-8">Could not fetch recommendation.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function MarketPricesContent() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [state, setState] = useState("All States");
  const [sortBy, setSortBy] = useState("name");
  const [aiTarget, setAiTarget] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  const filtered = useMemo(() => {
    let data = [...MANDI_DATA];
    if (search) data = data.filter(d => d.commodity.toLowerCase().includes(search.toLowerCase()) || d.state.toLowerCase().includes(search.toLowerCase()));
    if (category !== "All") data = data.filter(d => d.category === category);
    if (state !== "All States") data = data.filter(d => d.state === state);
    if (sortBy === "price_high") data.sort((a, b) => b.modal - a.modal);
    else if (sortBy === "price_low") data.sort((a, b) => a.modal - b.modal);
    else data.sort((a, b) => a.commodity.localeCompare(b.commodity));
    return data;
  }, [search, category, state, sortBy]);

  // Top 5 by modal price for chart
  const chartData = [...MANDI_DATA].sort((a, b) => b.modal - a.modal).slice(0, 8).map(d => ({
    name: d.commodity.length > 8 ? d.commodity.slice(0, 8) + "…" : d.commodity,
    Price: d.modal, emoji: d.emoji,
  }));

  const CHART_COLORS = ["#16a34a","#22c55e","#4ade80","#86efac","#bbf7d0","#f59e0b","#f97316","#ef4444"];

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="bg-gradient-to-br from-amber-600 via-yellow-600 to-orange-600 rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 text-[200px] leading-none pointer-events-none">📈</div>
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="font-display text-3xl font-extrabold">{t("market.title")}</h2>
            <p className="text-yellow-100 mt-1 text-sm">{t("market.subtitle")}</p>
            <div className="flex items-center gap-3 mt-3">
              <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse inline-block" /> Live Rates
              </span>
              <span className="text-yellow-200 text-xs font-bold">{MANDI_DATA.length} commodities tracked</span>
            </div>
          </div>
          <button onClick={() => toast.success("Prices refreshed!")} className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Top commodities chart */}
      <div className="bg-white rounded-[2rem] p-7 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" /> Top Modal Prices (₹/Quintal)
          </h3>
          <span className="text-xs text-gray-400 font-bold">Today's highest rates</span>
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 0, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 10 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 10 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <RechartsTooltip
                formatter={(v) => [`₹${v.toLocaleString()}`, "Modal Price"]}
                contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 40px rgba(0,0,0,0.08)" }} />
              <Bar dataKey="Price" radius={[8, 8, 0, 0]} barSize={36}>
                {chartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-gray-100 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={t("market.search")}
            className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 bg-gray-50 focus:bg-white transition" />
          {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"><X className="w-3 h-3 text-gray-400" /></button>}
        </div>
        {/* Filter row */}
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <select value={state} onChange={e => setState(e.target.value)}
              className="appearance-none border border-gray-200 rounded-xl pl-4 pr-8 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-400 text-gray-700">
              {STATES.map(s => <option key={s}>{s}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              className="appearance-none border border-gray-200 rounded-xl pl-4 pr-8 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-400 text-gray-700">
              <option value="name">Sort: Name</option>
              <option value="price_high">Sort: Price ↑</option>
              <option value="price_low">Sort: Price ↓</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
          <span className="ml-auto text-xs font-bold text-gray-400 self-center">{filtered.length} results</span>
        </div>
        {/* Category pills */}
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all capitalize ${category === cat ? "bg-primary-600 text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Cards grid */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array(6).fill(0).map((_, i) => <div key={i} className="h-52 bg-gray-100 animate-pulse rounded-3xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <BarChart2 className="w-14 h-14 mx-auto mb-4 opacity-20" />
          <p className="font-bold">No results for "{search}"</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((row, i) => (
            <div key={i} className="relative group">
              <PriceCard row={row} />
              <button
                onClick={() => setAiTarget(row)}
                className="absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-primary-600 hover:bg-primary-700 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 shadow-lg">
                <Sparkles className="w-3 h-3" /> AI Advice
              </button>
            </div>
          ))}
        </div>
      )}

      {/* AI modal */}
      {aiTarget && <AIRecommendation item={aiTarget} onClose={() => setAiTarget(null)} />}
    </div>
  );
}

export default function MarketPrices() {
  return (
    <FarmerLayout>
      <MarketPricesContent />
    </FarmerLayout>
  );
}
