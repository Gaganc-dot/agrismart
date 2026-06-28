import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import FarmerLayout from "./FarmerLayout";
import { WeatherContent }            from "./WeatherForecast";
import { CropRecommendationContent } from "./CropRecommendation";
import { LiveMandiPriceContent }       from "./LiveMandiPrice";
import { DiseaseDetectionContent }   from "./DiseaseDetection";
import { FertilizerAdviceContent }   from "./FertilizerAdvice";
import {
  CloudSun, Sprout, TrendingUp, Bug, FlaskConical,
  ChevronRight, Zap, ArrowRight
} from "lucide-react";

// ── Tab definitions ────────────────────────────────────────────────────────────
const TABS = [
  {
    id:      "weather",
    label:   "Weather",
    emoji:   "🌤️",
    icon:    CloudSun,
    desc:    "Live forecasts & farming alerts",
    color:   "#3b82f6",
    bg:      "from-blue-600 to-blue-800",
    light:   "bg-blue-50 text-blue-700 border-blue-200",
    active:  "bg-blue-600 text-white shadow-blue-200",
    step:    1,
  },
  {
    id:      "crop",
    label:   "Crop Advisor",
    emoji:   "🌱",
    icon:    Sprout,
    desc:    "AI crop recommendation & analysis",
    color:   "#16a34a",
    bg:      "from-emerald-600 to-green-800",
    light:   "bg-emerald-50 text-emerald-700 border-emerald-200",
    active:  "bg-emerald-600 text-white shadow-emerald-200",
    step:    2,
  },
  {
    id:      "market",
    label:   "Market Prices",
    emoji:   "📊",
    icon:    TrendingUp,
    desc:    "Live mandi rates & sell recommendations",
    color:   "#d97706",
    bg:      "from-amber-600 to-yellow-700",
    light:   "bg-amber-50 text-amber-700 border-amber-200",
    active:  "bg-amber-500 text-white shadow-amber-200",
    step:    3,
  },
  {
    id:      "disease",
    label:   "Disease AI",
    emoji:   "🔬",
    icon:    Bug,
    desc:    "Upload image · AI diagnosis · Treatment",
    color:   "#dc2626",
    bg:      "from-red-600 to-rose-700",
    light:   "bg-red-50 text-red-700 border-red-200",
    active:  "bg-red-600 text-white shadow-red-200",
    step:    4,
  },
  {
    id:      "fertilizer",
    label:   "Fertilizer",
    emoji:   "🧪",
    icon:    FlaskConical,
    desc:    "NPK plans · Organic options · Schedule",
    color:   "#65a30d",
    bg:      "from-lime-600 to-green-700",
    light:   "bg-lime-50 text-lime-700 border-lime-200",
    active:  "bg-lime-600 text-white shadow-lime-200",
    step:    5,
  },
];

// Mapping from URL param values to tab IDs
const PARAM_MAP = {
  weather: "weather",
  crop: "crop",
  "crop-recommendation": "crop",
  "market-prices": "market",
  market: "market",
  disease: "disease",
  "disease-detection": "disease",
  fertilizer: "fertilizer",
};

// ── Workflow step pills shown in hero ─────────────────────────────────────────
function WorkflowStep({ emoji, label, isLast }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5 text-white text-xs font-bold border border-white/20">
        <span>{emoji}</span>
        <span className="hidden sm:inline">{label}</span>
      </div>
      {!isLast && (
        <ArrowRight className="w-3.5 h-3.5 text-white/50 flex-shrink-0" />
      )}
    </div>
  );
}

// ── Tab button for desktop ─────────────────────────────────────────────────────
function DesktopTab({ tab, active, onClick }) {
  const Icon = tab.icon;
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2.5 px-5 py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 flex-shrink-0 ${
        active
          ? `${tab.active} shadow-lg`
          : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
      }`}
    >
      <span className="text-base">{tab.emoji}</span>
      <span>{tab.label}</span>
      {active && <Zap className="w-3.5 h-3.5 opacity-70" />}
    </button>
  );
}

// ── Tab button for mobile ──────────────────────────────────────────────────────
function MobileTab({ tab, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 px-4 py-2.5 rounded-xl font-bold transition-all flex-1 min-w-0 ${
        active
          ? `${tab.active} shadow-md`
          : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
      }`}
    >
      <span className="text-xl leading-none">{tab.emoji}</span>
      <span className="text-[9px] truncate w-full text-center">{tab.label}</span>
    </button>
  );
}

// ── Hub content ───────────────────────────────────────────────────────────────
function HubContent() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read tab from ?tab= URL param (supports deep-linking from old routes)
  const paramTab  = PARAM_MAP[searchParams.get("tab") || ""] || "weather";
  const [activeTab, setActiveTab] = useState(paramTab);

  // Keep URL in sync
  const handleTabChange = (id) => {
    setActiveTab(id);
    setSearchParams({ tab: id }, { replace: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // If URL param changes externally (e.g. back/forward), sync state
  useEffect(() => {
    const p = PARAM_MAP[searchParams.get("tab") || ""];
    if (p && p !== activeTab) setActiveTab(p);
  }, [searchParams]);

  const currentTab = TABS.find(t => t.id === activeTab) || TABS[0];

  // ── Workflow steps ─────────────────────────────────────────────────────────
  const WORKFLOW = [
    { emoji: "🌤️", label: "Check Weather" },
    { emoji: "🌱", label: "Plan Crop" },
    { emoji: "🔬", label: "Detect Disease" },
    { emoji: "🧪", label: "Fertilize" },
    { emoji: "📊", label: "Check Prices" },
    { emoji: "🛒", label: "Sell Crop" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* ── Hero Banner ───────────────────────────────────────────────────── */}
      <div className={`bg-gradient-to-br ${currentTab.bg} rounded-[2rem] p-7 text-white shadow-2xl relative overflow-hidden transition-all duration-500`}>
        {/* Background deco */}
        <div className="absolute inset-0 opacity-5 text-[220px] leading-none pointer-events-none flex items-center justify-end pr-8 select-none">
          {currentTab.emoji}
        </div>
        <div className="absolute inset-0 bg-black/10 pointer-events-none" />

        <div className="relative z-10">
          {/* Title row */}
          <div className="flex items-center justify-between gap-4 flex-wrap mb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{currentTab.emoji}</span>
                <h1 className="font-display text-2xl font-extrabold leading-tight">
                  Smart Farming Hub
                </h1>
                <span className="hidden sm:inline text-xs font-bold bg-white/20 px-2.5 py-1 rounded-full backdrop-blur-sm ml-1">
                  AI Powered
                </span>
              </div>
              <p className="text-white/70 text-sm mt-0.5">
                Weather · Crop AI · Market Prices · Disease Detection · Fertilizer — all in one place
              </p>
            </div>
            {/* Active section badge */}
            <div className="bg-white/20 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-2.5 text-center">
              <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider">Now viewing</p>
              <p className="text-white font-bold text-sm mt-0.5">{currentTab.label}</p>
            </div>
          </div>

          {/* Farming workflow */}
          <div className="hidden sm:flex items-center gap-1 flex-wrap">
            {WORKFLOW.map((step, i) => (
              <WorkflowStep key={i} emoji={step.emoji} label={step.label} isLast={i === WORKFLOW.length - 1} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Desktop Tab Bar ────────────────────────────────────────────────── */}
      <div className="hidden md:block bg-white rounded-2xl p-2 shadow-sm border border-gray-100">
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-hide">
          {TABS.map(tab => (
            <DesktopTab key={tab.id} tab={tab} active={activeTab === tab.id} onClick={() => handleTabChange(tab.id)} />
          ))}
          {/* Step indicator */}
          <div className="ml-auto flex-shrink-0 flex items-center gap-2 px-4 text-xs text-gray-400 font-bold">
            {TABS.map((tab, i) => (
              <div
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`w-2.5 h-2.5 rounded-full cursor-pointer transition-all duration-200 ${activeTab === tab.id ? "scale-125" : "hover:scale-110"}`}
                style={{ backgroundColor: activeTab === tab.id ? tab.color : "#e5e7eb" }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Mobile Tab Bar ─────────────────────────────────────────────────── */}
      <div className="md:hidden bg-white rounded-2xl p-2 shadow-sm border border-gray-100 sticky top-[73px] z-20">
        <div className="flex items-center gap-1">
          {TABS.map(tab => (
            <MobileTab key={tab.id} tab={tab} active={activeTab === tab.id} onClick={() => handleTabChange(tab.id)} />
          ))}
        </div>
      </div>

      {/* ── Section header chip ────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border"
          style={{ backgroundColor: currentTab.color + "15", color: currentTab.color, borderColor: currentTab.color + "30" }}
        >
          <span>{currentTab.emoji}</span>
          <span>{currentTab.label}</span>
          <ChevronRight className="w-3.5 h-3.5 opacity-60" />
          <span className="font-normal opacity-70">{currentTab.desc}</span>
        </div>
      </div>

      {/* ── Tab Content ────────────────────────────────────────────────────── */}
      <div key={activeTab} style={{ animation: "hubFadeIn .22s ease both" }}>
        {activeTab === "weather"    && <WeatherContent />}
        {activeTab === "crop"       && <CropRecommendationContent />}
        {activeTab === "market"     && <LiveMandiPriceContent />}
        {activeTab === "disease"    && <DiseaseDetectionContent />}
        {activeTab === "fertilizer" && <FertilizerAdviceContent />}
      </div>

      {/* ── Next Step Suggestion ───────────────────────────────────────────── */}
      <NextStepBanner activeTab={activeTab} onNavigate={handleTabChange} />

      <style>{`
        @keyframes hubFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

// ── "What's next?" bottom card ─────────────────────────────────────────────────
function NextStepBanner({ activeTab, onNavigate }) {
  const NEXT = {
    weather:    { next: "crop",       msg: "Now that you know the weather, find the best crop to plant" },
    crop:       { next: "disease",    msg: "Check for common diseases before sowing your crop" },
    disease:    { next: "fertilizer", msg: "Treat your crop and get the right fertilizer plan" },
    fertilizer: { next: "market",     msg: "Your crop is healthy — check today's best market prices" },
    market:     { next: "weather",    msg: "Monitor weather daily to protect your investment" },
  };
  const hint = NEXT[activeTab];
  if (!hint) return null;
  const nextTab = TABS.find(t => t.id === hint.next);

  return (
    <div
      className="rounded-2xl border p-5 flex items-center justify-between gap-4 cursor-pointer hover:shadow-md transition-all"
      style={{ backgroundColor: nextTab.color + "08", borderColor: nextTab.color + "25" }}
      onClick={() => onNavigate(hint.next)}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ backgroundColor: nextTab.color + "20" }}
        >
          {nextTab.emoji}
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: nextTab.color }}>
            Suggested Next Step
          </p>
          <p className="text-sm text-gray-700 font-medium mt-0.5">{hint.msg}</p>
        </div>
      </div>
      <div
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold flex-shrink-0"
        style={{ backgroundColor: nextTab.color, color: "#fff" }}
      >
        {nextTab.label}
        <ArrowRight className="w-4 h-4" />
      </div>
    </div>
  );
}

// ── Page export ───────────────────────────────────────────────────────────────
export default function SmartFarmingHub() {
  return (
    <FarmerLayout>
      <HubContent />
    </FarmerLayout>
  );
}
