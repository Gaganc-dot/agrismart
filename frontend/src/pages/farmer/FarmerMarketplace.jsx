import { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import FarmerLayout from "./FarmerLayout";
import axios from "axios";
import toast from "react-hot-toast";
import {
  ShoppingBag, Tractor, Gavel, Package, Plus, Search, Filter,
  MapPin, Phone, Tag, ChevronDown, X, RefreshCw, Loader,
  TrendingUp, TrendingDown, Minus, Sparkles, Star, IndianRupee,
  CheckCircle, Clock, Eye, BarChart2, Zap, AlertCircle,
  ArrowUpRight, Camera, Upload, Info, ArrowRight, Scale,
  Wrench, Edit2, Trash2, ToggleLeft
} from "lucide-react";

const API = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : "http://localhost:8000/api";

// ── Constants ─────────────────────────────────────────────────────────────────
const UNITS = ["kg", "quintal", "ton", "litre", "dozen", "piece", "bag"];
const CROP_CATEGORIES = ["vegetables","grains","oilseeds","cash crops","pulses","spices","fruits","other"];

const EQUIPMENT_CATEGORIES = [
  { id:"tractor",    label:"Tractor",        emoji:"🚜" },
  { id:"harvester",  label:"Harvester",       emoji:"🌾" },
  { id:"sprayer",    label:"Sprayer",         emoji:"💧" },
  { id:"rotavator",  label:"Rotavator",       emoji:"⚙️" },
  { id:"seeder",     label:"Seeder",          emoji:"🌱" },
  { id:"cultivator", label:"Cultivator",      emoji:"🔧" },
  { id:"plough",     label:"Plough",          emoji:"🪵" },
  { id:"pump",       label:"Water Pump",      emoji:"⛽" },
  { id:"irrigation", label:"Drip Irrigation", emoji:"💦" },
  { id:"thresher",   label:"Thresher",        emoji:"🏗️" },
  { id:"trolley",    label:"Trolley",         emoji:"🛒" },
  { id:"tools",      label:"Hand Tools",      emoji:"🛠️" },
  { id:"other",      label:"Other",           emoji:"📦" },
];

const CONDITION_COLORS = {
  new:         { bg:"bg-green-100",  text:"text-green-700",  border:"border-green-200",  label:"New"         },
  used:        { bg:"bg-amber-100",  text:"text-amber-700",  border:"border-amber-200",  label:"Used"        },
  refurbished: { bg:"bg-blue-100",   text:"text-blue-700",   border:"border-blue-200",   label:"Refurbished" },
};

const TABS = [
  { id:"browse",    label:"Browse",      emoji:"🏪", desc:"All listings" },
  { id:"crops",     label:"Sell Crops",  emoji:"🌾", desc:"Live mandi prices" },
  { id:"equipment", label:"Equipment",   emoji:"🚜", desc:"Buy & sell machinery" },
  { id:"mylist",    label:"My Listings", emoji:"📦", desc:"Manage your listings" },
];

// ── Auth helper ───────────────────────────────────────────────────────────────
function getToken() { return localStorage.getItem("token") || sessionStorage.getItem("token"); }
function authH()    { return { Authorization: `Bearer ${getToken()}` }; }

// ── Price trend icon ──────────────────────────────────────────────────────────
function TrendIcon({ trend, size = "w-3.5 h-3.5" }) {
  if (trend === "up")     return <TrendingUp   className={`${size} text-green-500`} />;
  if (trend === "down")   return <TrendingDown className={`${size} text-red-500`} />;
  return <Minus className={`${size} text-gray-400`} />;
}

// ── Mandi price badge (small inline) ─────────────────────────────────────────
function MandiBadge({ mandiPrice, unit }) {
  if (!mandiPrice) return null;
  return (
    <span className="inline-flex items-center gap-1 bg-green-50 border border-green-200 text-green-700 text-[9px] font-bold px-2 py-0.5 rounded-full">
      <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
      Mandi ₹{mandiPrice.toLocaleString()}/{unit}
    </span>
  );
}

// ── Crop listing card ─────────────────────────────────────────────────────────
function CropCard({ product, onContact }) {
  const discount = product.mandiRefPrice
    ? Math.round(((product.price - product.mandiRefPrice) / product.mandiRefPrice) * 100)
    : null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 overflow-hidden group">
      {/* Image / placeholder */}
      <div className="relative h-40 bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center overflow-hidden">
        {product.images?.[0] ? (
          <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />
        ) : (
          <span className="text-6xl opacity-40">🌾</span>
        )}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.isAuction && (
            <span className="bg-orange-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Gavel className="w-2.5 h-2.5" /> Auction
            </span>
          )}
          {discount !== null && (
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
              discount > 0 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
            }`}>
              {discount > 0 ? `+${discount}%` : `${discount}%`} vs Mandi
            </span>
          )}
        </div>
        {product.negotiable && (
          <div className="absolute top-2 right-2 bg-blue-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">Negotiable</div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <h3 className="font-bold text-gray-800 text-sm leading-tight">{product.title}</h3>
            <p className="text-gray-400 text-[10px] capitalize mt-0.5">{product.category}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="font-display font-extrabold text-primary-700 text-base">
              ₹{product.price?.toLocaleString()}
            </p>
            <p className="text-gray-400 text-[9px]">/{product.unit}</p>
          </div>
        </div>

        {/* Mandi reference */}
        <MandiBadge mandiPrice={product.mandiRefPrice} unit={product.unit} />

        <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
          <span className="flex items-center gap-1"><Scale className="w-3 h-3" />{product.quantity} {product.unit}</span>
          {product.location && <span className="flex items-center gap-1 truncate"><MapPin className="w-3 h-3 flex-shrink-0" />{product.location}</span>}
        </div>

        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-gray-400 truncate">
              by {product.farmer?.name || "Farmer"}
            </p>
          </div>
          <button
            onClick={() => onContact(product)}
            className="bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1"
          >
            <Phone className="w-3 h-3" /> Contact
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Equipment card ────────────────────────────────────────────────────────────
function EquipmentCard({ item, onContact }) {
  const cond  = CONDITION_COLORS[item.condition] || CONDITION_COLORS.used;
  const cat   = EQUIPMENT_CATEGORIES.find(c => c.id === item.category);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 overflow-hidden">
      <div className="relative h-44 bg-gradient-to-br from-slate-100 to-gray-200 flex items-center justify-center overflow-hidden">
        {item.images?.[0] ? (
          <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-7xl opacity-30">{cat?.emoji || "🚜"}</span>
        )}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${cond.bg} ${cond.text} ${cond.border}`}>
            {cond.label}
          </span>
          {item.isRental && (
            <span className="bg-purple-100 text-purple-700 border border-purple-200 text-[9px] font-bold px-2 py-0.5 rounded-full">
              For Rent
            </span>
          )}
        </div>
        {item.negotiable && (
          <div className="absolute top-2 right-2 bg-blue-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">Negotiable</div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <h3 className="font-bold text-gray-800 text-sm leading-tight">{item.name}</h3>
            <p className="text-gray-400 text-[10px] mt-0.5">{cat?.label || item.category} {item.brand ? `· ${item.brand}` : ""}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="font-display font-extrabold text-gray-800 text-base">₹{item.price?.toLocaleString()}</p>
            {item.isRental && item.rentalPricePerDay && (
              <p className="text-purple-600 text-[9px] font-bold">₹{item.rentalPricePerDay}/day</p>
            )}
          </div>
        </div>

        {item.yearOfManufacture && (
          <p className="text-xs text-gray-400 mb-2">Year: {item.yearOfManufacture}
            {item.hoursUsed ? ` · ${item.hoursUsed.toLocaleString()} hrs` : ""}
          </p>
        )}

        {item.description && (
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-2">{item.description}</p>
        )}

        <div className="flex items-center gap-2 mt-2 pt-3 border-t border-gray-50">
          {item.location && (
            <span className="text-[10px] text-gray-400 flex items-center gap-1 flex-1 truncate">
              <MapPin className="w-3 h-3 flex-shrink-0" /> {item.location}
            </span>
          )}
          <button
            onClick={() => onContact(item)}
            className="bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1 flex-shrink-0"
          >
            <Phone className="w-3 h-3" /> Contact
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Contact modal ─────────────────────────────────────────────────────────────
function ContactModal({ item, onClose }) {
  if (!item) return null;
  const farmer = item.farmer;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-gray-800">Seller Contact</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">Seller Name</p>
            <p className="font-bold text-gray-800">{farmer?.name || "—"}</p>
          </div>
          {(farmer?.phone || item.contactPhone) && (
            <a href={`tel:${farmer?.phone || item.contactPhone}`}
               className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4 hover:bg-green-100 transition">
              <Phone className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-xs text-gray-400">Phone</p>
                <p className="font-bold text-green-700">{farmer?.phone || item.contactPhone}</p>
              </div>
            </a>
          )}
          {farmer?.location && (
            <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4">
              <MapPin className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-xs text-gray-400">Location</p>
                <p className="font-bold text-gray-700">{farmer.location}</p>
              </div>
            </div>
          )}
        </div>
        <p className="text-center text-xs text-gray-400 mt-4">Contact the seller to discuss price and delivery.</p>
      </div>
    </div>
  );
}

// ── Mandi Price lookup widget ─────────────────────────────────────────────────
function MandiLookup({ cropName, onPriceSelect, unit }) {
  const [data, setData]     = useState(null);
  const [loading, setLoad]  = useState(false);

  useEffect(() => {
    if (!cropName) { setData(null); return; }
    setLoad(true);
    axios.get(`${API}/mandi/suggest/${encodeURIComponent(cropName)}`)
      .then(r => setData(r.data.success ? r.data : null))
      .catch(() => setData(null))
      .finally(() => setLoad(false));
  }, [cropName]);

  if (!cropName) return null;
  if (loading) return (
    <div className="bg-green-50 border border-green-100 rounded-2xl p-4 flex items-center gap-3">
      <Loader className="w-4 h-4 animate-spin text-green-600" />
      <span className="text-xs text-green-700 font-bold">Fetching live mandi prices for {cropName}…</span>
    </div>
  );
  if (!data) return null;

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-5 space-y-3">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span className="text-xs font-bold text-green-700 uppercase tracking-wider">Live Mandi Prices — {data.commodity}</span>
        <span className="text-[9px] text-gray-400 ml-auto">per {data.unit}</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {data.markets?.slice(0,4).map((m, i) => (
          <button key={i} onClick={() => onPriceSelect(m.price, m.name)}
            className="bg-white border border-green-100 rounded-xl p-3 text-left hover:border-green-400 hover:shadow-sm transition group">
            <p className="text-[10px] text-gray-400 mb-0.5">{m.name}, {m.state}</p>
            <p className="font-bold text-green-700 group-hover:text-green-800">
              ₹{m.price?.toLocaleString()}
              <span className="text-[9px] text-gray-400 font-normal ml-1">/{data.unit}</span>
            </p>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-green-200">
        <div>
          <p className="text-[10px] text-gray-400">Suggested Sell Price</p>
          <p className="font-display font-bold text-lg text-primary-700">₹{data.suggestedSellPrice?.toLocaleString()}
            <span className="text-xs font-normal text-gray-400 ml-1">/{data.unit}</span>
          </p>
        </div>
        <button onClick={() => onPriceSelect(data.suggestedSellPrice, "Suggested")}
          className="bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5" /> Use This
        </button>
      </div>

      <p className="text-[10px] text-gray-400 flex items-center gap-1">
        <Info className="w-3 h-3" /> Click any price to auto-fill. Prices are indicative live rates.
      </p>
    </div>
  );
}

// ── Create Crop Listing Modal ──────────────────────────────────────────────────
function CreateCropModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    title: "", category: "", description: "", price: "", unit: "kg",
    quantity: "", location: "", contactPhone: "", isAuction: false,
    negotiable: true, mandiRefPrice: "",
  });
  const [saving, setSave]   = useState(false);
  const [imgData, setImg]   = useState("");
  const [mandiRef, setRef]  = useState(null);
  const fileRef             = useRef();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // When title changes → try to auto-fetch mandi price
  useEffect(() => {
    if (!form.title || form.title.length < 3) { setRef(null); return; }
    const t = setTimeout(() => {
      axios.get(`${API}/mandi/suggest/${encodeURIComponent(form.title)}`)
        .then(r => {
          if (r.data.success) {
            setRef(r.data);
            if (!form.mandiRefPrice) set("mandiRefPrice", String(r.data.suggestedSellPrice));
            if (!form.price)        set("price",          String(r.data.suggestedSellPrice));
          }
        }).catch(() => {});
    }, 700);
    return () => clearTimeout(t);
  }, [form.title]);

  const handleImg = (file) => {
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) return toast.error("Max 3MB image");
    const r = new FileReader();
    r.onload = e => setImg(e.target.result);
    r.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!form.title || !form.category || !form.price || !form.quantity)
      return toast.error("Fill all required fields");
    if (form.contactPhone && form.contactPhone.replace(/\D/g, "").length !== 10)
      return toast.error("Contact phone must be exactly 10 digits");
    setSave(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        quantity: Number(form.quantity),
        mandiRefPrice: form.mandiRefPrice ? Number(form.mandiRefPrice) : undefined,
        images: imgData ? [imgData] : [],
      };
      await axios.post(`${API}/products`, payload, { headers: authH() });
      toast.success("Listing created!");
      onCreated();
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to create listing");
    } finally { setSave(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="font-bold text-gray-800 flex items-center gap-2"><ShoppingBag className="w-5 h-5 text-primary-600" /> New Crop Listing</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-6 space-y-4">
          {/* Image upload */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Crop Photo</label>
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/50 transition"
            >
              {imgData ? (
                <img src={imgData} alt="crop" className="h-28 object-cover mx-auto rounded-xl" />
              ) : (
                <>
                  <Camera className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">Click to add photo (optional)</p>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => handleImg(e.target.files[0])} />
          </div>

          {/* Crop name */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Crop / Product Name *</label>
            <input value={form.title} onChange={e => set("title", e.target.value)}
              placeholder="e.g. Tomato, Onion, Wheat…"
              className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:bg-white transition" />
          </div>

          {/* Mandi price lookup */}
          {mandiRef && (
            <MandiLookup cropName={form.title}
              unit={form.unit}
              onPriceSelect={(price, source) => {
                set("price", String(price));
                set("mandiRefPrice", String(price));
                toast(`Price set: ₹${price.toLocaleString()} (${source})`, { icon: "✅" });
              }} />
          )}

          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Category *</label>
            <div className="relative">
              <select value={form.category} onChange={e => set("category", e.target.value)}
                className="w-full appearance-none border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 pr-10 text-gray-700 transition">
                <option value="">-- Select --</option>
                {CROP_CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Price + Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Price (₹) *</label>
              <input type="number" value={form.price} onChange={e => set("price", e.target.value)}
                placeholder="e.g. 1200"
                className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:bg-white transition" />
              {form.mandiRefPrice && form.price && (
                <p className="text-[10px] mt-1 text-gray-400">
                  Mandi ref: ₹{Number(form.mandiRefPrice).toLocaleString()}
                  {Number(form.price) > Number(form.mandiRefPrice) ? " (premium)" : " (below mandi)"}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Unit *</label>
              <div className="relative">
                <select value={form.unit} onChange={e => set("unit", e.target.value)}
                  className="w-full appearance-none border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 pr-10 transition">
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Available Quantity *</label>
            <input type="number" value={form.quantity} onChange={e => set("quantity", e.target.value)}
              placeholder="e.g. 50"
              className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:bg-white transition" />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Description</label>
            <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={2}
              placeholder="Quality grade, harvest date, delivery options…"
              className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:bg-white transition resize-none" />
          </div>

          {/* Location + Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Location</label>
              <input value={form.location} onChange={e => set("location", e.target.value)}
                placeholder="City / Village"
                className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:bg-white transition" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Contact Phone</label>
              <input value={form.contactPhone} onChange={e => set("contactPhone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="10-digit phone number"
                className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:bg-white transition" />
            </div>
          </div>

          {/* Options */}
          <div className="flex gap-4">
            {[
              { key:"negotiable", label:"Negotiable price" },
              { key:"isAuction",  label:"List as Auction" },
            ].map(o => (
              <label key={o.key} className="flex items-center gap-2 cursor-pointer select-none">
                <div
                  onClick={() => set(o.key, !form[o.key])}
                  className={`w-10 h-5 rounded-full transition-colors ${form[o.key] ? "bg-primary-600" : "bg-gray-200"} relative flex-shrink-0`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow absolute top-0.5 transition-all ${form[o.key] ? "translate-x-5" : "translate-x-0.5"}`} />
                </div>
                <span className="text-xs font-semibold text-gray-600">{o.label}</span>
              </label>
            ))}
          </div>

          <button onClick={handleSubmit} disabled={saving}
            className="w-full bg-gradient-to-r from-primary-600 to-green-600 text-white font-bold py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {saving ? <Loader className="w-5 h-5 animate-spin" /> : <><Plus className="w-5 h-5" /> Create Listing</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Create Equipment Modal ────────────────────────────────────────────────────
function CreateEquipmentModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    name:"", category:"", brand:"", model:"", yearOfManufacture:"",
    condition:"used", price:"", negotiable:true,
    isRental:false, rentalPricePerDay:"", rentalPricePerHour:"",
    description:"", location:"", contactPhone:"", hoursUsed:"",
  });
  const [saving, setSave] = useState(false);
  const [imgData, setImg] = useState("");
  const fileRef           = useRef();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleImg = (file) => {
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) return toast.error("Max 3MB image");
    const r = new FileReader();
    r.onload = e => setImg(e.target.result);
    r.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.category || !form.condition || !form.price)
      return toast.error("Fill all required fields");
    if (form.contactPhone && form.contactPhone.replace(/\D/g, "").length !== 10)
      return toast.error("Contact phone must be exactly 10 digits");
    setSave(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        yearOfManufacture: form.yearOfManufacture ? Number(form.yearOfManufacture) : undefined,
        hoursUsed: form.hoursUsed ? Number(form.hoursUsed) : undefined,
        rentalPricePerDay: form.rentalPricePerDay ? Number(form.rentalPricePerDay) : undefined,
        rentalPricePerHour: form.rentalPricePerHour ? Number(form.rentalPricePerHour) : undefined,
        images: imgData ? [imgData] : [],
      };
      await axios.post(`${API}/equipment`, payload, { headers: authH() });
      toast.success("Equipment listed!");
      onCreated();
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed");
    } finally { setSave(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="font-bold text-gray-800 flex items-center gap-2"><Tractor className="w-5 h-5 text-slate-600" /> List Equipment</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-6 space-y-4">
          {/* Image */}
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center cursor-pointer hover:border-slate-400 hover:bg-slate-50/50 transition"
          >
            {imgData ? (
              <img src={imgData} alt="equipment" className="h-28 object-cover mx-auto rounded-xl" />
            ) : (
              <>
                <Camera className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-400">Add equipment photo</p>
              </>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => handleImg(e.target.files[0])} />

          {/* Name + Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Equipment Name *</label>
              <input value={form.name} onChange={e => set("name", e.target.value)}
                placeholder="e.g. Mahindra 575"
                className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Category *</label>
              <div className="relative">
                <select value={form.category} onChange={e => set("category", e.target.value)}
                  className="w-full appearance-none border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 pr-10 text-gray-700 transition">
                  <option value="">-- Select --</option>
                  {EQUIPMENT_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Brand + Year */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Brand / Make</label>
              <input value={form.brand} onChange={e => set("brand", e.target.value)}
                placeholder="e.g. Mahindra, TAFE"
                className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Year</label>
              <input type="number" value={form.yearOfManufacture} onChange={e => set("yearOfManufacture", e.target.value)}
                placeholder="e.g. 2018"
                className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition" />
            </div>
          </div>

          {/* Condition */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Condition *</label>
            <div className="flex gap-2">
              {Object.entries(CONDITION_COLORS).map(([key, c]) => (
                <button key={key} onClick={() => set("condition", key)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                    form.condition === key ? `${c.bg} ${c.text} ${c.border}` : "border-gray-200 text-gray-400 hover:border-gray-300"
                  }`}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Price */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Selling Price (₹) *</label>
            <input type="number" value={form.price} onChange={e => set("price", e.target.value)}
              placeholder="e.g. 350000"
              className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition" />
          </div>

          {/* Rental option */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer mb-3">
              <div onClick={() => set("isRental", !form.isRental)}
                className={`w-10 h-5 rounded-full transition-colors ${form.isRental ? "bg-purple-600" : "bg-gray-200"} relative flex-shrink-0`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow absolute top-0.5 transition-all ${form.isRental ? "translate-x-5" : "translate-x-0.5"}`} />
              </div>
              <span className="text-xs font-bold text-gray-600">Also available for Rent</span>
            </label>
            {form.isRental && (
              <div className="grid grid-cols-2 gap-3 bg-purple-50 border border-purple-100 rounded-2xl p-4">
                <div>
                  <label className="block text-[10px] font-bold text-purple-600 uppercase mb-1">₹/Hour</label>
                  <input type="number" value={form.rentalPricePerHour} onChange={e => set("rentalPricePerHour", e.target.value)}
                    placeholder="500" className="w-full border border-purple-200 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 transition" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-purple-600 uppercase mb-1">₹/Day</label>
                  <input type="number" value={form.rentalPricePerDay} onChange={e => set("rentalPricePerDay", e.target.value)}
                    placeholder="3000" className="w-full border border-purple-200 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 transition" />
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Description</label>
            <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={2}
              placeholder="Engine hours, condition details, accessories included…"
              className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition resize-none" />
          </div>

          {/* Location + Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Location</label>
              <input value={form.location} onChange={e => set("location", e.target.value)}
                placeholder="City / Village"
                className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Contact Phone</label>
              <input value={form.contactPhone} onChange={e => set("contactPhone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="10-digit phone number"
                className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition" />
            </div>
          </div>

          <button onClick={handleSubmit} disabled={saving}
            className="w-full bg-gradient-to-r from-slate-700 to-gray-800 text-white font-bold py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {saving ? <Loader className="w-5 h-5 animate-spin" /> : <><Plus className="w-5 h-5" /> List Equipment</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Live Mandi Prices Panel ───────────────────────────────────────────────────
function MandiPricesPanel() {
  const [prices, setPrices] = useState([]);
  const [loading, setLoad]  = useState(true);
  const [search, setSearch] = useState("");
  const [cat, setCat]       = useState("all");

  const fetch = () => {
    setLoad(true);
    axios.get(`${API}/mandi/prices?category=${cat}&search=${search}`)
      .then(r => setPrices(r.data.data || []))
      .catch(() => setPrices([]))
      .finally(() => setLoad(false));
  };

  useEffect(() => { fetch(); }, [cat, search]);

  const trendIcon = (t) => {
    if (t === "up")   return <span className="text-green-500 text-xs font-bold">↑</span>;
    if (t === "down") return <span className="text-red-500 text-xs font-bold">↓</span>;
    return <span className="text-gray-400 text-xs">→</span>;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-amber-600 via-orange-600 to-yellow-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-xl font-extrabold flex items-center gap-2">
              <TrendingUp className="w-6 h-6" /> Live Mandi Prices
            </h3>
            <p className="text-yellow-100 text-sm mt-1">Multi-market comparison · Indian Mandis</p>
          </div>
          <button onClick={fetch} className="p-2.5 bg-white/20 hover:bg-white/30 rounded-xl transition">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-yellow-100 text-xs font-bold">Prices refresh on demand</span>
        </div>
      </div>

      {/* Search + filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search crop…"
            className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-gray-50 focus:bg-white transition" />
        </div>
        <div className="relative">
          <select value={cat} onChange={e => setCat(e.target.value)}
            className="appearance-none border border-gray-200 rounded-xl pl-3 pr-8 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-400 text-gray-700 transition">
            {["all","vegetables","grains","oilseeds","cash crops","pulses","spices","fruits"].map(c => (
              <option key={c} value={c} className="capitalize">{c === "all" ? "All" : c}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {Array(6).fill(0).map((_, i) => <div key={i} className="h-36 bg-gray-100 animate-pulse rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {prices.map((item, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{item.emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-gray-800">{item.commodity}</h4>
                    {trendIcon(item.trend)}
                  </div>
                  <p className="text-[10px] text-gray-400 capitalize">{item.category}</p>
                </div>
                <div className="text-right">
                  <p className="font-display font-extrabold text-primary-700 text-lg">₹{item.bestPrice?.toLocaleString()}</p>
                  <p className="text-[9px] text-gray-400">Best: {item.bestMarket}</p>
                </div>
              </div>
              {/* Market comparison */}
              <div className="grid grid-cols-2 gap-1.5">
                {item.markets?.slice(0, 4).map((m, j) => (
                  <div key={j} className="bg-gray-50 rounded-xl px-3 py-1.5 text-center">
                    <p className="text-[9px] text-gray-400 truncate">{m.name}</p>
                    <p className="text-xs font-bold text-gray-700">₹{m.modal?.toLocaleString()}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1 border-t border-gray-50">
                <span>Avg: ₹{item.avgPrice?.toLocaleString()}/{item.unit}</span>
                <span className="text-green-600 font-bold">Suggest: ₹{item.suggestedSellPrice?.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Browse tab ─────────────────────────────────────────────────────────────────
function BrowseTab() {
  const [products, setProducts] = useState([]);
  const [equipment, setEquip]   = useState([]);
  const [loading, setLoad]      = useState(true);
  const [search, setSearch]     = useState("");
  const [contact, setContact]   = useState(null);
  const [filter, setFilter]     = useState("all"); // all | crops | equipment

  const load = async () => {
    setLoad(true);
    try {
      const [p, e] = await Promise.all([
        axios.get(`${API}/products?search=${search}`, { headers: authH() }),
        axios.get(`${API}/equipment?search=${search}`, { headers: authH() }),
      ]);
      setProducts(p.data.products || []);
      setEquip(e.data.equipment || []);
    } catch {}
    setLoad(false);
  };

  useEffect(() => { load(); }, []);

  const filteredProducts = filter === "equipment" ? [] : products.filter(p => !p.isAuction);
  const filteredEquip    = filter === "crops"     ? [] : equipment;
  const allCount         = filteredProducts.length + filteredEquip.length;

  return (
    <div className="space-y-5">
      {/* Stats bar */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label:"Crop Listings", val: products.length, icon:"🌾", color:"text-green-700 bg-green-50 border-green-100" },
          { label:"Equipment",     val: equipment.length, icon:"🚜", color:"text-slate-700 bg-slate-50 border-slate-100" },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border p-4 text-center ${s.color}`}>
            <p className="text-2xl mb-1">{s.icon}</p>
            <p className="font-display font-bold text-xl">{s.val}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search + filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === "Enter" && load()}
            placeholder="Search crops, equipment…"
            className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 bg-gray-50 focus:bg-white transition" />
        </div>
        <button onClick={load} className="p-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition">
          <Search className="w-4 h-4" />
        </button>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2">
        {[["all","All"],["crops","Crops"],["equipment","Equipment"]].map(([id,label]) => (
          <button key={id} onClick={() => setFilter(id)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${filter===id ? "bg-primary-600 text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {label}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-400 font-bold self-center">{allCount} listings</span>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => <div key={i} className="h-64 bg-gray-100 animate-pulse rounded-2xl" />)}
        </div>
      ) : allCount === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <ShoppingBag className="w-14 h-14 mx-auto mb-4 opacity-20" />
          <p className="font-bold">No listings found</p>
          <p className="text-sm mt-1">Be the first to list something!</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map(p => <CropCard key={p._id} product={p} onContact={setContact} />)}
          {filteredEquip.map(e => <EquipmentCard key={e._id} item={e} onContact={setContact} />)}
        </div>
      )}

      {contact && <ContactModal item={contact} onClose={() => setContact(null)} />}
    </div>
  );
}

// ── Equipment Tab ─────────────────────────────────────────────────────────────
function EquipmentTab() {
  const [items, setItems]       = useState([]);
  const [loading, setLoad]      = useState(true);
  const [contact, setContact]   = useState(null);
  const [search, setSearch]     = useState("");
  const [cat, setCat]           = useState("all");
  const [showCreate, setCreate] = useState(false);
  const [filter, setFilter]     = useState("all"); // all | sale | rental

  const load = async () => {
    setLoad(true);
    try {
      const params = new URLSearchParams();
      if (cat !== "all") params.set("category", cat);
      if (search)        params.set("search", search);
      if (filter === "rental") params.set("isRental", "true");
      const r = await axios.get(`${API}/equipment?${params}`, { headers: authH() });
      setItems(r.data.equipment || []);
    } catch {}
    setLoad(false);
  };

  useEffect(() => { load(); }, [cat, filter]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-700 to-gray-900 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 text-[120px] opacity-5 leading-none pointer-events-none">🚜</div>
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="font-display text-xl font-extrabold flex items-center gap-2"><Tractor className="w-6 h-6" /> Farm Equipment Marketplace</h3>
            <p className="text-gray-300 text-sm mt-1">Tractors · Harvesters · Sprayers · Tools & more</p>
          </div>
          <button onClick={() => setCreate(true)}
            className="bg-white text-gray-800 font-bold px-4 py-2.5 rounded-xl hover:bg-gray-100 transition flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> List Equipment
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && load()}
            placeholder="Search equipment…"
            className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 bg-gray-50 focus:bg-white transition" />
        </div>
        <div className="relative">
          <select value={cat} onChange={e => setCat(e.target.value)}
            className="appearance-none border border-gray-200 rounded-xl pl-3 pr-8 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-slate-400 text-gray-700 transition">
            <option value="all">All Types</option>
            {EQUIPMENT_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        </div>
        <div className="flex gap-2">
          {[["all","All"],["sale","For Sale"],["rental","For Rent"]].map(([id, label]) => (
            <button key={id} onClick={() => setFilter(id)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition ${filter===id ? "bg-slate-700 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Category quick filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {EQUIPMENT_CATEGORIES.slice(0,8).map(c => (
          <button key={c.id} onClick={() => setCat(cat === c.id ? "all" : c.id)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              cat === c.id ? "bg-slate-700 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}>
            <span>{c.emoji}</span>{c.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => <div key={i} className="h-72 bg-gray-100 animate-pulse rounded-2xl" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Tractor className="w-14 h-14 mx-auto mb-4 opacity-20" />
          <p className="font-bold">No equipment listings yet</p>
          <p className="text-sm mt-1">Be the first to list your farm equipment!</p>
          <button onClick={() => setCreate(true)}
            className="mt-4 bg-slate-700 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-slate-800 transition text-sm">
            + List Equipment
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(item => <EquipmentCard key={item._id} item={item} onContact={setContact} />)}
        </div>
      )}

      {contact  && <ContactModal item={contact} onClose={() => setContact(null)} />}
      {showCreate && <CreateEquipmentModal onClose={() => setCreate(false)} onCreated={load} />}
    </div>
  );
}

// ── Sell Crops Tab (with mandi prices) ───────────────────────────────────────
function SellCropsTab() {
  const [showCreate, setCreate] = useState(false);
  const [myListings, setMine]   = useState([]);
  const [loadMine, setLoadMine] = useState(true);

  const loadMy = async () => {
    setLoadMine(true);
    try {
      const r = await axios.get(`${API}/products/my`, { headers: authH() });
      setMine((r.data.products || []).filter(p => !p.isAuction));
    } catch {}
    setLoadMine(false);
  };

  useEffect(() => { loadMy(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this listing?")) return;
    try {
      await axios.delete(`${API}/products/${id}`, { headers: authH() });
      toast.success("Listing deleted");
      loadMy();
    } catch { toast.error("Failed to delete"); }
  };

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      {/* Left: create button + mandi prices */}
      <div className="lg:col-span-2 space-y-5">
        {/* Create card */}
        <div className="bg-gradient-to-br from-primary-600 to-green-700 rounded-2xl p-6 text-white text-center">
          <div className="text-5xl mb-3">🌾</div>
          <h3 className="font-display font-extrabold text-xl mb-1">Sell Your Crops</h3>
          <p className="text-green-100 text-sm mb-5">Auto-filled mandi prices · Fair & transparent</p>
          <button onClick={() => setCreate(true)}
            className="w-full bg-white text-primary-700 font-bold py-3 rounded-xl hover:bg-green-50 transition flex items-center justify-center gap-2">
            <Plus className="w-5 h-5" /> Create Listing
          </button>
        </div>

        {/* Live mandi mini-panel */}
        <MandiPricesPanel />
      </div>

      {/* Right: my listings */}
      <div className="lg:col-span-3 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Package className="w-5 h-5 text-primary-600" /> My Crop Listings
          </h3>
          <button onClick={loadMy} className="p-2 hover:bg-gray-100 rounded-xl transition">
            <RefreshCw className={`w-4 h-4 ${loadMine ? "animate-spin" : ""}`} />
          </button>
        </div>

        {loadMine ? (
          <div className="space-y-3">
            {Array(3).fill(0).map((_, i) => <div key={i} className="h-20 bg-gray-100 animate-pulse rounded-2xl" />)}
          </div>
        ) : myListings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400">
            <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="font-bold">No crop listings yet</p>
            <p className="text-sm">Create your first listing with live mandi prices</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myListings.map(p => (
              <div key={p._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                  {p.images?.[0] ? <img src={p.images[0]} alt="" className="w-full h-full object-cover rounded-xl" /> : "🌾"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 truncate">{p.title}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5 flex-wrap">
                    <span>₹{p.price?.toLocaleString()}/{p.unit}</span>
                    <span>{p.quantity} {p.unit}</span>
                    <MandiBadge mandiPrice={p.mandiRefPrice} unit={p.unit} />
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-[9px] font-bold px-2 py-1 rounded-full ${
                    p.status === "available" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  }`}>{p.status}</span>
                  <button onClick={() => handleDelete(p._id)}
                    className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg transition text-gray-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreate && <CreateCropModal onClose={() => setCreate(false)} onCreated={loadMy} />}
    </div>
  );
}

// ── Auctions tab ──────────────────────────────────────────────────────────────
function AuctionsTab() {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoad]      = useState(true);
  const [contact, setContact]   = useState(null);

  useEffect(() => {
    setLoad(true);
    axios.get(`${API}/products`)
      .then(r => setAuctions((r.data.products || []).filter(p => p.isAuction)))
      .catch(() => {})
      .finally(() => setLoad(false));
  }, []);

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-orange-600 to-red-700 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 text-[120px] opacity-5 leading-none">🏷️</div>
        <div className="relative z-10">
          <h3 className="font-display text-xl font-extrabold flex items-center gap-2"><Gavel className="w-6 h-6" /> Live Auctions</h3>
          <p className="text-orange-100 text-sm mt-1">Bid on crops in real-time · Highest bid wins</p>
        </div>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(3).fill(0).map((_, i) => <div key={i} className="h-64 bg-gray-100 animate-pulse rounded-2xl" />)}
        </div>
      ) : auctions.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Gavel className="w-14 h-14 mx-auto mb-4 opacity-20" />
          <p className="font-bold">No live auctions right now</p>
          <p className="text-sm mt-1">Check back soon or list your crop for auction</p>
          <a href="/farmer/sell-crops"
            className="mt-4 inline-flex items-center gap-2 bg-orange-500 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-orange-600 transition text-sm">
            <Plus className="w-4 h-4" /> Start Auction
          </a>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {auctions.map(p => {
            const highBid = p.bids?.length ? Math.max(...p.bids.map(b => b.amount)) : p.price;
            const endTime = p.auctionEndTime ? new Date(p.auctionEndTime) : null;
            const expired = endTime && endTime < new Date();
            return (
              <div key={p._id} className="bg-white rounded-2xl border border-orange-100 shadow-sm hover:shadow-lg transition-all overflow-hidden">
                <div className="relative h-40 bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
                  {p.images?.[0] ? <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" /> : <span className="text-5xl opacity-40">🌾</span>}
                  <div className="absolute top-2 left-2">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${expired ? "bg-gray-200 text-gray-600" : "bg-orange-500 text-white"}`}>
                      {expired ? "Ended" : "🔴 Live"}
                    </span>
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  <h4 className="font-bold text-gray-800">{p.title}</h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-gray-400">Current Bid</p>
                      <p className="font-display font-extrabold text-orange-600 text-lg">₹{highBid.toLocaleString()}<span className="text-xs font-normal text-gray-400">/{p.unit}</span></p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-gray-400">{p.bids?.length || 0} bids</p>
                      {endTime && <p className="text-[10px] text-gray-400">{expired ? "Ended" : `Ends ${endTime.toLocaleDateString()}`}</p>}
                    </div>
                  </div>
                  <a href="/buyer/browse"
                    className="block w-full text-center bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold py-2.5 rounded-xl transition">
                    View & Bid →
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── My Listings tab ───────────────────────────────────────────────────────────
function MyListingsTab() {
  const [products, setProducts] = useState([]);
  const [equip, setEquip]       = useState([]);
  const [loading, setLoad]      = useState(true);
  const [deleting, setDel]      = useState(null);

  const load = async () => {
    setLoad(true);
    try {
      const [p, e] = await Promise.all([
        axios.get(`${API}/products/my`,    { headers: authH() }),
        axios.get(`${API}/equipment/my`,   { headers: authH() }),
      ]);
      setProducts(p.data.products  || []);
      setEquip(e.data.equipment || []);
    } catch {}
    setLoad(false);
  };

  useEffect(() => { load(); }, []);

  const delProduct = async (id) => {
    setDel(id);
    try {
      await axios.delete(`${API}/products/${id}`,  { headers: authH() });
      toast.success("Listing removed");
      load();
    } catch { toast.error("Failed"); }
    setDel(null);
  };

  const delEquip = async (id) => {
    setDel(id);
    try {
      await axios.delete(`${API}/equipment/${id}`, { headers: authH() });
      toast.success("Equipment listing removed");
      load();
    } catch { toast.error("Failed"); }
    setDel(null);
  };

  const ListRow = ({ item, type, onDelete }) => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center text-xl flex-shrink-0">
        {item.images?.[0] ? <img src={item.images[0]} alt="" className="w-full h-full object-cover" /> : (type === "crop" ? "🌾" : "🚜")}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-800 truncate">{item.title || item.name}</p>
        <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5 flex-wrap">
          <span className="capitalize">{type}</span>
          {item.price && <span>₹{item.price.toLocaleString()}{item.unit ? `/${item.unit}` : ""}</span>}
          {item.quantity && <span>{item.quantity} {item.unit}</span>}
          {item.condition && <span className={`px-1.5 py-0.5 rounded-full font-bold ${CONDITION_COLORS[item.condition]?.bg} ${CONDITION_COLORS[item.condition]?.text}`}>{CONDITION_COLORS[item.condition]?.label}</span>}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={`text-[9px] font-bold px-2 py-1 rounded-full ${
          item.status === "available" ? "bg-green-100 text-green-700" :
          item.status === "sold"      ? "bg-gray-100 text-gray-500" :
          "bg-amber-100 text-amber-700"
        }`}>{item.status}</span>
        <button onClick={onDelete} disabled={deleting === item._id}
          className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg transition text-gray-400 disabled:opacity-40">
          {deleting === item._id ? <Loader className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  const total = products.length + equip.length;

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="space-y-3">
          {Array(4).fill(0).map((_, i) => <div key={i} className="h-20 bg-gray-100 animate-pulse rounded-2xl" />)}
        </div>
      ) : total === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Package className="w-14 h-14 mx-auto mb-4 opacity-20" />
          <p className="font-bold text-lg">No listings yet</p>
          <p className="text-sm">Create your first crop or equipment listing</p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 text-sm font-bold text-gray-500">
            <Package className="w-4 h-4" />
            <span>All Listings ({total})</span>
            <button onClick={load} className="ml-auto p-1.5 hover:bg-gray-100 rounded-lg transition"><RefreshCw className="w-4 h-4" /></button>
          </div>

          {products.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-primary-600 uppercase tracking-wider">🌾 Crops & Produce ({products.length})</p>
              {products.map(p => <ListRow key={p._id} item={p} type="crop" onDelete={() => delProduct(p._id)} />)}
            </div>
          )}
          {equip.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">🚜 Equipment ({equip.length})</p>
              {equip.map(e => <ListRow key={e._id} item={e} type="equipment" onDelete={() => delEquip(e._id)} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Main Hub Component ────────────────────────────────────────────────────────
function MarketplaceContent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initTab   = searchParams.get("tab") || "browse";
  const [tab, setTab] = useState(TABS.find(t => t.id === initTab) ? initTab : "browse");

  const [showCropCreate, setCropCreate]   = useState(false);
  const [showEquipCreate, setEquipCreate] = useState(false);

  const changeTab = (id) => {
    setTab(id);
    setSearchParams({ tab: id }, { replace: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const currentTab = TABS.find(t => t.id === tab) || TABS[0];

  const TAB_COLORS = {
    browse:    "from-primary-700 to-green-800",
    crops:     "from-emerald-600 to-teal-700",
    equipment: "from-slate-700 to-gray-900",
    auctions:  "from-orange-600 to-red-700",
    mylist:    "from-violet-600 to-purple-700",
  };

  const QuickAction = ({ emoji, label, onClick, color }) => (
    <button onClick={onClick}
      className={`flex items-center gap-2 ${color} text-white text-sm font-bold px-4 py-2.5 rounded-xl transition shadow-sm hover:shadow-md hover:-translate-y-0.5`}>
      <span>{emoji}</span>{label}
    </button>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* Hero */}
      <div className={`bg-gradient-to-br ${TAB_COLORS[tab]} rounded-[2rem] p-7 text-white shadow-2xl relative overflow-hidden transition-all duration-500`}>
        <div className="absolute inset-0 opacity-5 text-[200px] leading-none pointer-events-none flex items-end justify-end pr-8 pb-0 select-none">
          {currentTab.emoji}
        </div>
        <div className="relative z-10">
          <div className="flex items-start justify-between flex-wrap gap-4 mb-5">
            <div>
              <h1 className="font-display text-2xl font-extrabold flex items-center gap-2">
                {currentTab.emoji} Agri Marketplace
              </h1>
              <p className="text-white/70 text-sm mt-1">
                Live mandi prices · Buy &amp; sell crops · Farm equipment · Auctions
              </p>
            </div>
            {/* Mandi live indicator */}
            <div className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-white text-xs font-bold">Live Mandi Prices</span>
              </div>
              <p className="text-white/60 text-[10px] mt-0.5">Agmarknet · eNAM · Daily updated</p>
            </div>
          </div>
          {/* Quick actions */}
          <div className="flex flex-wrap gap-2">
            <QuickAction emoji="🌾" label="Sell Crops"   onClick={() => setCropCreate(true)}  color="bg-white/20 hover:bg-white/30" />
            <QuickAction emoji="🚜" label="List Equipment" onClick={() => setEquipCreate(true)} color="bg-white/20 hover:bg-white/30" />
            <QuickAction emoji="📊" label="Mandi Prices" onClick={() => changeTab("crops")}    color="bg-white/20 hover:bg-white/30" />
          </div>
        </div>
      </div>

      {/* Tab bar — desktop */}
      <div className="hidden md:block bg-white rounded-2xl p-2 shadow-sm border border-gray-100">
        <div className="flex items-center gap-1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => changeTab(t.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all flex-1 justify-center ${
                tab === t.id
                  ? "bg-primary-600 text-white shadow-lg"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
              }`}>
              <span>{t.emoji}</span> {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab bar — mobile */}
      <div className="md:hidden bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100 sticky top-[73px] z-20">
        <div className="flex items-center gap-1 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => changeTab(t.id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl font-bold transition-all flex-shrink-0 ${
                tab === t.id ? "bg-primary-600 text-white" : "text-gray-400"
              }`}>
              <span className="text-lg">{t.emoji}</span>
              <span className="text-[9px]">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Active tab content */}
      <div key={tab} style={{ animation: "mpFade .22s ease both" }}>
        {tab === "browse"    && <BrowseTab />}
        {tab === "crops"     && <SellCropsTab />}
        {tab === "equipment" && <EquipmentTab />}
        {/* Auctions tab removed — farmers list crops for auction, they don't bid on others' */}
        {tab === "mylist"    && <MyListingsTab />}
      </div>

      {/* Global modals */}
      {showCropCreate  && <CreateCropModal      onClose={() => setCropCreate(false)}  onCreated={() => {}} />}
      {showEquipCreate && <CreateEquipmentModal onClose={() => setEquipCreate(false)} onCreated={() => {}} />}

      <style>{`
        @keyframes mpFade {
          from { opacity:0; transform:translateY(8px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default function FarmerMarketplace() {
  return (
    <FarmerLayout>
      <MarketplaceContent />
    </FarmerLayout>
  );
}
