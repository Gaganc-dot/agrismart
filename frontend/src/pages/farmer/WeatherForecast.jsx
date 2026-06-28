import { useState, useEffect } from "react";
import FarmerLayout from "./FarmerLayout";
import { useTranslation } from "react-i18next";
import {
  MapPin, Wind, Droplets, Thermometer, Eye, Loader, RefreshCw, Gauge,
  AlertTriangle, CheckCircle2, Info, Tractor, Droplet, Sun, Cloud,
  CloudRain, Snowflake, Zap, ArrowRight, Calendar
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, BarChart, Bar, Cell
} from "recharts";

const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;

function getWeatherStyle(code) {
  if (code >= 200 && code < 300) return { icon: "⛈️", label: "Thunderstorm", bg: "from-gray-700 to-gray-900", textColor: "text-white" };
  if (code >= 300 && code < 400) return { icon: "🌦️", label: "Drizzle",      bg: "from-blue-600 to-blue-900", textColor: "text-white" };
  if (code >= 500 && code < 600) return { icon: "🌧️", label: "Rain",         bg: "from-blue-500 to-blue-800", textColor: "text-white" };
  if (code >= 600 && code < 700) return { icon: "❄️", label: "Snow",         bg: "from-blue-200 to-blue-400", textColor: "text-blue-900" };
  if (code >= 700 && code < 800) return { icon: "🌫️", label: "Foggy",        bg: "from-gray-400 to-gray-600", textColor: "text-white" };
  if (code === 800)               return { icon: "☀️", label: "Clear Sky",    bg: "from-amber-400 to-orange-500", textColor: "text-white" };
  if (code > 800)                 return { icon: "⛅", label: "Cloudy",       bg: "from-slate-400 to-blue-500", textColor: "text-white" };
  return                                 { icon: "🌤️", label: "Weather",      bg: "from-primary-600 to-primary-900", textColor: "text-white" };
}

function getFarmingAlerts(weather, forecast) {
  const alerts = [];
  const temp = weather?.main?.temp;
  const humidity = weather?.main?.humidity;
  const windSpeed = weather?.wind?.speed;
  const weatherMain = weather?.weather?.[0]?.main;

  if (temp > 38) alerts.push({ type: "warning", icon: "🌡️", title: "Extreme Heat Alert", msg: "Irrigate crops early morning or evening. Avoid midday field work.", action: "Plan irrigation" });
  if (temp < 10) alerts.push({ type: "warning", icon: "❄️", title: "Cold Wave Alert", msg: "Protect sensitive crops with mulching or crop covers tonight.", action: "Protect crops" });
  if (humidity > 85) alerts.push({ type: "warning", icon: "💧", title: "High Humidity", msg: "Risk of fungal diseases. Apply preventive fungicide spray.", action: "Check fungicide" });
  if (windSpeed > 10) alerts.push({ type: "warning", icon: "💨", title: "Strong Winds", msg: "Postpone spraying operations. Secure young plants and polytunnels.", action: "Delay spraying" });
  if (weatherMain === "Rain") alerts.push({ type: "info", icon: "🌧️", title: "Rain Detected", msg: "Skip irrigation today. Great time to transplant seedlings.", action: "Save water" });
  if (weatherMain === "Clear" && temp >= 20 && temp <= 32) alerts.push({ type: "success", icon: "✅", title: "Perfect Farming Day", msg: "Ideal conditions for field operations, sowing, and crop management.", action: "Head to field" });
  if (humidity < 30) alerts.push({ type: "warning", icon: "🏜️", title: "Low Humidity", msg: "Increase irrigation frequency. Mulch soil to retain moisture.", action: "Irrigate more" });

  // Check rain in next 3 days from forecast
  const rainComing = forecast?.list?.slice(0, 8)?.some(f => f.weather[0].main === "Rain");
  if (rainComing) alerts.push({ type: "info", icon: "🌦️", title: "Rain Expected Soon", msg: "Hold off on fertilizer application until rain passes.", action: "Delay fertilizer" });

  if (alerts.length === 0) alerts.push({ type: "success", icon: "🌱", title: "Normal Conditions", msg: "Weather is suitable for regular farming activities.", action: "Proceed normally" });
  return alerts.slice(0, 4);
}

function StatTile({ icon, label, value }) {
  return (
    <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 text-center">
      <div className="flex justify-center mb-1.5 text-white/80">{icon}</div>
      <p className="text-white font-bold text-lg">{value}</p>
      <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider mt-0.5">{label}</p>
    </div>
  );
}

function ForecastDay({ day }) {
  const icons = { Clear: "☀️", Clouds: "⛅", Rain: "🌧️", Thunderstorm: "⛈️", Drizzle: "🌦️", Snow: "❄️", Mist: "🌫️", Fog: "🌫️" };
  const emoji = icons[day.weather[0].main] || "🌤️";
  const date = new Date(day.dt * 1000);
  const dayName = date.toLocaleDateString("en", { weekday: "short" });
  const dateStr = date.toLocaleDateString("en", { day: "numeric", month: "short" });
  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all text-center flex flex-col items-center gap-2">
      <p className="font-bold text-gray-800 text-sm">{dayName}</p>
      <p className="text-gray-400 text-[10px]">{dateStr}</p>
      <span className="text-3xl">{emoji}</span>
      <p className="text-xs text-gray-500 capitalize">{day.weather[0].description}</p>
      <div className="flex gap-2 text-xs font-bold mt-1">
        <span className="text-orange-500">{Math.round(day.main.temp_max)}°</span>
        <span className="text-blue-400">{Math.round(day.main.temp_min)}°</span>
      </div>
      {day.rain && (
        <span className="text-[9px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold">
          Rain {Math.round(day.rain?.["3h"] || 0)}mm
        </span>
      )}
    </div>
  );
}

function AlertCard({ alert }) {
  const styles = {
    warning: "border-orange-200 bg-orange-50",
    success: "border-green-200 bg-green-50",
    info: "border-blue-200 bg-blue-50",
  };
  const iconMap = {
    warning: <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0" />,
    success: <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />,
    info: <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />,
  };
  return (
    <div className={`rounded-2xl border-2 p-4 ${styles[alert.type]}`}>
      <div className="flex items-start gap-3">
        <span className="text-xl flex-shrink-0">{alert.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {iconMap[alert.type]}
            <h4 className="font-bold text-gray-800 text-sm">{alert.title}</h4>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">{alert.msg}</p>
          <button className="text-xs font-bold flex items-center gap-1 mt-2 text-gray-700 group">
            {alert.action} <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function WeatherContent() {
  const { t } = useTranslation();
  const [current, setCurrent] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [permDenied, setPermDenied] = useState(false);
  const [city, setCity] = useState("");

  const fetchWeather = (lat, lon) => {
    setLoading(true);
    Promise.all([
      fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`).then(r => r.json()),
      fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`).then(r => r.json()),
    ]).then(([curr, fore]) => {
      setCurrent(curr);
      setForecast(fore);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  const fetchByCity = async () => {
    if (!city.trim()) return;
    setLoading(true);
    try {
      const [curr, fore] = await Promise.all([
        fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`).then(r => r.json()),
        fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`).then(r => r.json()),
      ]);
      setCurrent(curr);
      setForecast(fore);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      ({ coords }) => fetchWeather(coords.latitude, coords.longitude),
      () => { setPermDenied(true); setLoading(false); }
    );
  }, []);

  // Extract daily from 3-hourly forecast (every 8 items = one day)
  const dailyForecast = forecast?.list
    ? forecast.list.filter((_, i) => i % 8 === 0).slice(0, 6)
    : [];

  // Hourly chart data (next 8 intervals = 24h)
  const hourlyData = forecast?.list?.slice(0, 8).map(f => ({
    time: new Date(f.dt * 1000).toLocaleTimeString("en", { hour: "2-digit", hour12: true }),
    Temp: Math.round(f.main.temp),
    Humidity: f.main.humidity,
  })) || [];

  const farmingAlerts = getFarmingAlerts(current, forecast);

  if (loading) return (
    <div className="flex flex-col justify-center items-center h-[60vh] gap-4">
      <div className="w-14 h-14 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
      <p className="text-blue-600 font-bold animate-pulse">Fetching weather data…</p>
    </div>
  );

  if (permDenied && !current) return (
    <div className="max-w-md mx-auto py-20 text-center space-y-4">
      <span className="text-6xl">📍</span>
      <h3 className="font-display font-bold text-xl text-gray-800">Enter Your Location</h3>
      <p className="text-gray-500 text-sm">Location access was denied. Search by city name instead.</p>
      <div className="flex gap-2">
        <input value={city} onChange={e => setCity(e.target.value)}
          onKeyDown={e => e.key === "Enter" && fetchByCity()}
          placeholder="e.g. Pune, Maharashtra"
          className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
        <button onClick={fetchByCity} className="bg-blue-600 text-white px-4 py-3 rounded-xl font-bold text-sm">Go</button>
      </div>
    </div>
  );

  if (!current) return <div className="p-20 text-center text-gray-400">Weather data unavailable.</div>;

  const style = getWeatherStyle(current.weather[0].id);

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-primary-800 rounded-[2rem] p-7 text-white shadow-xl flex items-center justify-between">
        <div>
          <h2 className="font-display text-3xl font-extrabold">{t("weather.title")}</h2>
          <p className="text-blue-200 mt-1 text-sm">{t("weather.subtitle")}</p>
        </div>
        <div className="flex gap-3">
          <div className="flex gap-2">
            <input value={city} onChange={e => setCity(e.target.value)}
              onKeyDown={e => e.key === "Enter" && fetchByCity()}
              placeholder="Search city…"
              className="bg-white/20 placeholder-white/50 text-white text-sm px-4 py-2 rounded-xl border border-white/20 focus:outline-none focus:bg-white/30 w-36" />
            <button onClick={fetchByCity} className="bg-white/20 hover:bg-white/30 px-3 py-2 rounded-xl transition">
              <MapPin className="w-4 h-4" />
            </button>
          </div>
          <button onClick={() => navigator.geolocation?.getCurrentPosition(({ coords }) => fetchWeather(coords.latitude, coords.longitude))}
            className="p-2.5 bg-white/20 hover:bg-white/30 rounded-xl transition">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Current weather hero */}
      <div className={`bg-gradient-to-br ${style.bg} rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden`}>
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1 opacity-80">
                <MapPin className="w-4 h-4" />
                <span className="font-bold text-lg">{current.name}, {current.sys?.country}</span>
              </div>
              <p className="text-sm opacity-60">
                {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
              </p>
            </div>
            <span className="text-8xl md:text-9xl" style={{ filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.2))" }}>
              {style.icon}
            </span>
          </div>
          <div className="mb-8">
            <h1 className="text-7xl md:text-8xl font-display font-extrabold leading-none">
              {Math.round(current.main.temp)}°C
            </h1>
            <p className="text-2xl opacity-90 capitalize mt-2">{current.weather[0].description}</p>
            <p className="text-sm opacity-60 mt-1">
              Feels like {Math.round(current.main.feels_like)}°C · High {Math.round(current.main.temp_max)}° · Low {Math.round(current.main.temp_min)}°
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatTile icon={<Droplets className="w-5 h-5" />} label={t("weather.humidity")} value={`${current.main.humidity}%`} />
            <StatTile icon={<Wind className="w-5 h-5" />} label={t("weather.wind")} value={`${current.wind.speed} m/s`} />
            <StatTile icon={<Eye className="w-5 h-5" />} label={t("weather.visibility")} value={`${(current.visibility / 1000).toFixed(1)} km`} />
            <StatTile icon={<Gauge className="w-5 h-5" />} label={t("weather.pressure")} value={`${current.main.pressure} hPa`} />
          </div>
        </div>
      </div>

      {/* Hourly temp chart */}
      {hourlyData.length > 0 && (
        <div className="bg-white rounded-[2rem] p-7 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 text-lg mb-5 flex items-center gap-2">
            <Thermometer className="w-5 h-5 text-orange-500" /> 24-Hour Temperature Forecast
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 10 }} tickFormatter={v => `${v}°`} />
                <RechartsTooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 40px rgba(0,0,0,0.08)" }} />
                <Area type="monotone" dataKey="Temp" stroke="#f97316" strokeWidth={2.5} fill="url(#tempGrad)" dot={{ r: 3, fill: "#f97316" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 7-day forecast */}
      {dailyForecast.length > 0 && (
        <div className="bg-white rounded-[2rem] p-7 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 text-lg mb-5 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" /> 7-Day Forecast
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {dailyForecast.map((day, i) => <ForecastDay key={i} day={day} />)}
          </div>
        </div>
      )}

      {/* Farming alerts */}
      <div className="bg-white rounded-[2rem] p-7 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 text-lg mb-5 flex items-center gap-2">
          <Tractor className="w-5 h-5 text-primary-600" /> Farming Alerts & Recommendations
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          {farmingAlerts.map((a, i) => <AlertCard key={i} alert={a} />)}
        </div>
      </div>

      {/* Humidity chart */}
      {hourlyData.length > 0 && (
        <div className="bg-white rounded-[2rem] p-7 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 text-lg mb-5 flex items-center gap-2">
            <Droplet className="w-5 h-5 text-blue-500" /> Hourly Humidity Tracking
          </h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 10 }} tickFormatter={v => `${v}%`} />
                <RechartsTooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 40px rgba(0,0,0,0.08)" }} />
                <Bar dataKey="Humidity" radius={[6, 6, 0, 0]} barSize={28}>
                  {hourlyData.map((entry, i) => (
                    <Cell key={i} fill={entry.Humidity > 80 ? "#3b82f6" : entry.Humidity > 60 ? "#60a5fa" : "#bfdbfe"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-gray-400 mt-3 text-center">
            💡 Humidity above 85% increases fungal disease risk. Plan accordingly.
          </p>
        </div>
      )}
    </div>
  );
}

export default function WeatherForecast() {
  return (
    <FarmerLayout>
      <WeatherContent />
    </FarmerLayout>
  );
}
