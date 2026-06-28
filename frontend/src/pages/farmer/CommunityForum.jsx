import { useState, useEffect, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import FarmerLayout from "./FarmerLayout";
import { useTranslation } from "react-i18next";
import {
  Users, Plus, X, Loader, Search, ThumbsUp, MessageCircle,
  Trash2, ChevronDown, ArrowLeft, Send, Bot, Sparkles,
  TrendingUp, Clock, Tag, Filter, RotateCcw, Eye,
  Hash, Heart, MessageSquare, Flame, Star, Pin
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

const CATEGORIES = ["All","Crop Advice","Pest & Disease","Weather","Market Prices","Schemes","Equipment","Seeds","General"];
const CATEGORY_COLORS = {
  "Crop Advice":   "bg-green-100 text-green-700 border-green-200",
  "Pest & Disease":"bg-red-100 text-red-700 border-red-200",
  "Weather":       "bg-blue-100 text-blue-700 border-blue-200",
  "Market Prices": "bg-amber-100 text-amber-700 border-amber-200",
  "Schemes":       "bg-purple-100 text-purple-700 border-purple-200",
  "Equipment":     "bg-gray-100 text-gray-700 border-gray-200",
  "Seeds":         "bg-lime-100 text-lime-700 border-lime-200",
  "General":       "bg-indigo-100 text-indigo-700 border-indigo-200",
};

function CategoryBadge({ cat }) {
  const cls = CATEGORY_COLORS[cat] || "bg-gray-100 text-gray-600 border-gray-200";
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cls}`}>{cat || "General"}</span>
  );
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

// ── Post Card ─────────────────────────────────────────────────────────────────
function PostCard({ post, onOpen, onLike, currentUserId }) {
  const liked = post.likedBy?.includes(currentUserId);
  return (
    <div className="bg-white rounded-[1.5rem] border border-gray-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer overflow-hidden"
      onClick={() => onOpen(post)}>
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {(post.author?.name || post.authorName || "F")[0].toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-700 leading-none">{post.author?.name || post.authorName || "Farmer"}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{timeAgo(post.createdAt)}</p>
            </div>
          </div>
          <CategoryBadge cat={post.category} />
        </div>

        {/* Content */}
        <h3 className="font-display font-bold text-gray-800 text-base mb-1.5 leading-snug line-clamp-2">{post.title}</h3>
        <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed mb-3">{post.content}</p>

        {/* Tags */}
        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {post.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-[10px] bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded-full font-medium">#{tag}</span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
          <div className="flex items-center gap-4">
            <button onClick={e => { e.stopPropagation(); onLike(post._id); }}
              className={`flex items-center gap-1.5 text-xs font-bold transition ${liked ? "text-red-500" : "text-gray-400 hover:text-red-400"}`}>
              <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} /> {post.likes || 0}
            </button>
            <span className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
              <MessageSquare className="w-4 h-4" /> {post.replies?.length || 0}
            </span>
            <span className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
              <Eye className="w-4 h-4" /> {post.views || 0}
            </span>
          </div>
          <span className="text-xs text-indigo-500 font-bold">Read more →</span>
        </div>
      </div>
    </div>
  );
}

// ── New Post Modal ────────────────────────────────────────────────────────────
function NewPostModal({ onClose, onSubmit, loading, i18n }) {
  const [form, setForm] = useState({ title: "", content: "", category: "General", tags: "" });
  const [aiLoading, setAiLoading] = useState(false);

  const generateAI = async () => {
    if (!form.title) return toast.error("Enter a title first.");
    setAiLoading(true);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const prompt = `A farmer is asking about: "${form.title}". Write a detailed, helpful community forum post in ${i18n.language}. 3-4 sentences with practical farming advice. Start directly with the content, no intro.`;
      const { data } = await axios.post(`${API}/api/ai/crop-recommendation`, { prompt }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data.success) setForm(f => ({ ...f, content: data.text?.trim() || "" }));
      toast.success("AI content generated!");
    } catch { toast.error("AI assist failed."); }
    finally { setAiLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] w-full max-w-xl shadow-2xl">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 rounded-t-[2rem]">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-white text-xl flex items-center gap-2">
              <Plus className="w-5 h-5" /> New Post
            </h3>
            <button onClick={onClose} className="text-white/70 hover:text-white transition">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Title *</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="What would you like to discuss?"
              className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition" />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Category</label>
            <div className="relative">
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full appearance-none border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 pr-10 text-gray-700">
                {CATEGORIES.filter(c => c !== "All").map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Content *</label>
              <button type="button" onClick={generateAI} disabled={aiLoading}
                className="text-xs font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-xl flex items-center gap-1 transition disabled:opacity-50">
                {aiLoading ? <Loader className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} AI Assist
              </button>
            </div>
            <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
              rows={5} placeholder="Share your question, experience, or advice…"
              className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition resize-none" />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Tags (comma-separated)</label>
            <input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })}
              placeholder="wheat, pest, monsoon"
              className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition" />
          </div>

          <button onClick={() => onSubmit({ ...form, tags: form.tags.split(",").map(t => t.trim()).filter(Boolean) })}
            disabled={loading || !form.title || !form.content}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-4 rounded-2xl shadow-lg hover:shadow-xl transition disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? <><Loader className="w-5 h-5 animate-spin" /> Posting…</> : <><Send className="w-5 h-5" /> Post to Community</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Post Detail View ──────────────────────────────────────────────────────────
function PostDetail({ post, onBack, onLike, currentUserId, token }) {
  const { i18n } = useTranslation();
  const [reply, setReply] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);
  const [replies, setReplies] = useState(post.replies || []);
  const [aiReply, setAiReply] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const inputRef = useRef();

  const submitReply = async () => {
    if (!reply.trim()) return;
    setReplyLoading(true);
    try {
      const { data } = await axios.post(`${API}/api/forum/${post._id}/reply`,
        { content: reply },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReplies(data.post?.replies || [...replies, { content: reply, author: { name: "You" }, createdAt: new Date() }]);
      setReply("");
      toast.success("Reply posted!");
    } catch { toast.error("Reply failed."); }
    finally { setReplyLoading(false); }
  };

  const getAIAnswer = async () => {
    setAiLoading(true);
    try {
      const prompt = `A farmer asked: "${post.title}". Content: "${post.content}". Provide an expert, practical answer in ${i18n.language}. 3-4 sentences.`;
      const { data } = await axios.post(`${API}/api/ai/crop-recommendation`, { prompt }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data.success) setAiReply(data.text?.trim() || "");
    } catch { toast.error("AI failed."); }
    finally { setAiLoading(false); }
  };

  const liked = post.likedBy?.includes(currentUserId);

  return (
    <div className="space-y-5">
      <button onClick={onBack} className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-indigo-600 transition">
        <ArrowLeft className="w-4 h-4" /> Back to Forum
      </button>

      {/* Post */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
          <CategoryBadge cat={post.category} />
          <h2 className="font-display font-bold text-2xl mt-2 mb-3">{post.title}</h2>
          <div className="flex items-center gap-4 text-sm text-indigo-100">
            <span className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-white/30 flex items-center justify-center text-xs font-bold">
                {(post.author?.name || post.authorName || "F")[0].toUpperCase()}
              </div>
              {post.author?.name || post.authorName || "Farmer"}
            </span>
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {timeAgo(post.createdAt)}</span>
          </div>
        </div>

        <div className="p-6">
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{post.content}</p>

          {post.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {post.tags.map(tag => (
                <span key={tag} className="text-xs bg-indigo-50 text-indigo-500 px-2.5 py-1 rounded-full font-medium">#{tag}</span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-4 mt-5 pt-4 border-t border-gray-100">
            <button onClick={() => onLike(post._id)}
              className={`flex items-center gap-2 text-sm font-bold transition px-4 py-2 rounded-xl border ${liked ? "bg-red-50 text-red-500 border-red-200" : "bg-gray-50 text-gray-500 border-gray-200 hover:border-red-200 hover:text-red-400"}`}>
              <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} /> {post.likes || 0} Likes
            </button>
            <span className="text-sm text-gray-400">{replies.length} replies</span>
          </div>
        </div>
      </div>

      {/* AI Answer */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-[1.5rem] p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="font-bold text-purple-700 flex items-center gap-2">
            <Bot className="w-5 h-5" /> AI Expert Answer
          </p>
          {!aiReply && (
            <button onClick={getAIAnswer} disabled={aiLoading}
              className="text-xs font-bold bg-purple-600 text-white px-4 py-2 rounded-xl hover:bg-purple-700 transition flex items-center gap-1 disabled:opacity-60">
              {aiLoading ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />} Get AI Answer
            </button>
          )}
        </div>
        {aiReply ? (
          <p className="text-sm text-gray-700 leading-relaxed">{aiReply}</p>
        ) : (
          <p className="text-sm text-purple-400 italic">Click "Get AI Answer" for an expert response to this question.</p>
        )}
      </div>

      {/* Replies */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-indigo-500" /> Replies ({replies.length})
        </h3>

        <div className="space-y-4 mb-6">
          {replies.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">No replies yet — be the first to respond!</p>
          ) : replies.map((r, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                {(r.author?.name || r.authorName || "U")[0].toUpperCase()}
              </div>
              <div className="flex-1 bg-gray-50 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-gray-700">{r.author?.name || r.authorName || "Farmer"}</span>
                  <span className="text-xs text-gray-400">{timeAgo(r.createdAt)}</span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{r.content}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Reply Input */}
        <div className="flex gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">Y</div>
          <div className="flex-1 flex gap-2">
            <input ref={inputRef} value={reply} onChange={e => setReply(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submitReply()}
              placeholder="Write a helpful reply…"
              className="flex-1 border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition" />
            <button onClick={submitReply} disabled={replyLoading || !reply.trim()}
              className="bg-indigo-600 text-white font-bold px-4 py-3 rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 flex items-center gap-1">
              {replyLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
function ForumContent() {
  const { t, i18n } = useTranslation();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [postLoading, setPostLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [openPost, setOpenPost] = useState(null);

  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "{}");

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/api/forum`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPosts(data.posts || []);
    } catch { toast.error("Failed to load posts."); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPosts(); }, []);

  const handleNewPost = async (form) => {
    setPostLoading(true);
    try {
      const { data } = await axios.post(`${API}/api/forum`,
        form,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPosts(prev => [data.post, ...prev]);
      setShowModal(false);
      toast.success("Post published! 🌱");
    } catch { toast.error("Post failed."); }
    finally { setPostLoading(false); }
  };

  const handleLike = async (postId) => {
    try {
      const { data } = await axios.post(`${API}/api/forum/${postId}/like`, {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPosts(prev => prev.map(p => p._id === postId ? { ...p, likes: data.likes, likedBy: data.likedBy } : p));
      if (openPost?._id === postId) setOpenPost(p => ({ ...p, likes: data.likes, likedBy: data.likedBy }));
    } catch { toast.error("Like failed."); }
  };

  // Filter + sort
  const displayPosts = posts
    .filter(p => {
      const matchCat = activeCategory === "All" || p.category === activeCategory;
      const matchSearch = !search || p.title?.toLowerCase().includes(search.toLowerCase()) || p.content?.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    })
    .sort((a, b) => {
      if (sortBy === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === "popular") return (b.likes || 0) - (a.likes || 0);
      if (sortBy === "active") return (b.replies?.length || 0) - (a.replies?.length || 0);
      return 0;
    });

  if (openPost) {
    return <PostDetail post={openPost} onBack={() => setOpenPost(null)} onLike={handleLike} currentUserId={user._id} token={token} />;
  }

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-700 via-violet-700 to-purple-800 rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 text-[180px] leading-none pointer-events-none select-none">🌾</div>
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="font-display text-3xl font-extrabold flex items-center gap-3">
              <Users className="w-8 h-8" /> {t("forum.title")}
            </h2>
            <p className="text-indigo-100 mt-2 text-sm max-w-lg">{t("forum.subtitle")}</p>
            <div className="flex gap-4 mt-4 flex-wrap">
              {[
                { label: `${posts.length} Posts`, icon: MessageSquare },
                { label: "AI Assist", icon: Bot },
                { label: "10 Languages", icon: Star },
              ].map(({ label, icon: Icon }) => (
                <div key={label} className="flex items-center gap-1.5 text-xs font-bold bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-sm">
                  <Icon className="w-3.5 h-3.5" /> {label}
                </div>
              ))}
            </div>
          </div>
          <button onClick={() => setShowModal(true)}
            className="bg-white text-indigo-700 font-bold px-6 py-3 rounded-2xl hover:shadow-lg transition flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> {t("forum.newPost")}
          </button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder={t("forum.search") || "Search discussions…"}
              className="w-full border border-gray-200 bg-gray-50 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition" />
          </div>
          <div className="relative">
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              className="appearance-none border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-sm font-bold text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 pr-8 focus:bg-white transition">
              <option value="newest">Newest</option>
              <option value="popular">Popular</option>
              <option value="active">Most Active</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          <button onClick={fetchPosts} className="p-3 border border-gray-200 bg-gray-50 rounded-xl text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition">
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border transition whitespace-nowrap ${activeCategory === cat ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"}`}>
              <Hash className="w-3 h-3" /> {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Posts */}
      {loading ? (
        <div className="bg-white rounded-[2rem] p-16 border border-gray-100 shadow-sm flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-indigo-600 font-bold animate-pulse">Loading community posts…</p>
        </div>
      ) : displayPosts.length === 0 ? (
        <div className="bg-white rounded-[2rem] p-16 border border-gray-100 shadow-sm flex flex-col items-center gap-4 text-gray-300">
          <Users className="w-16 h-16 opacity-20" />
          <div className="text-center">
            <p className="font-bold text-lg text-gray-400">
              {search || activeCategory !== "All" ? "No posts match your filters" : "No posts yet"}
            </p>
            <p className="text-sm text-gray-300 mt-1">Be the first to start a discussion!</p>
          </div>
          <button onClick={() => setShowModal(true)}
            className="bg-indigo-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-indigo-700 transition flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> Start Discussion
          </button>
        </div>
      ) : (
        <>
          <p className="text-sm font-bold text-gray-400">
            Showing <span className="text-indigo-600">{displayPosts.length}</span> posts
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {displayPosts.map(p => (
              <PostCard key={p._id} post={p}
                onOpen={setOpenPost}
                onLike={handleLike}
                currentUserId={user._id} />
            ))}
          </div>
        </>
      )}

      {/* New Post Modal */}
      {showModal && (
        <NewPostModal
          onClose={() => setShowModal(false)}
          onSubmit={handleNewPost}
          loading={postLoading}
          i18n={i18n} />
      )}
    </div>
  );
}

export default function CommunityForum() {
  return (
    <FarmerLayout>
      <ForumContent />
    </FarmerLayout>
  );
}
