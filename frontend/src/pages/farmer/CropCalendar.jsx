import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import FarmerLayout from "./FarmerLayout";
import {
  Sprout, Calendar, CheckCircle2, Clock, Plus, ArrowRight,
  Loader2, Trash2
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

const COMMON_CROPS = [
  { name: "Rice / Paddy", emoji: "🌾" },
  { name: "Wheat", emoji: "🌾" },
  { name: "Cotton", emoji: "☁️" },
  { name: "Maize (Corn)", emoji: "🌽" },
  { name: "Sugarcane", emoji: "🎋" },
  { name: "Potato", emoji: "🥔" },
  { name: "Tomato", emoji: "🍅" },
  { name: "Onion", emoji: "🧅" }
];

export default function CropCalendar() {
  const { t } = useTranslation();
  const [calendars, setCalendars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [cropName, setCropName] = useState("");
  const [sowingDate, setSowingDate] = useState(new Date().toISOString().split("T")[0]);

  const getToken = () => localStorage.getItem("token") || sessionStorage.getItem("token");

  // Fetch calendars
  const fetchCalendars = async () => {
    try {
      const { data } = await axios.get(`${API}/api/calendar`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (data.success) {
        setCalendars(data.calendars || []);
      }
    } catch (err) {
      toast.error("Failed to load crop calendars");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendars();
  }, []);

  // Handle create calendar
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!cropName.trim()) {
      return toast.error("Please enter or select a crop name");
    }

    setSubmitting(true);
    try {
      const { data } = await axios.post(`${API}/api/calendar`, {
        cropName,
        sowingDate
      }, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (data.success) {
        toast.success("New crop calendar generated! 📅");
        setCalendars(prev => [data.calendar, ...prev]);
        setCropName("");
      }
    } catch (err) {
      toast.error("Failed to generate crop calendar");
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle stage completion
  const handleToggleStage = async (calendarId, stageId, currentStatus) => {
    const nextStatus = currentStatus === "done" ? "pending" : "done";
    try {
      const { data } = await axios.put(`${API}/api/calendar/${calendarId}/stage/${stageId}`, {
        status: nextStatus
      }, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (data.success) {
        setCalendars(prev => prev.map(c => c._id === calendarId ? data.calendar : c));
        toast.success(nextStatus === "done" ? "Stage marked complete! 🎉" : "Stage marked pending.");
      }
    } catch {
      toast.error("Failed to update stage status");
    }
  };

  // Delete calendar
  const handleDeleteCalendar = async (id) => {
    if (!window.confirm("Are you sure you want to delete this crop calendar?")) return;

    try {
      const { data } = await axios.delete(`${API}/api/calendar/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (data.success) {
        toast.success("Crop calendar deleted 🗑️");
        setCalendars(prev => prev.filter(c => c._id !== id));
      }
    } catch {
      toast.error("Failed to delete calendar");
    }
  };

  // Calculate calendar progress percentage
  const getProgress = (stages = []) => {
    if (stages.length === 0) return 0;
    const completedCount = stages.filter(s => s.status === "done").length;
    return Math.round((completedCount / stages.length) * 100);
  };

  return (
    <FarmerLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Banner */}
        <div className="bg-gradient-to-br from-emerald-700 via-green-700 to-teal-800 rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 opacity-10 text-[180px] leading-none pointer-events-none">📅</div>
          <div className="relative z-10">
            <h2 className="font-display text-3xl font-extrabold flex items-center gap-3">
              <Calendar className="w-8 h-8" /> Crop Calendar & Timeline
            </h2>
            <p className="text-emerald-100 mt-2 text-sm max-w-2xl">
              Plan and track your crop stages from sowing to harvesting. Get automated alerts when fertilizer, pesticide, or irrigation tasks are due.
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Form Side */}
          <div className="bg-white rounded-[2rem] p-7 border border-gray-100 shadow-sm space-y-6 self-start">
            <div>
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600" /> Start New Calendar
              </h3>
              <p className="text-xs text-gray-400 mt-1">Select a crop and enter the sowing date to generate a guided farming timeline.</p>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 mb-2 block">Crop Name</label>
                <input
                  type="text"
                  value={cropName}
                  onChange={(e) => setCropName(e.target.value)}
                  placeholder="e.g. Wheat"
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 text-sm font-semibold text-gray-800 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all"
                />
              </div>

              {/* Suggestions */}
              <div>
                <p className="text-xs font-semibold text-gray-400 mb-2">Or select common crops:</p>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_CROPS.map((crop) => (
                    <button
                      key={crop.name}
                      type="button"
                      onClick={() => setCropName(crop.name)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        cropName === crop.name
                          ? "bg-emerald-500 border-emerald-500 text-white shadow-sm"
                          : "bg-gray-50 border-gray-100 text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {crop.emoji} {crop.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 mb-2 block">Sowing Date</label>
                <input
                  type="date"
                  value={sowingDate}
                  onChange={(e) => setSowingDate(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 text-sm font-semibold text-gray-800 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold shadow-md shadow-emerald-100 transition disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>Generate Guided Timeline <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>
          </div>

          {/* Timeline Lists Side */}
          <div className="lg:col-span-2 space-y-6">
            {loading ? (
              <div className="bg-white rounded-[2rem] p-10 border border-gray-100 shadow-sm flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                <p className="text-sm text-gray-400">Loading Crop Calendars...</p>
              </div>
            ) : calendars.length === 0 ? (
              <div className="bg-white rounded-[2rem] p-12 border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-2xl">🌱</div>
                <div>
                  <h4 className="font-bold text-gray-800 text-lg">No Crop Calendars Active</h4>
                  <p className="text-sm text-gray-400 max-w-sm mt-1">You haven't generated any calendars yet. Fill out the form to generate a customized sowing timeline.</p>
                </div>
              </div>
            ) : (
              calendars.map((cal) => {
                const progress = getProgress(cal.stages);
                return (
                  <div key={cal._id} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden p-6 space-y-6 relative group">
                    
                    {/* Delete Calendar Button */}
                    <button
                      onClick={() => handleDeleteCalendar(cal._id)}
                      className="absolute top-6 right-6 p-2 rounded-xl text-gray-300 hover:text-red-600 hover:bg-red-50 transition duration-150"
                      title="Delete Calendar"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>

                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-8">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl">🌱</span>
                          <h4 className="text-xl font-bold text-gray-800">{cal.cropName}</h4>
                        </div>
                        <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-1.5">
                          <Calendar className="w-3.5 h-3.5" /> Sowing Date: {new Date(cal.sowingDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>

                      {/* Progress Meter */}
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Progress</p>
                          <p className="text-sm font-bold text-emerald-600">{progress}%</p>
                        </div>
                        <div className="w-20 bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div className="bg-emerald-500 h-full rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    </div>

                    {/* Timeline Stages */}
                    <div className="relative border-l border-gray-100 ml-4 pl-6 space-y-6">
                      {cal.stages.map((stage) => {
                        const isDone = stage.status === "done";
                        const expected = new Date(stage.dueDate);
                        const isTodayOrOverdue = expected <= new Date();
                        return (
                          <div key={stage._id} className="relative">
                            {/* Dot indicator */}
                            <span className={`absolute -left-[31px] top-1.5 w-[14px] h-[14px] rounded-full border-2 bg-white flex items-center justify-center transition-all ${
                              isDone ? "border-emerald-500 bg-emerald-50" : isTodayOrOverdue ? "border-amber-500 bg-amber-50 animate-pulse" : "border-gray-200"
                            }`} />

                            <div className={`p-4 rounded-2xl border transition-all ${
                              isDone
                                ? "bg-emerald-50/50 border-emerald-100 text-gray-500"
                                : isTodayOrOverdue
                                  ? "bg-amber-50/40 border-amber-100 text-gray-800 shadow-sm"
                                  : "bg-white border-gray-100 text-gray-700"
                            } flex items-center justify-between gap-4`}>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h5 className={`font-semibold text-sm ${isDone ? "line-through text-gray-400" : ""}`}>
                                    {stage.name}
                                  </h5>
                                  {isTodayOrOverdue && !isDone && (
                                    <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full">
                                      Action Required
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5" /> Target Date: {expected.toLocaleDateString("en-IN", { day: 'numeric', month: 'short' })}
                                  {isDone && stage.completedAt && (
                                    <span className="text-[10px] text-emerald-600 bg-emerald-100/50 px-1.5 py-0.5 rounded-full font-medium ml-2">
                                      Done: {new Date(stage.completedAt).toLocaleDateString("en-IN")}
                                    </span>
                                  )}
                                </p>
                                {stage.note && (
                                  <p className="text-[11px] text-gray-400 mt-1.5 leading-relaxed italic">
                                    💡 {stage.note}
                                  </p>
                                )}
                              </div>

                              <button
                                onClick={() => handleToggleStage(cal._id, stage._id, stage.status)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                                  isDone
                                    ? "bg-emerald-500 border-emerald-500 text-white hover:bg-emerald-600"
                                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                                }`}
                              >
                                {isDone ? (
                                  <>
                                    <CheckCircle2 className="w-4 h-4" /> Completed
                                  </>
                                ) : (
                                  "Mark Complete"
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </FarmerLayout>
  );
}
