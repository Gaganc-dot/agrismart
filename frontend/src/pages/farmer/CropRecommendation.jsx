import { useState, useEffect, useRef } from "react";
import FarmerLayout from "./FarmerLayout";
import { useTranslation } from "react-i18next";
import {
  Sprout, Loader, ChevronDown, RotateCcw, Droplet, Thermometer,
  Wind, Zap, Activity, ShieldCheck, MapPin, Sparkles, Star,
  Clock, TrendingUp, Leaf, Beaker, Sun, CloudRain, Info,
  CheckCircle2, AlertCircle, ArrowRight, FlaskConical, Trophy
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  Legend, ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis
} from "recharts";
import axios from "axios";
import toast from "react-hot-toast";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

// ── Confidence Ring (SVG circular progress) ──────────────────────────────────
function ConfidenceRing({ value, size = 72 }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  const color = value >= 80 ? "#16a34a" : value >= 60 ? "#f59e0b" : "#ef4444";
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={8} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={8}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s ease" }} />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
        className="rotate-90" style={{ transform: `rotate(90deg) translate(0, -${size}px)`, fill: color, fontSize: size * 0.22, fontWeight: 800 }}>
        {value}%
      </text>
    </svg>
  );
}

// ── NPK Bar ──────────────────────────────────────────────────────────────────
function NPKBar({ label, current, ideal, color }) {
  const max = Math.max(current, ideal, 100);
  const curPct = Math.min((current / max) * 100, 100);
  const idealPct = Math.min((ideal / max) * 100, 100);
  const diff = current - ideal;
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-bold text-gray-600">{label}</span>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-400">Current: <b className="text-gray-700">{current}</b></span>
          <span className="text-gray-300">|</span>
          <span className="text-gray-400">Ideal: <b style={{ color }}>{ideal}</b></span>
          <span className={`font-bold text-xs ${diff > 0 ? "text-green-600" : diff < 0 ? "text-red-500" : "text-gray-400"}`}>
            {diff > 0 ? `+${diff}` : diff}
          </span>
        </div>
      </div>
      <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
        <div className="absolute h-full rounded-full opacity-30 transition-all duration-700" style={{ width: `${curPct}%`, background: color }} />
        <div className="absolute h-full rounded-full transition-all duration-700" style={{ width: `${idealPct}%`, background: color, opacity: 0.8 }} />
      </div>
    </div>
  );
}

// ── Select Field ─────────────────────────────────────────────────────────────
function SelectField({ label, value, onChange, options, accent = "emerald" }) {
  return (
    <div>
      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">{label}</label>
      <div className="relative">
        <select value={value} onChange={e => onChange(e.target.value)}
          className={`w-full appearance-none border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-${accent}-400 focus:bg-white transition pr-10 text-gray-700`}>
          <option value="">-- Select --</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
}

// ── Range Slider ─────────────────────────────────────────────────────────────
function RangeSlider({ label, value, min, max, unit, onChange, color = "#16a34a", icon: Icon }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <label className="text-xs font-bold text-gray-600 flex items-center gap-1">
          {Icon && <Icon className="w-3 h-3" />} {label}
        </label>
        <span className="text-xs font-extrabold px-2 py-0.5 rounded-lg bg-gray-100" style={{ color }}>{value} {unit}</span>
      </div>
      <div className="relative h-2 bg-gray-100 rounded-full">
        <div className="absolute h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
        <input type="range" min={min} max={max} value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-full" />
        <div className="absolute w-4 h-4 rounded-full border-2 border-white shadow-md -translate-y-1/4 -translate-x-1/2 transition-all"
          style={{ left: `${pct}%`, background: color }} />
      </div>
      <div className="flex justify-between text-[10px] text-gray-400">
        <span>{min}</span><span>{max}</span>
      </div>
    </div>
  );
}

// ── Market Demand Badge ───────────────────────────────────────────────────────
function DemandBadge({ level }) {
  const map = {
    High: "bg-green-100 text-green-700 border-green-200",
    Medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
    Low: "bg-red-100 text-red-700 border-red-200",
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${map[level] || map.Medium}`}>
      {level} Demand
    </span>
  );
}

// ── Crop Card ────────────────────────────────────────────────────────────────
function CropCard({ crop, idx, isSelected, onSelect, advForm }) {
  const RING_COLORS = ["border-emerald-400 ring-4 ring-emerald-50", "border-blue-300 ring-2 ring-blue-50", "border-gray-200"];
  const BADGE_COLORS = ["bg-emerald-500", "bg-blue-500", "bg-gray-400"];
  const LABELS = ["🏆 Top Match", "2nd Choice", "3rd Pick"];

  return (
    <div
      onClick={() => onSelect(idx)}
      className={`bg-white rounded-2xl p-5 border cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg ${isSelected ? RING_COLORS[Math.min(idx, 2)] : "border-gray-200 hover:border-gray-300"} shadow-sm relative overflow-hidden`}
    >
      <div className={`absolute top-0 right-0 ${BADGE_COLORS[Math.min(idx, 2)]} text-white text-[9px] font-bold px-2.5 py-1 rounded-bl-xl`}>
        {LABELS[Math.min(idx, 2)]}
      </div>

      <div className="flex items-start gap-3 mb-3">
        <ConfidenceRing value={crop.confidence} size={60} />
        <div className="flex-1 pt-1">
          <h4 className="font-display font-extrabold text-lg text-gray-800 leading-tight">{crop.name}</h4>
          <DemandBadge level={crop.marketDemand || "Medium"} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
        <div className="bg-gray-50 rounded-xl p-2.5">
          <p className="text-gray-400 mb-0.5">Yield / acre</p>
          <p className="font-bold text-gray-700 text-sm">{crop.yield}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-2.5">
          <p className="text-gray-400 mb-0.5">Duration</p>
          <p className="font-bold text-gray-700 text-sm">{crop.duration}</p>
        </div>
      </div>

      <p className="text-xs text-gray-500 leading-relaxed italic border-t border-gray-100 pt-2">
        "{crop.reasoning}"
      </p>
    </div>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────
export function CropRecommendationContent() {
  const { t, i18n } = useTranslation();
  const [basicForm, setBasicForm] = useState({ soil: "", season: "", water: "", state: "", area: "", budget: "" });
  const [advForm, setAdvForm] = useState({ n: 50, p: 50, k: 50, ph: 6.5, temp: 25, humidity: 60, rainfall: 100 });
  const [showAdv, setShowAdv] = useState(false);
  const [iotData, setIotData] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const fetchIot = async () => {
      try {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        const { data } = await axios.get(`${API}/api/iot/sensors`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIotData(data.data);
      } catch { /* no IoT device connected */ }
    };
    fetchIot();
    const iv = setInterval(fetchIot, 5000);
    return () => clearInterval(iv);
  }, []);

  // Load last saved crop recommendation on mount
  useEffect(() => {
    const loadSaved = async () => {
      try {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        const { data } = await axios.get(`${API}/api/ai/latest-recommendation?type=crop`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (data.success && data.recommendation) {
          const { inputs, result: savedResult } = data.recommendation;
          if (inputs && inputs.basicForm) setBasicForm(inputs.basicForm);
          if (inputs && inputs.advForm) setAdvForm(inputs.advForm);
          if (savedResult) setResult(savedResult);
        }
      } catch { /* silent */ }
    };
    loadSaved();
  }, []);

  const handleAutoFill = () => {
    if (!iotData) return toast.error("No sensor data available.");
    setAdvForm({
      n: iotData.nitrogen, p: iotData.phosphorus, k: iotData.potassium,
      ph: iotData.ph, temp: iotData.temperature, humidity: iotData.humidity,
      rainfall: iotData.rainfall,
    });
    setShowAdv(true);
    toast.success("Sensor data synced! 📡");
  };

  const handleSubmit = async () => {
    if (!basicForm.soil || !basicForm.season || !basicForm.water || !basicForm.state) {
      return toast.error("Please fill all required fields.");
    }
    setLoading(true);
    setResult(null);
    setSelectedCrop(0);
    setActiveTab("overview");

    const prompt = `You are an expert AI agricultural advisor. Analyze the following farm conditions and provide top 3 crop recommendations.

Farm Details:
- State: ${basicForm.state}
- Soil Type: ${basicForm.soil}
- Season: ${basicForm.season}
- Water Availability: ${basicForm.water}
- Farm Area: ${basicForm.area || "not specified"} acres
- Budget: ${basicForm.budget || "not specified"}

Sensor / Environmental Data:
- Nitrogen (N): ${advForm.n} mg/kg
- Phosphorus (P): ${advForm.p} mg/kg
- Potassium (K): ${advForm.k} mg/kg
- Soil pH: ${advForm.ph}
- Temperature: ${advForm.temp}°C
- Humidity: ${advForm.humidity}%
- Expected Rainfall: ${advForm.rainfall} mm

Respond ONLY with a valid JSON object:
{
  "crops": [
    {
      "name": "Crop Name with emoji",
      "confidence": 92,
      "yield": "20-25 quintals/acre",
      "duration": "90-120 days",
      "marketDemand": "High",
      "waterReq": "Moderate (500-700mm)",
      "idealTemp": "20-30°C",
      "fertilizer": "Fertilizer recommendation in 1 sentence",
      "idealNPK": [80, 60, 40],
      "idealPH": 6.5,
      "pestRisk": "Low",
      "profitMargin": "High",
      "bestMonths": "June-October",
      "govtSupport": "MSP available / PM-KISAN eligible",
      "reasoning": "2 sentences in ${i18n.language} on why this crop matches the inputs perfectly.",
      "tips": ["Tip 1", "Tip 2", "Tip 3"]
    }
  ]
}`;

    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const { data } = await axios.post(`${API}/api/ai/crop-recommendation`,
        { prompt, inputs: { basicForm, advForm } },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.success) {
        const clean = data.text.replace(/^```json/m, "").replace(/^```/m, "").trim();
        setResult(JSON.parse(clean));
        toast.success("AI analysis complete! 🌱");
      }
    } catch {
      toast.error("AI engine failed — please retry.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setBasicForm({ soil: "", season: "", water: "", state: "", area: "", budget: "" });
    setAdvForm({ n: 50, p: 50, k: 50, ph: 6.5, temp: 25, humidity: 60, rainfall: 100 });
    setResult(null);
    setSelectedCrop(0);
  };

  const crop = result?.crops?.[selectedCrop];

  // NPK comparison chart data
  const npkData = crop ? [
    { label: "N", current: advForm.n, ideal: crop.idealNPK?.[0] || 0 },
    { label: "P", current: advForm.p, ideal: crop.idealNPK?.[1] || 0 },
    { label: "K", current: advForm.k, ideal: crop.idealNPK?.[2] || 0 },
  ] : [];

  const TABS = [
    { id: "overview", label: "Overview", icon: Leaf },
    { id: "soil", label: "Soil & NPK", icon: Beaker },
    { id: "tips", label: "Expert Tips", icon: Sparkles },
  ];

  const STATES = [
    "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
    "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka",
    "Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram",
    "Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
    "Tripura","Uttar Pradesh","Uttarakhand","West Bengal"
  ];

  return (
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Hero Header ── */}
        <div className="bg-gradient-to-br from-green-700 via-emerald-700 to-teal-800 rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 opacity-10 text-[180px] leading-none pointer-events-none select-none">🌱</div>
          <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="font-display text-3xl font-extrabold flex items-center gap-3">
                <Sprout className="w-8 h-8" /> {t("crop.title")}
              </h2>
              <p className="text-green-100 mt-2 text-sm max-w-lg">{t("crop.subtitle")}</p>
              <div className="flex gap-3 mt-3 flex-wrap">
                {["AI-Powered","NPK Analysis","IoT Ready","Multi-Crop"].map(tag => (
                  <span key={tag} className="text-[11px] font-bold bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">{tag}</span>
                ))}
              </div>
            </div>
            {result && (
              <button onClick={reset} className="bg-white/20 hover:bg-white/30 text-white font-bold py-2.5 px-5 rounded-xl transition flex items-center gap-2 text-sm">
                <RotateCcw className="w-4 h-4" /> New Analysis
              </button>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* ── Input Panel ── */}
          <div className="bg-white rounded-[2rem] p-7 border border-gray-100 shadow-sm space-y-5">
            <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-600" /> Farm Details
            </h3>

            <SelectField label="State *" value={basicForm.state} onChange={v => setBasicForm({ ...basicForm, state: v })} options={STATES} />
            <SelectField label="Soil Type *" value={basicForm.soil} onChange={v => setBasicForm({ ...basicForm, soil: v })}
              options={["Red Soil","Black Cotton Soil","Alluvial Soil","Laterite Soil","Sandy Loam","Clay Loam","Loamy","Sandy","Saline","Other"]} />
            <SelectField label="Season *" value={basicForm.season} onChange={v => setBasicForm({ ...basicForm, season: v })}
              options={["Kharif (Jun–Oct)","Rabi (Nov–Apr)","Zaid (Mar–Jun)","Year Round"]} />
            <SelectField label="Water Availability *" value={basicForm.water} onChange={v => setBasicForm({ ...basicForm, water: v })}
              options={["Rain-fed","Canal Irrigation","Drip Irrigation","Borewell","Limited","Abundant"]} />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Area (acres)</label>
                <input type="number" value={basicForm.area} onChange={e => setBasicForm({ ...basicForm, area: e.target.value })}
                  placeholder="e.g. 3" className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Budget (₹)</label>
                <input type="number" value={basicForm.budget} onChange={e => setBasicForm({ ...basicForm, budget: e.target.value })}
                  placeholder="e.g. 50000" className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition" />
              </div>
            </div>

            {/* Advanced Sensors */}
            <div>
              <button onClick={() => setShowAdv(!showAdv)}
                className="w-full flex items-center justify-between text-sm font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-4 py-3 rounded-xl transition">
                <span className="flex items-center gap-2"><Activity className="w-4 h-4" /> Advanced Sensor Data</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showAdv ? "rotate-180" : ""}`} />
              </button>

              {showAdv && (
                <div className="mt-3 bg-gray-50 rounded-2xl p-5 border border-gray-100 space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Soil & Climate</p>
                    <button onClick={handleAutoFill}
                      className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg font-bold hover:bg-blue-200 transition flex items-center gap-1">
                      <Zap className="w-3 h-3" /> Auto IoT
                    </button>
                  </div>

                  <RangeSlider label="Nitrogen (N)" value={advForm.n} min={0} max={150} unit="mg/kg"
                    color="#16a34a" icon={Leaf} onChange={v => setAdvForm({ ...advForm, n: v })} />
                  <RangeSlider label="Phosphorus (P)" value={advForm.p} min={0} max={100} unit="mg/kg"
                    color="#9333ea" icon={FlaskConical} onChange={v => setAdvForm({ ...advForm, p: v })} />
                  <RangeSlider label="Potassium (K)" value={advForm.k} min={0} max={300} unit="mg/kg"
                    color="#ea580c" icon={Beaker} onChange={v => setAdvForm({ ...advForm, k: v })} />
                  <RangeSlider label="Soil pH" value={advForm.ph} min={0} max={14} unit="pH"
                    color="#0284c7" icon={Droplet} onChange={v => setAdvForm({ ...advForm, ph: v })} />
                  <RangeSlider label="Temperature" value={advForm.temp} min={0} max={50} unit="°C"
                    color="#dc2626" icon={Thermometer} onChange={v => setAdvForm({ ...advForm, temp: v })} />
                  <RangeSlider label="Humidity" value={advForm.humidity} min={0} max={100} unit="%"
                    color="#0891b2" icon={Wind} onChange={v => setAdvForm({ ...advForm, humidity: v })} />
                  <RangeSlider label="Rainfall" value={advForm.rainfall} min={0} max={500} unit="mm"
                    color="#1d4ed8" icon={CloudRain} onChange={v => setAdvForm({ ...advForm, rainfall: v })} />
                </div>
              )}
            </div>

            <button onClick={handleSubmit} disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2 text-base">
              {loading
                ? <><Loader className="w-5 h-5 animate-spin" /> Analyzing Farm…</>
                : <><Sparkles className="w-5 h-5" /> {t("crop.predict")}</>}
            </button>

            {/* Demo Quick Fill */}
            <button onClick={() => {
              setBasicForm({ soil: "Black Cotton Soil", season: "Kharif (Jun–Oct)", water: "Canal Irrigation", state: "Maharashtra", area: "3", budget: "50000" });
              setAdvForm({ n: 80, p: 40, k: 60, ph: 6.8, temp: 28, humidity: 72, rainfall: 180 });
              setShowAdv(true);
              toast("Demo data filled!", { icon: "🌾" });
            }} className="w-full text-xs font-bold text-gray-400 hover:text-emerald-600 py-2 rounded-xl hover:bg-emerald-50 transition text-center">
              Try with demo farm data →
            </button>
          </div>

          {/* ── Results Panel ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Loading */}
            {loading && (
              <div className="bg-white rounded-[2rem] p-16 border border-gray-100 shadow-sm flex flex-col items-center gap-5">
                <div className="relative w-20 h-20">
                  <div className="absolute inset-0 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
                  <div className="absolute inset-3 border-4 border-teal-100 border-b-teal-500 rounded-full animate-spin" style={{ animationDirection: "reverse", animationDuration: "0.8s" }} />
                  <Sprout className="absolute inset-0 m-auto w-6 h-6 text-emerald-600" />
                </div>
                <div className="text-center">
                  <p className="text-emerald-700 font-bold text-lg animate-pulse">Analyzing your farm conditions…</p>
                  <p className="text-gray-400 text-sm mt-1">Matching soil, climate & NPK data to optimal crops</p>
                </div>
              </div>
            )}

            {/* Empty state */}
            {!result && !loading && (
              <div className="bg-white rounded-[2rem] p-16 border border-gray-100 shadow-sm flex flex-col items-center gap-4 text-gray-300">
                <Sprout className="w-16 h-16 opacity-20" />
                <div className="text-center">
                  <p className="font-bold text-lg text-gray-400">Fill farm details to get crop recommendations</p>
                  <p className="text-sm mt-1 text-gray-300">AI will match your soil, climate & NPK to best crops</p>
                </div>
              </div>
            )}

            {result && !loading && (
              <>
                {/* Crop Cards Row */}
                <div className="grid md:grid-cols-3 gap-4">
                  {result.crops?.map((c, i) => (
                    <CropCard key={i} crop={c} idx={i}
                      isSelected={selectedCrop === i}
                      onSelect={setSelectedCrop}
                      advForm={advForm} />
                  ))}
                </div>

                {/* Detail Panel for Selected Crop */}
                {crop && (
                  <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                    {/* Crop Header */}
                    <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-display text-2xl font-extrabold">{crop.name}</h3>
                          <p className="text-emerald-100 text-sm mt-1">{crop.reasoning}</p>
                        </div>
                        <ConfidenceRing value={crop.confidence} size={80} />
                      </div>
                      <div className="flex gap-4 mt-4 flex-wrap">
                        {[
                          { icon: TrendingUp, label: "Profit", val: crop.profitMargin },
                          { icon: Clock, label: "Duration", val: crop.duration },
                          { icon: Sun, label: "Best Months", val: crop.bestMonths },
                          { icon: ShieldCheck, label: "Pest Risk", val: crop.pestRisk },
                        ].map(({ icon: Icon, label, val }) => val && (
                          <div key={label} className="bg-white/20 backdrop-blur-sm rounded-xl px-3 py-2 text-xs">
                            <div className="flex items-center gap-1 text-emerald-100 mb-0.5">
                              <Icon className="w-3 h-3" /> {label}
                            </div>
                            <p className="font-bold text-white">{val}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-gray-100 bg-gray-50">
                      {TABS.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                          className={`flex items-center gap-1.5 px-5 py-3.5 text-sm font-bold transition border-b-2 ${activeTab === tab.id ? "border-emerald-500 text-emerald-700 bg-white" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
                          <tab.icon className="w-4 h-4" /> {tab.label}
                        </button>
                      ))}
                    </div>

                    <div className="p-6">
                      {/* Overview Tab */}
                      {activeTab === "overview" && (
                        <div className="space-y-4">
                          <div className="grid md:grid-cols-3 gap-4">
                            {[
                              { label: "Yield / Acre", val: crop.yield, color: "emerald" },
                              { label: "Water Requirement", val: crop.waterReq, color: "blue" },
                              { label: "Ideal Temperature", val: crop.idealTemp, color: "orange" },
                            ].map(({ label, val, color }) => (
                              <div key={label} className={`bg-${color}-50 border border-${color}-100 rounded-2xl p-4`}>
                                <p className={`text-xs font-bold text-${color}-600 mb-1`}>{label}</p>
                                <p className="font-bold text-gray-800 text-sm">{val || "—"}</p>
                              </div>
                            ))}
                          </div>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="bg-gray-50 rounded-2xl p-4">
                              <p className="text-xs font-bold text-gray-500 mb-1">Fertilizer Advice</p>
                              <p className="text-sm text-gray-700 leading-relaxed">{crop.fertilizer}</p>
                            </div>
                            {crop.govtSupport && (
                              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                                <p className="text-xs font-bold text-blue-600 mb-1 flex items-center gap-1">
                                  <ShieldCheck className="w-3 h-3" /> Govt. Support
                                </p>
                                <p className="text-sm text-gray-700">{crop.govtSupport}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Soil & NPK Tab */}
                      {activeTab === "soil" && (
                        <div className="space-y-5">
                          <div className="space-y-3">
                            <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                              <Beaker className="w-4 h-4 text-purple-500" /> NPK Comparison (Current vs. Ideal)
                            </h4>
                            <NPKBar label="Nitrogen (N)" current={advForm.n} ideal={crop.idealNPK?.[0] || 0} color="#16a34a" />
                            <NPKBar label="Phosphorus (P)" current={advForm.p} ideal={crop.idealNPK?.[1] || 0} color="#9333ea" />
                            <NPKBar label="Potassium (K)" current={advForm.k} ideal={crop.idealNPK?.[2] || 0} color="#ea580c" />
                          </div>
                          <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={npkData} barCategoryGap="30%">
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0fdf4" />
                                <XAxis dataKey="label" tick={{ fontSize: 12, fontWeight: 700 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <RechartsTooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
                                <Legend />
                                <Bar dataKey="current" name="Your Soil" fill="#6ee7b7" radius={[6, 6, 0, 0]} />
                                <Bar dataKey="ideal" name={`Ideal for ${crop.name}`} fill="#059669" radius={[6, 6, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="bg-gray-50 rounded-2xl p-4 flex items-center gap-3">
                            <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />
                            <p className="text-xs text-gray-600">
                              Ideal soil pH for <b>{crop.name}</b>: <b className="text-blue-600">{crop.idealPH}</b>.
                              Your current pH is <b className="text-gray-700">{advForm.ph}</b>.
                              {Math.abs(advForm.ph - (crop.idealPH || 7)) < 0.5
                                ? " ✅ Perfect match!"
                                : advForm.ph < (crop.idealPH || 7)
                                  ? " ⚠️ Consider lime application to raise pH."
                                  : " ⚠️ Consider sulfur application to lower pH."}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Tips Tab */}
                      {activeTab === "tips" && (
                        <div className="space-y-3">
                          <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-amber-500" /> Expert Tips for {crop.name}
                          </h4>
                          {crop.tips?.length ? (
                            <div className="space-y-3">
                              {crop.tips.map((tip, i) => (
                                <div key={i} className="flex items-start gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
                                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</div>
                                  <p className="text-sm text-gray-700 leading-relaxed">{tip}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-400 italic">No additional tips available for this crop.</p>
                          )}

                          {/* Quick Actions */}
                          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-4 mt-4">
                            <p className="text-xs font-bold text-emerald-700 mb-3 flex items-center gap-1">
                              <ArrowRight className="w-3.5 h-3.5" /> Next Steps
                            </p>
                            <div className="grid grid-cols-3 gap-3">
                              {[
                                { label: "Get Fertilizer Advice", href: "/farmer/fertilizer" },
                                { label: "Check Market Price", href: "/farmer/market-prices" },
                                { label: "Predict Profit", href: "/farmer/profit-prediction" },
                              ].map(({ label, href }) => (
                                <a key={label} href={href}
                                  className="bg-white border border-emerald-100 rounded-xl p-3 text-xs font-bold text-gray-700 hover:border-emerald-400 hover:text-emerald-700 transition text-center shadow-sm hover:shadow-md">
                                  {label}
                                </a>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
  );
}

export default function CropRecommendation() {
  return <FarmerLayout><CropRecommendationContent /></FarmerLayout>;
}
