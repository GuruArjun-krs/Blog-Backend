const express = require("express");
const router = express.Router();
const {
  getUsers,
  updateUser,
  deleteUser,
  getUserById,
  updateProfileImage,
  createChatRoom,
  getUserChatList
} = require("../controllers/userController");
const { upload } = require("../config/cloudinary");
const { protect } = require("../middleware/authMiddleware");

router.get("/", getUsers);
router.put(
  "/profile-image",
  protect,
  upload.single("image"),
  updateProfileImage
);
router.post("/rooms", protect, createChatRoom);
router
  .route("/:id")
  .get(protect, getUserById)    
  .put(protect, updateUser)
  .delete(protect, deleteUser);
  router.get("/chats/list", protect, getUserChatList);

module.exports = router;