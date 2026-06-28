import { useState, useRef } from "react";
import FarmerLayout from "./FarmerLayout";
import { useTranslation } from "react-i18next";
import {
  Bug, Loader, RotateCcw, Upload, Camera, X, ChevronDown,
  ShieldAlert, CheckCircle, ShieldCheck, AlertTriangle, Sparkles,
  Microscope, FileText, Leaf, Zap, Info, ArrowRight, Shield
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

const CROPS = ["Wheat","Rice","Maize","Tomato","Potato","Cotton","Soybean","Sugarcane","Chilli","Onion","Banana","Mango","Groundnut","Mustard","Other"];
const PARTS = ["Leaf","Stem","Root","Fruit","Flower","Whole Plant","Bark","Seeds"];

function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>
      <div className="relative">
        <select value={value} onChange={e => onChange(e.target.value)}
          className="w-full appearance-none border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-400 focus:bg-white pr-10 text-gray-700 transition">
          <option value="">-- Select --</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
}

function SeverityBar({ level }) {
  const pct = level === "Severe" ? 90 : level === "Moderate" ? 55 : level === "Mild" ? 25 : 10;
  const color = pct >= 70 ? "bg-red-500" : pct >= 40 ? "bg-yellow-500" : "bg-green-500";
  const textColor = pct >= 70 ? "text-red-700" : pct >= 40 ? "text-yellow-700" : "text-green-700";
  const bg = pct >= 70 ? "bg-red-50" : pct >= 40 ? "bg-yellow-50" : "bg-green-50";
  return (
    <div className={`rounded-2xl p-4 ${bg}`}>
      <div className="flex justify-between mb-2">
        <span className="text-xs font-bold text-gray-500 uppercase">Severity</span>
        <span className={`text-xs font-bold ${textColor}`}>{level}</span>
      </div>
      <div className="w-full h-2.5 bg-white rounded-full">
        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function ConfidenceRing({ value }) {
  const pct = value || 0;
  const color = pct >= 80 ? "#16a34a" : pct >= 60 ? "#f59e0b" : "#ef4444";
  const radius = 36;
  const circ = 2 * Math.PI * radius;
  const dash = circ - (pct / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r={radius} fill="none" stroke="#f3f4f6" strokeWidth="8" />
          <circle cx="48" cy="48" r={radius} fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={circ} strokeDashoffset={dash} strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s ease" }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-display font-extrabold text-gray-800">{pct}%</span>
        </div>
      </div>
      <span className="text-xs font-bold text-gray-400">Confidence</span>
    </div>
  );
}

export function DiseaseDetectionContent() {
  const { t, i18n } = useTranslation();
  const fileInputRef = useRef(null);

  const [image, setImage] = useState(null);
  const [imageBase64, setBase64] = useState("");
  const [mimeType, setMimeType] = useState("");
  const [cropName, setCropName] = useState("");
  const [affectedPart, setPart] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [resultJSON, setResultJSON] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [activeTab, setActiveTab] = useState("treatment");

  const isValid = cropName && affectedPart;

  const handleReset = () => {
    setImage(null); setBase64(""); setMimeType(""); setCropName("");
    setPart(""); setSymptoms(""); setResultJSON(null); setError("");
  };

  const handleFile = (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return setError("Max image size is 5MB");
    setError("");
    setMimeType(file.type);
    const r1 = new FileReader();
    r1.onload = e => setImage(e.target.result);
    r1.readAsDataURL(file);
    const r2 = new FileReader();
    r2.onload = e => setBase64(e.target.result.split(",")[1]);
    r2.readAsDataURL(file);
  };

  const handleSubmit = async (withImage = true) => {
    if (!isValid) return toast.error("Select crop and affected part");
    setLoading(true); setResultJSON(null); setError("");

    const prompt = `Expert plant pathologist analysis. Crop: ${cropName}, Affected Part: ${affectedPart}, Symptoms: ${symptoms || "Not specified"}.
Respond ONLY with valid JSON:
{
  "disease": "Disease Name",
  "confidence": 87,
  "severity": "Mild|Moderate|Severe",
  "cause": "Pathogen/cause description",
  "symptoms": ["Symptom 1", "Symptom 2"],
  "chemicalTreatments": [{"name": "Product", "dosage": "Amount", "frequency": "When to apply", "cost": "Approx cost"}],
  "organicTreatments": [{"name": "Remedy", "method": "How to apply", "effectiveness": "High|Medium"}],
  "prevention": ["Prevention tip 1"],
  "spreadRisk": "Low|Medium|High",
  "recoveryTime": "2-3 weeks",
  "immediateAction": "What to do right now"
}`;

    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const response = await fetch(`${API}/api/ai/disease-detection`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ prompt, imageBase64: withImage ? imageBase64 : "", mimeType }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.message);
      const clean = data.text.replace(/^```json/m, "").replace(/^```/m, "").trim();
      setResultJSON(JSON.parse(clean));
      toast.success("Diagnosis complete!");
    } catch (e) {
      setError(e.message || "Diagnosis failed");
      toast.error("Analysis failed");
    } finally { setLoading(false); }
  };

  const tabs = [
    { key: "treatment", label: "💊 Chemical" },
    { key: "organic", label: "🌿 Organic" },
    { key: "prevention", label: "🛡️ Prevention" },
  ];

  const spreadColor = { High: "text-red-600 bg-red-50", Medium: "text-yellow-700 bg-yellow-50", Low: "text-green-600 bg-green-50" };

  return (
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="bg-gradient-to-br from-red-700 via-rose-700 to-pink-800 rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 opacity-10 text-[180px] leading-none pointer-events-none">🔬</div>
          <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="font-display text-3xl font-extrabold flex items-center gap-3">
                <Bug className="w-8 h-8" /> {t("disease.title")}
              </h2>
              <p className="text-rose-100 mt-2 text-sm">{t("disease.subtitle")}</p>
            </div>
            {resultJSON && (
              <button onClick={handleReset} className="bg-white/20 hover:bg-white/30 text-white font-bold py-2.5 px-5 rounded-xl transition flex items-center gap-2 text-sm">
                <RotateCcw className="w-4 h-4" /> New Scan
              </button>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Input Panel */}
          <div className="space-y-5">
            {/* Image upload */}
            <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Camera className="w-5 h-5 text-red-500" /> Upload Crop Image
              </h3>
              {image ? (
                <div className="relative">
                  <img src={image} alt="crop" className="w-full h-52 object-cover rounded-2xl" />
                  <button onClick={() => { setImage(null); setBase64(""); }}
                    className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 hover:bg-red-600 transition">
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs font-bold px-2 py-1 rounded-lg backdrop-blur-sm">
                    Image uploaded ✓
                  </div>
                </div>
              ) : (
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${dragOver ? "border-red-400 bg-red-50" : "border-gray-200 hover:border-red-300 hover:bg-red-50/50"}`}>
                  <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="font-bold text-gray-500 text-sm">Drop image here</p>
                  <p className="text-xs text-gray-400 mt-1">or click to browse</p>
                  <p className="text-[10px] text-gray-300 mt-2">JPG, PNG up to 5MB</p>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleFile(e.target.files[0])} />
            </div>

            {/* Details form */}
            <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm space-y-4">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Leaf className="w-5 h-5 text-green-500" /> Crop Details
              </h3>
              <SelectField label="Crop *" value={cropName} onChange={setCropName} options={CROPS} />
              <SelectField label="Affected Part *" value={affectedPart} onChange={setPart} options={PARTS} />
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Describe Symptoms</label>
                <textarea value={symptoms} onChange={e => setSymptoms(e.target.value)} rows={3}
                  placeholder="e.g. Brown spots on leaves, yellowing edges, white powder…"
                  className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:bg-white transition resize-none" />
              </div>
              {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => handleSubmit(!!imageBase64)} disabled={loading || !isValid}
                  className="bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold py-3.5 rounded-2xl shadow-lg hover:shadow-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2 text-sm">
                  {loading ? <Loader className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-4 h-4" /> {t("disease.detect")}</>}
                </button>
                <button onClick={() => handleSubmit(false)} disabled={loading || !isValid}
                  className="border-2 border-red-200 text-red-600 font-bold py-3.5 rounded-2xl hover:bg-red-50 transition flex items-center justify-center gap-2 text-sm">
                  <FileText className="w-4 h-4" /> Text Only
                </button>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-2 space-y-5">
            {loading && (
              <div className="bg-white rounded-[2rem] p-16 border border-gray-100 shadow-sm flex flex-col items-center gap-5">
                <div className="relative w-24 h-24">
                  <div className="absolute inset-0 border-4 border-red-100 border-t-red-600 rounded-full animate-spin" />
                  <div className="absolute inset-3 border-4 border-red-50 border-b-red-400 rounded-full animate-spin" style={{ animationDirection: "reverse" }} />
                  <Bug className="absolute inset-0 m-auto w-8 h-8 text-red-500" />
                </div>
                <div className="text-center">
                  <p className="text-red-700 font-bold text-lg animate-pulse">AI Scanning Crop…</p>
                  <p className="text-gray-400 text-sm mt-1">Analyzing image, symptoms & patterns</p>
                </div>
              </div>
            )}

            {resultJSON && !loading && (
              <>
                {/* Disease summary */}
                <div className="bg-white rounded-[2rem] p-7 border border-gray-100 shadow-sm">
                  <div className="flex items-start justify-between flex-wrap gap-4 mb-5">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Bug className="w-6 h-6 text-red-500" />
                        <h3 className="font-display text-2xl font-extrabold text-gray-800">{resultJSON.disease}</h3>
                      </div>
                      <p className="text-gray-500 text-sm">{resultJSON.cause}</p>
                    </div>
                    <ConfidenceRing value={resultJSON.confidence} />
                  </div>

                  <div className="grid md:grid-cols-3 gap-4 mb-5">
                    <SeverityBar level={resultJSON.severity} />
                    <div className="rounded-2xl p-4 bg-gray-50">
                      <p className="text-xs font-bold text-gray-400 uppercase mb-1">Recovery Time</p>
                      <p className="font-bold text-gray-800">{resultJSON.recoveryTime}</p>
                    </div>
                    <div className={`rounded-2xl p-4 ${spreadColor[resultJSON.spreadRisk] || "bg-gray-50 text-gray-600"}`}>
                      <p className="text-xs font-bold text-gray-400 uppercase mb-1">Spread Risk</p>
                      <p className="font-bold">{resultJSON.spreadRisk}</p>
                    </div>
                  </div>

                  {/* Immediate action */}
                  {resultJSON.immediateAction && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
                      <p className="text-xs font-bold text-red-700 mb-2 flex items-center gap-1.5"><Zap className="w-4 h-4" /> Immediate Action Required</p>
                      <p className="text-sm text-gray-700 font-medium">{resultJSON.immediateAction}</p>
                    </div>
                  )}
                </div>

                {/* Symptoms list */}
                {resultJSON.symptoms?.length > 0 && (
                  <div className="bg-white rounded-[2rem] p-7 border border-gray-100 shadow-sm">
                    <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Info className="w-4 h-4 text-blue-500" /> Identified Symptoms</h4>
                    <div className="grid md:grid-cols-2 gap-2">
                      {resultJSON.symptoms.map((s, i) => (
                        <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                          <div className="w-2 h-2 bg-red-400 rounded-full flex-shrink-0" />
                          <span className="text-sm text-gray-700">{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Treatment tabs */}
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                  <div className="flex border-b">
                    {tabs.map(tab => (
                      <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                        className={`flex-1 py-4 text-sm font-bold transition-all ${activeTab === tab.key ? "text-red-700 border-b-2 border-red-600 bg-red-50" : "text-gray-400 hover:text-gray-600"}`}>
                        {tab.label}
                      </button>
                    ))}
                  </div>
                  <div className="p-6">
                    {activeTab === "treatment" && (
                      <div className="space-y-4">
                        {resultJSON.chemicalTreatments?.map((ct, i) => (
                          <div key={i} className="bg-orange-50 border border-orange-200 rounded-2xl p-5">
                            <h4 className="font-bold text-orange-800 mb-2">{ct.name}</h4>
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div><span className="text-gray-400">Dosage:</span> <b className="text-gray-700">{ct.dosage}</b></div>
                              <div><span className="text-gray-400">Frequency:</span> <b className="text-gray-700">{ct.frequency}</b></div>
                              <div><span className="text-gray-400">Cost:</span> <b className="text-gray-700">{ct.cost}</b></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {activeTab === "organic" && (
                      <div className="space-y-4">
                        {resultJSON.organicTreatments?.map((ot, i) => (
                          <div key={i} className="bg-green-50 border border-green-200 rounded-2xl p-5">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-bold text-green-800">{ot.name}</h4>
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${ot.effectiveness === "High" ? "bg-green-200 text-green-800" : "bg-yellow-100 text-yellow-700"}`}>
                                {ot.effectiveness} Effectiveness
                              </span>
                            </div>
                            <p className="text-sm text-gray-700">{ot.method}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {activeTab === "prevention" && (
                      <div className="space-y-3">
                        {resultJSON.prevention?.map((p, i) => (
                          <div key={i} className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4">
                            <Shield className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
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
                <Microscope className="w-16 h-16 opacity-20" />
                <div className="text-center">
                  <p className="font-bold text-lg">Upload an image or describe symptoms</p>
                  <p className="text-sm mt-1">AI will diagnose disease & suggest treatment</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
  );
}

export default function DiseaseDetection() {
  return <FarmerLayout><DiseaseDetectionContent /></FarmerLayout>;
}
