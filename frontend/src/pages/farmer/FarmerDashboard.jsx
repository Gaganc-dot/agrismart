import { useState, useEffect } from "react";
import FarmerLayout from "./FarmerLayout";
import { DashboardSkeleton } from "../../components/SkeletonLoader";
import { useTranslation } from "react-i18next";
import {
  TrendingUp, Package, IndianRupee, ShoppingBag, Loader, Plus,
  AlertTriangle, CheckCircle2, Info, ChevronRight, Wallet,
  BarChart2, Droplets, Wind, Bell, Zap, Sparkles,
  Activity, RefreshCw, MapPin, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Cell, AreaChart, Area
} from "recharts";
import axios from "axios";
import { Link } from "react-router-dom";

// ── Animated counter ──────────────────────────────────────────
function useCountUp(target, duration = 1200) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!target) return;
    const step = target / (duration / 16);
    let cur = 0;
    const timer = setInterval(() => {
      cur += step;
      if (cur >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(cur));
    }, 16);
    return () => clearInterval(timer);
  }, [target]);
  return count;
}

// ── Stat Card ─────────────────────────────────────────────────
function StatCard({ title, value, prefix = "", color, bg, icon, trend, trendVal }) {
  const num = parseFloat(String(value).replace(/[^0-9.]/g, "")) || 0;
  const animated = useCountUp(num);
  return (
    <div className={`rounded-3xl p-6 border border-gray-50 shadow-sm ${bg} hover:-translate-y-1 transition-transform duration-200`}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{title}</p>
        <div className={`${color} opacity-80`}>{icon}</div>
      </div>
      <h4 className={`text-2xl font-display font-extrabold ${color}`}>
        {prefix}{animated.toLocaleString()}
      </h4>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 mt-2 text-xs font-bold ${trend >= 0 ? "text-green-600" : "text-red-500"}`}>
          {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {Math.abs(trendVal)}% vs last month
        </div>
      )}
    </div>
  );
}

// ── Weather mini widget ───────────────────────────────────────
function WeatherWidget() {
  const [weather, setWeather] = useState(null);
  const apiKey = import.meta.env.VITE_WEATHER_API_KEY;
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(async ({ coords }) => {
      try {
        const r = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${coords.latitude}&lon=${coords.longitude}&appid=${apiKey}&units=metric`
        );
        setWeather(await r.json());
      } catch {}
    });
  }, []);
  if (!weather) return (
    <Link to="/farmer/weather" className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-[2.5rem] p-8 text-white shadow-lg flex flex-col items-center justify-center gap-4 hover:scale-[1.02] transition-transform h-full min-h-[260px]">
      <span className="text-7xl">🌤️</span>
      <div className="text-center">
        <p className="font-bold text-lg">Live Weather</p>
        <p className="text-blue-200 text-sm mt-1">Enable location for</p>
        <p className="text-blue-200 text-sm">your local forecast</p>
      </div>
      <span className="text-xs font-bold bg-white/20 px-4 py-1.5 rounded-full">Enable Location →</span>
    </Link>
  );
  const icons = { Clear: "☀️", Clouds: "⛅", Rain: "🌧️", Thunderstorm: "⛈️", Drizzle: "🌦️", Snow: "❄️", Mist: "🌫️", Fog: "🌫️" };
  const emoji = icons[weather.weather[0].main] || "🌤️";
  return (
    <Link to="/farmer/weather" className="bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded-[2.5rem] p-8 text-white shadow-xl flex flex-col justify-between hover:scale-[1.01] transition-transform h-full min-h-[260px] relative overflow-hidden">
      {/* Background blur orb */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 blur-[60px] rounded-full -mr-10 -mt-10 pointer-events-none" />

      {/* Top: location */}
      <div className="flex items-center gap-1.5 text-blue-200 text-xs font-bold">
        <MapPin className="w-3.5 h-3.5" /> {weather.name}
      </div>

      {/* Centre: temp + emoji */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-6xl font-display font-extrabold leading-none">{Math.round(weather.main.temp)}°</div>
          <p className="text-blue-100 text-sm capitalize mt-2">{weather.weather[0].description}</p>
        </div>
        <span className="text-7xl drop-shadow-lg">{emoji}</span>
      </div>

      {/* Bottom: stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/10 rounded-2xl px-4 py-3 flex items-center gap-2">
          <Droplets className="w-4 h-4 text-blue-200" />
          <div>
            <p className="text-white font-bold text-sm">{weather.main.humidity}%</p>
            <p className="text-blue-200 text-[10px]">Humidity</p>
          </div>
        </div>
        <div className="bg-white/10 rounded-2xl px-4 py-3 flex items-center gap-2">
          <Wind className="w-4 h-4 text-blue-200" />
          <div>
            <p className="text-white font-bold text-sm">{weather.wind.speed} m/s</p>
            <p className="text-blue-200 text-[10px]">Wind</p>
          </div>
        </div>
        <div className="bg-white/10 rounded-2xl px-4 py-3 flex items-center gap-2 col-span-2 justify-center">
          <p className="text-blue-200 text-xs font-bold">Feels like {Math.round(weather.main.feels_like)}° · {weather.main.pressure} hPa</p>
        </div>
      </div>
    </Link>
  );
}

// ── Farm Tasks panel ──────────────────────────────────────────
const INITIAL_TASKS = [
  { id: 1, text: "Check soil moisture levels", done: false, priority: "high" },
  { id: 2, text: "Apply fertilizer to wheat field", done: false, priority: "medium" },
  { id: 3, text: "Review pending buyer orders", done: true, priority: "low" },
  { id: 4, text: "Update crop listings with photos", done: false, priority: "medium" },
];
const priorityColor = { high: "bg-red-100 text-red-600", medium: "bg-yellow-100 text-yellow-700", low: "bg-gray-100 text-gray-500" };

function TasksPanel() {
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [newTask, setNewTask] = useState("");
  const toggle = (id) => setTasks(t => t.map(x => x.id === id ? { ...x, done: !x.done } : x));
  const add = () => {
    if (!newTask.trim()) return;
    setTasks(t => [...t, { id: Date.now(), text: newTask, done: false, priority: "medium" }]);
    setNewTask("");
  };
  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
          <CheckSquare className="w-4 h-4 text-primary-600" /> Farm Tasks
        </h3>
        <span className="text-xs font-bold text-gray-400">{tasks.filter(t => !t.done).length} pending</span>
      </div>
      <div className="space-y-1.5 mb-4 max-h-44 overflow-y-auto pr-1">
        {tasks.map(task => (
          <div key={task.id} onClick={() => toggle(task.id)}
            className={`flex items-center gap-3 p-2.5 rounded-2xl cursor-pointer transition-all ${task.done ? "opacity-50" : "hover:bg-gray-50"}`}>
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${task.done ? "bg-primary-600 border-primary-600" : "border-gray-300"}`}>
              {task.done && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
            </div>
            <span className={`text-xs flex-1 ${task.done ? "line-through text-gray-400" : "text-gray-700 font-medium"}`}>{task.text}</span>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${priorityColor[task.priority]}`}>{task.priority}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={newTask} onChange={e => setNewTask(e.target.value)}
          onKeyDown={e => e.key === "Enter" && add()}
          placeholder="Add a task..." className="flex-1 text-xs border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-400" />
        <button onClick={add} className="bg-primary-600 text-white px-3 py-2 rounded-xl hover:bg-primary-700 transition">
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Quick action card ─────────────────────────────────────────
function QuickAction({ to, emoji, label, desc, color }) {
  return (
    <Link to={to}
      className={`group flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 ${color} hover:scale-105 transition-all duration-200 text-center`}>
      <span className="text-2xl group-hover:scale-110 transition-transform">{emoji}</span>
      <div>
        <p className="font-bold text-xs text-gray-800">{label}</p>
        <p className="text-[9px] text-gray-400 mt-0.5 hidden sm:block">{desc}</p>
      </div>
    </Link>
  );
}

// ── Activity feed ─────────────────────────────────────────────
function ActivityFeed({ orders }) {
  const statusColor = {
    pending: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-blue-100 text-blue-700",
    shipped: "bg-purple-100 text-purple-700",
    delivered: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700"
  };
  return (
    <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary-600" /> Recent Activity
        </h3>
        <Link to="/farmer/orders" className="text-xs font-bold text-primary-600 hover:underline flex items-center gap-1">
          View all <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-300">
          <ShoppingBag className="w-12 h-12 mb-3 opacity-20" />
          <p className="font-bold text-sm">Waiting for your first order…</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.slice(0, 6).map(o => (
            <div key={o._id} className="group p-4 rounded-3xl bg-gray-50 border border-transparent hover:border-primary-100 hover:bg-primary-50/30 transition-all flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-lg shadow-sm flex-shrink-0">📦</div>
                <div>
                  <h4 className="font-bold text-sm text-gray-800 truncate max-w-[120px]">{o.product?.title || "Product"}</h4>
                  <p className="text-[10px] text-gray-500 font-bold uppercase">{o.buyer?.name?.split(" ")[0]}</p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-bold text-primary-700 text-sm">₹{Number(o.totalPrice).toLocaleString()}</p>
                <p className="text-[9px] text-gray-400">{o.quantity} {o.product?.unit || "unit"}</p>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${statusColor[o.status] || "bg-gray-100 text-gray-500"}`}>{o.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────
export default function FarmerDashboard() {
  const { t, i18n } = useTranslation();
  const user = JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "{}");

  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const API = import.meta.env.VITE_API_URL || "http://localhost:8000";
      const [resOrders, resProducts, resExpenses] = await Promise.all([
        axios.get(`${API}/api/orders/farmer`, { headers }),
        axios.get(`${API}/api/products/my`, { headers }),
        axios.get(`${API}/api/expenses`, { headers }),
      ]);
      const ords = resOrders.data.orders || [];
      const prods = resProducts.data.products || [];
      const exps = resExpenses.data.expenses || [];
      setOrders(ords); setProducts(prods); setExpenses(exps);
    } catch (err) { console.error("Dashboard fetch error", err); }
    finally { setLoading(false); setRefreshing(false); }
  };

  if (loading) return (
    <FarmerLayout>
      <DashboardSkeleton role="farmer" />
    </FarmerLayout>
  );

  // Analytics
  const confirmedOrders = orders.filter(o => o.status !== "cancelled");
  const pendingOrders = orders.filter(o => o.status === "pending");
  const totalRevenue = confirmedOrders.reduce((s, o) => s + o.totalPrice, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const netBalance = totalRevenue - totalExpenses;
  const activeListings = products.filter(p => p.status === "available").length;

  // Revenue by crop
  const revenueMap = {};
  confirmedOrders.forEach(o => {
    const t2 = o.product?.title || "Unknown";
    revenueMap[t2] = (revenueMap[t2] || 0) + o.totalPrice;
  });
  const chartData = Object.entries(revenueMap)
    .sort((a, b) => b[1] - a[1]).slice(0, 6)
    .map(([key, val]) => ({ name: key.length > 10 ? key.slice(0, 10) + "…" : key, Revenue: val }));

  // Monthly area chart
  const monthlyMap = {};
  confirmedOrders.forEach(o => {
    const m = new Date(o.createdAt).toLocaleString("en", { month: "short" });
    monthlyMap[m] = (monthlyMap[m] || 0) + o.totalPrice;
  });
  const now = new Date();
  const trendData = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (4 - i), 1);
    const key = d.toLocaleString("en", { month: "short" });
    return { month: key, Revenue: monthlyMap[key] || 0 };
  });
  const hasTrend = trendData.some(d => d.Revenue > 0);

  return (
    <FarmerLayout>
      <div className="max-w-7xl mx-auto space-y-8 pb-10">

        {/* ── Hero Banner ─────────────────────────────────── */}
        <div className="bg-gradient-to-br from-primary-800 via-primary-900 to-primary-950 rounded-[2.5rem] p-8 md:p-10 text-white shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary-700/20 blur-[100px] -mr-20 -mt-20 rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-1/2 w-64 h-64 bg-green-500/10 blur-[80px] rounded-full pointer-events-none" />
          <div className="relative z-10 space-y-4 flex-1">
            <div className="flex items-center gap-2 text-primary-300 text-xs font-bold uppercase tracking-widest">
              <Sparkles className="w-4 h-4" /> Smart Farm Dashboard
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-extrabold leading-tight">
              {t("dashboard.welcome")}, {user.name?.split(" ")[0] || "Farmer"}! 👨‍🌾
            </h1>
            <p className="text-primary-200 max-w-md leading-relaxed">{t("dashboard.subtitle")}</p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link to="/farmer/sell-crops"
                className="bg-white text-primary-900 font-bold py-3 px-6 rounded-2xl hover:scale-105 transition shadow-xl flex items-center gap-2 text-sm">
                <Plus className="w-4 h-4" /> {t("dashboard.listNew")}
              </Link>
              <Link to="/farmer/expenses"
                className="bg-primary-700/50 hover:bg-primary-700 text-white font-bold py-3 px-6 rounded-2xl transition border border-primary-600 backdrop-blur-md flex items-center gap-2 text-sm">
                <Wallet className="w-4 h-4" /> {t("nav.expenses")}
              </Link>
              <button onClick={() => fetchDashboardData(true)}
                className="bg-primary-700/30 hover:bg-primary-700/60 text-white p-3 rounded-2xl border border-primary-600/50 transition">
                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Net Balance */}
          <div className="relative z-10 bg-white/10 backdrop-blur-xl p-7 rounded-[2rem] border border-white/20 text-center w-full md:w-auto md:min-w-[220px]">
            <p className="text-primary-200 text-[10px] font-bold uppercase tracking-widest mb-2">{t("dashboard.netBalance")}</p>
            <h2 className={`text-4xl font-display font-extrabold ${netBalance >= 0 ? "text-green-400" : "text-red-400"}`}>
              ₹{Math.abs(netBalance).toLocaleString()}
            </h2>
            <p className="text-white/40 text-[9px] mt-1 uppercase">{netBalance >= 0 ? "Surplus" : "Deficit"}</p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-center">
              <div className="bg-white/10 rounded-xl p-2">
                <p className="text-green-400 font-bold text-sm">₹{totalRevenue.toLocaleString()}</p>
                <p className="text-white/40 text-[9px]">Revenue</p>
              </div>
              <div className="bg-white/10 rounded-xl p-2">
                <p className="text-red-400 font-bold text-sm">₹{totalExpenses.toLocaleString()}</p>
                <p className="text-white/40 text-[9px]">Expenses</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Stats ───────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title={t("dashboard.revenue")} value={totalRevenue} prefix="₹" color="text-green-600" bg="bg-green-50" icon={<IndianRupee className="w-5 h-5" />} trend={1} trendVal={12} />
          <StatCard title="Total Expenses" value={totalExpenses} prefix="₹" color="text-red-600" bg="bg-red-50" icon={<TrendingDown />} trend={-1} trendVal={3} />
          <StatCard title={t("dashboard.activeListings")} value={activeListings} color="text-blue-600" bg="bg-blue-50" icon={<Package className="w-5 h-5" />} />
          <StatCard title={t("dashboard.orders")} value={confirmedOrders.length} color="text-purple-600" bg="bg-purple-50" icon={<ShoppingBag className="w-5 h-5" />} trend={1} trendVal={8} />
        </div>

        {/* ── Quick Actions ────────────────────────────────── */}
        <div className="space-y-3">
          <h3 className="font-bold text-gray-500 text-xs uppercase tracking-widest flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-500" /> Quick Actions
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            <QuickAction to="/farmer/crop-recommendation" emoji="🌱" label="Crop AI" desc="Get recommendations" color="border-green-100 hover:border-green-300 bg-green-50/60" />
            <QuickAction to="/farmer/weather" emoji="🌤️" label="Weather" desc="7-day forecast" color="border-blue-100 hover:border-blue-300 bg-blue-50/60" />
            <QuickAction to="/farmer/market-prices" emoji="📈" label="Mandi" desc="Live rates" color="border-yellow-100 hover:border-yellow-300 bg-yellow-50/60" />
            <QuickAction to="/farmer/disease-detection" emoji="🔬" label="Disease AI" desc="Scan crops" color="border-red-100 hover:border-red-300 bg-red-50/60" />
            <QuickAction to="/farmer/fertilizer-advice" emoji="🧪" label="Fertilizer" desc="NPK advice" color="border-purple-100 hover:border-purple-300 bg-purple-50/60" />
            <QuickAction to="/farmer/profit-prediction" emoji="💰" label="Profit AI" desc="Predict ROI" color="border-emerald-100 hover:border-emerald-300 bg-emerald-50/60" />
          </div>
        </div>


        {/* ── Charts + Side ────────────────────────────────── */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Revenue chart */}
          <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-gray-800 text-lg">{t("dashboard.revenueGrowth")}</h3>
              <span className="text-xs font-bold text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full">
                {hasTrend ? "Monthly trend" : "By crop"}
              </span>
            </div>
            {hasTrend ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 10 }} tickFormatter={v => `₹${v}`} />
                    <RechartsTooltip contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 10px 40px rgba(0,0,0,0.08)" }} />
                    <Area type="monotone" dataKey="Revenue" stroke="#16a34a" strokeWidth={3} fill="url(#rev)" dot={{ r: 4, fill: "#16a34a" }} activeDot={{ r: 6 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : chartData.length > 0 ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 10 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 10 }} tickFormatter={v => `₹${v}`} />
                    <RechartsTooltip contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 10px 40px rgba(0,0,0,0.05)" }} />
                    <Bar dataKey="Revenue" radius={[8, 8, 0, 0]} barSize={40}>
                      {chartData.map((_, i) => <Cell key={i} fill={i % 2 === 0 ? "#16a34a" : "#22c55e"} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-72 flex flex-col items-center justify-center text-gray-300">
                <BarChart2 className="w-14 h-14 mb-3 opacity-20" />
                <p className="font-bold text-sm">Start selling to see analytics</p>
                <p className="text-xs mt-1 opacity-60">Your revenue chart will appear here</p>
              </div>
            )}

            {/* Pending alert */}
            {pendingOrders.length > 0 && (
              <div className="mt-5 flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
                <Bell className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                <p className="text-sm font-bold text-yellow-800">
                  You have <span className="text-yellow-600">{pendingOrders.length}</span> pending order{pendingOrders.length > 1 ? "s" : ""} awaiting confirmation.
                </p>
                <Link to="/farmer/orders" className="ml-auto text-xs font-bold text-yellow-700 hover:underline whitespace-nowrap">
                  Review →
                </Link>
              </div>
            )}
          </div>

          {/* Side panels */}
          <div className="flex flex-col h-full">
            <WeatherWidget />
          </div>
        </div>

        {/* ── Activity feed ────────────────────────────────── */}
        <ActivityFeed orders={orders} />

      </div>
    </FarmerLayout>
  );
}

function TrendingDown(props) {
  return <svg {...props} className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>;
}
