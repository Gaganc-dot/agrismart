import { useState, useMemo, useEffect } from "react";
import FarmerLayout from "./FarmerLayout";
import { useTranslation } from "react-i18next";
import {
  TrendingUp, Loader, IndianRupee, AlertCircle, BarChart2, Sparkles,
  Info, RotateCcw, Zap, Shield, ChevronDown, Calculator, ArrowUp, ArrowDown
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell,
  ResponsiveContainer, Tooltip as RechartsTooltip
} from "recharts";
import axios from "axios";
import toast from "react-hot-toast";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

const CHART_COLORS = ["#16a34a", "#ef4444", "#3b82f6"];

const CROP_OPTIONS = [
  "Wheat","Rice","Maize","Soybean","Cotton","Sugarcane","Tomato","Onion",
  "Potato","Chilli","Turmeric","Groundnut","Mustard","Chana Dal","Arhar Dal",
  "Banana","Mango","Apple","Garlic","Ginger","Jowar","Bajra","Other"
];
const UNIT_OPTIONS = ["kg","quintal","ton","litre","dozen","piece","bag"];

/* ── Helpers ──────────────────────────────────────────────── */
function FieldLabel({ children }) {
  return <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">{children}</label>;
}
function NumInput({ value, onChange, placeholder, prefix, suffix }) {
  return (
    <div className="relative">
      {prefix && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">{prefix}</span>}
      <input type="number" value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} min="0" step="any"
        className={`w-full border border-gray-200 bg-gray-50 rounded-xl py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition ${prefix ? "pl-8 pr-4" : suffix ? "pl-4 pr-16" : "px-4"}`} />
      {suffix && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">{suffix}</span>}
    </div>
  );
}
function RiskBadge({ level }) {
  const map = {
    Low:    { cls: "bg-green-100 text-green-700 border-green-200",  icon: <Shield className="w-3.5 h-3.5" /> },
    Medium: { cls: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: <AlertCircle className="w-3.5 h-3.5" /> },
    High:   { cls: "bg-red-100 text-red-700 border-red-200",        icon: <AlertCircle className="w-3.5 h-3.5" /> },
  };
  const { cls, icon } = map[level] || map.Medium;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${cls}`}>
      {icon} {level} Risk
    </span>
  );
}

/* ── Live calculator widget (Quantity mode only) ─────────── */
function LiveCalc({ sp, cp, qty, unit }) {
  if (!sp || !qty) return null;
  const revenue  = sp * qty;
  const expenses = cp * qty;
  const profit   = revenue - expenses;
  const roi      = expenses > 0 ? ((profit / expenses) * 100).toFixed(1) : null;
  return (
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Calculator className="w-4 h-4 text-emerald-600" />
        <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Live Preview</span>
      </div>
      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-500">Revenue: ₹{sp} × {qty} {unit}</span>
          <span className="font-bold text-green-700">₹{revenue.toLocaleString()}</span>
        </div>
        {cp > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-500">Expenses: ₹{cp} × {qty} {unit}</span>
            <span className="font-bold text-red-600">₹{expenses.toLocaleString()}</span>
          </div>
        )}
        <div className="border-t border-emerald-200 pt-1.5 flex justify-between font-bold text-sm">
          <span>Net Profit</span>
          <span className={profit >= 0 ? "text-green-700" : "text-red-600"}>
            {profit >= 0 ? "+" : ""}₹{profit.toLocaleString()}
          </span>
        </div>
        {roi !== null && (
          <div className="flex justify-between text-[10px]">
            <span className="text-gray-400">ROI</span>
            <span className={`font-bold ${parseFloat(roi) >= 0 ? "text-primary-700" : "text-red-600"}`}>{roi}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main component ───────────────────────────────────────── */
export default function ProfitPrediction() {
  const { t, i18n } = useTranslation();

  // "quantity" = exact unit-based; "area" = area-estimate mode
  const [mode, setMode] = useState("quantity");

  const [f, setF] = useState({
    cropType: "", unit: "kg",
    sellingPrice: "", costPrice: "", quantity: "",   // quantity mode
    area: "", expenses: "", marketPrice: "", season: "", // area mode
  });
  const set = (k, v) => setF(prev => ({ ...prev, [k]: v }));

  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState(null);

  // Load last saved profit prediction on mount
  useEffect(() => {
    const loadSaved = async () => {
      try {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        const { data } = await axios.get(`${API}/api/ai/latest-recommendation?type=profit`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (data.success && data.recommendation) {
          const { inputs, result: savedResult } = data.recommendation;
          if (inputs) {
            if (inputs.cropType !== undefined) setF(prev => ({ ...prev, cropType: inputs.cropType || "" }));
            if (inputs.unit !== undefined) setF(prev => ({ ...prev, unit: inputs.unit || "kg" }));
            if (inputs.sellingPricePerUnit !== undefined) setF(prev => ({ ...prev, sellingPrice: String(inputs.sellingPricePerUnit || "") }));
            if (inputs.costPricePerUnit !== undefined) setF(prev => ({ ...prev, costPrice: String(inputs.costPricePerUnit || "") }));
            if (inputs.quantitySold !== undefined) setF(prev => ({ ...prev, quantity: String(inputs.quantitySold || "") }));
            if (inputs.area !== undefined) setF(prev => ({ ...prev, area: String(inputs.area || "") }));
            if (inputs.expenses !== undefined) setF(prev => ({ ...prev, expenses: String(inputs.expenses || "") }));
            if (inputs.marketPrice !== undefined) setF(prev => ({ ...prev, marketPrice: String(inputs.marketPrice || "") }));
            if (inputs.quantitySold || inputs.sellingPricePerUnit) setMode("quantity");
            else if (inputs.area || inputs.marketPrice) setMode("area");
          }
          if (savedResult) setResult(savedResult);
        }
      } catch { /* silent */ }
    };
    loadSaved();
  }, []);

  // Derived live values (quantity mode)
  const sp  = parseFloat(f.sellingPrice) || 0;
  const cp  = parseFloat(f.costPrice)    || 0;
  const qty = parseFloat(f.quantity)     || 0;

  const handlePredict = async () => {
    if (mode === "quantity") {
      if (!f.cropType || !f.sellingPrice || !f.quantity)
        return toast.error("Fill Crop, Selling Price and Quantity");
    } else {
      if (!f.cropType || !f.area || !f.expenses || !f.marketPrice)
        return toast.error("Fill all required fields");
    }
    setLoading(true);
    setResult(null);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const payload = mode === "quantity"
        ? { cropType: f.cropType, sellingPricePerUnit: sp, costPricePerUnit: cp, quantitySold: qty, unit: f.unit, langName: i18n.language }
        : { cropType: f.cropType, area: f.area, expenses: f.expenses, marketPrice: f.marketPrice, season: f.season, langName: i18n.language };

      const { data } = await axios.post(`${API}/api/ai/profit-prediction`, payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const raw = typeof data.text === "string"
        ? data.text.replace(/^```json\s*/m, "").replace(/```\s*$/m, "").trim()
        : JSON.stringify(data.text);
      setResult(JSON.parse(raw));
      toast.success("Profit prediction ready!");
    } catch { toast.error("Prediction failed — please try again"); }
    finally { setLoading(false); }
  };

  const reset = () => {
    setF({ cropType: "", unit: "kg", sellingPrice: "", costPrice: "", quantity: "", area: "", expenses: "", marketPrice: "", season: "" });
    setResult(null);
  };

  const roiPct = result?.roiPercentage ?? 0;

  return (
    <FarmerLayout>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Hero ── */}
        <div className="bg-gradient-to-br from-emerald-700 via-teal-700 to-cyan-800 rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 opacity-10 text-[180px] leading-none pointer-events-none select-none">💰</div>
          <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="font-display text-3xl font-extrabold flex items-center gap-3">
                <TrendingUp className="w-8 h-8" /> {t("profit.title")}
              </h2>
              <p className="text-emerald-100 mt-1 text-sm">{t("profit.subtitle")}</p>
              <div className="mt-2 flex gap-2 flex-wrap">
                {["Revenue = Price × Qty","Profit = Revenue − Expenses","ROI = Profit ÷ Cost × 100%"].map(f => (
                  <span key={f} className="text-[10px] bg-white/20 px-2.5 py-1 rounded-full font-mono">{f}</span>
                ))}
              </div>
            </div>
            {result && (
              <button onClick={reset} className="bg-white/20 hover:bg-white/30 text-white font-bold py-2.5 px-5 rounded-xl transition flex items-center gap-2 text-sm">
                <RotateCcw className="w-4 h-4" /> New Prediction
              </button>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* ── Form Panel ── */}
          <div className="bg-white rounded-[2rem] p-7 border border-gray-100 shadow-sm space-y-5">
            <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-600" /> Farm Details
            </h3>

            {/* Mode selector */}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
              {[{ id:"quantity", label:"📦 Exact Qty" }, { id:"area", label:"🌾 Area Estimate" }].map(m => (
                <button key={m.id} onClick={() => setMode(m.id)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${mode === m.id ? "bg-white shadow text-emerald-700" : "text-gray-500"}`}>
                  {m.label}
                </button>
              ))}
            </div>

            {/* Crop */}
            <div>
              <FieldLabel>Crop Type *</FieldLabel>
              <div className="relative">
                <select value={f.cropType} onChange={e => set("cropType", e.target.value)}
                  className="w-full appearance-none border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 pr-10 text-gray-700">
                  <option value="">Select crop…</option>
                  {CROP_OPTIONS.map(c => <option key={c}>{c}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {mode === "quantity" ? (
              <>
                {/* Unit */}
                <div>
                  <FieldLabel>Unit</FieldLabel>
                  <div className="relative">
                    <select value={f.unit} onChange={e => set("unit", e.target.value)}
                      className="w-full appearance-none border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 pr-10">
                      {UNIT_OPTIONS.map(u => <option key={u}>{u}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Selling price */}
                <div>
                  <FieldLabel>Selling Price (₹ per {f.unit}) *</FieldLabel>
                  <NumInput value={f.sellingPrice} onChange={v => set("sellingPrice", v)} placeholder="e.g. 13" prefix="₹" />
                  <p className="text-[10px] text-gray-400 mt-1">The price you receive per {f.unit}</p>
                </div>

                {/* Cost price */}
                <div>
                  <FieldLabel>Cost Price (₹ per {f.unit})</FieldLabel>
                  <NumInput value={f.costPrice} onChange={v => set("costPrice", v)} placeholder="e.g. 10" prefix="₹" />
                  <p className="text-[10px] text-gray-400 mt-1">Your production cost per {f.unit}</p>
                </div>

                {/* Quantity */}
                <div>
                  <FieldLabel>Quantity Sold ({f.unit}) *</FieldLabel>
                  <NumInput value={f.quantity} onChange={v => set("quantity", v)} placeholder="e.g. 100" suffix={f.unit} />
                  <p className="text-[10px] text-gray-400 mt-1">Total quantity sold or expected to sell</p>
                </div>

                {/* Live preview */}
                <LiveCalc sp={sp} cp={cp} qty={qty} unit={f.unit} />
              </>
            ) : (
              <>
                <div>
                  <FieldLabel>Farm Area (acres) *</FieldLabel>
                  <NumInput value={f.area} onChange={v => set("area", v)} placeholder="e.g. 2.5" />
                </div>
                <div>
                  <FieldLabel>Total Expenses (₹) *</FieldLabel>
                  <NumInput value={f.expenses} onChange={v => set("expenses", v)} placeholder="e.g. 25000" prefix="₹" />
                </div>
                <div>
                  <FieldLabel>Expected Market Price (₹/Quintal) *</FieldLabel>
                  <NumInput value={f.marketPrice} onChange={v => set("marketPrice", v)} placeholder="e.g. 2000" prefix="₹" />
                </div>
                <div>
                  <FieldLabel>Season</FieldLabel>
                  <div className="relative">
                    <select value={f.season} onChange={e => set("season", e.target.value)}
                      className="w-full appearance-none border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 pr-10 text-gray-700">
                      <option value="">Select season…</option>
                      {["Kharif (Jun–Oct)","Rabi (Nov–Apr)","Zaid (Mar–Jun)","Year Round"].map(s => <option key={s}>{s}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </>
            )}

            <button onClick={handlePredict} disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2">
              {loading ? <><Loader className="w-5 h-5 animate-spin" /> Analyzing…</> : <><Sparkles className="w-5 h-5" /> {t("profit.calculate")}</>}
            </button>
          </div>

          {/* ── Results Panel ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Loading */}
            {loading && (
              <div className="bg-white rounded-[2rem] p-16 border border-gray-100 shadow-sm flex flex-col items-center gap-4">
                <div className="w-16 h-16 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
                <p className="text-emerald-700 font-bold animate-pulse">Calculating your profit…</p>
                <p className="text-gray-400 text-sm">AI is crunching price × quantity × costs</p>
              </div>
            )}

            {result && !loading && (
              <>
                {/* Formula banner (quantity mode) */}
                {result.quantitySold && (
                  <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl px-5 py-3 text-white flex items-center gap-2 flex-wrap text-sm">
                    <span className="font-mono bg-white/20 px-2.5 py-1 rounded-lg text-xs">₹{result.pricePerUnit}/{result.unit}</span>
                    <span className="opacity-60">×</span>
                    <span className="font-mono bg-white/20 px-2.5 py-1 rounded-lg text-xs">{result.quantitySold} {result.unit}</span>
                    <span className="opacity-60">=</span>
                    <span className="font-mono bg-white/30 font-bold px-2.5 py-1 rounded-lg">₹{result.totalRevenue?.toLocaleString()} revenue</span>
                  </div>
                )}

                {/* Key metric cards */}
                <div className="grid md:grid-cols-3 gap-4">
                  {/* Revenue */}
                  <div className="bg-white rounded-3xl p-6 border border-green-100 shadow-sm">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-1">
                      <ArrowUp className="w-3.5 h-3.5 text-green-500" /> {t("profit.revenue")}
                    </p>
                    <h4 className="text-3xl font-display font-extrabold text-gray-800">
                      ₹{result.totalRevenue?.toLocaleString()}
                    </h4>
                    {result.quantitySold && (
                      <p className="text-[10px] text-gray-400 mt-1">
                        ₹{result.pricePerUnit}/{result.unit} × {result.quantitySold} {result.unit}
                      </p>
                    )}
                  </div>

                  {/* Expenses */}
                  <div className="bg-white rounded-3xl p-6 border border-red-100 shadow-sm">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-1">
                      <ArrowDown className="w-3.5 h-3.5 text-red-500" /> Total Expenses
                    </p>
                    <h4 className="text-3xl font-display font-extrabold text-red-600">
                      ₹{(result.totalExpenses ?? 0)?.toLocaleString()}
                    </h4>
                    {result.costPerUnit > 0 && result.quantitySold && (
                      <p className="text-[10px] text-gray-400 mt-1">
                        ₹{result.costPerUnit}/{result.unit} × {result.quantitySold} {result.unit}
                      </p>
                    )}
                  </div>

                  {/* Net Profit */}
                  <div className={`rounded-3xl p-6 border shadow-sm ${result.netProfit >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                    <p className="text-xs font-bold text-gray-400 uppercase mb-2">Net Profit</p>
                    <h4 className={`text-3xl font-display font-extrabold ${result.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {result.netProfit >= 0 ? "+" : ""}₹{Math.abs(result.netProfit)?.toLocaleString()}
                    </h4>
                    <div className="flex items-center justify-between mt-2 flex-wrap gap-1">
                      <RiskBadge level={result.riskLevel || "Medium"} />
                      <span className={`text-xs font-bold ${roiPct >= 0 ? "text-primary-700" : "text-red-600"}`}>ROI: {roiPct}%</span>
                    </div>
                  </div>
                </div>

                {/* Chart */}
                {result.chartData && (
                  <div className="bg-white rounded-[2rem] p-7 border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-gray-800 mb-5 flex items-center gap-2">
                      <BarChart2 className="w-5 h-5 text-emerald-600" /> Financial Breakdown
                    </h3>
                    <div className="grid md:grid-cols-2 gap-6 items-center">
                      <div className="h-52">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={result.chartData} barCategoryGap="35%">
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0fdf4" />
                            <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 700 }} />
                            <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `₹${Math.round(v / 1000)}k`} />
                            <RechartsTooltip
                              formatter={v => [`₹${Number(v).toLocaleString()}`, ""]}
                              contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }} />
                            <Bar dataKey="value" radius={[8,8,0,0]}>
                              {result.chartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="space-y-2.5">
                        {result.chartData.map((d, i) => (
                          <div key={i} className="flex items-center justify-between gap-3 bg-gray-50 rounded-xl p-3">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                              <span className="text-sm font-bold text-gray-700">{d.name}</span>
                            </div>
                            <span className="font-bold text-gray-800">₹{Number(d.value)?.toLocaleString()}</span>
                          </div>
                        ))}
                        <div className={`flex items-center justify-between gap-3 rounded-xl p-3 border-2 font-bold ${result.netProfit >= 0 ? "bg-green-50 border-green-300 text-green-700" : "bg-red-50 border-red-300 text-red-600"}`}>
                          <span className="text-sm">Net Balance</span>
                          <span>{result.netProfit >= 0 ? "+" : ""}₹{Math.abs(result.netProfit)?.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Details */}
                <div className="bg-white rounded-[2rem] p-7 border border-gray-100 shadow-sm space-y-4">
                  <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                    <Info className="w-5 h-5 text-blue-500" /> Prediction Details
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-2xl p-4">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Yield / Quantity</p>
                      <p className="font-bold text-gray-800 text-sm">{result.estimatedYield}</p>
                    </div>
                    <div className="bg-gray-50 rounded-2xl p-4">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">{t("profit.breakEven")}</p>
                      <p className="font-bold text-gray-800 text-sm">{result.breakEvenPoint}</p>
                    </div>
                    <div className="bg-gray-50 rounded-2xl p-4">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">ROI</p>
                      <p className={`font-extrabold text-2xl ${roiPct >= 0 ? "text-primary-700" : "text-red-600"}`}>{roiPct}%</p>
                    </div>
                    <div className="bg-gray-50 rounded-2xl p-4">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">{t("profit.risk")}</p>
                      <RiskBadge level={result.riskLevel || "Medium"} />
                    </div>
                  </div>
                  {result.advice && (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
                      <p className="text-xs font-bold text-emerald-700 mb-2 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" /> AI Advice
                      </p>
                      <p className="text-sm text-gray-700 leading-relaxed">{result.advice}</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Empty state */}
            {!result && !loading && (
              <div className="bg-white rounded-[2rem] p-12 border border-gray-100 shadow-sm flex flex-col items-center gap-4">
                <TrendingUp className="w-16 h-16 text-gray-200" />
                <div className="text-center">
                  <p className="font-bold text-lg text-gray-500">Enter farm details to predict profit</p>
                  <p className="text-sm text-gray-400 mt-1">Use Exact Qty for precise quantity-based calculation</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-xs text-gray-600 space-y-1 w-full max-w-xs">
                  <p className="font-bold text-emerald-700 mb-2 flex items-center gap-1"><Calculator className="w-3.5 h-3.5" /> Correct Formula</p>
                  <p>Revenue = Selling Price × Quantity</p>
                  <p>Expenses = Cost Price × Quantity</p>
                  <p>Profit = Revenue − Expenses</p>
                  <p>ROI = (Profit ÷ Expenses) × 100%</p>
                  <p className="text-[10px] text-gray-400 mt-2 border-t border-emerald-100 pt-2">
                    Example: ₹13/kg × 100 kg = ₹1,300 revenue
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </FarmerLayout>
  );
}
