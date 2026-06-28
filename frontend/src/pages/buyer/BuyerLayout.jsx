import { useState, createContext, useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ShoppingBag, LayoutDashboard, ClipboardList, TrendingUp, Users,
  LogOut, Menu, X, ChevronRight, Bell, Globe, User, ChevronDown, Check, Leaf, Tractor, MessageCircle, PhoneCall
} from "lucide-react";
import NotificationCenter from "../../components/NotificationCenter";
import LanguageSelector from "../../components/LanguageSelector";


export const BuyerLangContext = createContext("en");
export const useBuyerLang = () => useContext(BuyerLangContext);

export const bt = {
  en: { dashboard:"Dashboard", browse:"Crops & Auctions", equipment:"Farm Equipment", myOrders:"My Orders", marketPrice:"Market Prices", community:"Community", messages:"Messages", language:"Language", logout:"Logout",     hello:"Hello",     buyer:"Buyer", support:"Contact & Support" },
  hi: { dashboard:"डैशबोर्ड", browse:"फसल और नीलाਮੀ",    equipment:"खेत उपकरण",      myOrders:"मेरे ऑर्डर", marketPrice:"बाज़ार भाव",  community:"समुदाय",    messages:"संदेश",  language:"भाषा",    logout:"लॉगआउट",   hello:"नमस्ते",    buyer:"खरीदार", support:"संपर्क और सहायता" },
  mr: { dashboard:"डॅशबोर्ड", browse:"पिके आणि लिलाव",   equipment:"शेती उपकरणे",    myOrders:"माझे ऑर्डर", marketPrice:"बाजार भाव",   community:"समुदाय",    messages:"संदेश",  language:"भाषा",    logout:"लॉगआउट",   hello:"नमस्कार",   buyer:"खरेदीदार", support:"संपर्क आणि मदत" },
  ta: { dashboard:"டாஷ்போர்ட்", browse:"பொருட்கள்",       equipment:"கருவிகள்",        myOrders:"என் ஆர்டர்", marketPrice:"சந்தை விலை", community:"சமூகம்",    messages:"செய்திகள்", language:"மொழி", logout:"வெளியेறு", hello:"வணக்கம்",   buyer:"வாங்குனர்", support:"தொடர்பு & ஆதரவு" },
  te: { dashboard:"డాష్‌బోర్డ్", browse:"ఉత్పత్తులు",     equipment:"వ్యవసాయ పరికరాలు", myOrders:"నా ఆర్డర్లు", marketPrice:"మార్కెట్ ధర", community:"కమ్యూనిటీ", messages:"సందేశాలు", language:"భాష", logout:"లాగ్అవుట్",hello:"నమస్కారం",  buyer:"కొనుగోలుదారు", support:"సంప్రదించండి & మద్దతు" },
  kn: { dashboard:"ಡ್ಯಾಶ್‌ಬೋರ್ಡ್", browse:"ಉತ್ಪನ್ನಗಳು",   equipment:"ಕೃಷಿ ಉಪಕರಣ",    myOrders:"ನನ್ನ ಆರ್ಡರ್", marketPrice:"ಮಾರುಕಟ್ಟೆ",  community:"ಸಮುದಾಯ",   messages:"ಸಂದೇಶಗಳು", language:"ಭಾಷೆ", logout:"ಲಾಗ್ಔಟ್", hello:"ನಮಸ್ಕಾರ",  buyer:"ಖರೀದಿದಾರ", support:"ಸಂಪರ್ಕ ಮತ್ತು ಬೆಂಬಲ" },
  gu: { dashboard:"ડૅશબોર્ડ", browse:"ઉત્પાદનો",          equipment:"ખેત સાધનો",       myOrders:"મારા ઓર્ડર", marketPrice:"બજાર ભાવ",   community:"સમુદાય",    messages:"સեղશા",  language:"ભાષા",    logout:"લૉગ આઉટ", hello:"નમસ્તે",    buyer:"ખરીદનાર", support:"સંપર્ક અને સપોર્ટ" },
  pa: { dashboard:"ਡੈਸ਼ਬੋਰਡ", browse:"ਉਤਪਾਦ ਵੇਖੋ",         equipment:"ਖੇਤ ਉਪਕਰਣ",     myOrders:"ਮੇਰੇ ਆਰਡਰ", marketPrice:"ਬਾਜ਼ਾਰ ਭਾਅ", community:"ਭਾਈਚਾਰਾ",  messages:"ਸੁਨੇਹੇ",  language:"ਭਾਸ਼ਾ",  logout:"ਲੌਗਆਉਟ",  hello:"ਸਤ ਸ੍ਰੀ ਅਕਾਲ", buyer:"ਖਰੀਦਦਾਰ", support:"ਸੰਪਰਕ ਅਤੇ ਸਹਾਇਤਾ" },
  bn: { dashboard:"ড্যাশবোর্ড", browse:"পণ্য দেখুন",       equipment:"কৃষি যন্ত্রপাতি",  myOrders:"আমার অর্ডার", marketPrice:"বাজার মূল্য", community:"সম্প্রদায়", messages:"বার্তা",  language:"ভাষা",    logout:"লগআউট",    hello:"নমস্কার",   buyer:"ক্রেতা", support:"যোগাযোগ ও সহায়তা" },
  ml: { dashboard:"ಡಾಷ್ಬോർഡ്", browse:"ഉൽപ്പന്നങ്ങൾ",    equipment:"കാർഷിക ഉപകരണങ്ങൾ", myOrders:"ഓർഡറുകൾ",  marketPrice:"വിപണി വില",   community:"കമ്മ്യൂണിറ്റി", messages:"സന്ദേശങ്ങൾ", language:"ഭാഷ", logout:"ലോഗൗട്ട്", hello:"നമസ്കാരം",  buyer:"വാങ്ങുന്നയാൾ", support:"ബന്ധപ്പെടുക & പിന്തുണ" },
};

function getLang(code) { return bt[code] || bt.en; }

const navItems = (lang) => [
  { key:"dashboard", label:getLang(lang).dashboard,   icon:LayoutDashboard, path:"/buyer/dashboard",            emoji:"🏠" },
  { key:"browse",    label:getLang(lang).browse,      icon:ShoppingBag,     path:"/buyer/browse",               emoji:"🌾" },
  { key:"equipment", label:getLang(lang).equipment,   icon:Tractor,         path:"/buyer/browse?tab=equipment", emoji:"🚜" },
  { key:"orders",    label:getLang(lang).myOrders,    icon:ClipboardList,   path:"/buyer/orders",               emoji:"📦" },
  { key:"market",    label:getLang(lang).marketPrice, icon:TrendingUp,      path:"/buyer/market-prices",        emoji:"📊" },
  { key:"community", label:getLang(lang).community,   icon:Users,           path:"/buyer/community",            emoji:"👥" },
  { key:"chat",      label:getLang(lang).messages,    icon:MessageCircle,   path:"/buyer/chat",                 emoji:"💬" },
  { key:"support",   label:getLang(lang).support,     icon:PhoneCall,       path:"/buyer/contact-support",      emoji:"📞" },
];

function Sidebar({ lang, setLang, open, setOpen }) {
  const location = useLocation();
  const navigate = useNavigate();
  const getUser = () => {
    try {
      const uStr = localStorage.getItem("user") || sessionStorage.getItem("user");
      return uStr && uStr !== "undefined" && uStr !== "null" ? JSON.parse(uStr) : {};
    } catch {
      return {};
    }
  };
  const user    = getUser();
  const items    = navItems(lang);
  const t        = getLang(lang);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("agri_lang");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    navigate("/signin");
  };

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setOpen(false)} />}
      <aside className={`fixed top-0 left-0 h-full z-30 w-64 flex flex-col transform transition-transform duration-300 ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:static md:flex`}
        style={{ background: "linear-gradient(180deg, #854d0e 0%, #713f12 100%)" }}>

        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-yellow-900/50">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-md" style={{ background:"#ca8a04" }}>
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-display font-bold text-white text-sm leading-tight">Agri-Smart</p>
              <p className="text-yellow-400 text-xs -mt-0.5">Connect</p>
            </div>
          </Link>
          <button onClick={() => setOpen(false)} className="md:hidden text-yellow-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User info */}
        <div className="px-5 py-4 border-b border-yellow-900/50">
          <Link to="/profile" onClick={() => setOpen(false)} className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-md flex-shrink-0 group-hover:ring-2 group-hover:ring-yellow-400 transition-all" style={{ background:"#ca8a04" }}>
              👩‍💼
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-white font-bold text-sm truncate">{user.name || t.buyer}</p>
              <p className="text-yellow-400 text-xs">{t.buyer}</p>
            </div>
            <User className="w-3.5 h-3.5 text-yellow-500 group-hover:text-yellow-300 transition-colors flex-shrink-0" />
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5 sidebar-scroll">
          {items.map((item) => {
            const Icon = item.icon;
            const [itemPath, itemQuery] = item.path.split("?");
            const isEquip = item.key === "equipment";
            const active = isEquip
              ? location.pathname === "/buyer/browse" && location.search.includes("equipment")
              : item.key === "browse"
                ? location.pathname === "/buyer/browse" && !location.search.includes("equipment")
                : item.key === "chat"
                  ? location.pathname.startsWith("/buyer/chat")
                  : location.pathname === itemPath;
            return (
              <Link key={item.key} to={item.path} onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  active ? "text-white shadow-lg" : "text-yellow-200 hover:text-white"
                }`}
                style={active ? { backgroundColor:"#ca8a04" } : {}}>
                <span className="text-base flex-shrink-0">{item.emoji}</span>
                <span className="flex-1 truncate">{item.label}</span>
                {active && <ChevronRight className="w-3 h-3" />}
              </Link>
            );
          })}
        </nav>

        {/* Language */}
        <div className="px-4 py-3 border-t border-yellow-900/50">
          <p className="text-yellow-400 text-[10px] font-bold uppercase tracking-widest mb-2 px-1">{t.language}</p>
          <LanguageSelector
            value={lang}
            onChange={(code) => { setLang(code); localStorage.setItem('agri_lang', code); }}
            dark
            align="left"
            dropUp
            fullWidth
          />
        </div>

        {/* Logout */}
        <div className="px-4 py-4 border-t border-yellow-900/50">
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-300 hover:bg-red-900/30 hover:text-red-200 transition-all text-sm font-semibold">
            <LogOut className="w-4 h-4" />{t.logout}
          </button>
        </div>
      </aside>
    </>
  );
}

function Header({ lang, setLang, setOpen }) {
  const location = useLocation();
  const items    = navItems(lang);
  const current  = location.pathname.startsWith("/buyer/chat")
    ? items.find(i => i.key === "chat")
    : items.find(i => {
        const [p] = i.path.split("?");
        return i.key === "equipment"
          ? location.pathname === "/buyer/browse" && location.search.includes("equipment")
          : i.key === "browse"
            ? location.pathname === "/buyer/browse" && !location.search.includes("equipment")
            : location.pathname === p;
      });
  const getUser = () => {
    try {
      const uStr = localStorage.getItem("user") || sessionStorage.getItem("user");
      return uStr && uStr !== "undefined" && uStr !== "null" ? JSON.parse(uStr) : {};
    } catch {
      return {};
    }
  };
  const user    = getUser();
  const t        = getLang(lang);

  return (
    <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
      <div className="flex items-center gap-4">
        <button onClick={() => setOpen(true)} className="md:hidden text-gray-500 hover:text-earth-600 transition-colors">
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-display font-bold text-gray-800 text-lg leading-tight">{current?.label || t.dashboard}</h1>
          <p className="text-gray-400 text-xs">{t.hello}, {user.name?.split(" ")[0] || t.buyer}! 👋</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {/* Premium Language Selector */}
        <div className="hidden md:block">
          <LanguageSelector
            value={lang}
            onChange={(code) => { setLang(code); localStorage.setItem('agri_lang', code); }}
            align="right"
          />
        </div>
        <NotificationCenter />
        <Link to="/profile" className="w-10 h-10 rounded-xl flex items-center justify-center text-base shadow-md hover:opacity-90 transition-opacity" style={{ background:"#ca8a04" }}>
          👩‍💼
        </Link>
      </div>
    </header>
  );
}

export default function BuyerLayout({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      const uStr = localStorage.getItem("user") || sessionStorage.getItem("user");
      const u = uStr && uStr !== "undefined" && uStr !== "null" ? JSON.parse(uStr) : null;
      return localStorage.getItem('agri_lang') || u?.preferredLanguage || "en";
    } catch {
      return "en";
    }
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <BuyerLangContext.Provider value={lang}>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        <Sidebar lang={lang} setLang={setLang} open={sidebarOpen} setOpen={setSidebarOpen} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header lang={lang} setLang={setLang} setOpen={setSidebarOpen} />
          <main className="flex-1 overflow-y-auto p-6 page-enter">
            {children}
          </main>
        </div>

      </div>
    </BuyerLangContext.Provider>
  );
}

