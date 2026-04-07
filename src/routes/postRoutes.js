const express = require("express");
const router = express.Router();
const {
  getPosts,
  createPost,
  updatePost,
  deletePost,
  getPostById,
  getPostsByUserId,
  getMyPosts,
  getMyFavorites,
  toggleFavorite,
} = require("../controllers/postController");
const { protect } = require("../middleware/authMiddleware");

router.get("/", getPosts);
router.post("/", protect, createPost);
router.get("/me", protect, getMyPosts);
router.get("/user/:id", getPostsByUserId);
router.get("/:id", getPostById);
router.put("/:id", protect, updatePost);
router.delete("/:id", protect, deletePost);

router.get("/favorites/me", protect, getMyFavorites); // Get list of favorited posts
router.put("/:id/favorite", protect, toggleFavorite); // Toggle favorite status

module.exports = router;
