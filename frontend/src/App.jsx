import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import "./i18n";

// ── Lazy Page Imports ─────────────────────────────────────────
// Public
const HomePage      = lazy(() => import("./pages/HomePage"));
const SignUp        = lazy(() => import("./pages/SignUp"));
const SignIn        = lazy(() => import("./pages/SignIn"));
const VerifyEmail   = lazy(() => import("./pages/VerifyEmail"));
const ForgotPassword= lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const ProfilePage   = lazy(() => import("./pages/ProfilePage"));

// Farmer
const FarmerDashboardPage  = lazy(() => import("./pages/farmer/FarmerDashboard"));
const SmartFarmingHub      = lazy(() => import("./pages/farmer/SmartFarmingHub"));
const FarmerMarketplace    = lazy(() => import("./pages/farmer/FarmerMarketplace"));
const GovernmentSchemes    = lazy(() => import("./pages/farmer/GovernmentSchemes"));
const ExpenseTracker       = lazy(() => import("./pages/farmer/ExpenseTracker"));
const ProfitPrediction     = lazy(() => import("./pages/farmer/ProfitPrediction"));
const CropCalendar         = lazy(() => import("./pages/farmer/CropCalendar"));
const CommunityForum       = lazy(() => import("./pages/farmer/CommunityForum"));
const FarmerOrdersReceived = lazy(() => import("./pages/farmer/FarmerOrdersReceived"));
const FarmerChat           = lazy(() => import("./pages/farmer/FarmerChat"));
const LiveMandiPrice       = lazy(() => import("./pages/farmer/LiveMandiPrice"));

// Buyer
const BuyerDashboard      = lazy(() => import("./pages/buyer/BuyerDashboard"));
const BrowseProducts      = lazy(() => import("./pages/buyer/BrowseProducts"));
const MyOrders            = lazy(() => import("./pages/buyer/MyOrders"));
const BuyerMarketPrices   = lazy(() => import("./pages/buyer/BuyerMarketPrices"));
const BuyerCommunityForum = lazy(() => import("./pages/buyer/BuyerCommunityForum"));
const BuyerChat           = lazy(() => import("./pages/buyer/BuyerChat"));

// Shared
const ContactSupport      = lazy(() => import("./pages/ContactSupport"));

// Admin
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));

// ── Premium Page Loading Fallback ─────────────────────────────
function PageLoader() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #f0f9ff 100%)",
      gap: "20px",
    }}>
      {/* Animated logo */}
      <div style={{ position: "relative", width: 64, height: 64 }}>
        <div style={{
          position: "absolute", inset: 0,
          border: "3px solid #bbf7d0",
          borderTopColor: "#16a34a",
          borderRadius: "50%",
          animation: "spin 0.9s linear infinite",
        }} />
        <div style={{
          position: "absolute", inset: 8,
          border: "3px solid #a5f3fc",
          borderTopColor: "#0891b2",
          borderRadius: "50%",
          animation: "spin 1.4s linear infinite reverse",
        }} />
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 24,
        }}>🌿</div>
      </div>

      {/* Shimmer skeleton preview */}
      <div style={{ width: 320, display: "flex", flexDirection: "column", gap: 10 }}>
        {[80, 60, 40].map((w, i) => (
          <div key={i} style={{
            height: i === 0 ? 18 : 13,
            width: `${w}%`,
            borderRadius: 8,
            background: "linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)",
            backgroundSize: "200% 100%",
            animation: `shimmer 1.5s infinite ${i * 0.15}s`,
          }} />
        ))}
      </div>

      <p style={{
        fontSize: 13,
        color: "#64748b",
        fontWeight: 600,
        letterSpacing: "0.05em",
        animation: "pulse 2s ease-in-out infinite",
      }}>Loading Agri-Smart Connect…</p>

      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes shimmer { 0%,100% { background-position: 200% 0; } 50% { background-position: -200% 0; } }
        @keyframes pulse   { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
      `}</style>
    </div>
  );
}

// ── 404 Page ──────────────────────────────────────────────────
function NotFound() {
  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center px-6">
      <div className="text-center">
        <div className="text-8xl mb-6">🌾</div>
        <h1 className="font-display text-5xl font-bold text-gray-800 mb-4">404</h1>
        <p className="text-xl text-gray-500 mb-2">Page Not Found</p>
        <p className="text-gray-400 text-sm mb-8">The page you're looking for doesn't exist or has been moved.</p>
        <a href="/" className="btn btn-primary">Go to Home</a>
      </div>
    </div>
  );
}

// ── Protected Route ───────────────────────────────────────────
function PrivateRoute({ children, allowedRole }) {
  const userStr = localStorage.getItem("user") || sessionStorage.getItem("user");
  const user    = JSON.parse(userStr || "null");
  if (!user) return <Navigate to="/signin" replace />;
  if (allowedRole && user.role !== allowedRole) {
    if (user.role === "farmer") return <Navigate to="/farmer/dashboard" replace />;
    if (user.role === "buyer")  return <Navigate to="/buyer/dashboard" replace />;
    if (user.role === "admin")  return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/signin" replace />;
  }
  return children;
}

function AuthRoute({ children }) {
  const userStr = localStorage.getItem("user") || sessionStorage.getItem("user");
  const user    = JSON.parse(userStr || "null");
  if (!user) return <Navigate to="/signin" replace />;
  return children;
}

// ── App ───────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            borderRadius: "16px",
            padding: "14px 18px",
            fontSize: "14px",
            fontWeight: "600",
            fontFamily: "'Nunito', sans-serif",
            boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
          },
          success: { iconTheme: { primary: "#16a34a", secondary: "#fff" } },
          error:   { iconTheme: { primary: "#dc2626", secondary: "#fff" } },
        }}
      />

      <Suspense fallback={<PageLoader />}>
        <Routes>

          {/* ── Public ── */}
          <Route path="/"                       element={<HomePage />} />
          <Route path="/signup"                 element={<SignUp />} />
          <Route path="/signin"                 element={<SignIn />} />
          <Route path="/verify-email"           element={<VerifyEmail />} />
          <Route path="/forgot-password"        element={<ForgotPassword />} />
          <Route path="/reset-password/:token"  element={<ResetPassword />} />
          <Route path="/profile"                element={<AuthRoute><ProfilePage /></AuthRoute>} />

          {/* ── Farmer ── */}
          <Route path="/farmer/dashboard"
            element={<PrivateRoute allowedRole="farmer"><FarmerDashboardPage /></PrivateRoute>} />
          <Route path="/farmer/hub"
            element={<PrivateRoute allowedRole="farmer"><SmartFarmingHub /></PrivateRoute>} />
          <Route path="/farmer/marketplace"
            element={<PrivateRoute allowedRole="farmer"><FarmerMarketplace /></PrivateRoute>} />
          <Route path="/farmer/expenses"
            element={<PrivateRoute allowedRole="farmer"><ExpenseTracker /></PrivateRoute>} />
          <Route path="/farmer/crop-calendar"
            element={<PrivateRoute allowedRole="farmer"><CropCalendar /></PrivateRoute>} />
          <Route path="/farmer/profit-prediction"
            element={<PrivateRoute allowedRole="farmer"><ProfitPrediction /></PrivateRoute>} />
          <Route path="/farmer/schemes"
            element={<PrivateRoute allowedRole="farmer"><GovernmentSchemes /></PrivateRoute>} />
          <Route path="/farmer/community"
            element={<PrivateRoute allowedRole="farmer"><CommunityForum /></PrivateRoute>} />
          <Route path="/farmer/orders"
            element={<PrivateRoute allowedRole="farmer"><FarmerOrdersReceived /></PrivateRoute>} />
          <Route path="/farmer/chat"
            element={<PrivateRoute allowedRole="farmer"><FarmerChat /></PrivateRoute>} />
          <Route path="/farmer/chat/:conversationId"
            element={<PrivateRoute allowedRole="farmer"><FarmerChat /></PrivateRoute>} />
          <Route path="/farmer/live-mandi"
            element={<PrivateRoute allowedRole="farmer"><LiveMandiPrice /></PrivateRoute>} />
          <Route path="/farmer/contact-support"
            element={<PrivateRoute allowedRole="farmer"><ContactSupport /></PrivateRoute>} />

          {/* Legacy redirects */}
          <Route path="/farmer/weather"             element={<PrivateRoute allowedRole="farmer"><Navigate to="/farmer/hub?tab=weather"    replace /></PrivateRoute>} />
          <Route path="/farmer/crop-recommendation" element={<PrivateRoute allowedRole="farmer"><Navigate to="/farmer/hub?tab=crop"       replace /></PrivateRoute>} />
          <Route path="/farmer/market-prices"       element={<PrivateRoute allowedRole="farmer"><Navigate to="/farmer/hub?tab=market"     replace /></PrivateRoute>} />
          <Route path="/farmer/disease-detection"   element={<PrivateRoute allowedRole="farmer"><Navigate to="/farmer/hub?tab=disease"    replace /></PrivateRoute>} />
          <Route path="/farmer/fertilizer"          element={<PrivateRoute allowedRole="farmer"><Navigate to="/farmer/hub?tab=fertilizer" replace /></PrivateRoute>} />
          <Route path="/farmer/sell-crops"          element={<PrivateRoute allowedRole="farmer"><Navigate to="/farmer/marketplace?tab=crops" replace /></PrivateRoute>} />

          {/* ── Buyer ── */}
          <Route path="/buyer/dashboard"
            element={<PrivateRoute allowedRole="buyer"><BuyerDashboard /></PrivateRoute>} />
          <Route path="/buyer/browse"
            element={<PrivateRoute allowedRole="buyer"><BrowseProducts /></PrivateRoute>} />
          <Route path="/buyer/orders"
            element={<PrivateRoute allowedRole="buyer"><MyOrders /></PrivateRoute>} />
          <Route path="/buyer/market-prices"
            element={<PrivateRoute allowedRole="buyer"><BuyerMarketPrices /></PrivateRoute>} />
          <Route path="/buyer/community"
            element={<PrivateRoute allowedRole="buyer"><BuyerCommunityForum /></PrivateRoute>} />
          <Route path="/buyer/chat"
            element={<PrivateRoute allowedRole="buyer"><BuyerChat /></PrivateRoute>} />
          <Route path="/buyer/chat/:conversationId"
            element={<PrivateRoute allowedRole="buyer"><BuyerChat /></PrivateRoute>} />
          <Route path="/buyer/contact-support"
            element={<PrivateRoute allowedRole="buyer"><ContactSupport /></PrivateRoute>} />

          {/* ── Admin ── */}
          <Route path="/admin/dashboard" element={<PrivateRoute allowedRole="admin"><AdminDashboard /></PrivateRoute>} />
          <Route path="/admin/users"     element={<PrivateRoute allowedRole="admin"><AdminDashboard /></PrivateRoute>} />
          <Route path="/admin/orders"    element={<PrivateRoute allowedRole="admin"><AdminDashboard /></PrivateRoute>} />
          <Route path="/admin/products"  element={<PrivateRoute allowedRole="admin"><AdminDashboard /></PrivateRoute>} />

          {/* ── 404 ── */}
          <Route path="*" element={<NotFound />} />

        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
