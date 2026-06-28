import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
  User, Mail, Phone, MapPin, Building2, Leaf, Save,
  Lock, Eye, EyeOff, Camera, ArrowLeft, CheckCircle2,
  AlertCircle, Loader
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

function getToken() {
  return localStorage.getItem("token") || sessionStorage.getItem("token");
}
function getUser() {
  return JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "{}");
}
function setUser(u) {
  if (localStorage.getItem("token")) localStorage.setItem("user", JSON.stringify(u));
  else sessionStorage.setItem("user", JSON.stringify(u));
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUserState] = useState(getUser());
  const [activeTab, setActiveTab] = useState("profile");
  const [profileLoading, setProfileLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [profileForm, setProfileForm] = useState(() => {
    const rawPhone = user.phone || "";
    let cleanedPhone = rawPhone.replace(/\D/g, "");
    if (cleanedPhone.startsWith("91") && cleanedPhone.length === 12) {
      cleanedPhone = cleanedPhone.slice(2);
    }
    return {
      name: user.name || "",
      phone: cleanedPhone,
      farmName: user.farmName || "",
      location: user.location || "",
      companyName: user.companyName || "",
    };
  });

  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [pwErrors, setPwErrors] = useState({});

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone") {
      const digitsOnly = value.replace(/\D/g, "");
      if (digitsOnly.length <= 10) {
        setProfileForm(prev => ({ ...prev, phone: digitsOnly }));
      }
    } else {
      setProfileForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePwChange = (e) => {
    setPwForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setPwErrors(prev => ({ ...prev, [e.target.name]: "" }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (profileForm.phone && profileForm.phone.length !== 10) {
      toast.error("Phone number must be exactly 10 digits");
      return;
    }
    setProfileLoading(true);
    try {
      const payload = {
        ...profileForm,
        phone: profileForm.phone || "",
      };
      const { data } = await axios.put(`${API}/api/auth/profile`, payload, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const updated = { ...user, ...data.user };
      setUserState(updated);
      setUser(updated);

      const rawPhone = data.user?.phone || "";
      let cleanedPhone = rawPhone.replace(/\D/g, "");
      if (cleanedPhone.startsWith("91") && cleanedPhone.length === 12) {
        cleanedPhone = cleanedPhone.slice(2);
      }
      setProfileForm(prev => ({ ...prev, phone: cleanedPhone }));

      toast.success("Profile updated successfully!");
    } catch (err) {
      if (err.response?.data?.errors && err.response.data.errors.length > 0) {
        toast.error(err.response.data.errors[0].msg);
      } else {
        toast.error(err.response?.data?.message || "Failed to update profile");
      }
    } finally {
      setProfileLoading(false);
    }
  };


  const validatePassword = () => {
    const errors = {};
    if (!pwForm.currentPassword) errors.currentPassword = "Current password required";
    if (!pwForm.newPassword) errors.newPassword = "New password required";
    else if (pwForm.newPassword.length < 6) errors.newPassword = "At least 6 characters";
    if (pwForm.newPassword !== pwForm.confirmPassword) errors.confirmPassword = "Passwords do not match";
    return errors;
  };

  const handlePwSubmit = async (e) => {
    e.preventDefault();
    const errors = validatePassword();
    if (Object.keys(errors).length) { setPwErrors(errors); return; }
    setPwLoading(true);
    try {
      await axios.put(`${API}/api/auth/change-password`, {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      }, { headers: { Authorization: `Bearer ${getToken()}` } });
      toast.success("Password changed successfully!");
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password");
    } finally {
      setPwLoading(false);
    }
  };

  const isFarmer = user.role === "farmer";

  const goBack = () => {
    if (user.role === "farmer") navigate("/farmer/dashboard");
    else if (user.role === "buyer") navigate("/buyer/dashboard");
    else if (user.role === "admin") navigate("/admin/dashboard");
    else navigate("/");
  };

  const tabs = [
    { key: "profile", label: "Profile Info", icon: User },
    { key: "security", label: "Security", icon: Lock },
  ];

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
          <button onClick={goBack} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div>
            <h1 className="font-display font-bold text-gray-800 text-lg">My Profile</h1>
            <p className="text-gray-400 text-xs">Manage your account settings</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">

        {/* Profile Card */}
        <div className="card p-8">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shadow-lg ${
                user.role === "farmer" ? "bg-primary-100" : user.role === "buyer" ? "bg-earth-100" : "bg-red-100"
              }`}>
                {user.role === "farmer" ? "👨‍🌾" : user.role === "buyer" ? "👩‍💼" : "🛡️"}
              </div>
              <div className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs shadow-md ${
                user.role === "farmer" ? "bg-primary-600" : user.role === "buyer" ? "bg-earth-600" : "bg-red-600"
              }`}>
                {user.role === "farmer" ? <Leaf className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
              </div>
            </div>
            <div className="flex-1">
              <h2 className="font-display text-xl font-bold text-gray-800">{user.name}</h2>
              <p className="text-gray-500 text-sm">{user.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`badge text-xs capitalize ${
                  user.role === "farmer" ? "badge-primary" : user.role === "buyer" ? "badge-warning" : "badge-danger"
                }`}>
                  {user.role}
                </span>
                <span className="badge badge-success text-xs"><CheckCircle2 className="w-3 h-3" /> Verified</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-gray-100 p-1 rounded-2xl">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  activeTab === tab.key ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}>
                <Icon className="w-4 h-4" />{tab.label}
              </button>
            );
          })}
        </div>

        {/* Profile Form */}
        {activeTab === "profile" && (
          <div className="card p-8 animate-fade-up">
            <h3 className="section-title mb-6">Personal Information</h3>
            <form onSubmit={handleProfileSubmit} className="space-y-5">
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Full Name *</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input name="name" value={profileForm.name} onChange={handleProfileChange} required
                      className="input pl-10" placeholder="Your full name" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input name="phone" value={profileForm.phone} onChange={handleProfileChange}
                      className="input pl-10" placeholder="8530748696" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input value={user.email} disabled className="input pl-10 opacity-60 cursor-not-allowed" />
                </div>
                <p className="text-xs text-gray-400 mt-1.5 ml-1">Email cannot be changed after registration.</p>
              </div>

              {isFarmer && (
                <div className="grid md:grid-cols-2 gap-5 p-5 bg-primary-50 rounded-2xl border border-primary-100">
                  <div>
                    <label className="block text-xs font-bold text-primary-700 uppercase tracking-widest mb-2">Farm Name</label>
                    <div className="relative">
                      <Leaf className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-500" />
                      <input name="farmName" value={profileForm.farmName} onChange={handleProfileChange}
                        className="input pl-10 bg-white border-primary-200 focus:ring-primary-500" placeholder="Green Valley Farm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-primary-700 uppercase tracking-widest mb-2">Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-500" />
                      <input name="location" value={profileForm.location} onChange={handleProfileChange}
                        className="input pl-10 bg-white border-primary-200 focus:ring-primary-500" placeholder="Nashik, Maharashtra" />
                    </div>
                  </div>
                </div>
              )}

              {user.role === "buyer" && (
                <div className="p-5 bg-earth-50 rounded-2xl border border-earth-100">
                  <label className="block text-xs font-bold text-earth-700 uppercase tracking-widest mb-2">Company Name</label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-earth-500" />
                    <input name="companyName" value={profileForm.companyName} onChange={handleProfileChange}
                      className="input pl-10 bg-white border-earth-200 focus:ring-earth-400" placeholder="FreshMart Pvt. Ltd." />
                  </div>
                </div>
              )}

              <button type="submit" disabled={profileLoading}
                className="btn btn-primary w-full">
                {profileLoading ? <><Loader className="w-4 h-4 animate-spin" /> Saving…</> : <><Save className="w-4 h-4" /> Save Changes</>}
              </button>
            </form>
          </div>
        )}

        {/* Security Form */}
        {activeTab === "security" && (
          <div className="card p-8 animate-fade-up">
            <h3 className="section-title mb-2">Change Password</h3>
            <p className="text-gray-400 text-sm mb-6">Use a strong password to keep your account secure.</p>

            <form onSubmit={handlePwSubmit} className="space-y-5">
              {[
                { name:"currentPassword", label:"Current Password", show:showCurrent, toggle:() => setShowCurrent(!showCurrent) },
                { name:"newPassword",     label:"New Password",     show:showNew,     toggle:() => setShowNew(!showNew) },
                { name:"confirmPassword", label:"Confirm New Password", show:showConfirm, toggle:() => setShowConfirm(!showConfirm) },
              ].map(field => (
                <div key={field.name}>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{field.label}</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      name={field.name}
                      type={field.show ? "text" : "password"}
                      value={pwForm[field.name]}
                      onChange={handlePwChange}
                      className={`input pl-10 pr-12 ${pwErrors[field.name] ? "input-error" : ""}`}
                      placeholder="••••••••"
                    />
                    <button type="button" onClick={field.toggle}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {field.show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {pwErrors[field.name] && (
                    <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />{pwErrors[field.name]}
                    </p>
                  )}
                </div>
              ))}

              {/* Password strength indicator */}
              {pwForm.newPassword && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-gray-500">Password strength:</p>
                  <div className="flex gap-1">
                    {[1,2,3,4].map(i => (
                      <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${
                        pwForm.newPassword.length >= i * 3
                          ? i <= 2 ? "bg-red-400" : i === 3 ? "bg-yellow-400" : "bg-green-500"
                          : "bg-gray-200"
                      }`} />
                    ))}
                  </div>
                  <p className="text-xs text-gray-400">
                    {pwForm.newPassword.length < 6 ? "Too short" : pwForm.newPassword.length < 9 ? "Weak" : pwForm.newPassword.length < 12 ? "Good" : "Strong"}
                  </p>
                </div>
              )}

              <button type="submit" disabled={pwLoading}
                className="btn btn-primary w-full">
                {pwLoading ? <><Loader className="w-4 h-4 animate-spin" /> Updating…</> : <><Lock className="w-4 h-4" /> Update Password</>}
              </button>
            </form>

            {/* Security tips */}
            <div className="mt-6 p-4 bg-blue-50 rounded-2xl border border-blue-100">
              <p className="text-xs font-bold text-blue-700 mb-2 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Security Tips</p>
              <ul className="text-xs text-blue-600 space-y-1 list-disc ml-4">
                <li>Use at least 8 characters with letters, numbers & symbols</li>
                <li>Never share your password with anyone</li>
                <li>Use a unique password not used on other sites</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
