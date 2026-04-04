const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUsers,
} = require("../controllers/userController");
const { protect, admin } = require("../middleware/authMiddleware"); // use this when u need to restrict list based on roles
const {
  getUserById,
  updateUser,
  softDeleteUser,
} = require("../controllers/userActionController");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/", getUsers);
router
  .route("/:id")
  .get(protect, getUserById)
  .put(protect, updateUser)
  .delete(protect, admin, softDeleteUser);

module.exports = router;
