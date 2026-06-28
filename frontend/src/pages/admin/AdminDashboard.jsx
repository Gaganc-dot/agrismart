import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
  LayoutDashboard, Users, ShoppingBag, Package, TrendingUp,
  LogOut, Menu, X, ChevronRight, Bell, Shield, Leaf,
  UserCheck, UserX, AlertCircle, CheckCircle2, Clock,
  BarChart2, IndianRupee, Eye, Trash2, RefreshCw, Search,
  ChevronDown, ArrowUpRight, Activity, Settings
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LineChart, Line, Legend
} from "recharts";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

// ── Admin Sidebar ─────────────────────────────────────────────
const navItems = [
  { key:"dashboard",  label:"Dashboard",    icon:LayoutDashboard, path:"/admin/dashboard" },
  { key:"users",      label:"Users",        icon:Users,           path:"/admin/users" },
  { key:"orders",     label:"Orders",       icon:ShoppingBag,     path:"/admin/orders" },
  { key:"products",   label:"Products",     icon:Package,         path:"/admin/products" },
];

function AdminSidebar({ open, setOpen }) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "{}");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    navigate("/signin");
  };

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setOpen(false)} />}
      <aside className={`fixed top-0 left-0 h-full z-30 w-64 bg-gray-900 flex flex-col transform transition-transform duration-300 ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:static md:flex`}>
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-gray-800">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center"><Leaf className="w-4 h-4 text-white" /></div>
            <div>
              <p className="font-display font-bold text-white text-sm leading-tight">Agri-Smart</p>
              <p className="text-gray-500 text-xs -mt-0.5">Admin Panel</p>
            </div>
          </Link>
          <button onClick={() => setOpen(false)} className="md:hidden text-gray-400"><X className="w-5 h-5" /></button>
        </div>

        {/* User */}
        <div className="px-5 py-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-lg">🛡️</div>
            <div className="overflow-hidden">
              <p className="text-white font-bold text-sm truncate">{user.name || "Admin"}</p>
              <p className="text-gray-400 text-xs flex items-center gap-1"><Shield className="w-3 h-3" /> Administrator</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 sidebar-scroll">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link key={item.key} to={item.path} onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  active ? "bg-primary-600 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white"
                }`}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">{item.label}</span>
                {active && <ChevronRight className="w-3 h-3" />}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-4 py-4 border-t border-gray-800">
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-900/30 hover:text-red-300 transition-all text-sm font-semibold">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>
    </>
  );
}

function AdminHeader({ setOpen, title }) {
  const user = JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "{}");
  return (
    <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
      <div className="flex items-center gap-4">
        <button onClick={() => setOpen(true)} className="md:hidden text-gray-500"><Menu className="w-5 h-5" /></button>
        <div>
          <h1 className="font-display font-bold text-gray-800 text-lg">{title}</h1>
          <p className="text-gray-400 text-xs">Hello, {user.name?.split(" ")[0] || "Admin"}! 👋</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button className="relative w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center hover:bg-gray-100">
          <Bell className="w-5 h-5 text-gray-500" />
          <span className="notification-dot" />
        </button>
        <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-md">🛡️</div>
      </div>
    </header>
  );
}

// ── Stat Card ─────────────────────────────────────────────────
function StatCard({ title, value, icon, color, bg, change, loading }) {
  if (loading) return <div className="skeleton h-28 rounded-3xl" />;
  return (
    <div className={`card p-6 card-lift transition-all`}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{title}</p>
        <div className={`w-10 h-10 ${bg} rounded-2xl flex items-center justify-center ${color}`}>{icon}</div>
      </div>
      <h4 className={`text-2xl font-display font-extrabold ${color}`}>{value}</h4>
      {change !== undefined && (
        <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
          <ArrowUpRight className="w-3 h-3 text-green-500" />
          {change}
        </p>
      )}
    </div>
  );
}

// ── Pagination Controls ───────────────────────────────────────
function PaginationControls({ page, totalPages, setPage }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-gray-50">
      <button
        disabled={page === 1}
        onClick={() => setPage(p => Math.max(p - 1, 1))}
        className="px-3 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-lg disabled:opacity-50 transition-colors"
      >
        Previous
      </button>
      <span className="text-xs text-gray-500 font-medium">Page {page} of {totalPages}</span>
      <button
        disabled={page === totalPages}
        onClick={() => setPage(p => Math.min(p + 1, totalPages))}
        className="px-3 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-lg disabled:opacity-50 transition-colors"
      >
        Next
      </button>
    </div>
  );
}

// ── Recent Users Table (Dashboard Overview) ───────────────────
function RecentUsersTable({ users, onVerify, onDelete, loading }) {
  return (
    <div className="card overflow-hidden">
      <div className="p-6 border-b border-gray-50">
        <h3 className="section-title text-lg">Recent Users</h3>
      </div>
      {loading ? (
        <div className="p-6 space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-10 rounded-xl" />)}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-6 text-gray-400 text-sm">No users found</td></tr>
              ) : users.map(u => (
                <tr key={u._id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-sm">
                        {u.role === "farmer" ? "👨‍🌾" : u.role === "buyer" ? "👩‍💼" : "🛡️"}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{u.name}</p>
                        <p className="text-gray-400 text-xs">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${u.role === "farmer" ? "badge-primary" : u.role === "buyer" ? "badge-warning" : "badge-danger"}`}>
                      {u.role}
                    </span>
                  </td>
                  <td>
                    {u.isVerified
                      ? <span className="badge-success badge"><CheckCircle2 className="w-3 h-3" />Verified</span>
                      : <span className="badge-danger badge"><AlertCircle className="w-3 h-3" />Pending</span>
                    }
                  </td>
                  <td className="text-gray-500 text-xs">{new Date(u.createdAt).toLocaleDateString("en-IN")}</td>
                  <td>
                    <div className="flex gap-2">
                      {!u.isVerified && (
                        <button onClick={() => onVerify(u._id)}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Verify user">
                          <UserCheck className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => onDelete(u._id, u.name)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete user">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Recent Orders Table (Dashboard Overview) ──────────────────
function RecentOrdersTable({ orders, loading }) {
  const statusColor = {
    pending:   "status-pending",
    confirmed: "status-confirmed",
    shipped:   "status-shipped",
    delivered: "status-delivered",
    cancelled: "status-cancelled",
  };
  return (
    <div className="card overflow-hidden">
      <div className="p-6 border-b border-gray-50">
        <h3 className="section-title text-lg">Recent Orders</h3>
      </div>
      {loading ? (
        <div className="p-6 space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-10 rounded-xl" />)}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>Order</th><th>Buyer</th><th>Farmer</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              {orders.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-6 text-gray-400 text-sm">No orders yet</td></tr>
              ) : orders.map(o => (
                <tr key={o._id}>
                  <td className="font-semibold text-gray-800 text-sm">{o.product?.title || "–"}</td>
                  <td className="text-gray-600 text-sm">{o.buyer?.name || "–"}</td>
                  <td className="text-gray-600 text-sm">{o.farmer?.name || "–"}</td>
                  <td className="font-bold text-primary-700">₹{o.totalPrice?.toLocaleString()}</td>
                  <td><span className={statusColor[o.status] || "badge-neutral badge"}>{o.status}</span></td>
                  <td className="text-gray-500 text-xs">{new Date(o.createdAt).toLocaleDateString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Users Table (Management View) ──────────────────────────────
function UsersTable({
  users, loading, onVerify, onDelete,
  search, setSearch, role, setRole,
  page, totalPages, setPage, onAddAdminClick
}) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-gray-800">Manage Users</h2>
          <p className="text-gray-400 text-sm mt-1">Verify and manage platform accounts</p>
        </div>
        <button onClick={onAddAdminClick}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-md">
          <Shield className="w-3.5 h-3.5" /> Add New Admin
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <h3 className="section-title text-lg">All Users</h3>
          <div className="flex gap-3 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search users..." className="input pl-10 py-2 text-xs w-48" />
            </div>
            <select value={role} onChange={e => { setRole(e.target.value); setPage(1); }}
              className="input py-2 text-xs w-28">
              <option value="all">All Roles</option>
              <option value="farmer">Farmers</option>
              <option value="buyer">Buyers</option>
              <option value="admin">Admins</option>
            </select>
          </div>
        </div>
        {loading ? (
          <div className="p-6 space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="skeleton h-10 rounded-xl" />)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr><th>User</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-12 text-gray-400 text-sm">No users found</td></tr>
                ) : users.map(u => (
                  <tr key={u._id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-sm">
                          {u.role === "farmer" ? "👨‍🌾" : u.role === "buyer" ? "👩‍💼" : "🛡️"}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">{u.name}</p>
                          <p className="text-gray-400 text-xs">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${u.role === "farmer" ? "badge-primary" : u.role === "buyer" ? "badge-warning" : "badge-danger"}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      {u.isVerified
                        ? <span className="badge-success badge"><CheckCircle2 className="w-3 h-3" />Verified</span>
                        : <span className="badge-danger badge"><AlertCircle className="w-3 h-3" />Pending</span>
                      }
                    </td>
                    <td className="text-gray-500 text-xs">{new Date(u.createdAt).toLocaleDateString("en-IN")}</td>
                    <td>
                      <div className="flex gap-2">
                        {!u.isVerified && (
                          <button onClick={() => onVerify(u._id)}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Verify user">
                            <UserCheck className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => onDelete(u._id, u.name)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete user">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <PaginationControls page={page} totalPages={totalPages} setPage={setPage} />
      </div>
    </div>
  );
}

// ── Orders Table (Management View) ─────────────────────────────
function OrdersTable({
  orders, loading,
  status, setStatus,
  page, totalPages, setPage
}) {
  const statusColor = {
    pending:   "status-pending",
    confirmed: "status-confirmed",
    shipped:   "status-shipped",
    delivered: "status-delivered",
    cancelled: "status-cancelled",
  };
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-gray-800">Manage Orders</h2>
          <p className="text-gray-400 text-sm mt-1">Track and monitor platform transactions</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
          <h3 className="section-title text-lg">All Orders</h3>
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
            className="input py-2 text-xs w-36">
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        {loading ? (
          <div className="p-6 space-y-3">{[1,2,3,4].map(i => <div key={i} className="skeleton h-10 rounded-xl" />)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>Order</th><th>Buyer</th><th>Farmer</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-gray-400 text-sm">No orders found</td></tr>
                ) : orders.map(o => (
                  <tr key={o._id}>
                    <td className="font-semibold text-gray-800 text-sm">{o.product?.title || "–"}</td>
                    <td className="text-gray-600 text-sm">{o.buyer?.name || "–"}</td>
                    <td className="text-gray-600 text-sm">{o.farmer?.name || "–"}</td>
                    <td className="font-bold text-primary-700">₹{o.totalPrice?.toLocaleString()}</td>
                    <td><span className={statusColor[o.status] || "badge-neutral badge"}>{o.status}</span></td>
                    <td className="text-gray-500 text-xs">{new Date(o.createdAt).toLocaleDateString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <PaginationControls page={page} totalPages={totalPages} setPage={setPage} />
      </div>
    </div>
  );
}

// ── Products Table (Management View) ───────────────────────────
function ProductsTable({
  products, loading, onDeleteProduct,
  category, setCategory,
  status, setStatus,
  page, totalPages, setPage
}) {
  const statusColor = {
    available: "badge-success",
    sold: "badge-warning",
    pending: "badge-pending",
  };
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-gray-800">Manage Products</h2>
          <p className="text-gray-400 text-sm mt-1">Review active product listings on the marketplace</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <h3 className="section-title text-lg">Product Listings</h3>
          <div className="flex gap-3 flex-wrap">
            <select value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}
              className="input py-2 text-xs w-32">
              <option value="all">All Categories</option>
              <option value="grains">Grains</option>
              <option value="vegetables">Vegetables</option>
              <option value="fruits">Fruits</option>
              <option value="spices">Spices</option>
              <option value="other">Other</option>
            </select>
            <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
              className="input py-2 text-xs w-32">
              <option value="all">All Statuses</option>
              <option value="available">Available</option>
              <option value="sold">Sold</option>
            </select>
          </div>
        </div>
        {loading ? (
          <div className="p-6 space-y-3">{[1,2,3,4].map(i => <div key={i} className="skeleton h-10 rounded-xl" />)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr><th>Product</th><th>Farmer</th><th>Price</th><th>Category</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-gray-400 text-sm">No products found</td></tr>
                ) : products.map(p => (
                  <tr key={p._id}>
                    <td className="font-semibold text-gray-800 text-sm">{p.title}</td>
                    <td className="text-gray-600 text-sm">
                      {p.farmer?.name || "–"}
                      <span className="text-xs text-gray-400 block">{p.farmer?.farmName}</span>
                    </td>
                    <td className="font-bold text-primary-700">₹{p.price} / {p.unit}</td>
                    <td className="text-gray-600 text-sm capitalize">{p.category}</td>
                    <td><span className={`badge ${statusColor[p.status] || "badge-neutral"}`}>{p.status}</span></td>
                    <td>
                      <button onClick={() => onDeleteProduct(p._id, p.title)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete listing">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <PaginationControls page={page} totalPages={totalPages} setPage={setPage} />
      </div>
    </div>
  );
}

// ── Dashboard Overview View ──────────────────────────────────
function DashboardView({ stats, chartData, recentUsers, recentOrders, loading, onVerify, onDelete, onRefresh }) {
  const statCards = [
    { title:"Total Users",      value: stats?.totalUsers ?? "–",    icon:<Users className="w-5 h-5" />,        color:"text-blue-600",    bg:"bg-blue-50",    change:`${stats?.totalFarmers} farmers + ${stats?.totalBuyers} buyers` },
    { title:"Total Orders",     value: stats?.totalOrders ?? "–",   icon:<ShoppingBag className="w-5 h-5" />,  color:"text-purple-600",  bg:"bg-purple-50",  change:`${stats?.pendingOrders} pending` },
    { title:"Active Listings",  value: stats?.totalProducts ?? "–", icon:<Package className="w-5 h-5" />,      color:"text-primary-600", bg:"bg-primary-50", change:"Products listed" },
    { title:"Total Revenue",    value: stats ? `₹${stats.totalRevenue.toLocaleString()}` : "–",
      icon:<IndianRupee className="w-5 h-5" />, color:"text-earth-600", bg:"bg-earth-50", change:"All confirmed orders" },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-gray-800">Platform Overview</h2>
          <p className="text-gray-400 text-sm mt-1">Real-time data from Agri-Smart Connect</p>
        </div>
        <button onClick={onRefresh} disabled={loading}
          className="btn btn-ghost btn-sm flex items-center gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {statCards.map((s,i) => <StatCard key={i} {...s} loading={loading} />)}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Growth Chart */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="section-title text-lg">Platform Growth</h3>
            <span className="badge badge-primary">Last 6 months</span>
          </div>
          {loading ? <div className="skeleton h-56 rounded-xl" /> : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill:"#9ca3af", fontSize:11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill:"#9ca3af", fontSize:11 }} />
                  <Tooltip contentStyle={{ borderRadius:"16px", border:"none", boxShadow:"0 20px 50px rgba(0,0,0,0.05)" }} />
                  <Legend />
                  <Line type="monotone" dataKey="users"  stroke="#16a34a" strokeWidth={2.5} dot={false} name="New Users" />
                  <Line type="monotone" dataKey="orders" stroke="#ca8a04" strokeWidth={2.5} dot={false} name="Orders" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Revenue Chart */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="section-title text-lg">Monthly Revenue</h3>
            <span className="badge badge-success">₹</span>
          </div>
          {loading ? <div className="skeleton h-56 rounded-xl" /> : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill:"#9ca3af", fontSize:11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill:"#9ca3af", fontSize:11 }} tickFormatter={v => `₹${v}`} />
                  <Tooltip contentStyle={{ borderRadius:"16px", border:"none", boxShadow:"0 20px 50px rgba(0,0,0,0.05)" }}
                    formatter={v => [`₹${v.toLocaleString()}`, "Revenue"]} />
                  <Bar dataKey="revenue" radius={[8,8,0,0]} barSize={36}>
                    {chartData.map((_,i) => <Cell key={i} fill={i % 2 === 0 ? "#16a34a" : "#22c55e"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Platform stats summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:"Farmers",         value:stats?.totalFarmers ?? "–",   icon:"👨‍🌾", color:"bg-primary-50 border-primary-100" },
          { label:"Buyers",          value:stats?.totalBuyers ?? "–",    icon:"👩‍💼", color:"bg-earth-50 border-earth-100" },
          { label:"Pending Orders",  value:stats?.pendingOrders ?? "–",  icon:"⏳",   color:"bg-yellow-50 border-yellow-100" },
          { label:"Confirmed Orders",value:stats?.confirmedOrders ?? "–",icon:"✅",   color:"bg-green-50 border-green-100" },
        ].map((s,i) => (
          loading ? <div key={i} className="skeleton h-20 rounded-2xl" /> :
          <div key={i} className={`flex items-center gap-4 p-4 rounded-2xl border ${s.color}`}>
            <span className="text-2xl">{s.icon}</span>
            <div>
              <p className="font-bold text-gray-800 text-lg">{s.value}</p>
              <p className="text-gray-500 text-xs">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Tables Row */}
      <RecentUsersTable users={recentUsers} onVerify={onVerify} onDelete={onDelete} loading={loading} />
      <RecentOrdersTable orders={recentOrders} loading={loading} />
    </div>
  );
}

// ── Main AdminDashboard Component ─────────────────────────────
export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const currentPath = location.pathname;

  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);

  // Add admin modal state
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [adminForm, setAdminForm] = useState({ name: "", email: "", password: "" });
  const [creatingAdmin, setCreatingAdmin] = useState(false);

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    if (!adminForm.name || !adminForm.email || !adminForm.password) {
      return toast.error("All fields are required");
    }
    setCreatingAdmin(true);
    try {
      const { data } = await axios.post(`${API}/api/admin/create-admin`, adminForm, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (data.success) {
        toast.success("✅ Admin user created successfully!");
        setShowAddAdminModal(false);
        setAdminForm({ name: "", email: "", password: "" });
        fetchUsersData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create admin");
    } finally {
      setCreatingAdmin(false);
    }
  };
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Paginated/Filterable lists
  const [usersList, setUsersList] = useState([]);
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotalPages, setUsersTotalPages] = useState(1);
  const [usersSearch, setUsersSearch] = useState("");
  const [usersRole, setUsersRole] = useState("all");

  const [ordersList, setOrdersList] = useState([]);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersTotalPages, setOrdersTotalPages] = useState(1);
  const [ordersStatus, setOrdersStatus] = useState("all");

  const [productsList, setProductsList] = useState([]);
  const [productsPage, setProductsPage] = useState(1);
  const [productsTotalPages, setProductsTotalPages] = useState(1);
  const [productsCategory, setProductsCategory] = useState("all");
  const [productsStatus, setProductsStatus] = useState("all");

  const getToken = () => localStorage.getItem("token") || sessionStorage.getItem("token");

  // Fetch Dashboard stats
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setStats(data.stats);
      setChartData(data.chartData);
      setRecentUsers(data.recentUsers);
      setRecentOrders(data.recentOrders);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  // Fetch Users
  const fetchUsersData = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/api/admin/users`, {
        params: { page: usersPage, limit: 10, search: usersSearch, role: usersRole },
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (data.success) {
        setUsersList(data.users);
        setUsersTotalPages(data.pagination.pages);
      }
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  // Fetch Orders
  const fetchOrdersData = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/api/admin/orders`, {
        params: { page: ordersPage, limit: 10, status: ordersStatus },
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (data.success) {
        setOrdersList(data.orders);
        setOrdersTotalPages(data.pagination.pages);
      }
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  // Fetch Products
  const fetchProductsData = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/api/admin/products`, {
        params: { page: productsPage, limit: 10, category: productsCategory, status: productsStatus },
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (data.success) {
        setProductsList(data.products);
        setProductsTotalPages(data.pagination.pages);
      }
    } catch {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  // Unified trigger on path or filter/page changes
  useEffect(() => {
    if (currentPath === "/admin/dashboard") {
      fetchDashboardData();
    } else if (currentPath === "/admin/users") {
      fetchUsersData();
    } else if (currentPath === "/admin/orders") {
      fetchOrdersData();
    } else if (currentPath === "/admin/products") {
      fetchProductsData();
    }
  }, [
    currentPath,
    usersPage, usersSearch, usersRole,
    ordersPage, ordersStatus,
    productsPage, productsCategory, productsStatus
  ]);

  // Handlers
  const handleVerifyUser = async (userId) => {
    try {
      await axios.put(`${API}/api/admin/users/${userId}/verify`, {}, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      toast.success("User verified!");
      setRecentUsers(prev => prev.map(u => u._id === userId ? { ...u, isVerified: true } : u));
      setUsersList(prev => prev.map(u => u._id === userId ? { ...u, isVerified: true } : u));
    } catch {
      toast.error("Failed to verify user");
    }
  };

  const handleDeleteUser = async (userId, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) return;
    try {
      await axios.delete(`${API}/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      toast.success("User deleted.");
      setRecentUsers(prev => prev.filter(u => u._id !== userId));
      setUsersList(prev => prev.filter(u => u._id !== userId));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete user");
    }
  };

  const handleDeleteProduct = async (productId, title) => {
    if (!window.confirm(`Are you sure you want to delete product "${title}"? This action cannot be undone.`)) return;
    try {
      await axios.delete(`${API}/api/admin/products/${productId}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      toast.success("Product deleted.");
      setProductsList(prev => prev.filter(p => p._id !== productId));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete product");
    }
  };

  const getPageTitle = () => {
    if (currentPath === "/admin/users") return "Manage Users";
    if (currentPath === "/admin/orders") return "Manage Orders";
    if (currentPath === "/admin/products") return "Manage Products";
    return "Admin Dashboard";
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <AdminSidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader setOpen={setSidebarOpen} title={getPageTitle()} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto pb-10">
            {currentPath === "/admin/dashboard" && (
              <DashboardView
                stats={stats}
                chartData={chartData}
                recentUsers={recentUsers}
                recentOrders={recentOrders}
                loading={loading}
                onVerify={handleVerifyUser}
                onDelete={handleDeleteUser}
                onRefresh={fetchDashboardData}
              />
            )}

            {currentPath === "/admin/users" && (
              <UsersTable
                users={usersList}
                loading={loading}
                onVerify={handleVerifyUser}
                onDelete={handleDeleteUser}
                search={usersSearch}
                setSearch={setUsersSearch}
                role={usersRole}
                setRole={setUsersRole}
                page={usersPage}
                totalPages={usersTotalPages}
                setPage={setUsersPage}
                onAddAdminClick={() => setShowAddAdminModal(true)}
              />
            )}

            {currentPath === "/admin/orders" && (
              <OrdersTable
                orders={ordersList}
                loading={loading}
                status={ordersStatus}
                setStatus={setOrdersStatus}
                page={ordersPage}
                totalPages={ordersTotalPages}
                setPage={setOrdersPage}
              />
            )}

            {currentPath === "/admin/products" && (
              <ProductsTable
                products={productsList}
                loading={loading}
                onDeleteProduct={handleDeleteProduct}
                category={productsCategory}
                setCategory={setProductsCategory}
                status={productsStatus}
                setStatus={setProductsStatus}
                page={productsPage}
                totalPages={productsTotalPages}
                setPage={setProductsPage}
              />
            )}
          </div>
        </main>
      </div>

      {/* ── ADD ADMIN MODAL ── */}
      {showAddAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm"
          onClick={() => setShowAddAdminModal(false)}>
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-display font-bold text-gray-800 text-lg flex items-center gap-2">
                <Shield className="w-5 h-5 text-red-600" /> Add New Admin
              </h3>
              <button onClick={() => setShowAddAdminModal(false)}
                className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition">
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Full Name</label>
                <input type="text" required value={adminForm.name}
                  onChange={e => setAdminForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. John Doe" className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-red-400 focus:bg-white transition" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Email Address</label>
                <input type="email" required value={adminForm.email}
                  onChange={e => setAdminForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="e.g. admin.new@agri.com" className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-red-400 focus:bg-white transition" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Password</label>
                <input type="password" required value={adminForm.password}
                  onChange={e => setAdminForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="••••••••" className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-red-400 focus:bg-white transition" />
              </div>
              <div className="pt-2">
                <button type="submit" disabled={creatingAdmin}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition shadow-md disabled:opacity-60">
                  {creatingAdmin ? "Creating..." : "Save Admin Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .animate-fade-in {
          animation: adminFadeIn 0.2s ease-out both;
        }
        @keyframes adminFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
