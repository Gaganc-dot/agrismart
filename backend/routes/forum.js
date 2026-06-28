const express = require("express");
const router  = express.Router();
const Post    = require("../models/Post");
const protect = require("../middleware/auth");

// GET /api/forum — get all posts
router.get("/", protect, async (req, res) => {
  try {
    const { category, search } = req.query;
    const query = {};
    if (category && category !== "all") query.category = category;
    if (search) query.title = { $regex: search, $options: "i" };

    const posts = await Post.find(query)
      .populate("author", "name farmName location role")
      .populate("replies.author", "name role")
      .sort({ createdAt: -1 });

    res.json({ success: true, posts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/forum — create new post
router.post("/", protect, async (req, res) => {
  try {
    const post = await Post.create({
      ...req.body,
      author: req.user.id,
    });
    const populated = await Post.findById(post._id)
      .populate("author", "name farmName location role");
    res.status(201).json({ success: true, post: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/forum/:id/reply — add reply to post
router.post("/:id/reply", protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post)
      return res.status(404).json({ success: false, message: "Post not found" });

    post.replies.push({
      author:  req.user.id,
      content: req.body.content,
      isAI:    req.body.isAI || false,
    });
    await post.save();

    const populated = await Post.findById(post._id)
      .populate("author", "name farmName role")
      .populate("replies.author", "name role");

    res.json({ success: true, post: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/forum/:id/like — like a post
router.put("/:id/like", protect, async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $inc: { likes: 1 } },
      { new: true }
    );
    res.json({ success: true, likes: post.likes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/forum/:id — delete post (own only)
router.delete("/:id", protect, async (req, res) => {
  try {
    const post = await Post.findOneAndDelete({
      _id:    req.params.id,
      author: req.user.id,
    });
    if (!post)
      return res.status(404).json({ success: false, message: "Post not found" });
    res.json({ success: true, message: "Post deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;