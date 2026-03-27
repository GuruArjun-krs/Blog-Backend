const asyncHandler = require("express-async-handler");
const Post = require("../models/Post");

// @desc    Get all posts (Public)
exports.getPosts = asyncHandler(async (req, res) => {
  const posts = await Post.find({ isPublished: true }).populate(
    "user",
    "name email",
  );
  res.status(200).json({ success: true, data: posts });
});

// @desc    Create new post (Protected)
exports.createPost = asyncHandler(async (req, res) => {
  const { title, content, category } = req.body;

  const post = await Post.create({
    title,
    content,
    category,
    user: req.user.id, // Taken from the JWT token
  });

  res.status(201).json({ success: true, message: "Post created", data: post });
});

// @desc    Update post (Owner or Admin)
exports.updatePost = asyncHandler(async (req, res) => {
  let post = await Post.findById(req.params.id);

  if (!post) {
    res.status(404);
    throw new Error("Post not found");
  }

  // Check if user owns post OR is admin
  if (post.user.toString() !== req.user.id && !req.user.isAdmin) {
    res.status(401);
    throw new Error("Not authorized to update this post");
  }

  post = await Post.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.status(200).json({ success: true, data: post });
});

// @desc    Delete post (Owner or Admin)
exports.deletePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post || (post.user.toString() !== req.user.id && !req.user.isAdmin)) {
    res.status(401);
    throw new Error("Not authorized to delete");
  }

  await post.deleteOne();
  res.status(200).json({ success: true, message: "Post removed" });
});
