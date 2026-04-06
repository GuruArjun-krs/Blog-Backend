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
} = require("../controllers/postController");
const { protect } = require("../middleware/authMiddleware");

router.get("/", getPosts);
router.post("/", protect, createPost);
router.get("/me", protect, getMyPosts);
router.get("/user/:id", getPostsByUserId);
router.get("/:id", getPostById);
router.put("/:id", protect, updatePost);
router.delete("/:id", protect, deletePost);

module.exports = router;
