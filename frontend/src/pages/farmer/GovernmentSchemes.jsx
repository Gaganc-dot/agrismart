import { useState, useEffect, useMemo } from "react";
import FarmerLayout from "./FarmerLayout";
import { useTranslation } from "react-i18next";
import {
  Landmark, Loader, Search, ExternalLink, ChevronDown,
  Bookmark, BookmarkCheck, LayoutGrid, Sparkles, Filter,
  Calendar, IndianRupee, Users, Award, RefreshCw, X,
  CheckCircle2, AlertCircle, Info, Shield, TrendingUp, FileText
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

const STATES = [
  "All States","Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala",
  "Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha",
  "Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura",
  "Uttar Pradesh","Uttarakhand","West Bengal"
];

const CATEGORIES = ["All","Subsidy","Loan","Insurance","Training","MSP","Equipment","Seeds","Irrigation","Organic"];

const CATEGORY_META = {
  Subsidy:    { icon: IndianRupee, color: "green" },
  Loan:       { icon: TrendingUp, color: "blue" },
  Insurance:  { icon: Shield, color: "purple" },
  Training:   { icon: Award, color: "amber" },
  MSP:        { icon: IndianRupee, color: "emerald" },
  Equipment:  { icon: LayoutGrid, color: "orange" },
  Seeds:      { icon: Sparkles, color: "lime" },
  Irrigation: { icon: Info, color: "cyan" },
  Organic:    { icon: CheckCircle2, color: "teal" },
  All:        { icon: LayoutGrid, color: "gray" },
};

function CategoryPill({ cat, active, onClick }) {
  const meta = CATEGORY_META[cat] || CATEGORY_META.All;
  const Icon = meta.icon;
  return (
    <button onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition whitespace-nowrap ${
        active
          ? `bg-purple-600 text-white border-purple-600`
          : "bg-white text-gray-600 border-gray-200 hover:border-purple-300 hover:text-purple-600"
      }`}>
      <Icon className="w-3 h-3" /> {cat}
    </button>
  );
}

function SchemeCard({ scheme, isBookmarked, onBookmark }) {
  const meta = CATEGORY_META[scheme.category] || CATEGORY_META.All;
  const color = meta.color;
  const colorMap = {
    green:   "bg-green-100 text-green-700 border-green-200",
    blue:    "bg-blue-100 text-blue-700 border-blue-200",
    purple:  "bg-purple-100 text-purple-700 border-purple-200",
    amber:   "bg-amber-100 text-amber-700 border-amber-200",
    emerald: "bg-emerald-100 text-emerald-700 border-emerald-200",
    orange:  "bg-orange-100 text-orange-700 border-orange-200",
    lime:    "bg-lime-100 text-lime-700 border-lime-200",
    cyan:    "bg-cyan-100 text-cyan-700 border-cyan-200",
    teal:    "bg-teal-100 text-teal-700 border-teal-200",
    gray:    "bg-gray-100 text-gray-700 border-gray-200",
  };

  return (
    <div className="bg-white rounded-[1.5rem] border border-gray-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 flex flex-col overflow-hidden">
      {/* Top accent */}
      <div className={`h-1.5 bg-${color}-500`} style={{ background: `var(--tw-gradient-from, #8b5cf6)` }} />

      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-start justify-between mb-3">
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${colorMap[color] || colorMap.gray}`}>
            {scheme.category}
          </span>
          <button onClick={() => onBookmark(scheme)}
            className={`transition ${isBookmarked ? "text-purple-600" : "text-gray-300 hover:text-purple-500"}`}>
            {isBookmarked ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
          </button>
        </div>

        <h3 className="font-display font-bold text-gray-800 text-base mb-1 leading-snug">{scheme.name}</h3>

        {scheme.benefit && (
          <p className="text-purple-600 font-bold text-sm mb-2">{scheme.benefit}</p>
        )}

        {scheme.description && (
          <p className="text-gray-500 text-xs leading-relaxed mb-3 line-clamp-3">{scheme.description}</p>
        )}

        {/* Eligibility / Deadline row */}
        <div className="flex flex-wrap gap-2 mb-4">
          {scheme.eligibility && (
            <span className="flex items-center gap-1 text-[10px] font-bold bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg text-gray-500">
              <Users className="w-3 h-3" /> {scheme.eligibility}
            </span>
          )}
          {scheme.deadline && (
            <span className="flex items-center gap-1 text-[10px] font-bold bg-red-50 border border-red-100 px-2 py-1 rounded-lg text-red-500">
              <Calendar className="w-3 h-3" /> {scheme.deadline}
            </span>
          )}
          {scheme.amount && (
            <span className="flex items-center gap-1 text-[10px] font-bold bg-green-50 border border-green-100 px-2 py-1 rounded-lg text-green-600">
              <IndianRupee className="w-3 h-3" /> {scheme.amount}
            </span>
          )}
        </div>

        {scheme.documents?.length > 0 && (
          <div className="bg-gray-50 rounded-xl p-3 mb-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <FileText className="w-3 h-3" /> Documents Required
            </p>
            <div className="flex flex-wrap gap-1.5">
              {scheme.documents.map((doc, i) => (
                <span key={i} className="text-[10px] bg-white border border-gray-200 rounded-lg px-2 py-0.5 text-gray-600 font-medium">{doc}</span>
              ))}
            </div>
          </div>
        )}

        <a href={scheme.url || "https://pmkisan.gov.in"} target="_blank" rel="noreferrer"
          className="mt-auto w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-3 rounded-xl hover:shadow-lg transition text-sm">
          Apply Now <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}

export default function GovernmentSchemes() {
  const { t, i18n } = useTranslation();
  const [selectedState, setSelectedState] = useState("All States");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [cropInput, setCropInput] = useState("");
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [schemes, setSchemes] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [showBookmarks, setShowBookmarks] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("agri_scheme_bookmarks");
    if (saved) setBookmarks(JSON.parse(saved));
  }, []);

  const toggleBookmark = (scheme) => {
    const exists = bookmarks.find(b => b.name === scheme.name);
    const updated = exists ? bookmarks.filter(b => b.name !== scheme.name) : [...bookmarks, scheme];
    setBookmarks(updated);
    localStorage.setItem("agri_scheme_bookmarks", JSON.stringify(updated));
    toast.success(exists ? "Removed from saved" : "Scheme saved!");
  };

  const handleSearch = async () => {
    setLoading(true);
    setSchemes([]);
    setShowBookmarks(false);

    const prompt = `You are an expert on Indian government agricultural schemes. Provide relevant schemes for:
- State: ${selectedState}
- Category: ${selectedCategory}
- Crop: ${cropInput || "General farming"}
- Language: ${i18n.language}

Respond ONLY with valid JSON:
{
  "schemes": [
    {
      "name": "Scheme full name",
      "category": "Subsidy|Loan|Insurance|Training|MSP|Equipment|Seeds|Irrigation|Organic",
      "benefit": "Key benefit in 1 line (e.g. ₹6000/year direct transfer)",
      "description": "2-3 sentence description of the scheme",
      "eligibility": "Who is eligible (e.g. Small & Marginal Farmers)",
      "amount": "Financial amount or benefit value",
      "deadline": "Application deadline or 'Ongoing'",
      "documents": ["Aadhaar Card", "Land Records", "Bank Passbook"],
      "url": "https://official-website.gov.in"
    }
  ]
}

Include 6-8 highly relevant schemes. Prioritize state-specific schemes if state is not 'All States'.`;

    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const { data } = await axios.post(`${API}/api/ai/government-schemes`,
        { prompt },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.success && data.text) {
        const clean = data.text.replace(/^```json/m, "").replace(/^```/m, "").trim();
        const parsed = JSON.parse(clean);
        setSchemes(parsed.schemes || []);
        toast.success(`Found ${parsed.schemes?.length || 0} schemes!`);
      }
    } catch {
      toast.error("Failed to fetch schemes — please retry.");
    } finally {
      setLoading(false);
    }
  };

  const displayList = useMemo(() => {
    const base = showBookmarks ? bookmarks : schemes;
    return base.filter(s =>
      (!searchText || s.name?.toLowerCase().includes(searchText.toLowerCase()) ||
        s.description?.toLowerCase().includes(searchText.toLowerCase())) &&
      (selectedCategory === "All" || s.category === selectedCategory)
    );
  }, [schemes, bookmarks, showBookmarks, searchText, selectedCategory]);

  return (
    <FarmerLayout>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Hero */}
        <div className="bg-gradient-to-br from-purple-700 via-indigo-700 to-violet-800 rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 opacity-10 text-[180px] leading-none pointer-events-none select-none">🏛️</div>
          <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="font-display text-3xl font-extrabold flex items-center gap-3">
                <Landmark className="w-8 h-8" /> {t("schemes.title")}
              </h2>
              <p className="text-purple-100 mt-2 text-sm max-w-lg">{t("schemes.subtitle")}</p>
              <div className="flex gap-3 mt-3 flex-wrap">
                {["Central Schemes","State Specific","Subsidies","Loans","Insurance"].map(tag => (
                  <span key={tag} className="text-[11px] font-bold bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">{tag}</span>
                ))}
              </div>
            </div>
            <button onClick={() => setShowBookmarks(!showBookmarks)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition ${showBookmarks ? "bg-white text-purple-700" : "bg-white/20 hover:bg-white/30 text-white"}`}>
              <BookmarkCheck className="w-4 h-4" /> Saved ({bookmarks.length})
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Filter Panel */}
          <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm space-y-5 h-fit">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Filter className="w-5 h-5 text-purple-500" /> Filters
            </h3>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">State</label>
              <div className="relative">
                <select value={selectedState} onChange={e => setSelectedState(e.target.value)}
                  className="w-full appearance-none border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white pr-10 text-gray-700 transition">
                  {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Crop / Type</label>
              <input value={cropInput} onChange={e => setCropInput(e.target.value)}
                placeholder="e.g. Wheat, Cotton, All"
                className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white transition" />
            </div>

            <button onClick={handleSearch} disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg hover:shadow-xl transition disabled:opacity-60 flex items-center justify-center gap-2">
              {loading
                ? <><Loader className="w-5 h-5 animate-spin" /> Searching…</>
                : <><Sparkles className="w-5 h-5" /> Find Schemes</>}
            </button>

            {schemes.length > 0 && (
              <button onClick={() => { setSchemes([]); setShowBookmarks(false); }}
                className="w-full text-xs font-bold text-gray-400 hover:text-purple-600 py-2 rounded-xl hover:bg-purple-50 transition flex items-center justify-center gap-1">
                <RefreshCw className="w-3 h-3" /> Reset Results
              </button>
            )}

            {/* Stats */}
            <div className="bg-purple-50 rounded-2xl p-4 space-y-2">
              <p className="text-xs font-bold text-purple-700 uppercase tracking-wider">Quick Stats</p>
              {[
                { label: "Central Schemes", val: "50+" },
                { label: "Total Outlay", val: "₹2.5L Cr" },
                { label: "Beneficiaries", val: "12 Cr+" },
              ].map(({ label, val }) => (
                <div key={label} className="flex justify-between text-xs">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-bold text-purple-700">{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-4">
            {/* Search + Category Pills */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input value={searchText} onChange={e => setSearchText(e.target.value)}
                  placeholder="Search schemes by name or keyword…"
                  className="w-full border border-gray-200 bg-gray-50 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white transition" />
                {searchText && (
                  <button onClick={() => setSearchText("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {CATEGORIES.map(cat => (
                  <CategoryPill key={cat} cat={cat} active={selectedCategory === cat}
                    onClick={() => setSelectedCategory(cat)} />
                ))}
              </div>
            </div>

            {/* Loading */}
            {loading && (
              <div className="bg-white rounded-[2rem] p-16 border border-gray-100 shadow-sm flex flex-col items-center gap-4">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 border-4 border-purple-100 border-t-purple-600 rounded-full animate-spin" />
                  <Landmark className="absolute inset-0 m-auto w-7 h-7 text-purple-600" />
                </div>
                <p className="text-purple-700 font-bold animate-pulse">Fetching government schemes…</p>
                <p className="text-gray-400 text-sm">Searching across central & state schemes</p>
              </div>
            )}

            {/* Empty State */}
            {!loading && displayList.length === 0 && (
              <div className="bg-white rounded-[2rem] p-16 border border-gray-100 shadow-sm flex flex-col items-center gap-4">
                <Landmark className="w-16 h-16 text-gray-200" />
                <div className="text-center">
                  <p className="font-bold text-gray-500 text-lg">
                    {showBookmarks ? "No saved schemes yet" : "Search for government schemes"}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    {showBookmarks
                      ? "Bookmark schemes to find them quickly later"
                      : "Select your state and click 'Find Schemes' to get AI-powered results"}
                  </p>
                </div>
              </div>
            )}

            {/* Results */}
            {!loading && displayList.length > 0 && (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-gray-500">
                    {showBookmarks ? "Saved Schemes" : "Search Results"} — <span className="text-purple-700">{displayList.length} schemes</span>
                  </p>
                </div>
                <div className="grid md:grid-cols-2 gap-5">
                  {displayList.map((scheme, i) => (
                    <SchemeCard key={i} scheme={scheme}
                      isBookmarked={!!bookmarks.find(b => b.name === scheme.name)}
                      onBookmark={toggleBookmark} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </FarmerLayout>
  );
}
