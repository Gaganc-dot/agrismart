import { useState, useEffect } from "react";
import FarmerLayout from "./FarmerLayout";
import { useTranslation } from "react-i18next";
import {
  Leaf, Loader, RotateCcw, ChevronDown, CheckCircle, Clock,
  ArrowRight, IndianRupee, ShieldCheck, AlertTriangle, Sparkles,
  Zap, Info, Plus, Minus, FlaskConical
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

const CROPS = ["Wheat","Rice","Maize","Tomato","Onion","Potato","Cotton","Soybean","Sugarcane","Chilli","Turmeric","Groundnut","Mustard","Other"];
const SOILS = ["Alluvial","Black (Regur)","Red","Laterite","Sandy","Loamy","Clay","Silt","Desert","Other"];
const STAGES = ["Seedling","Vegetative","Flowering","Fruiting","Maturity","Post-Harvest"];
const BUDGETS = ["Low (under ₹5,000)","Medium (₹5,000–₹15,000)","High (above ₹15,000)"];

function SelectField({ label, value, onChange, options, accent = "lime" }) {
  const ringColor = { lime: "focus:ring-lime-500", green: "focus:ring-green-500", emerald: "focus:ring-emerald-500" };
  return (
    <div>
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>
      <div className="relative">
        <select value={value} onChange={e => onChange(e.target.value)}
          className={`w-full appearance-none border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 ${ringColor[accent] || ringColor.lime} focus:bg-white pr-10 text-gray-700 transition`}>
          <option value="">-- Select --</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
}

function NPKBar({ label, value, max, color, bg }) {
  return (
    <div className="flex items-center gap-3">
      <span className={`text-xs font-bold ${color} w-20 flex-shrink-0`}>{label}</span>
      <div className={`flex-1 h-3 ${bg} rounded-full overflow-hidden`}>
        <div className={`h-full ${color.replace("text-","bg-")} rounded-full transition-all duration-700`}
          style={{ width: `${Math.min((value / max) * 100, 100)}%` }} />
      </div>
      <span className="text-xs font-bold text-gray-600 w-12 text-right">{value} kg/ha</span>
    </div>
  );
}

function FertCard({ f, i }) {
  const colors = ["bg-green-50 border-green-200", "bg-blue-50 border-blue-200", "bg-purple-50 border-purple-200", "bg-amber-50 border-amber-200"];
  const dotColors = ["bg-green-500","bg-blue-500","bg-purple-500","bg-amber-500"];
  return (
    <div className={`rounded-2xl p-5 border-2 ${colors[i % colors.length]}`}>
      <div className="flex items-start gap-3">
        <div className={`w-3 h-3 rounded-full ${dotColors[i % dotColors.length]} flex-shrink-0 mt-1`} />
        <div className="flex-1">
          <h4 className="font-bold text-gray-800">{f.name}</h4>
          <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
            <span className="text-gray-500">Qty: <b className="text-gray-700">{f.quantity}</b></span>
            <span className="text-gray-500">Method: <b className="text-gray-700">{f.method}</b></span>
            <span className="text-gray-500 col-span-2">Timing: <b className="text-gray-700">{f.timing}</b></span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FertilizerAdviceContent() {
  const { t, i18n } = useTranslation();
  const [form, setForm] = useState({ crop: "", soil: "", stage: "", problem: "", area: "", budget: "" });
  const [resultJSON, setResultJSON] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("primary");

  const isValid = form.crop && form.soil && form.stage;

  const handleReset = () => { setForm({ crop: "", soil: "", stage: "", problem: "", area: "", budget: "" }); setResultJSON(null); };

  const handleDemo = () => setForm({ crop: "Tomato", soil: "Red Soil", stage: "Flowering", problem: "Yellowing lower leaves", area: "2", budget: "Medium (₹5,000–₹15,000)" });

  // Load last saved fertilizer recommendation on mount
  useEffect(() => {
    const loadSaved = async () => {
      try {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        const { data } = await axios.get(`${API}/api/ai/latest-recommendation?type=fertilizer`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (data.success && data.recommendation) {
          const { inputs, result: savedResult } = data.recommendation;
          if (inputs) setForm(f => ({ ...f, ...inputs }));
          if (savedResult) setResultJSON(savedResult);
        }
      } catch { /* silent */ }
    };
    loadSaved();
  }, []);

  const handleSubmit = async () => {
    if (!isValid) return toast.error("Please select crop, soil and growth stage");
    setLoading(true);
    setResultJSON(null);

    const prompt = `You are an expert Indian agricultural specialist. Provide a detailed, structured fertilizer plan.
Farmer Details:
- Crop: ${form.crop}, Soil: ${form.soil}, Stage: ${form.stage}
- Problem: ${form.problem || "None"}, Area: ${form.area || "1"} acres, Budget: ${form.budget}
Respond ONLY with valid JSON:
{
  "whyThisFertilizer": "2-3 sentence explanation",
  "deficiencies": ["List of detected deficiencies"],
  "npkRecommended": { "n": 80, "p": 40, "k": 40 },
  "npkMax": { "n": 150, "p": 100, "k": 100 },
  "primaryFertilizers": [
    { "name": "Urea", "quantity": "50 kg/acre", "method": "Broadcast/Basal/Foliar", "timing": "Morning, pre-irrigation" }
  ],
  "organicAlternatives": [{ "name": "Compost", "benefit": "Improves soil structure and microbial activity" }],
  "schedule": [{ "timeline": "Week 1-2", "action": "Apply basal dose of DAP" }],
  "precautions": ["Safety tips"],
  "costEstimate": 5000,
  "expectedYieldBoost": "15-20%"
}`;

    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const { data } = await axios.post(`${API}/api/ai/fertilizer-advice`,
        { prompt, inputs: form },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const clean = data.text.replace(/^```json/m, "").replace(/^```/m, "").trim();
      setResultJSON(JSON.parse(clean));
      toast.success("Fertilizer plan ready!");
    } catch { toast.error("Analysis failed — please try again"); }
    finally { setLoading(false); }
  };

  const tabs = [
    { key: "primary", label: "Primary Fertilizers" },
    { key: "organic", label: "Organic Options" },
    { key: "schedule", label: "Schedule" },
    { key: "precautions", label: "Precautions" },
  ];

  return (
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="bg-gradient-to-br from-lime-700 via-green-700 to-emerald-800 rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 opacity-10 text-[180px] leading-none pointer-events-none">🧪</div>
          <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="font-display text-3xl font-extrabold flex items-center gap-3">
                <FlaskConical className="w-8 h-8" /> {t("fertilizer.title")}
              </h2>
              <p className="text-lime-100 mt-2 text-sm">{t("fertilizer.subtitle")}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={handleDemo} className="bg-white/20 hover:bg-white/30 text-white font-bold py-2.5 px-5 rounded-xl transition text-sm">
                Try Demo
              </button>
              {resultJSON && (
                <button onClick={handleReset} className="bg-white/20 hover:bg-white/30 text-white font-bold py-2.5 px-5 rounded-xl transition flex items-center gap-2 text-sm">
                  <RotateCcw className="w-4 h-4" /> Reset
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Input Form */}
          <div className="bg-white rounded-[2rem] p-7 border border-gray-100 shadow-sm space-y-5">
            <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
              <Leaf className="w-5 h-5 text-lime-600" /> Farm Parameters
            </h3>
            <SelectField label="Crop *" value={form.crop} onChange={v => setForm({ ...form, crop: v })} options={CROPS} />
            <SelectField label="Soil Type *" value={form.soil} onChange={v => setForm({ ...form, soil: v })} options={SOILS} />
            <SelectField label="Growth Stage *" value={form.stage} onChange={v => setForm({ ...form, stage: v })} options={STAGES} />
            <SelectField label="Budget" value={form.budget} onChange={v => setForm({ ...form, budget: v })} options={BUDGETS} />
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Farm Area (acres)</label>
              <input value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} type="number" placeholder="e.g. 2"
                className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-lime-400 focus:bg-white transition" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Problem / Symptoms</label>
              <textarea value={form.problem} onChange={e => setForm({ ...form, problem: e.target.value })} rows={2}
                placeholder="e.g. Yellowing leaves, stunted growth…"
                className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-lime-400 focus:bg-white transition resize-none" />
            </div>
            <button onClick={handleSubmit} disabled={loading || !isValid}
              className="w-full bg-gradient-to-r from-lime-600 to-green-600 text-white font-bold py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2 text-sm">
              {loading ? <><Loader className="w-5 h-5 animate-spin" /> Analyzing…</> : <><Sparkles className="w-5 h-5" /> {t("fertilizer.analyze")}</>}
            </button>
          </div>

          {/* Results */}
          <div className="lg:col-span-2 space-y-5">
            {loading && (
              <div className="bg-white rounded-[2rem] p-16 border border-gray-100 shadow-sm flex flex-col items-center gap-4">
                <div className="w-16 h-16 border-4 border-lime-100 border-t-lime-600 rounded-full animate-spin" />
                <p className="text-lime-700 font-bold animate-pulse">Analyzing soil & crop data…</p>
              </div>
            )}

            {resultJSON && !loading && (
              <>
                {/* Why + NPK */}
                <div className="bg-white rounded-[2rem] p-7 border border-gray-100 shadow-sm space-y-5">
                  <div className="bg-lime-50 border border-lime-100 rounded-2xl p-5">
                    <p className="text-xs font-bold text-lime-700 mb-2 flex items-center gap-1.5"><Info className="w-4 h-4" /> Why This Plan?</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{resultJSON.whyThisFertilizer}</p>
                  </div>

                  {/* Deficiencies */}
                  {resultJSON.deficiencies?.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-yellow-500" /> Detected Deficiencies</p>
                      <div className="flex flex-wrap gap-2">
                        {resultJSON.deficiencies.map((d, i) => (
                          <span key={i} className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs font-bold px-3 py-1.5 rounded-full">{d}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* NPK bars */}
                  {resultJSON.npkRecommended && (
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-gray-500 uppercase mb-1">Recommended NPK Dosage</p>
                      <NPKBar label="Nitrogen (N)" value={resultJSON.npkRecommended.n} max={resultJSON.npkMax?.n || 150} color="text-green-600" bg="bg-green-100" />
                      <NPKBar label="Phosphorus (P)" value={resultJSON.npkRecommended.p} max={resultJSON.npkMax?.p || 100} color="text-purple-600" bg="bg-purple-100" />
                      <NPKBar label="Potassium (K)" value={resultJSON.npkRecommended.k} max={resultJSON.npkMax?.k || 100} color="text-orange-600" bg="bg-orange-100" />
                    </div>
                  )}

                  {/* Cost + yield boost */}
                  <div className="grid grid-cols-2 gap-4">
                    {resultJSON.costEstimate && (
                      <div className="bg-gray-50 rounded-2xl p-4 flex items-center gap-3">
                        <IndianRupee className="w-5 h-5 text-primary-600" />
                        <div>
                          <p className="text-xs text-gray-400 font-bold">Estimated Cost</p>
                          <p className="font-bold text-gray-800">₹{resultJSON.costEstimate.toLocaleString()}</p>
                        </div>
                      </div>
                    )}
                    {resultJSON.expectedYieldBoost && (
                      <div className="bg-green-50 rounded-2xl p-4 flex items-center gap-3">
                        <ShieldCheck className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="text-xs text-gray-400 font-bold">Expected Boost</p>
                          <p className="font-bold text-green-700">{resultJSON.expectedYieldBoost}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tab section */}
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                  <div className="flex border-b">
                    {tabs.map(tab => (
                      <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                        className={`flex-1 py-4 text-xs font-bold transition-all ${activeTab === tab.key ? "text-lime-700 border-b-2 border-lime-600 bg-lime-50" : "text-gray-400 hover:text-gray-600"}`}>
                        {tab.label}
                      </button>
                    ))}
                  </div>
                  <div className="p-6">
                    {activeTab === "primary" && (
                      <div className="grid md:grid-cols-2 gap-4">
                        {resultJSON.primaryFertilizers?.map((f, i) => <FertCard key={i} f={f} i={i} />)}
                      </div>
                    )}
                    {activeTab === "organic" && (
                      <div className="grid md:grid-cols-2 gap-4">
                        {resultJSON.organicAlternatives?.map((o, i) => (
                          <div key={i} className="bg-green-50 border border-green-200 rounded-2xl p-5">
                            <h4 className="font-bold text-green-800 flex items-center gap-2"><Leaf className="w-4 h-4" />{o.name}</h4>
                            <p className="text-sm text-gray-600 mt-2">{o.benefit}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {activeTab === "schedule" && (
                      <div className="space-y-3">
                        {resultJSON.schedule?.map((s, i) => (
                          <div key={i} className="flex gap-4 items-start">
                            <div className="flex flex-col items-center gap-1">
                              <div className="w-7 h-7 bg-lime-100 text-lime-700 rounded-full flex items-center justify-center font-bold text-xs">{i + 1}</div>
                              {i < resultJSON.schedule.length - 1 && <div className="w-0.5 h-6 bg-lime-100" />}
                            </div>
                            <div className="bg-gray-50 rounded-xl p-4 flex-1">
                              <p className="text-xs font-bold text-lime-700 mb-1 flex items-center gap-1"><Clock className="w-3 h-3" />{s.timeline}</p>
                              <p className="text-sm text-gray-700">{s.action}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {activeTab === "precautions" && (
                      <div className="space-y-3">
                        {resultJSON.precautions?.map((p, i) => (
                          <div key={i} className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl p-4">
                            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-gray-700">{p}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {!resultJSON && !loading && (
              <div className="bg-white rounded-[2rem] p-16 border border-gray-100 shadow-sm flex flex-col items-center gap-4 text-gray-300">
                <FlaskConical className="w-16 h-16 opacity-20" />
                <div className="text-center">
                  <p className="font-bold text-lg">Enter crop details to get fertilizer advice</p>
                  <p className="text-sm mt-1">AI analyzes soil + crop stage + symptoms</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
  );
}

export default function FertilizerAdvice() {
  return <FarmerLayout><FertilizerAdviceContent /></FarmerLayout>;
}
