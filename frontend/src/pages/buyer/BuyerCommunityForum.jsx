import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import BuyerLayout from "./BuyerLayout";
import { useBuyerLang, bt } from "./BuyerLayout";
import {
  Users, Plus, X, Loader, Search,
  ThumbsUp, MessageCircle, Trash2,
  ChevronDown, ArrowLeft, Send, Bot, Heart
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

// ── Translations ──────────────────────────────────────────────
const bft = {
  en: {
    title:        "Community Forum",
    subtitle:     "Connect with buyers, share tips, and get help",
    newPost:      "New Discussion",
    search:       "Search discussions...",
    allCats:      "All Topics",
    noPost:       "No discussions yet. Start the conversation!",
    postTitle:    "Topic Title *",
    postContent:  "Your Question or Thought *",
    category:     "Topic Category *",
    postBtn:      "Post Discussion",
    cancel:       "Cancel",
    reply:        "Reply",
    replies:      "Replies",
    replyPlaceholder: "Write your reply...",
    aiReply:      "Get AI Suggestion",
    aiLoading:    "AI is thinking...",
    likes:        "Likes",
    delete:       "Delete",
    back:         "Back to Forum",
    posted:       "Posted by",
    on:           "on",
    noReplies:    "No replies yet. Be the first to help!",
    categories: {
      all:        "All Topics",
      quality:    "🎯 Product Quality",
      delivery:   "🚚 Delivery & Logistics",
      pricing:    "💰 Pricing & Deals",
      farming:    "🌱 Farming Tips",
      buyers:     "👥 Buyers Support",
      recipes:    "👨‍🍳 Recipes & Usage",
      general:    "💬 General Discussion",
    },
  },
  hi: {
    title:        "समुदाय मंच",
    subtitle:     "खरीदारों से जुड़ें, सुझाव साझा करें और मदद पाएं",
    newPost:      "नई चर्चा",
    search:       "चर्चा खोजें...",
    allCats:      "सभी विषय",
    noPost:       "कोई चर्चा नहीं। बातचीत शुरू करें!",
    postTitle:    "विषय शीर्षक *",
    postContent:  "आपका प्रश्न या विचार *",
    category:     "विषय श्रेणी *",
    postBtn:      "चर्चा पोस्ट करें",
    cancel:       "रद्द करें",
    reply:        "उत्तर दें",
    replies:      "उत्तर",
    replyPlaceholder: "अपना उत्तर लिखें...",
    aiReply:      "AI सुझाव पाएं",
    aiLoading:    "AI सोच रहा है...",
    likes:        "लाइक",
    delete:       "हटाएं",
    back:         "फोरम पर वापस",
    posted:       "पोस्ट किया",
    on:           "को",
    noReplies:    "कोई उत्तर नहीं। पहले मदद करें!",
    categories: {
      all:        "सभी विषय",
      quality:    "🎯 उत्पाद गुणवत्ता",
      delivery:   "🚚 डिलीवरी और लॉजिस्टिक्स",
      pricing:    "💰 मूल्य निर्धारण और डील",
      farming:    "🌱 खेती की सलाह",
      buyers:     "👥 खरीदार सहायता",
      recipes:    "👨‍🍳 व्यंजन और उपयोग",
      general:    "💬 सामान्य चर्चा",
    },
  },
  mr: {
    title:        "समुदाय मंच",
    subtitle:     "खरेदीदारांशी जुळा, सुझाव शेअर करा आणि मदत मिळवा",
    newPost:      "नवीन चर्चा",
    search:       "चर्चा शोधा...",
    allCats:      "सर्व विषय",
    noPost:       "कोणतीही चर्चा नाही. संभाषण सुरू करा!",
    postTitle:    "विषय शीर्षक *",
    postContent:  "तुमचा प्रश्न किंवा विचार *",
    category:     "विषय श्रेणी *",
    postBtn:      "चर्चा पोस्ट करा",
    cancel:       "रद्द करा",
    reply:        "उत्तर द्या",
    replies:      "उत्तरे",
    replyPlaceholder: "तुमचे उत्तर लिहा...",
    aiReply:      "AI सुझाव मिळवा",
    aiLoading:    "AI विचार करत आहे...",
    likes:        "लाइक",
    delete:       "हटवा",
    back:         "मंचावर परत",
    posted:       "पोस्ट केले",
    on:           "रोजी",
    noReplies:    "कोणतेही उत्तर नाही. प्रथम मदत करा!",
    categories: {
      all:        "सर्व विषय",
      quality:    "🎯 उत्पाद गुणवत्ता",
      delivery:   "🚚 वितरण आणि लॉजिस्टिक्स",
      pricing:    "💰 किमती आणि सौदे",
      farming:    "🌱 शेतीची सलाह",
      buyers:     "👥 खरेदी सहाय्य",
      recipes:    "👨‍🍳 व्यंजने आणि वापर",
      general:    "💬 सामान्य चर्चा",
    },
  },
};

const CAT_KEYS = ["quality", "delivery", "pricing", "farming", "buyers", "recipes", "general"];

// ── Category color map ────────────────────────────────────────
const catColors = {
  quality:    "bg-blue-100 text-blue-700",
  delivery:   "bg-orange-100 text-orange-700",
  pricing:    "bg-green-100 text-green-700",
  farming:    "bg-yellow-100 text-yellow-700",
  buyers:     "bg-purple-100 text-purple-700",
  recipes:    "bg-pink-100 text-pink-700",
  general:    "bg-indigo-100 text-indigo-700",
};

// ── New Post Modal ────────────────────────────────────────────
function NewPostModal({ labels, onClose, onSave }) {
  const [form, setForm] = useState({ title: "", content: "", category: "general" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.content || !form.category) {
      toast.error("Please fill all fields");
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      await axios.post(`${API}/api/forum`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Discussion posted! 🎉");
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="font-display font-bold text-gray-800 text-lg">
            {labels.newPost}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">{labels.postTitle}</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Best way to store fresh vegetables?"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">{labels.postContent}</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Share your question, experience, or knowledge..."
              rows={4}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">{labels.category}</label>
            <div className="relative">
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full appearance-none border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400 pr-10"
              >
                {CAT_KEYS.map((k) => (
                  <option key={k} value={k}>{labels.categories[k]}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-50 transition-all text-sm"
            >
              {labels.cancel}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 text-white font-bold py-3 rounded-xl transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ backgroundColor: "#a16207" }}
            >
              {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {loading ? "Posting..." : labels.postBtn}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Post Card ─────────────────────────────────────────────────
function PostCard({ post, labels, onOpen, onLike, onDelete, currentUserId }) {
  const isAuthor = post.farmer?.id === currentUserId;
  const replyCount = post.replies?.length || 0;
  const likes = post.likes || 0;

  return (
    <div
      onClick={() => onOpen(post)}
      className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-display font-bold text-gray-800 text-base mb-1">{post.title}</h3>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${catColors[post.category] || catColors.general}`}>
              {labels.categories[post.category]}
            </span>
            <span className="text-xs text-gray-500">
              {labels.posted} {post.farmer?.name || "Anonymous"}
            </span>
          </div>
        </div>
        {isAuthor && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(post._id); }}
            className="text-gray-400 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <p className="text-sm text-gray-600 line-clamp-2 mb-4">{post.content}</p>

      <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-3">
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => { e.stopPropagation(); onLike(post._id); }}
            className="flex items-center gap-1 hover:text-red-500 transition-colors"
          >
            <Heart className="w-3 h-3" />
            <span>{likes}</span>
          </button>
          <div className="flex items-center gap-1">
            <MessageCircle className="w-3 h-3" />
            <span>{replyCount}</span>
          </div>
        </div>
        <span>{new Date(post.createdAt || Date.now()).toLocaleDateString()}</span>
      </div>
    </div>
  );
}

// ── Post Detail ───────────────────────────────────────────────
function PostDetail({ post, labels, lang, onBack, onRefresh }) {
  const [replies, setReplies] = useState(post.replies || []);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(false);
  const user = JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "{}");

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) { toast.error("Reply cannot be empty"); return; }
    setLoading(true);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      await axios.post(`${API}/api/forum/${post._id}/reply`, { content: replyText }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Reply posted! 🎉");
      setReplyText("");
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to post reply");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 font-bold mb-6 transition-colors text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        {labels.back}
      </button>

      {/* Post Detail */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="font-display font-bold text-gray-800 text-2xl mb-2">{post.title}</h2>
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`text-sm font-bold px-3 py-1.5 rounded-lg ${catColors[post.category] || catColors.general}`}>
                {labels.categories[post.category]}
              </span>
              <span className="text-sm text-gray-600">
                {labels.posted} <strong>{post.farmer?.name || "Anonymous"}</strong>
              </span>
              <span className="text-sm text-gray-400">
                {labels.on} {new Date(post.createdAt || Date.now()).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <p className="text-gray-700 leading-relaxed mb-6">{post.content}</p>

        <div className="flex items-center gap-6 text-sm text-gray-600 border-t pt-4">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4" />
            <span>{post.likes || 0} {labels.likes}</span>
          </div>
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            <span>{replies.length} {labels.replies}</span>
          </div>
        </div>
      </div>

      {/* Replies */}
      <div className="space-y-4 mb-6">
        <h3 className="font-display font-bold text-gray-800">{labels.replies} ({replies.length})</h3>

        {replies.length === 0 ? (
          <div className="bg-gray-50 rounded-2xl p-6 text-center">
            <p className="text-gray-500 text-sm">{labels.noReplies}</p>
          </div>
        ) : (
          replies.map((reply, idx) => (
            <div key={idx} className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <strong className="text-sm text-gray-800">{reply.farmer?.name || "Anonymous"}</strong>
                <span className="text-xs text-gray-400">{new Date(reply.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="text-sm text-gray-700">{reply.content}</p>
            </div>
          ))
        )}
      </div>

      {/* Reply Form */}
      <form onSubmit={handleReply} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <label className="block text-xs font-bold text-gray-600 mb-3">{labels.reply}</label>
        <div className="flex gap-2">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder={labels.replyPlaceholder}
            rows={3}
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl text-white font-bold text-sm flex items-center gap-2 transition-all disabled:opacity-60"
            style={{ backgroundColor: "#a16207" }}
          >
            {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Forum Content ─────────────────────────────────────────────
function ForumContent() {
  const lang = useBuyerLang();
  const labels = bft[lang];
  const user = JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "{}");

  const [posts,      setPosts]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showModal,  setShowModal]  = useState(false);
  const [activePost, setActivePost] = useState(null);
  const [search,     setSearch]     = useState("");
  const [selCat,     setSelCat]     = useState("all");

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const token  = localStorage.getItem("token") || sessionStorage.getItem("token");
      const params = [];
      if (selCat !== "all") params.push(`category=${selCat}`);
      if (search)           params.push(`search=${search}`);
      const query  = params.length ? `?${params.join("&")}` : "";
      const { data } = await axios.get(`${API}/api/forum${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPosts(data.posts || []);
    } catch {
      toast.error("Failed to load posts");
    } finally {
      setLoading(false);
    }
  };

  const fetchSinglePost = async (postId) => {
    try {
      const token   = localStorage.getItem("token") || sessionStorage.getItem("token");
      const { data } = await axios.get(`${API}/api/forum`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const updated = data.posts?.find((p) => p._id === postId);
      if (updated) setActivePost(updated);
    } catch {
      toast.error("Failed to refresh post");
    }
  };

  useEffect(() => { fetchPosts(); }, [selCat]);

  const handleSearch = (e) => {
    if (e.key === "Enter") fetchPosts();
  };

  const handleLike = async (postId) => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      await axios.put(`${API}/api/forum/${postId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchPosts();
    } catch {
      toast.error("Failed to like post");
    }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm("Delete this post?")) return;
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      await axios.delete(`${API}/api/forum/${postId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Post deleted");
      fetchPosts();
    } catch {
      toast.error("Failed to delete post");
    }
  };

  // If viewing a specific post
  if (activePost) {
    return (
      <PostDetail
        post={activePost}
        labels={labels}
        lang={lang}
        onBack={() => { setActivePost(null); fetchPosts(); }}
        onRefresh={() => fetchSinglePost(activePost._id)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div
        className="rounded-2xl p-6 text-white"
        style={{ background: "linear-gradient(to right, #a16207, #854d0e)" }}
      >
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl">👥</div>
            <div>
              <h2 className="font-display text-xl font-bold">{labels.title}</h2>
              <p className="text-yellow-100 text-sm mt-0.5">{labels.subtitle}</p>
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-white text-yellow-600 font-bold px-5 py-2.5 rounded-xl hover:bg-gray-50 transition-all text-sm shadow-sm"
          >
            <Plus className="w-4 h-4" />
            {labels.newPost}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { emoji: "📝", label: lang === "en" ? "Discussions"   : lang === "hi" ? "चर्चाएं"    : "चर्चा",    value: posts.length },
          { emoji: "💬", label: lang === "en" ? "Total Replies" : lang === "hi" ? "कुल उत्तर"    : "एकूण उत्तरे",   value: posts.reduce((s, p) => s + (p.replies?.length || 0), 0) },
          { emoji: "❤️", label: lang === "en" ? "Total Likes"   : lang === "hi" ? "कुल लाइक्स"   : "एकूण लाइक्स",  value: posts.reduce((s, p) => s + (p.likes || 0), 0) },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
            <div className="text-3xl mb-1">{s.emoji}</div>
            <p className="font-display font-bold text-2xl text-gray-800">{s.value}</p>
            <p className="text-gray-500 text-xs mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search + Category Filter */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearch}
            placeholder={labels.search}
            className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
        </div>

        {/* Category pills */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelCat("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selCat === "all"
                ? "text-white"
                : "bg-gray-100 text-gray-600 hover:bg-yellow-50"
            }`}
            style={selCat === "all" ? { backgroundColor: "#a16207" } : {}}
          >
            {labels.allCats}
          </button>
          {CAT_KEYS.map((k) => (
            <button
              key={k}
              onClick={() => setSelCat(k)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selCat === k
                  ? "text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-yellow-50"
              }`}
              style={selCat === k ? { backgroundColor: "#a16207" } : {}}
            >
              {labels.categories[k]}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center h-48">
          <div className="w-12 h-12 border-4 border-yellow-200 border-t-yellow-600 rounded-full animate-spin" />
        </div>
      )}

      {/* No posts */}
      {!loading && posts.length === 0 && (
        <div className="flex flex-col items-center justify-center h-48 text-center bg-white rounded-2xl border border-gray-100">
          <div className="text-5xl mb-3">💬</div>
          <p className="text-gray-500 text-sm mb-4">{labels.noPost}</p>
          <button
            onClick={() => setShowModal(true)}
            className="font-bold px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 hover:opacity-80 transition-all text-white"
            style={{ backgroundColor: "#a16207" }}
          >
            <Plus className="w-4 h-4" />
            {labels.newPost}
          </button>
        </div>
      )}

      {/* Posts Grid */}
      {!loading && posts.length > 0 && (
        <div className="grid md:grid-cols-2 gap-4">
          {posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              labels={labels}
              onOpen={setActivePost}
              onLike={handleLike}
              onDelete={handleDelete}
              currentUserId={user.id}
            />
          ))}
        </div>
      )}

      {/* New Post Modal */}
      {showModal && (
        <NewPostModal
          labels={labels}
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); fetchPosts(); }}
        />
      )}
    </div>
  );
}

export default function BuyerCommunityForum() {
  return (
    <BuyerLayout>
      <ForumContent />
    </BuyerLayout>
  );
}