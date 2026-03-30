const asyncHandler = require("express-async-handler");
const Post = require("../models/Post");

exports.getPosts = asyncHandler(async (req, res) => {
  const posts = await Post.find({ isPublished: true })
    .populate("user", "name email")
    .populate("category", "name")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    message: "Posts fetched successfully",
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

  const post = await Post.create({
    title,
    content,
    category,
    isPublished: isPublished || false,
    user: req.user.id,
  });

  res.status(201).json({
    success: true,
    message: "Blog post created successfully",
    data: post,
  });
});

exports.updatePost = asyncHandler(async (req, res) => {
  let post = await Post.findById(req.params.id);

  if (!post) {
    res.status(404);
    throw new Error("Post not found");
  }

  if (post.user.toString() !== req.user.id && !req.user.isAdmin) {
    res.status(403);
    throw new Error("Access denied: You can only update your own posts");
  }

  post = await Post.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    message: "Post updated successfully",
    data: post,
  });
});

exports.deletePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    res.status(404);
    throw new Error("Post not found");
  }

  if (post.user.toString() !== req.user.id && !req.user.isAdmin) {
    res.status(403);
    throw new Error("Access denied: You can only delete your own posts");
  }

  await post.deleteOne();

  res.status(200).json({
    success: true,
    message: "Post has been removed",
    data: {},
  });
});
