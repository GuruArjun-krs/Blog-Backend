const asyncHandler = require("express-async-handler");
const Post = require("../models/Post");

exports.getPosts = asyncHandler(async (req, res) => {
  const posts = await Post.find()
    .populate("createdBy", "name")
    .populate("category", "name")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: posts.length,
    data: posts,
  });
});

exports.createPost = asyncHandler(async (req, res) => {
  const { title, content, category, isPublished } = req.body;

  if (!title || !content || !category) {
    res.status(400);
    throw new Error("Please provide title, content, and category");
  }

  if (!req.user) {
    res.status(401);
    throw new Error("User not found, please login again");
  }

  const post = await Post.create({
    title,
    content,
    category,
    isPublished: isPublished,
    createdBy: req.user._id,
  });

  res.status(201).json({
    success: true,
    data: post,
  });
});

exports.updatePost = asyncHandler(async (req, res) => {
  if (!req.user) {
    res.status(401);
    throw new Error("Not authorized, user missing");
  }

  let post = await Post.findOne({ _id: req.params.id, deletedAt: null });

  if (!post) {
    res.status(404);
    throw new Error("Post not found");
  }

  if (post.createdBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Access denied: Only the creator can edit this post");
  }

  post = await Post.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: post,
  });
});

exports.deletePost = asyncHandler(async (req, res) => {
  if (!req.user) {
    res.status(401);
    throw new Error("Not authorized, user missing");
  }

  const post = await Post.findOne({ _id: req.params.id, deletedAt: null });

  if (!post) {
    res.status(404);
    throw new Error("Post not found");
  }

  const isOwner = post.createdBy.toString() === req.user._id.toString();
  const isAdmin = req.user.isAdmin === true;

  if (!isOwner && !isAdmin) {
    res.status(403);
    throw new Error("Access denied: Insufficient permissions to delete");
  }

  post.deletedAt = Date.now();
  await post.save();

  res.status(200).json({
    success: true,
    message: "Post has been moved to trash",
    data: {},
  });
});

exports.getPostById = asyncHandler(async (req, res) => {
  const post = await Post.findOne({ _id: req.params.id, deletedAt: null })
    .populate("createdBy", "name")
    .populate("category", "name");

  if (!post) {
    res.status(404);
    throw new Error("Post not found");
  }

  res.status(200).json({
    success: true,
    data: post,
  });
});
