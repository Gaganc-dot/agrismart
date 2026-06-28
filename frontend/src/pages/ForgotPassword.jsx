import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { Leaf, ArrowLeft } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/api/auth/forgot-password`, { email });
      toast.success(data.message || "Reset link sent!");
      setIsSent(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send reset link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-earth-700 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">
        <Link to="/signin" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to login
        </Link>

        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
            <Leaf className="w-8 h-8 text-primary-600" />
          </div>
        </div>

        <h2 className="font-display text-2xl font-bold text-gray-800 text-center mb-2">
          Forgot Password?
        </h2>

        {!isSent ? (
          <>
            <p className="text-gray-500 text-sm text-center mb-8">
              No worries, we'll send you reset instructions.
            </p>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl transition-all duration-200 disabled:opacity-60 shadow-md hover:shadow-lg"
              >
                {loading ? "Sending..." : "Reset Password"}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center">
            <p className="text-green-600 font-medium mb-6">
              Check your email! We've sent a password reset link to <br /><span className="font-bold text-gray-800">{email}</span>
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Didn't receive the email? Check your spam folder or try again.
            </p>
            <button
              onClick={() => setIsSent(false)}
              className="text-primary-600 font-semibold hover:underline"
            >
              Try another email
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
