import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { Leaf, Eye, EyeOff, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function SignIn() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post(
        `${API}/api/auth/signin`,
        form
      );
      
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem("token", data.token);
      storage.setItem("user", JSON.stringify(data.user));
      
      toast.success(`Welcome back, ${data.user.name}! 👋`);
      const role = data.user.role;
      if (role === "farmer") navigate("/farmer/dashboard");
      else if (role === "buyer") navigate("/buyer/dashboard");
      else if (role === "admin") navigate("/admin/dashboard");
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.isVerified === false) {
        toast.error(err.response?.data?.message);
        navigate("/verify-email", { state: { email: form.email } });
      } else {
        toast.error(err.response?.data?.message || "Invalid email or password");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-earth-700 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "radial-gradient(circle, #fff 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-10 overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50 rounded-full -mr-16 -mt-16 blur-2xl" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-8">
            <Link to="/" className="flex items-center gap-2 mb-6 group">
              <motion.div 
                whileHover={{ rotate: 15 }}
                className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-900/20"
              >
                <Leaf className="w-7 h-7 text-white" />
              </motion.div>
              <div>
                <h1 className="font-display text-2xl font-bold text-primary-900 leading-tight">Agri-Smart</h1>
                <p className="text-xs text-gray-400 -mt-1">Connect</p>
              </div>
            </Link>
          </div>

          <h2 className="font-display text-3xl font-bold text-gray-800 mb-2">
            Welcome Back
          </h2>
          <p className="text-gray-500 text-sm mb-8">Please enter your details to sign in</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">
                Email Address
              </label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="you@example.com"
                className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all placeholder:text-gray-300"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">
                Password
              </label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                  className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 pr-14 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all placeholder:text-gray-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-primary-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm px-1">
              <label className="flex items-center text-gray-600 cursor-pointer group">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <div className="w-5 h-5 border-2 border-gray-200 rounded-md peer-checked:bg-primary-600 peer-checked:border-primary-600 transition-all"></div>
                  <svg className="absolute w-3 h-3 text-white left-1 opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4"><path d="M5 13l4 4L19 7" /></svg>
                </div>
                <span className="ml-3 text-xs font-semibold group-hover:text-primary-600 transition-colors">Remember me</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-bold text-primary-600 hover:text-primary-700 hover:underline transition-colors"
              >
                Forgot Password?
              </Link>
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 rounded-2xl transition-all duration-300 disabled:opacity-60 shadow-xl shadow-primary-900/20 flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </motion.button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-10">
            Don&apos;t have an account?{" "}
            <Link
              to="/signup"
              className="text-primary-600 font-bold hover:text-primary-700 hover:underline"
            >
              Create Account
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
