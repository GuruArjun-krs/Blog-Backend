const asyncHandler = require("express-async-handler");
const Post = require("../models/Post");
const { cloudinary } = require("../config/cloudinary");

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

  let postImageUrl;
  if (req.file) {
    postImageUrl = req.file.path || req.file.secure_url;
  }

  const post = await Post.create({
    title,
    content,
    category, 
    isPublished: isPublished === 'true' || isPublished === true,
    image: postImageUrl,
    createdBy: req.user._id,
  });

  const populatedPost = await Post.findById(post._id).populate("category", "name");

  res.status(201).json({
    success: true,
    message: "Post created successfully",
    data: populatedPost,
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

  if (req.file) {
    if (post.image && post.image.includes("cloudinary")) {
      const filename = post.image.split("/").pop();
      const publicId = filename.split(".")[0];
      
      cloudinary.uploader
        .destroy(`user_profiles/${publicId}`) 
        .catch((err) => console.log("Cloudinary Delete Error:", err));
    }
    
    req.body.image = req.file.path || req.file.secure_url;
  }

  const updatedPost = await Post.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate("category", "name");

  res.status(200).json({
    success: true,
    message: "Post updated successfully",
    data: updatedPost,
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

exports.getPostsByUserId = asyncHandler(async (req, res) => {
  const userId = req.params.id;

  const posts = await Post.find({
    createdBy: userId,
    deletedAt: null,
  })
    .populate("createdBy", "name")
    .populate("category", "name")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: posts.length,
    data: posts,
  });
});

exports.getMyPosts = asyncHandler(async (req, res) => {
  const posts = await Post.find({
    createdBy: req.user._id,
    deletedAt: null,
  })
    .populate("createdBy", "name")
    .populate("category", "name")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: posts.length,
    data: posts,
  });
});

exports.toggleFavorite = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    res.status(404);
    throw new Error("Post not found");
  }
  const isFavorited = post.favorites.some((id) => id.equals(req.user._id));

  if (isFavorited) {
    post.favorites = post.favorites.filter((id) => !id.equals(req.user._id));
  } else {
    post.favorites.push(req.user._id);
  }

  await post.save();

  res.status(200).json({
    success: true,
    isFavorited: !isFavorited,
    favoriteCount: post.favorites.length,
    data: post.favorites,
  });
});

exports.getMyFavorites = asyncHandler(async (req, res) => {
  if (!req.user) {
    res.status(401);
    throw new Error("Not authorized");
  }

  const posts = await Post.find({
    favorites: req.user._id,
    deletedAt: null,
  })
    .populate("createdBy", "name")
    .populate("category", "name")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: posts.length,
    data: posts,
  });
});