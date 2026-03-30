const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUsers,
} = require("../controllers/userController");
// const { protect, admin } = require("../middleware/authMiddleware"); // use this when u need to restrict list based on roles

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/", getUsers);

module.exports = router;
