const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUsers,
  updateUser,
  deleteUser,
  getUserById,
  updateProfileImage,
  createChatRoom
} = require("../controllers/userController");
const { upload } = require("../config/cloudinary");
const { protect } = require("../middleware/authMiddleware");

router.post("/register", registerUser);
router.post("/login", loginUser);

router.get("/", getUsers);
router.put(
  "/profile-image",
  protect,
  upload.single("image"),
  updateProfileImage,
);
router.route("/:id").get(getUserById).put(updateUser).delete(deleteUser);
router.post("/rooms", protect, createChatRoom)

module.exports = router;
