import { useState, useEffect } from "react";
import {
  Wind, Droplets, Thermometer, Eye,
  MapPin, CloudRain, Sun, Cloud,
  CloudSnow, Zap, AlertCircle, Loader
} from "lucide-react";

// Map weather condition codes to icons + labels + bg colors
function getWeatherStyle(code) {
  if (code >= 200 && code < 300) return { icon: "⛈️", label: "Thunderstorm", bg: "from-gray-700 to-gray-900", text: "text-yellow-300" };
  if (code >= 300 && code < 400) return { icon: "🌦️", label: "Drizzle",      bg: "from-blue-700 to-blue-900", text: "text-blue-200" };
  if (code >= 500 && code < 600) return { icon: "🌧️", label: "Rain",         bg: "from-blue-600 to-blue-900", text: "text-blue-100" };
  if (code >= 600 && code < 700) return { icon: "❄️", label: "Snow",         bg: "from-blue-200 to-blue-400", text: "text-blue-900" };
  if (code >= 700 && code < 800) return { icon: "🌫️", label: "Foggy",        bg: "from-gray-400 to-gray-600", text: "text-gray-100" };
  if (code === 800)               return { icon: "☀️", label: "Clear Sky",    bg: "from-yellow-400 to-orange-500", text: "text-yellow-900" };
  if (code > 800)                 return { icon: "⛅", label: "Cloudy",       bg: "from-gray-400 to-blue-500", text: "text-white" };
  return                                 { icon: "🌤️", label: "Weather",      bg: "from-primary-600 to-primary-900", text: "text-white" };
}

// Farming advisory based on weather
function getFarmingTip(code, temp) {
  if (code >= 200 && code < 300) return "⚡ Thunderstorm expected — keep livestock sheltered and avoid open fields.";
  if (code >= 500 && code < 600) return "🌧️ Rain today — good for irrigation-free watering, avoid pesticide spraying.";
  if (code >= 600 && code < 700) return "❄️ Frost risk — protect sensitive crops with covers overnight.";
  if (code === 800 && temp > 35)  return "🔥 Very hot day — water crops early morning or evening to avoid evaporation.";
  if (code === 800)               return "☀️ Clear sunny day — ideal for harvesting, drying grains, and spraying.";
  if (code > 800)                 return "⛅ Partly cloudy — good conditions for field work and transplanting.";
  return "🌱 Check local forecasts before planning heavy fieldwork today.";
}

export default function WeatherWidget() {
  const [weather, setWeather]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [permDenied, setPermDenied] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported by your browser.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const apiKey = import.meta.env.VITE_WEATHER_API_KEY;

          const res = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`
          );

          if (!res.ok) throw new Error("Weather data unavailable");
          const data = await res.json();
          setWeather(data);
        } catch (err) {
          setError("Could not fetch weather data.");
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) setPermDenied(true);
        else setError("Location access failed.");
        setLoading(false);
      }
    );
  }, []);

  // ── Loading State ──
  if (loading) {
    return (
      <div className="bg-gradient-to-br from-primary-700 to-primary-900 rounded-3xl p-6 text-white flex items-center gap-4 shadow-lg">
        <Loader className="w-6 h-6 animate-spin text-primary-200" />
        <div>
          <p className="font-bold text-sm">Fetching weather...</p>
          <p className="text-primary-200 text-xs mt-0.5">Allow location access when prompted</p>
        </div>
      </div>
    );
  }

  // ── Permission Denied State ──
  if (permDenied) {
    return (
      <div className="bg-gradient-to-br from-gray-700 to-gray-900 rounded-3xl p-6 text-white shadow-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm">Location Access Denied</p>
            <p className="text-gray-300 text-xs mt-1 leading-relaxed">
              To see local weather & farming tips, please allow location access in your browser settings.
            </p>
            <p className="text-gray-400 text-xs mt-2">
              <span className="font-semibold">Chrome:</span> Click 🔒 in address bar → Site settings → Allow Location
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Error State ──
  if (error) {
    return (
      <div className="bg-gradient-to-br from-red-700 to-red-900 rounded-3xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-200" />
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // ── Weather Data ──
  const style   = getWeatherStyle(weather.weather[0].id);
  const tip     = getFarmingTip(weather.weather[0].id, weather.main.temp);
  const sunrise = new Date(weather.sys.sunrise * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const sunset  = new Date(weather.sys.sunset  * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className={`bg-gradient-to-br ${style.bg} rounded-3xl p-6 text-white shadow-xl`}>
      {/* Top Row — location + condition */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <MapPin className="w-3.5 h-3.5 text-white/70" />
            <span className="text-white/70 text-xs font-semibold">
              {weather.name}, {weather.sys.country}
            </span>
          </div>
          <p className="text-5xl font-bold font-display">{Math.round(weather.main.temp)}°C</p>
          <p className="text-white/80 text-sm mt-1 capitalize">{weather.weather[0].description}</p>
        </div>
        <div className="text-right">
          <span className="text-6xl">{style.icon}</span>
          <p className={`text-xs font-bold mt-1 ${style.text}`}>{style.label}</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[
          { icon: <Thermometer className="w-3.5 h-3.5" />, label: "Feels Like", val: `${Math.round(weather.main.feels_like)}°C` },
          { icon: <Droplets    className="w-3.5 h-3.5" />, label: "Humidity",   val: `${weather.main.humidity}%` },
          { icon: <Wind        className="w-3.5 h-3.5" />, label: "Wind",       val: `${Math.round(weather.wind.speed)} m/s` },
          { icon: <Eye         className="w-3.5 h-3.5" />, label: "Visibility", val: `${(weather.visibility / 1000).toFixed(1)} km` },
        ].map((s, i) => (
          <div key={i} className="bg-white/15 rounded-xl p-2.5 text-center backdrop-blur-sm">
            <div className="flex justify-center text-white/70 mb-1">{s.icon}</div>
            <p className="text-white font-bold text-xs">{s.val}</p>
            <p className="text-white/60 text-xs mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Sunrise / Sunset */}
      <div className="flex justify-between bg-white/10 rounded-xl px-4 py-2.5 mb-4 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="text-lg">🌅</span>
          <div>
            <p className="text-white/60 text-xs">Sunrise</p>
            <p className="text-white font-bold text-sm">{sunrise}</p>
          </div>
        </div>
        <div className="w-px bg-white/20" />
        <div className="flex items-center gap-2">
          <span className="text-lg">🌇</span>
          <div>
            <p className="text-white/60 text-xs">Sunset</p>
            <p className="text-white font-bold text-sm">{sunset}</p>
          </div>
        </div>
        <div className="w-px bg-white/20" />
        <div className="flex items-center gap-2">
          <span className="text-lg">💧</span>
          <div>
            <p className="text-white/60 text-xs">Min / Max</p>
            <p className="text-white font-bold text-sm">
              {Math.round(weather.main.temp_min)}° / {Math.round(weather.main.temp_max)}°
            </p>
          </div>
        </div>
      </div>

      {/* Farming Advisory */}
      <div className="bg-black/20 rounded-xl px-4 py-3 backdrop-blur-sm">
        <p className="text-white/70 text-xs font-bold uppercase tracking-wider mb-1">🌾 Farming Advisory</p>
        <p className="text-white text-xs leading-relaxed">{tip}</p>
      </div>
    </div>
  );
}