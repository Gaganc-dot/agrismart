import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import FarmerLayout from "./FarmerLayout";
import { useTranslation } from "react-i18next";
import {
  Wallet, Plus, Trash2, X, Loader, TrendingUp, TrendingDown,
  ArrowUpCircle, ArrowDownCircle, Calendar, Filter, Search,
  Download, ChevronDown, Sparkles, IndianRupee, BarChart2
} from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  AreaChart, Area
} from "recharts";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";
const COLORS = ["#16a34a","#ef4444","#3b82f6","#f59e0b","#8b5cf6","#ec4899","#06b6d4","#84cc16"];

const CATEGORIES = {
  income: ["crop_sale","livestock","government_subsidy","rental","other_income"],
  expense: ["seeds","fertilizer","pesticide","labour","irrigation","machinery","fuel","transport","storage","loan_repayment","other_expense"],
};

const CAT_LABELS = {
  crop_sale:"Crop Sale", livestock:"Livestock", government_subsidy:"Govt Subsidy",
  rental:"Rental Income", other_income:"Other Income",
  seeds:"Seeds", fertilizer:"Fertilizer", pesticide:"Pesticide", labour:"Labour",
  irrigation:"Irrigation", machinery:"Machinery/Equipment", fuel:"Fuel",
  transport:"Transport", storage:"Storage", loan_repayment:"Loan Repayment",
  other_expense:"Other Expense",
};

const CAT_EMOJI = {
  crop_sale:"🌾", livestock:"🐄", government_subsidy:"🏛️", rental:"🏠", other_income:"💰",
  seeds:"🌱", fertilizer:"🧪", pesticide:"🐛", labour:"👷", irrigation:"💧",
  machinery:"🚜", fuel:"⛽", transport:"🚛", storage:"🏭", loan_repayment:"🏦", other_expense:"📦",
};

// ── Add/Edit Modal ────────────────────────────────────────────
function EntryModal({ onClose, onSave, editItem = null }) {
  const { t } = useTranslation();
  const [form, setForm] = useState(editItem || {
    title: "", amount: "", type: "expense", category: "", date: new Date().toISOString().split("T")[0], note: "",
  });
  // Smart calculator fields (only for sale/income entries)
  const [pricePerUnit, setPricePerUnit] = useState("");
  const [quantityAmt,  setQuantityAmt]  = useState("");
  const [unitLabel,    setUnitLabel]    = useState("kg");
  const [useCalc,      setUseCalc]      = useState(false);
  const [loading, setLoading] = useState(false);

  // Auto-fill amount when using price×qty calculator
  const calcTotal = pricePerUnit && quantityAmt
    ? (parseFloat(pricePerUnit) * parseFloat(quantityAmt)).toFixed(2)
    : "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalAmount = useCalc && calcTotal ? calcTotal : form.amount;
    if (!form.title || !finalAmount || !form.category) return toast.error("Fill all required fields");
    setLoading(true);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const payload = { ...form, amount: parseFloat(finalAmount) };
      if (editItem) {
        await axios.put(`${API}/api/expenses/${editItem._id}`, payload, { headers: { Authorization: `Bearer ${token}` } });
        toast.success("Entry updated!");
      } else {
        await axios.post(`${API}/api/expenses`, payload, { headers: { Authorization: `Bearer ${token}` } });
        toast.success("Entry recorded!");
      }
      onSave();
    } catch { toast.error("Failed to save entry"); }
    finally { setLoading(false); }
  };

  const cats = CATEGORIES[form.type] || [];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-8 py-6 border-b bg-gray-50">
          <h3 className="font-bold text-gray-800 text-lg">{editItem ? "Edit Entry" : t("expenses.add")}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {/* Type toggle */}
          <div className="flex bg-gray-100 p-1.5 rounded-2xl gap-1">
            {["income", "expense"].map(tp => (
              <button key={tp} type="button" onClick={() => setForm({ ...form, type: tp, category: "" })}
                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${form.type === tp ? `bg-white shadow-sm ${tp === "income" ? "text-green-600" : "text-red-600"}` : "text-gray-400"}`}>
                {tp === "income" ? "💰 " + t("expenses.income") : "💸 " + t("expenses.expense")}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-bold text-gray-500 mb-1.5 block">Title *</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder={form.type === "income" ? "e.g. Wheat sale — 100 kg" : "e.g. Fertilizer purchase"}
                className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:bg-white transition" />
            </div>

            {/* Smart Calculator (income mode) */}
            {form.type === "income" && (
              <div className="col-span-2">
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-xs font-bold text-gray-500">Amount (₹) *</label>
                  <button type="button" onClick={() => setUseCalc(c => !c)}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all ${useCalc ? "bg-emerald-100 border-emerald-300 text-emerald-700" : "bg-gray-100 border-gray-200 text-gray-500"}`}>
                    {useCalc ? "✓ Price × Qty" : "Use Price × Qty"}
                  </button>
                </div>
                {useCalc ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-1">
                        <label className="text-[10px] font-bold text-gray-400 mb-1 block">Unit</label>
                        <select value={unitLabel} onChange={e => setUnitLabel(e.target.value)}
                          className="w-full border border-gray-200 bg-gray-50 rounded-xl px-2 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400">
                          {["kg","quintal","ton","litre","dozen","piece","bag"].map(u => <option key={u}>{u}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 mb-1 block">Price/unit (₹)</label>
                        <input type="number" min="0" step="any" value={pricePerUnit} onChange={e => setPricePerUnit(e.target.value)}
                          placeholder="e.g. 13"
                          className="w-full border border-gray-200 bg-gray-50 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 mb-1 block">Quantity ({unitLabel})</label>
                        <input type="number" min="0" step="any" value={quantityAmt} onChange={e => setQuantityAmt(e.target.value)}
                          placeholder="e.g. 100"
                          className="w-full border border-gray-200 bg-gray-50 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                      </div>
                    </div>
                    {calcTotal && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 text-sm flex items-center justify-between">
                        <span className="text-gray-500 text-xs">₹{pricePerUnit} × {quantityAmt} {unitLabel}</span>
                        <span className="font-extrabold text-emerald-700 text-base">= ₹{parseFloat(calcTotal).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <input type="number" min="0" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                    placeholder="0"
                    className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:bg-white transition" />
                )}
              </div>
            )}

            {form.type === "expense" && (
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1.5 block">Amount (₹) *</label>
                <input type="number" min="0" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                  placeholder="0"
                  className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:bg-white transition" />
              </div>
            )}

            <div className={form.type === "income" ? "" : ""}>
              <label className="text-xs font-bold text-gray-500 mb-1.5 block">Date</label>
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:bg-white transition" />
            </div>
          </div>

          {/* Category grid */}
          <div>
            <label className="text-xs font-bold text-gray-500 mb-2 block">{t("expenses.category")} *</label>
            <div className="grid grid-cols-3 gap-2 max-h-44 overflow-y-auto pr-1">
              {cats.map(cat => (
                <button key={cat} type="button" onClick={() => setForm({ ...form, category: cat })}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-center transition-all text-xs font-bold ${form.category === cat ? "border-primary-500 bg-primary-50 text-primary-700" : "border-gray-100 hover:border-gray-200 text-gray-600"}`}>
                  <span className="text-xl">{CAT_EMOJI[cat] || "📌"}</span>
                  <span className="leading-tight">{CAT_LABELS[cat]}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 mb-1.5 block">Note (optional)</label>
            <textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })}
              rows={2} placeholder="Any additional notes…"
              className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:bg-white transition resize-none" />
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? <Loader className="w-5 h-5 animate-spin" /> : <><Plus className="w-4 h-4" /> Save Entry</>}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────
function FinanceStat({ label, value, color, icon, bg }) {
  return (
    <div className={`rounded-3xl p-6 ${bg} border border-gray-50 shadow-sm`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</p>
        <div className={color}>{icon}</div>
      </div>
      <h4 className={`text-2xl font-display font-extrabold ${color}`}>₹{Math.abs(value).toLocaleString()}</h4>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function ExpenseTracker() {
  const { t } = useTranslation();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => { fetchExpenses(); }, []);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const { data } = await axios.get(`${API}/api/expenses`, { headers: { Authorization: `Bearer ${token}` } });
      setExpenses(data.expenses || []);
    } catch { toast.error("Error loading data"); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this entry?")) return;
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      await axios.delete(`${API}/api/expenses/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Deleted");
      fetchExpenses();
    } catch { toast.error("Delete failed"); }
  };

  // Analytics
  const totalIn  = expenses.filter(e => e.type === "income").reduce((s, e) => s + e.amount, 0);
  const totalOut = expenses.filter(e => e.type === "expense").reduce((s, e) => s + e.amount, 0);
  const balance  = totalIn - totalOut;

  // Pie chart: expense categories
  const pieData = useMemo(() => {
    const map = {};
    expenses.filter(e => e.type === "expense").forEach(e => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return Object.entries(map).map(([name, value]) => ({ name: CAT_LABELS[name] || name, value }));
  }, [expenses]);

  // Monthly bar chart
  const monthlyData = useMemo(() => {
    const map = {};
    expenses.forEach(e => {
      const m = new Date(e.date || e.createdAt).toLocaleString("en", { month: "short" });
      if (!map[m]) map[m] = { month: m, Income: 0, Expenses: 0 };
      if (e.type === "income") map[m].Income += e.amount;
      else map[m].Expenses += e.amount;
    });
    return Object.values(map).slice(-6);
  }, [expenses]);

  // Filtered list
  const filtered = useMemo(() => {
    return expenses.filter(e => {
      const matchSearch = !search || e.title?.toLowerCase().includes(search.toLowerCase()) || e.category?.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === "all" || e.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [expenses, search, typeFilter]);

  const TABS = ["overview", "transactions", "analytics"];

  return (
    <FarmerLayout>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="bg-gradient-to-br from-emerald-700 via-green-700 to-teal-800 rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 opacity-10 text-[180px] leading-none pointer-events-none">💰</div>
          <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="font-display text-3xl font-extrabold">{t("expenses.title")}</h2>
              <p className="text-green-100 mt-1">{t("expenses.subtitle")}</p>
            </div>
            <button onClick={() => { setEditItem(null); setShowModal(true); }}
              className="bg-white text-green-700 font-bold py-3 px-6 rounded-2xl hover:scale-105 transition shadow-xl flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" /> {t("expenses.add")}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <FinanceStat label="Total Income" value={totalIn} color="text-green-600" bg="bg-green-50" icon={<ArrowUpCircle className="w-5 h-5" />} />
          <FinanceStat label="Total Expenses" value={totalOut} color="text-red-600" bg="bg-red-50" icon={<ArrowDownCircle className="w-5 h-5" />} />
          <div className={`rounded-3xl p-6 border border-gray-50 shadow-sm ${balance >= 0 ? "bg-primary-50" : "bg-red-50"} col-span-2 md:col-span-1`}>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Net Balance</p>
            <h4 className={`text-2xl font-display font-extrabold ${balance >= 0 ? "text-primary-700" : "text-red-600"}`}>
              {balance >= 0 ? "+" : "-"}₹{Math.abs(balance).toLocaleString()}
            </h4>
            <p className="text-xs font-bold mt-1 text-gray-400">{balance >= 0 ? "Profitable" : "In deficit"}</p>
          </div>
          <div className="rounded-3xl p-6 bg-blue-50 border border-gray-50 shadow-sm">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Total Entries</p>
            <h4 className="text-2xl font-display font-extrabold text-blue-600">{expenses.length}</h4>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1.5 rounded-2xl w-fit">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm capitalize transition-all ${activeTab === tab ? "bg-white shadow-sm text-gray-800" : "text-gray-400 hover:text-gray-600"}`}>
              {tab}
            </button>
          ))}
        </div>

        {/* ── Overview Tab ── */}
        {activeTab === "overview" && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Monthly chart */}
            <div className="bg-white rounded-[2rem] p-7 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 text-lg mb-5">Monthly Overview</h3>
              {monthlyData.length > 0 ? (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 11 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 10 }} tickFormatter={v => `₹${v}`} />
                      <RechartsTooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 40px rgba(0,0,0,0.08)" }} />
                      <Legend />
                      <Bar dataKey="Income" fill="#16a34a" radius={[6, 6, 0, 0]} barSize={20} />
                      <Bar dataKey="Expenses" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-56 flex flex-col items-center justify-center text-gray-300">
                  <BarChart2 className="w-12 h-12 mb-3 opacity-30" />
                  <p className="font-bold text-sm">No data yet</p>
                </div>
              )}
            </div>

            {/* Expense pie chart */}
            <div className="bg-white rounded-[2rem] p-7 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 text-lg mb-5">Expense Breakdown</h3>
              {pieData.length > 0 ? (
                <div className="flex gap-4 items-center">
                  <div className="h-56 flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                          paddingAngle={3} dataKey="value">
                          {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <RechartsTooltip formatter={v => `₹${v.toLocaleString()}`} contentStyle={{ borderRadius: "12px", border: "none" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2 text-xs min-w-0">
                    {pieData.slice(0, 7).map((d, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="text-gray-600 truncate">{d.name}</span>
                        <span className="font-bold text-gray-800 ml-auto pl-2">₹{d.value.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-56 flex flex-col items-center justify-center text-gray-300">
                  <p className="font-bold text-sm">No expense data yet</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Transactions Tab ── */}
        {activeTab === "transactions" && (
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
            {/* Filter bar */}
            <div className="flex flex-wrap gap-3 p-5 border-b">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search entries…"
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 bg-gray-50" />
              </div>
              <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
                {["all","income","expense"].map(f => (
                  <button key={f} onClick={() => setTypeFilter(f)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition-all ${typeFilter === f ? "bg-white shadow-sm text-gray-800" : "text-gray-400"}`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-16"><Loader className="w-8 h-8 animate-spin text-primary-600" /></div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Wallet className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="font-bold">No transactions found</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {filtered.map(e => (
                  <div key={e._id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors group">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg flex-shrink-0 ${e.type === "income" ? "bg-green-50" : "bg-red-50"}`}>
                      {CAT_EMOJI[e.category] || "📌"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-gray-800 truncate">{e.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-bold text-gray-400 capitalize">{CAT_LABELS[e.category] || e.category}</span>
                        <span className="text-gray-200">·</span>
                        <span className="text-[10px] text-gray-400">
                          {new Date(e.date || e.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`font-bold text-base ${e.type === "income" ? "text-green-600" : "text-red-600"}`}>
                        {e.type === "income" ? "+" : "-"}₹{e.amount.toLocaleString()}
                      </p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <button onClick={() => { setEditItem(e); setShowModal(true); }}
                        className="p-2 hover:bg-blue-50 text-blue-500 rounded-xl transition text-xs font-bold">Edit</button>
                      <button onClick={() => handleDelete(e._id)}
                        className="p-2 hover:bg-red-50 text-red-500 rounded-xl transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Analytics Tab ── */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            {/* ROI card */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-3xl p-6 text-white">
                <p className="text-primary-200 text-xs font-bold uppercase mb-2">Return on Investment</p>
                <h3 className="text-4xl font-display font-extrabold">
                  {totalOut > 0 ? Math.round((balance / totalOut) * 100) : 0}%
                </h3>
                <p className="text-primary-200 text-xs mt-2">Based on income vs expenses</p>
              </div>
              <div className="bg-white rounded-3xl p-6 border shadow-sm">
                <p className="text-gray-400 text-xs font-bold uppercase mb-2">Avg Monthly Expense</p>
                <h3 className="text-3xl font-display font-extrabold text-gray-800">
                  ₹{monthlyData.length > 0 ? Math.round(totalOut / monthlyData.length).toLocaleString() : 0}
                </h3>
              </div>
              <div className="bg-white rounded-3xl p-6 border shadow-sm">
                <p className="text-gray-400 text-xs font-bold uppercase mb-2">Biggest Expense Category</p>
                {pieData.length > 0 ? (
                  <>
                    <h3 className="text-xl font-display font-extrabold text-gray-800">{pieData.sort((a,b)=>b.value-a.value)[0]?.name}</h3>
                    <p className="text-red-500 font-bold mt-1">₹{pieData[0]?.value?.toLocaleString()}</p>
                  </>
                ) : <p className="text-gray-400 text-sm mt-2">No data yet</p>}
              </div>
            </div>

            {/* AI tips */}
            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200 rounded-3xl p-6">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-500" /> Smart Finance Tips
              </h3>
              <div className="space-y-3">
                {[
                  { icon:"💡", tip: "Reduce fertilizer costs by using organic compost for 30% of your needs" },
                  { icon:"📊", tip: "Track daily labour expenses to identify peak cost periods and plan better" },
                  { icon:"🌱", tip: "Bulk seed purchase can reduce seeds cost by up to 20% per season" },
                ].map((t, i) => (
                  <div key={i} className="flex items-start gap-3 bg-white rounded-2xl p-4 shadow-sm">
                    <span className="text-xl">{t.icon}</span>
                    <p className="text-sm text-gray-700">{t.tip}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <EntryModal
            editItem={editItem}
            onClose={() => { setShowModal(false); setEditItem(null); }}
            onSave={() => { setShowModal(false); setEditItem(null); fetchExpenses(); }}
          />
        )}
      </div>
    </FarmerLayout>
  );
}
