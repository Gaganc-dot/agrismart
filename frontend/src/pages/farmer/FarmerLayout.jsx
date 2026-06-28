import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axios from "axios";
import {
  Leaf, LayoutDashboard, ShoppingBag, Landmark, Wallet,
  Users, LogOut, Menu, X, ChevronRight, ChevronDown, User,
  TrendingUp, Sparkles, ClipboardList, Settings, MessageCircle, Calendar, PhoneCall,
} from "lucide-react";
import NotificationCenter from "../../components/NotificationCenter";
import LanguageSelector from "../../components/LanguageSelector";
import ChatWidget from "../../components/ChatWidget";

/** Shared helper — persists lang to localStorage + backend */
async function changeLang(code, i18n) {
  i18n.changeLanguage(code);
  localStorage.setItem('agri_lang', code);
  try {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (token) {
      const API = import.meta.env.VITE_API_URL || "http://localhost:8000";
      await axios.put(`${API}/api/auth/language`, { language: code }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const u = JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "{}");
      u.preferredLanguage = code;
      if (localStorage.getItem("token")) localStorage.setItem("user", JSON.stringify(u));
      else sessionStorage.setItem("user", JSON.stringify(u));
    }
  } catch (err) {
    console.error("Language sync failed", err);
  }
}

/**
 * New clean 7-section nav structure.
 * Each section has a label (displayed as a group header) and items.
 */
const NAV_SECTIONS = (t) => [
  {
    items: [
      { key:"dashboard", label:t("nav.dashboard"), icon:LayoutDashboard, path:"/farmer/dashboard", emoji:"🏠" },
      { key:"hub",       label:"Smart Farming Hub", icon:Sparkles,       path:"/farmer/hub",        emoji:"🌱",
        badge:"AI" },
      { key:"calendar",  label:t("nav.calendar", "Crop Calendar"), icon:Calendar,     path:"/farmer/crop-calendar",   emoji:"📅" },
    ],
  },
  {
    heading: "Marketplace",
    items: [
      { key:"marketplace", label:"Agri Marketplace", icon:ShoppingBag,  path:"/farmer/marketplace", emoji:"🛒" },
      { key:"orders",      label:"My Orders",         icon:ClipboardList, path:"/farmer/orders",      emoji:"📦" },
    ],
  },
  {
    heading: "Finance",
    items: [
      { key:"expenses", label:t("nav.expenses"), icon:Wallet,     path:"/farmer/expenses",         emoji:"💰" },
      { key:"profit",   label:t("nav.profit"),   icon:TrendingUp, path:"/farmer/profit-prediction", emoji:"📈" },
    ],
  },
  {
    heading: "More",
    items: [
      { key:"schemes",   label:t("nav.schemes"),   icon:Landmark,      path:"/farmer/schemes",   emoji:"🏛️" },
      { key:"community", label:t("nav.community"), icon:Users,         path:"/farmer/community", emoji:"👥" },
      { key:"chat",      label:"Messages",          icon:MessageCircle, path:"/farmer/chat",      emoji:"💬" },
      { key:"support",   label:t("nav.support", "Contact & Support"), icon:PhoneCall, path:"/farmer/contact-support", emoji:"📞" },
    ],
  },
];

function Sidebar({ open, setOpen }) {
  const { t, i18n } = useTranslation();
  const location   = useLocation();
  const navigate   = useNavigate();
  const user       = JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "{}");
  const sections   = NAV_SECTIONS(t);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("agri_lang");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    navigate("/signin");
  };

  const changeLanguage = (code) => changeLang(code, i18n);

  // Check if hub sub-tabs are active (for /farmer/hub?tab=*)
  const isHubActive = location.pathname === "/farmer/hub" ||
    ["/farmer/weather","/farmer/crop-recommendation","/farmer/market-prices",
     "/farmer/disease-detection","/farmer/fertilizer"].includes(location.pathname);

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setOpen(false)} />}
      <aside className={`fixed top-0 left-0 h-full z-30 w-64 bg-primary-900 flex flex-col transform transition-transform duration-300 ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:static md:flex`}>
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-primary-800">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center shadow-lg shadow-primary-900/50">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-display font-bold text-white text-sm leading-tight">Agri-Smart</p>
              <p className="text-primary-400 text-xs -mt-0.5">Connect</p>
            </div>
          </Link>
          <button onClick={() => setOpen(false)} className="md:hidden text-primary-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User info + Profile link */}
        <div className="px-5 py-4 border-b border-primary-800">
          <Link to="/profile" onClick={() => setOpen(false)} className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-lg shadow-md flex-shrink-0 group-hover:ring-2 group-hover:ring-primary-400 transition-all">
              👨‍🌾
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-white font-bold text-sm truncate">{user.name || "Farmer"}</p>
              <p className="text-primary-400 text-xs">{t("common.farmer")}</p>
            </div>
            <User className="w-3.5 h-3.5 text-primary-500 group-hover:text-primary-300 transition-colors flex-shrink-0" />
          </Link>
        </div>

        {/* Nav — grouped sections */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 sidebar-scroll space-y-5">
          {sections.map((section, si) => (
            <div key={si}>
              {section.heading && (
                <p className="text-primary-500 text-[9px] font-bold uppercase tracking-[0.12em] px-3 mb-1.5">
                  {section.heading}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = item.key === "hub"
                    ? isHubActive
                    : item.key === "chat"
                      ? location.pathname.startsWith("/farmer/chat")
                      : location.pathname === item.path;
                  return (
                    <Link key={item.key} to={item.path} onClick={() => setOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 group relative ${
                        active
                          ? "bg-primary-600 text-white shadow-lg shadow-primary-900/40"
                          : "text-primary-300 hover:bg-primary-800 hover:text-white"
                      }`}>
                      <span className="text-base leading-none flex-shrink-0">{item.emoji}</span>
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge && !active && (
                        <span className="text-[8px] font-bold bg-primary-500 text-white px-1.5 py-0.5 rounded-full flex-shrink-0">
                          {item.badge}
                        </span>
                      )}
                      {active && <ChevronRight className="w-3 h-3 flex-shrink-0" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Settings link at the bottom of nav */}
          <div className="pt-1 border-t border-primary-800/60">
            <Link to="/profile" onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                location.pathname === "/profile"
                  ? "bg-primary-600 text-white"
                  : "text-primary-400 hover:bg-primary-800 hover:text-white"
              }`}>
              <span className="text-base">⚙️</span>
              <span className="flex-1">Settings & Profile</span>
            </Link>
          </div>
        </nav>

        {/* Language Switcher */}
        <div className="px-4 py-3 border-t border-primary-800">
          <p className="text-primary-400 text-[10px] font-bold uppercase tracking-widest mb-2 px-1">{t("nav.language")}</p>
          <LanguageSelector
            value={i18n.language.split('-')[0]}
            onChange={changeLanguage}
            dark
            align="left"
            dropUp
            fullWidth
          />
        </div>

        {/* Logout */}
        <div className="px-4 py-4 border-t border-primary-800">
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-900/30 hover:text-red-300 transition-all text-sm font-semibold">
            <LogOut className="w-4 h-4" /> {t("nav.logout")}
          </button>
        </div>
      </aside>
    </>
  );
}

function Header({ setOpen }) {
  const { t, i18n } = useTranslation();
  const location    = useLocation();
  const user        = JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "{}");
  const sections    = NAV_SECTIONS(t);

  // Find current page label from new grouped nav
  const allItems    = sections.flatMap(s => s.items);
  const isHub       = ["/farmer/hub","/farmer/weather","/farmer/crop-recommendation",
                       "/farmer/market-prices","/farmer/disease-detection","/farmer/fertilizer"].includes(location.pathname);
  const current     = isHub
    ? { label: "Smart Farming Hub", emoji: "🌱" }
    : allItems.find(i => i.path === location.pathname);

  return (
    <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-sm">
      <div className="flex items-center gap-4">
        <button onClick={() => setOpen(true)} className="md:hidden text-gray-500 hover:text-primary-600 transition-colors">
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-display font-bold text-gray-800 text-lg leading-tight flex items-center gap-2">
            {current?.emoji && <span className="text-base">{current.emoji}</span>}
            {current?.label || t("nav.dashboard")}
          </h1>
          <p className="text-gray-400 text-xs">{t("common.hello")}, {user.name?.split(" ")[0] || t("common.farmer")}! 👋</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications */}
        <NotificationCenter />

        {/* Profile Avatar */}
        <Link to="/profile" className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-lg shadow-lg shadow-primary-900/20 hover:bg-primary-700 transition-colors">
          👨‍🌾
        </Link>
      </div>
    </header>
  );
}

export default function FarmerLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header setOpen={sidebarOpen} />
        <main className="flex-1 overflow-y-auto p-6 page-enter">
          {children}
        </main>
      </div>
      <ChatWidget />
    </div>
  );
}

