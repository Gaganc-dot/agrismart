import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import WeatherWidget from "../components/WeatherWidget";
import {
  Leaf, ShoppingBag, ShieldCheck, ArrowRight, Star, Users,
  Package, TrendingUp, Menu, X, ChevronDown, Zap, Globe, Heart
} from "lucide-react";

const fadeUp = {
  hidden:  { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};
const stagger = { visible: { transition: { staggerChildren: 0.12 } } };

function AnimatedSection({ children, className = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div ref={ref} variants={stagger} initial="hidden" animate={inView ? "visible" : "hidden"} className={className}>
      {children}
    </motion.div>
  );
}

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100" : "bg-transparent"}`}>
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <motion.div whileHover={{ rotate: 15, scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }}
            className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-900/20">
            <Leaf className="w-5 h-5 text-white" />
          </motion.div>
          <div>
            <span className={`font-display font-bold text-lg leading-tight ${scrolled ? "text-primary-900" : "text-white"}`}>Agri-Smart</span>
            <span className={`text-xs block -mt-1 ${scrolled ? "text-gray-400" : "text-primary-200"}`}>Connect</span>
          </div>
        </Link>
        <div className={`hidden md:flex items-center gap-8 text-sm font-semibold ${scrolled ? "text-gray-600" : "text-white/80"}`}>
          {["features","how-it-works","stats","testimonials"].map(id => (
            <a key={id} href={`#${id}`} className="hover:text-primary-500 transition-colors capitalize">{id.replace("-"," ")}</a>
          ))}
        </div>
        <div className="hidden md:flex items-center gap-3">
          <Link to="/signin" className={`text-sm font-bold px-4 py-2 rounded-xl transition-all ${scrolled ? "text-primary-700 hover:text-primary-900" : "text-white/90 hover:text-white"}`}>Sign In</Link>
          <Link to="/signup" className="text-sm font-bold bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl transition-all shadow-md hover:-translate-y-0.5">Get Started</Link>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className={`md:hidden p-2 rounded-xl ${scrolled ? "text-gray-700" : "text-white"}`}>
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>
      {mobileOpen && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-white border-b border-gray-100 px-6 py-4 space-y-3">
          {["features","how-it-works","stats","testimonials"].map(id => (
            <a key={id} href={`#${id}`} onClick={() => setMobileOpen(false)}
              className="block text-sm font-semibold text-gray-700 hover:text-primary-600 capitalize py-1">{id.replace("-"," ")}</a>
          ))}
          <div className="flex gap-3 pt-3 border-t border-gray-100">
            <Link to="/signin" className="flex-1 text-center text-sm font-bold text-primary-700 border-2 border-primary-200 px-4 py-2.5 rounded-xl">Sign In</Link>
            <Link to="/signup" className="flex-1 text-center text-sm font-bold bg-primary-600 text-white px-4 py-2.5 rounded-xl">Get Started</Link>
          </div>
        </motion.div>
      )}
    </nav>
  );
}

function Hero() {
  return (
    <section className="relative min-h-screen hero-gradient flex items-center overflow-hidden">
      <div className="absolute inset-0 bg-dot-pattern opacity-20" style={{ backgroundSize: "28px 28px" }} />
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary-500 rounded-full opacity-20 blur-3xl animate-float" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-earth-500 rounded-full opacity-15 blur-3xl" />
      <div className="relative max-w-6xl mx-auto px-6 pt-24 pb-16 grid md:grid-cols-2 gap-12 items-center">
        <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6">
            <span className="text-xs">🌱</span>
            <span className="text-white text-xs font-semibold">India&apos;s Smartest Agri Platform</span>
            <span className="bg-earth-400 text-xs text-white font-bold px-2 py-0.5 rounded-full">NEW</span>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.7 }}
            className="font-display text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
            From Farm<span className="text-earth-400"> Directly </span>to Your Table
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
            className="text-primary-100 text-lg leading-relaxed mb-8 max-w-md">
            Agri-Smart Connect bridges the gap between farmers and buyers. Sell fresh produce directly, get fair prices, and grow together.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="flex flex-wrap gap-4">
            <Link to="/signup" className="inline-flex items-center gap-2 bg-white text-primary-800 font-bold px-7 py-3.5 rounded-xl hover:bg-primary-50 transition-all shadow-xl text-sm hover:-translate-y-0.5">
              Join as Farmer <Leaf className="w-4 h-4" />
            </Link>
            <Link to="/signup" className="inline-flex items-center gap-2 bg-earth-500 hover:bg-earth-600 text-white font-bold px-7 py-3.5 rounded-xl transition-all shadow-xl text-sm hover:-translate-y-0.5">
              Join as Buyer <ShoppingBag className="w-4 h-4" />
            </Link>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="flex items-center gap-6 mt-10">
            {[{value:"10K+",label:"Farmers"},{value:"5K+",label:"Buyers"},{value:"₹2Cr+",label:"Transactions"}].map((s,i) => (
              <div key={i} className="text-center">
                <p className="text-white font-bold text-2xl">{s.value}</p>
                <p className="text-primary-200 text-xs">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
          className="hidden md:flex flex-col gap-4">
          <motion.div animate={{ y: [0,-6,0] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            className="bg-white rounded-2xl p-5 shadow-2xl ml-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center text-2xl">🥦</div>
              <div><p className="font-bold text-gray-800">Fresh Broccoli</p><p className="text-xs text-gray-400">Green Valley Farm, Nashik</p></div>
              <div className="ml-auto text-right"><p className="font-bold text-primary-700 text-lg">₹45/kg</p><span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-semibold">Available</span></div>
            </div>
            <div className="flex gap-2"><span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">Vegetables</span><span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">500 kg stock</span></div>
          </motion.div>
          <motion.div animate={{ y: [0,6,0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="bg-white rounded-2xl p-5 shadow-2xl mr-8">
            <div className="flex items-center justify-between mb-3">
              <p className="font-bold text-gray-800 text-sm">New Order Received! 🎉</p>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">Confirmed</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-earth-100 rounded-full flex items-center justify-center text-lg">🛒</div>
              <div><p className="text-sm font-semibold text-gray-700">FreshMart Pvt. Ltd.</p><p className="text-xs text-gray-400">100kg Tomatoes • ₹3,200</p></div>
            </div>
          </motion.div>
          <motion.div animate={{ y: [0,-4,0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-5 shadow-2xl ml-8">
            <p className="text-primary-100 text-xs font-semibold mb-1">This Month&apos;s Earnings</p>
            <p className="text-white font-bold text-3xl mb-1">₹48,200</p>
            <p className="text-primary-200 text-xs flex items-center gap-1"><TrendingUp className="w-3 h-3" /> +23% from last month</p>
          </motion.div>
        </motion.div>
      </div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <p className="text-white/50 text-xs font-semibold uppercase tracking-widest">Scroll</p>
        <motion.div animate={{ y: [0,6,0] }} transition={{ duration: 1.5, repeat: Infinity }}>
          <ChevronDown className="w-5 h-5 text-white/50" />
        </motion.div>
      </motion.div>
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <path d="M0,80 C360,0 1080,0 1440,80 L1440,80 L0,80 Z" fill="white" />
        </svg>
      </div>
    </section>
  );
}

function WeatherSection() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <AnimatedSection className="text-center mb-10">
          <motion.div variants={fadeUp}>
            <span className="text-primary-600 font-bold text-sm uppercase tracking-widest">Live Weather</span>
            <h2 className="font-display text-3xl font-bold text-gray-900 mt-2 mb-2">Your Local Farm Weather</h2>
            <p className="text-gray-500 text-sm max-w-md mx-auto">Real-time weather conditions and farming advisories based on your location.</p>
          </motion.div>
        </AnimatedSection>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-2xl mx-auto">
          <WeatherWidget />
        </motion.div>
      </div>
    </section>
  );
}

function Features() {
  const features = [
    { icon:"🌾", title:"Direct Farm Sales",         desc:"Farmers list produce directly with real-time pricing. No middlemen, maximum profit.",           color:"bg-primary-50 border-primary-100", iconBg:"bg-primary-100" },
    { icon:"🛒", title:"Smart Buyer Marketplace",   desc:"Buyers browse verified farm products, compare prices, and place orders with one click.",       color:"bg-earth-50 border-earth-100",    iconBg:"bg-earth-100" },
    { icon:"📦", title:"Order Tracking",             desc:"Real-time order status from confirmation to delivery. Full transparency for both parties.",    color:"bg-blue-50 border-blue-100",      iconBg:"bg-blue-100" },
    { icon:"🤖", title:"AI-Powered Insights",        desc:"Groq AI gives crop recommendations, disease detection, fertilizer advice and profit predictions.", color:"bg-purple-50 border-purple-100", iconBg:"bg-purple-100" },
    { icon:"🔒", title:"Verified Accounts",          desc:"All farmers and buyers go through OTP email verification ensuring trust and safety.",          color:"bg-red-50 border-red-100",        iconBg:"bg-red-100" },
    { icon:"🌐", title:"Multi-Language Support",     desc:"Available in 10 Indian languages: Hindi, Marathi, Tamil, Telugu, Kannada, and more.",         color:"bg-teal-50 border-teal-100",      iconBg:"bg-teal-100" },
  ];
  return (
    <section id="features" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <AnimatedSection className="text-center mb-16">
          <motion.div variants={fadeUp}>
            <span className="text-primary-600 font-bold text-sm uppercase tracking-widest">Why Choose Us</span>
            <h2 className="font-display text-4xl font-bold text-gray-900 mt-2 mb-4">Everything You Need to Grow</h2>
            <p className="text-gray-500 max-w-xl mx-auto">A complete platform built for Indian agriculture.</p>
          </motion.div>
        </AnimatedSection>
        <AnimatedSection className="grid md:grid-cols-3 gap-6">
          {features.map((f,i) => (
            <motion.div key={i} variants={fadeUp} whileHover={{ y:-4 }}
              className={`p-6 rounded-2xl border ${f.color} transition-all duration-300 hover:shadow-card-lg cursor-default`}>
              <div className={`w-12 h-12 ${f.iconBg} rounded-xl flex items-center justify-center text-2xl mb-4`}>{f.icon}</div>
              <h3 className="font-bold text-gray-800 text-lg mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </AnimatedSection>
      </div>
    </section>
  );
}

function HowItWorks() {
  const farmerSteps = [
    { step:"01", title:"Sign Up as Farmer",  desc:"Create your account with farm details in under 2 minutes." },
    { step:"02", title:"List Your Produce",  desc:"Add products with photos, price, and available quantity." },
    { step:"03", title:"Receive Orders",     desc:"Get notified when buyers place orders for your products." },
    { step:"04", title:"Earn & Grow",        desc:"Confirm, ship, and get paid directly. Track all earnings." },
  ];
  const buyerSteps = [
    { step:"01", title:"Sign Up as Buyer",       desc:"Register your business and get verified quickly." },
    { step:"02", title:"Browse Products",        desc:"Explore fresh produce from verified farms across India." },
    { step:"03", title:"Place Orders",           desc:"Select quantity, add delivery address and place your order." },
    { step:"04", title:"Receive Fresh Produce",  desc:"Track your order and receive farm-fresh products." },
  ];
  return (
    <section id="how-it-works" className="py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6">
        <AnimatedSection className="text-center mb-16">
          <motion.div variants={fadeUp}>
            <span className="text-primary-600 font-bold text-sm uppercase tracking-widest">Simple Process</span>
            <h2 className="font-display text-4xl font-bold text-gray-900 mt-2 mb-4">How It Works</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Get started in minutes whether you&apos;re a farmer or a buyer.</p>
          </motion.div>
        </AnimatedSection>
        <AnimatedSection className="grid md:grid-cols-2 gap-12">
          <motion.div variants={fadeUp} className="bg-white rounded-3xl p-8 shadow-card border border-primary-100">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center"><Leaf className="w-5 h-5 text-white" /></div>
              <h3 className="font-display text-xl font-bold text-primary-900">For Farmers</h3>
            </div>
            <div className="space-y-6">
              {farmerSteps.map((s,i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-primary-100 text-primary-700 font-bold text-sm rounded-xl flex items-center justify-center">{s.step}</div>
                  <div><p className="font-bold text-gray-800 text-sm">{s.title}</p><p className="text-gray-500 text-xs mt-0.5">{s.desc}</p></div>
                </div>
              ))}
            </div>
            <Link to="/signup" className="mt-8 w-full inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl transition-all text-sm hover:-translate-y-0.5">
              Join as Farmer <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
          <motion.div variants={fadeUp} className="bg-white rounded-3xl p-8 shadow-card border border-earth-200">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-earth-500 rounded-xl flex items-center justify-center"><ShoppingBag className="w-5 h-5 text-white" /></div>
              <h3 className="font-display text-xl font-bold text-earth-700">For Buyers</h3>
            </div>
            <div className="space-y-6">
              {buyerSteps.map((s,i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-earth-100 text-earth-700 font-bold text-sm rounded-xl flex items-center justify-center">{s.step}</div>
                  <div><p className="font-bold text-gray-800 text-sm">{s.title}</p><p className="text-gray-500 text-xs mt-0.5">{s.desc}</p></div>
                </div>
              ))}
            </div>
            <Link to="/signup" className="mt-8 w-full inline-flex items-center justify-center gap-2 bg-earth-500 hover:bg-earth-600 text-white font-bold py-3 rounded-xl transition-all text-sm hover:-translate-y-0.5">
              Join as Buyer <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </AnimatedSection>
      </div>
    </section>
  );
}

function Stats() {
  const stats = [
    { icon:<Users className="w-6 h-6" />,       value:"10,000+", label:"Registered Farmers", color:"text-green-400" },
    { icon:<ShoppingBag className="w-6 h-6" />,  value:"5,000+",  label:"Active Buyers",      color:"text-yellow-400" },
    { icon:<Package className="w-6 h-6" />,      value:"50,000+", label:"Orders Fulfilled",   color:"text-blue-400" },
    { icon:<TrendingUp className="w-6 h-6" />,   value:"₹2 Cr+",  label:"Total Transactions", color:"text-purple-400" },
  ];
  return (
    <section id="stats" className="py-20 hero-gradient relative overflow-hidden">
      <div className="absolute inset-0 bg-dot-pattern opacity-10" style={{ backgroundSize: "28px 28px" }} />
      <div className="relative max-w-6xl mx-auto px-6">
        <AnimatedSection className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s,i) => (
            <motion.div key={i} variants={fadeUp} className="text-center">
              <div className={`inline-flex items-center justify-center w-14 h-14 bg-white/10 rounded-2xl mb-4 ${s.color}`}>{s.icon}</div>
              <p className="text-white font-bold text-3xl font-display">{s.value}</p>
              <p className="text-primary-200 text-sm mt-1">{s.label}</p>
            </motion.div>
          ))}
        </AnimatedSection>
      </div>
    </section>
  );
}

function Testimonials() {
  const testimonials = [
    { name:"Rajesh Patil",  role:"Farmer, Nashik",            emoji:"👨‍🌾", text:"Agri-Smart Connect changed my life. I now sell directly to buyers and earn 40% more. No more middlemen!", rating:5 },
    { name:"Priya Sharma",  role:"Buyer, FreshMart Pvt. Ltd.", emoji:"👩‍💼", text:"We source all vegetables directly from farmers now. The quality is excellent and prices are much better.", rating:5 },
    { name:"Suresh Yadav",  role:"Farmer, Pune",              emoji:"👨‍🌾", text:"Very easy to use. I listed my tomatoes and got my first order within 2 days. Payment was fast and transparent.", rating:5 },
  ];
  return (
    <section id="testimonials" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <AnimatedSection className="text-center mb-16">
          <motion.div variants={fadeUp}>
            <span className="text-primary-600 font-bold text-sm uppercase tracking-widest">Testimonials</span>
            <h2 className="font-display text-4xl font-bold text-gray-900 mt-2 mb-4">What Our Users Say</h2>
          </motion.div>
        </AnimatedSection>
        <AnimatedSection className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t,i) => (
            <motion.div key={i} variants={fadeUp} whileHover={{ y:-4 }}
              className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:shadow-card-lg transition-all duration-300">
              <div className="flex gap-1 mb-4">{[...Array(t.rating)].map((_,j) => <Star key={j} className="w-4 h-4 text-earth-400 fill-earth-400" />)}</div>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">&quot;{t.text}&quot;</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-xl">{t.emoji}</div>
                <div><p className="font-bold text-gray-800 text-sm">{t.name}</p><p className="text-gray-400 text-xs">{t.role}</p></div>
              </div>
            </motion.div>
          ))}
        </AnimatedSection>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="py-24 bg-gray-50">
      <motion.div initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} className="max-w-3xl mx-auto px-6 text-center">
        <div className="text-5xl mb-6">🌾</div>
        <h2 className="font-display text-4xl font-bold text-gray-900 mb-4">Ready to Transform Your Agricultural Business?</h2>
        <p className="text-gray-500 text-lg mb-8">Join thousands of farmers and buyers already growing with Agri-Smart Connect.</p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link to="/signup" className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold px-8 py-4 rounded-xl transition-all shadow-lg hover:-translate-y-0.5">
            Get Started Free <ArrowRight className="w-5 h-5" />
          </Link>
          <Link to="/signin" className="inline-flex items-center gap-2 border-2 border-primary-600 text-primary-700 font-bold px-8 py-4 rounded-xl hover:bg-primary-50 transition-all">
            Sign In
          </Link>
        </div>
      </motion.div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-primary-950 text-primary-200 py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center"><Leaf className="w-4 h-4 text-white" /></div>
            <span className="font-display font-bold text-white">Agri-Smart Connect</span>
          </Link>
          <p className="text-sm text-primary-400">© {new Date().getFullYear()} Agri-Smart Connect. All rights reserved.</p>
          <div className="flex gap-6 text-sm">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
        <div className="border-t border-primary-900 pt-6 flex flex-wrap gap-4 justify-center text-xs text-primary-500">
          <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Secure Payments</span>
          <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> 10+ Languages</span>
          <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> AI-Powered</span>
          <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> Made in India</span>
        </div>
      </div>
    </footer>
  );
}

export default function HomePage() {
  return (
    <div className="font-sans">
      <Navbar />
      <Hero />
      <WeatherSection />
      <Features />
      <HowItWorks />
      <Stats />
      <Testimonials />
      <CTA />
      <Footer />
    </div>
  );
}
