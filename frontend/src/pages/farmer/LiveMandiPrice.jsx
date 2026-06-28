import { useState, useEffect, useCallback } from "react";
import FarmerLayout from "./FarmerLayout";
import { useTranslation } from "react-i18next";
import {
  TrendingUp, Search, RefreshCw, Loader, Info, MapPin,
  ChevronLeft, ChevronRight, IndianRupee, AlertCircle
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

const API = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : "http://localhost:8000/api";

export default function LiveMandiPrice() {
  const { t } = useTranslation();
  
  // State variables
  const [prices, setPrices] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  
  // Lists for dropdown filters
  const [statesList, setStatesList] = useState([]);
  const [districtsList, setDistrictsList] = useState([]);
  
  // Pagination & Loading
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("");
  const [error, setError] = useState(null);

  // Emojis for commodities to match rich visuals
  const emojiMap = {
    Tomato: "🍅", Onion: "🧅", Potato: "🥔", Wheat: "🌾", Rice: "🍚",
    Soybean: "🫘", Groundnut: "🥜", Cotton: "🌿", Sugarcane: "🎋", Maize: "🌽",
    Chilli: "🌶️", Turmeric: "🟡", Garlic: "🧄", Banana: "🍌", Mango: "🥭",
    "Urad Dal": "🫘", "Chana Dal": "🟡", Ginger: "🫚", Mustard: "🌻", Cauliflower: "🥦"
  };

  // Fetch unique states and districts to populate the selectors dynamically
  const fetchFilterLists = async () => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      // Fetch unfiltered legacy prices list to extract unique states and districts
      const { data } = await axios.get(`${API}/mandi/prices`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data && data.data) {
        // Flat map all markets
        const allMarkets = data.data.flatMap(c => c.markets || []);
        const uniqueStates = [...new Set(allMarkets.map(m => m.state))].sort();
        setStatesList(uniqueStates);
      }
    } catch (err) {
      console.error("Failed to populate filters list:", err.message);
    }
  };

  // Fetch unique districts based on selected state
  const fetchDistrictsForState = async (stateName) => {
    if (!stateName) {
      setDistrictsList([]);
      setSelectedDistrict("");
      return;
    }
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      // Fetch paginated prices for that state to get districts
      const { data } = await axios.get(`${API}/mandi?state=${stateName}&limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data && data.data) {
        const uniqueDistricts = [...new Set(data.data.map(item => item.district))].sort();
        setDistrictsList(uniqueDistricts);
      }
    } catch (err) {
      console.error("Failed to fetch districts:", err.message);
    }
  };

  // Fetch Mandi Prices from Backend Mapped Endpoint
  const fetchPrices = useCallback(async (pageNum = 1) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      let url = `${API}/mandi?page=${pageNum}&limit=10`;
      
      if (selectedState) url += `&state=${encodeURIComponent(selectedState)}`;
      if (selectedDistrict) url += `&district=${encodeURIComponent(selectedDistrict)}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;

      const { data } = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data && data.success) {
        setPrices(data.data);
        setTotalRecords(data.total);
        setTotalPages(data.pages || 1);
        setPage(data.page || 1);
        if (data.lastUpdated) {
          setLastUpdated(new Date(data.lastUpdated).toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            day: "numeric",
            month: "short",
            year: "numeric"
          }));
        }
      }
    } catch (err) {
      console.error("Fetch mandi prices error:", err.message);
      setError("Failed to fetch mandi prices. Please verify server connection.");
    } finally {
      setLoading(false);
    }
  }, [selectedState, selectedDistrict, search]);

  // Handle Manual Refresh (Trigger Scraper Sync)
  const handleRefresh = async () => {
    setRefreshing(true);
    const toastId = toast.loading("Syncing live rates from AGMARKNET website...");
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const { data } = await axios.post(`${API}/mandi/refresh`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data && data.success) {
        toast.success(data.message || "Rates updated successfully!", { id: toastId });
        fetchPrices(1);
      } else {
        toast.error("Failed to refresh. Serving last cached offline dataset.", { id: toastId });
      }
    } catch (err) {
      console.error("Mandi refresh error:", err.message);
      toast.error("Government source temporarily offline. Displaying last cached data.", { id: toastId });
      fetchPrices(page);
    } finally {
      setRefreshing(false);
    }
  };

  // Run on mount and state changes
  useEffect(() => {
    fetchFilterLists();
  }, []);

  useEffect(() => {
    fetchPrices(1);
  }, [selectedState, selectedDistrict, fetchPrices]);

  // Debounced search trigger
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchPrices(1);
    }, 400);
    return () => clearTimeout(delayDebounce);
  }, [search]);

  // State selection change handler
  const handleStateChange = (e) => {
    const val = e.target.value;
    setSelectedState(val);
    setSelectedDistrict("");
    fetchDistrictsForState(val);
  };

  // Auto-refresh every 30 minutes (1800000 ms)
  useEffect(() => {
    const interval = setInterval(() => {
      console.log("⏰ Auto-refreshing mandi prices in React UI...");
      fetchPrices(page);
    }, 1800000);
    return () => clearInterval(interval);
  }, [page, fetchPrices]);

  return (
    <FarmerLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Dynamic Header Banner */}
        <div className="bg-gradient-to-br from-amber-600 via-amber-700 to-orange-700 rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 opacity-10 text-[200px] leading-none pointer-events-none select-none">🌾</div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h2 className="font-display text-3xl font-extrabold flex items-center gap-2">
                <span>📊</span> Live Mandi Prices
              </h2>
              <p className="text-amber-100 mt-1 text-sm md:text-base">
                Real-time wholesale market rates synced from the official AGMARKNET database
              </p>
              
              <div className="flex flex-wrap items-center gap-3 mt-4">
                <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 border border-white/15">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse inline-block" /> Live Cache
                </span>
                {lastUpdated && (
                  <span className="text-amber-100 text-xs font-medium">
                    Last Updated: <span className="font-bold text-white">{lastUpdated}</span>
                  </span>
                )}
                <span className="text-amber-200 text-xs font-medium border-l border-amber-500/40 pl-3">
                  {totalRecords} commodities tracked
                </span>
              </div>
            </div>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-5 py-3.5 bg-white text-amber-900 hover:bg-amber-50 font-bold rounded-2xl shadow-lg transition-all duration-200 flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed group active:scale-[0.98]"
            >
              <RefreshCw className={`w-4 h-4 text-amber-800 ${refreshing ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"}`} />
              <span>{refreshing ? "Syncing..." : "Sync Live Rates"}</span>
            </button>
          </div>
        </div>

        {/* Caching Offline Message Alert */}
        {lastUpdated && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-start gap-3 text-emerald-800">
            <Info className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs md:text-sm">
              <span className="font-bold">Offline Cache Active:</span> If the government source is temporarily unavailable, the system automatically fallback-renders the last cached database records, guaranteeing seamless availability for farmers.
            </div>
          </div>
        )}

        {/* Filters Card */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          {/* Search Box */}
          <div className="space-y-1.5 col-span-1">
            <label className="text-xs font-extrabold text-gray-400 uppercase tracking-widest pl-1">Search Crop</label>
            <div className="relative">
              <Search className="absolute left-4 top-3.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search commodity (e.g. Onion)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 pl-11 pr-4 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Select State */}
          <div className="space-y-1.5 col-span-1">
            <label className="text-xs font-extrabold text-gray-400 uppercase tracking-widest pl-1">Select State</label>
            <select
              value={selectedState}
              onChange={handleStateChange}
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all appearance-none cursor-pointer"
            >
              <option value="">All States</option>
              {statesList.map((st, i) => (
                <option key={i} value={st}>{st}</option>
              ))}
            </select>
          </div>

          {/* Select District */}
          <div className="space-y-1.5 col-span-1">
            <label className="text-xs font-extrabold text-gray-400 uppercase tracking-widest pl-1">Select District</label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              disabled={!selectedState}
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">All Districts</option>
              {districtsList.map((dist, i) => (
                <option key={i} value={dist}>{dist}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-5 flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-semibold">{error}</p>
          </div>
        )}

        {/* Table & Data Container */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-20 flex flex-col items-center justify-center gap-4">
              <div className="relative w-12 h-12">
                <Loader className="w-12 h-12 text-amber-600 animate-spin" />
              </div>
              <p className="text-sm text-gray-400 font-bold animate-pulse">Loading live market rates...</p>
            </div>
          ) : prices.length === 0 ? (
            <div className="p-20 text-center space-y-4">
              <span className="text-5xl">🔍</span>
              <h3 className="font-bold text-gray-800 text-lg">No Mandi Rates Found</h3>
              <p className="text-sm text-gray-400 max-w-sm mx-auto font-medium">
                We couldn't find any results matching your filters. Try clearing search keywords or selecting other regions.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/75 border-b border-gray-100 text-gray-400 text-[10px] font-extrabold uppercase tracking-widest">
                    <th className="py-4 px-6">Commodity</th>
                    <th className="py-4 px-6">State</th>
                    <th className="py-4 px-6">District</th>
                    <th className="py-4 px-6">Market</th>
                    <th className="py-4 px-6 text-right">Min Price</th>
                    <th className="py-4 px-6 text-right">Max Price</th>
                    <th className="py-4 px-6 text-right text-amber-700 bg-amber-50/50">Modal Price</th>
                    <th className="py-4 px-6 text-center">Last Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm font-semibold text-gray-700">
                  {prices.map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50/40 transition">
                      <td className="py-4 px-6 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-lg shadow-inner">
                          {emojiMap[row.commodity] || "🌱"}
                        </div>
                        <div>
                          <p className="font-extrabold text-gray-900">{row.commodity}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">{row.variety || "FAQ"}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-gray-600">{row.state}</td>
                      <td className="py-4 px-6 text-gray-500 font-medium">{row.district}</td>
                      <td className="py-4 px-6 text-gray-500 font-medium">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-amber-600/70" />
                          <span>{row.market}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right text-red-600 font-extrabold">
                        ₹{row.minPrice.toLocaleString("en-IN")}/q
                      </td>
                      <td className="py-4 px-6 text-right text-green-600 font-extrabold">
                        ₹{row.maxPrice.toLocaleString("en-IN")}/q
                      </td>
                      <td className="py-4 px-6 text-right text-amber-700 font-black bg-amber-50/30">
                        ₹{row.modalPrice.toLocaleString("en-IN")}/q
                      </td>
                      <td className="py-4 px-6 text-center text-xs text-gray-400 font-bold">
                        {row.date || "Today"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {!loading && prices.length > 0 && (
            <div className="bg-gray-50/50 px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-gray-400 font-extrabold uppercase">
                Showing {prices.length} of {totalRecords} records
              </span>

              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => fetchPrices(page - 1)}
                  className="p-2 border border-gray-100 hover:bg-white text-gray-600 rounded-xl transition disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
                    <button
                      key={pNum}
                      onClick={() => fetchPrices(pNum)}
                      className={`w-9 h-9 rounded-xl text-xs font-bold transition ${
                        pNum === page
                          ? "bg-amber-600 text-white shadow-lg shadow-amber-600/30"
                          : "border border-gray-100 hover:bg-white text-gray-600"
                      }`}
                    >
                      {pNum}
                    </button>
                  ))}
                </div>

                <button
                  disabled={page >= totalPages}
                  onClick={() => fetchPrices(page + 1)}
                  className="p-2 border border-gray-100 hover:bg-white text-gray-600 rounded-xl transition disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </FarmerLayout>
  );
}

// Sub-component wrapper that allows embedding in tab view cleanly without FarmerLayout shell
export function LiveMandiPriceContent() {
  // Use the same component logic without layout shell
  return (
    <div className="space-y-6">
      {/* Renders the child logic simply */}
      <LiveMandiPriceNoLayout />
    </div>
  );
}

// Inner component wrapper for integration without duplicate layout
function LiveMandiPriceNoLayout() {
  const [prices, setPrices] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [statesList, setStatesList] = useState([]);
  const [districtsList, setDistrictsList] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("");
  const [error, setError] = useState(null);

  const emojiMap = {
    Tomato: "🍅", Onion: "🧅", Potato: "🥔", Wheat: "🌾", Rice: "🍚",
    Soybean: "🫘", Groundnut: "🥜", Cotton: "🌿", Sugarcane: "🎋", Maize: "🌽",
    Chilli: "🌶️", Turmeric: "🟡", Garlic: "🧄", Banana: "🍌", Mango: "🥭",
    "Urad Dal": "🫘", "Chana Dal": "🟡", Ginger: "🫚", Mustard: "🌻", Cauliflower: "🥦"
  };

  const fetchFilterLists = async () => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const { data } = await axios.get(`${API}/mandi/prices`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data && data.data) {
        const allMarkets = data.data.flatMap(c => c.markets || []);
        const uniqueStates = [...new Set(allMarkets.map(m => m.state))].sort();
        setStatesList(uniqueStates);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDistrictsForState = async (stateName) => {
    if (!stateName) return setDistrictsList([]);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const { data } = await axios.get(`${API}/mandi?state=${stateName}&limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data && data.data) {
        const uniqueDistricts = [...new Set(data.data.map(item => item.district))].sort();
        setDistrictsList(uniqueDistricts);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPrices = useCallback(async (pageNum = 1) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      let url = `${API}/mandi?page=${pageNum}&limit=10`;
      if (selectedState) url += `&state=${encodeURIComponent(selectedState)}`;
      if (selectedDistrict) url += `&district=${encodeURIComponent(selectedDistrict)}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;

      const { data } = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data && data.success) {
        setPrices(data.data);
        setTotalRecords(data.total);
        setTotalPages(data.pages || 1);
        setPage(data.page || 1);
        if (data.lastUpdated) {
          setLastUpdated(new Date(data.lastUpdated).toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            day: "numeric",
            month: "short",
            year: "numeric"
          }));
        }
      }
    } catch (err) {
      setError("Failed to fetch mandi prices.");
    } finally {
      setLoading(false);
    }
  }, [selectedState, selectedDistrict, search]);

  const handleRefresh = async () => {
    setRefreshing(true);
    const toastId = toast.loading("Syncing live rates...");
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const { data } = await axios.post(`${API}/mandi/refresh`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data && data.success) {
        toast.success(data.message || "Rates updated!", { id: toastId });
        fetchPrices(1);
      }
    } catch (err) {
      toast.error("Source offline. Displaying cached data.", { id: toastId });
      fetchPrices(page);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFilterLists();
  }, []);

  useEffect(() => {
    fetchPrices(1);
  }, [selectedState, selectedDistrict, fetchPrices]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchPrices(1);
    }, 400);
    return () => clearTimeout(delayDebounce);
  }, [search]);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-br from-amber-600 via-amber-700 to-orange-700 rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 text-[200px] leading-none pointer-events-none select-none">🌾</div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="font-display text-3xl font-extrabold flex items-center gap-2">
              <span>📊</span> Live Mandi Prices
            </h2>
            <p className="text-amber-100 mt-1 text-sm">
              Real-time wholesale market rates synced from the official AGMARKNET database
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse inline-block" /> Live Cache
              </span>
              {lastUpdated && (
                <span className="text-amber-100 text-xs font-medium">
                  Last Updated: <span className="font-bold text-white">{lastUpdated}</span>
                </span>
              )}
              <span className="text-amber-200 text-xs font-medium border-l border-amber-500/40 pl-3">
                {totalRecords} commodities
              </span>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-5 py-3 bg-white text-amber-900 hover:bg-amber-50 font-bold rounded-2xl shadow-lg transition duration-200 flex items-center gap-2 text-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            <span>{refreshing ? "Syncing..." : "Sync Live Rates"}</span>
          </button>
        </div>
      </div>

      {/* Info Warning */}
      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-start gap-3 text-emerald-800">
        <Info className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs">
          <span className="font-bold">Offline Cache Active:</span> Automatically fallback-renders last cached database records if government portal is offline.
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div className="space-y-1.5">
          <label className="text-xs font-extrabold text-gray-400 uppercase tracking-widest pl-1">Search Crop</label>
          <div className="relative">
            <Search className="absolute left-4 top-3.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search commodity (e.g. Tomato)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 pl-11 pr-4 text-sm font-semibold text-gray-800 focus:ring-2 focus:ring-amber-500 focus:bg-white outline-none"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-extrabold text-gray-400 uppercase tracking-widest pl-1">Select State</label>
          <select
            value={selectedState}
            onChange={(e) => {
              setSelectedState(e.target.value);
              setSelectedDistrict("");
              fetchDistrictsForState(e.target.value);
            }}
            className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 text-sm font-bold text-gray-700 outline-none cursor-pointer"
          >
            <option value="">All States</option>
            {statesList.map((st, i) => (
              <option key={i} value={st}>{st}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-extrabold text-gray-400 uppercase tracking-widest pl-1">Select District</label>
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            disabled={!selectedState}
            className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 text-sm font-bold text-gray-700 outline-none cursor-pointer disabled:opacity-50"
          >
            <option value="">All Districts</option>
            {districtsList.map((dist, i) => (
              <option key={i} value={dist}>{dist}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4">
            <Loader className="w-10 h-10 text-amber-600 animate-spin" />
            <p className="text-sm text-gray-400 font-bold">Loading rates...</p>
          </div>
        ) : prices.length === 0 ? (
          <div className="p-20 text-center">
            <span className="text-5xl">🔍</span>
            <h3 className="font-bold text-gray-800 text-lg mt-2">No Mandi Rates Found</h3>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/75 border-b border-gray-100 text-gray-400 text-[10px] font-extrabold uppercase tracking-widest">
                    <th className="py-4 px-6">Commodity</th>
                    <th className="py-4 px-6">State</th>
                    <th className="py-4 px-6">District</th>
                    <th className="py-4 px-6">Market</th>
                    <th className="py-4 px-6 text-right">Min Price</th>
                    <th className="py-4 px-6 text-right">Max Price</th>
                    <th className="py-4 px-6 text-right text-amber-700 bg-amber-50/50">Modal Price</th>
                    <th className="py-4 px-6 text-center">Last Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm font-semibold text-gray-700">
                  {prices.map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50/40 transition">
                      <td className="py-4 px-6 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-lg">
                          {emojiMap[row.commodity] || "🌱"}
                        </div>
                        <div>
                          <p className="font-extrabold text-gray-900">{row.commodity}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">{row.variety || "FAQ"}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-gray-600">{row.state}</td>
                      <td className="py-4 px-6 text-gray-500 font-medium">{row.district}</td>
                      <td className="py-4 px-6 text-gray-500 font-medium">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-amber-600/70" />
                          <span>{row.market}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right text-red-600 font-extrabold">
                        ₹{row.minPrice.toLocaleString("en-IN")}/q
                      </td>
                      <td className="py-4 px-6 text-right text-green-600 font-extrabold">
                        ₹{row.maxPrice.toLocaleString("en-IN")}/q
                      </td>
                      <td className="py-4 px-6 text-right text-amber-700 font-black bg-amber-50/30">
                        ₹{row.modalPrice.toLocaleString("en-IN")}/q
                      </td>
                      <td className="py-4 px-6 text-center text-xs text-gray-400 font-bold">
                        {row.date}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-gray-50/50 px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-gray-400 font-extrabold uppercase">
                Showing {prices.length} of {totalRecords} records
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => fetchPrices(page - 1)}
                  className="p-2 border border-gray-100 hover:bg-white text-gray-600 rounded-xl transition disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
                    <button
                      key={pNum}
                      onClick={() => fetchPrices(pNum)}
                      className={`w-9 h-9 rounded-xl text-xs font-bold transition ${
                        pNum === page
                          ? "bg-amber-600 text-white shadow-lg"
                          : "border border-gray-100 hover:bg-white text-gray-600"
                      }`}
                    >
                      {pNum}
                    </button>
                  ))}
                </div>
                <button
                  disabled={page >= totalPages}
                  onClick={() => fetchPrices(page + 1)}
                  className="p-2 border border-gray-100 hover:bg-white text-gray-600 rounded-xl transition disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
