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
const { upload } = require("../config/cloudinary");

router.get("/", getPosts);
router.post("/", protect, upload.single("image"), createPost);
router.get("/me", protect, getMyPosts);
router.get("/user/:id", protect,getPostsByUserId);
router.get("/:id",protect, getPostById);
router.put("/:id", protect, upload.single("image"), updatePost);
router.delete("/:id", protect, deletePost);

router.get("/favorites/me", protect, getMyFavorites);
router.put("/:id/favorite", protect, toggleFavorite);

module.exports = router;
