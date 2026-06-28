import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { Leaf, ShoppingBag } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

const roles = [
  {
    id: "farmer",
    label: "Farmer",
    icon: Leaf,
    desc: "Sell your produce directly",
  },
  {
    id: "buyer",
    label: "Buyer",
    icon: ShoppingBag,
    desc: "Source fresh farm products",
  },
];

export default function SignUp() {
  const navigate = useNavigate();
  const [role, setRole] = useState("farmer");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    farmName: "",
    location: "",
    companyName: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone") {
      const digitsOnly = value.replace(/\D/g, "");
      if (digitsOnly.length <= 10) {
        setForm(prev => ({ ...prev, phone: digitsOnly }));
      }
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.phone && form.phone.length !== 10) {
      toast.error("Phone number must be exactly 10 digits");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        phone: form.phone || "",
        role,
      };
      const { data } = await axios.post(
        `${API}/api/auth/signup`,
        payload
      );
      toast.success(data.message || "Registration successful! Please verify your account.");
      navigate("/verify-email", { state: { email: form.email } });
    } catch (err) {
      if (err.response?.data?.errors) {
        err.response.data.errors.forEach((error) => toast.error(error.msg));
      } else if (err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else if (err.code === "ERR_NETWORK" || !err.response) {
        toast.error("Cannot reach server — make sure the backend is running on port 8000.");
      } else {
        toast.error("Signup failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-earth-700 flex items-center justify-center p-4">
      {/* Background dot pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "radial-gradient(circle, #fff 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-8">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-6">
          <Link to="/" className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-primary-900 leading-tight">Agri-Smart</h1>
              <p className="text-xs text-gray-400 -mt-1">Connect</p>
            </div>
          </Link>
        </div>

        <h2 className="font-display text-2xl font-bold text-gray-800 mb-1">
          Create Account
        </h2>
        <p className="text-gray-500 text-sm mb-6">
          Join the smarter farming network
        </p>

        {/* Role Selector — only Farmer & Buyer */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {roles.map((roleItem) => {
            const RoleIcon = roleItem.icon;
            return (
              <button
                key={roleItem.id}
                type="button"
                onClick={() => setRole(roleItem.id)}
                className={`p-4 rounded-2xl border-2 text-left transition-all duration-200 ${role === roleItem.id
                    ? "border-primary-500 bg-primary-50"
                    : "border-gray-200 hover:border-primary-300"
                  }`}
              >
                <RoleIcon
                  className={`w-6 h-6 mb-2 ${role === roleItem.id
                      ? "text-primary-600"
                      : "text-gray-400"
                    }`}
                />
                <p
                  className={`font-bold text-sm ${role === roleItem.id
                      ? "text-primary-700"
                      : "text-gray-600"
                    }`}
                >
                  {roleItem.label}
                </p>
                <p className="text-xs text-gray-400 leading-tight mt-0.5">
                  {roleItem.desc}
                </p>
              </button>
            );
          })}
        </div>

        {/* Admin note */}
        <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-6">
          <span className="text-blue-500 text-sm mt-0.5">ℹ️</span>
          <p className="text-xs text-blue-700">
            <span className="font-bold">Admin access</span> is assigned
            manually by the platform team. Contact your administrator if you
            need admin privileges.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name + Phone */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Full Name *
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="Rajesh Patil"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Phone
              </label>
              <div>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="8530748696"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
              </div>
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Email *
            </label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="you@example.com"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Password *
            </label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              placeholder="Min. 6 characters"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>

          {/* Farmer-specific fields */}
          {role === "farmer" && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-primary-50 rounded-2xl border border-primary-100">
              <div>
                <label className="block text-xs font-semibold text-primary-700 mb-1">
                  Farm Name
                </label>
                <input
                  name="farmName"
                  value={form.farmName}
                  onChange={handleChange}
                  placeholder="Green Valley Farm"
                  className="w-full border border-primary-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-primary-700 mb-1">
                  Location
                </label>
                <input
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="Nashik, Maharashtra"
                  className="w-full border border-primary-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white"
                />
              </div>
            </div>
          )}

          {/* Buyer-specific fields */}
          {role === "buyer" && (
            <div className="p-4 bg-earth-50 rounded-2xl border border-earth-200">
              <label className="block text-xs font-semibold text-earth-700 mb-1">
                Company Name
              </label>
              <input
                name="companyName"
                value={form.companyName}
                onChange={handleChange}
                placeholder="FreshMart Pvt. Ltd."
                className="w-full border border-earth-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-earth-400 bg-white"
              />
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl transition-all duration-200 disabled:opacity-60 text-sm mt-2"
          >
            {loading ? "Creating Account..." : "Create Account 🌱"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account?{" "}
          <Link
            to="/signin"
            className="text-primary-600 font-semibold hover:underline"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
