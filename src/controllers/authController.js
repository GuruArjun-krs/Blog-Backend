const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { admin } = require("../config/firebase");

const generateToken = (id, isAdmin) => {
    return jwt.sign({ id, isAdmin }, process.env.JWT_SECRET, {
      expiresIn: "30m",
    });
  };

  const generateRefreshToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
      expiresIn: "7d",
    });
  };
  
  exports.registerUser = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
  
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400);
      throw new Error("User already exists");
    }
  
    const user = await User.create({ name, email, password });
  
    if (user) {
      try {
        await admin.auth().createUser({
          uid: user._id.toString(),
          email: email,
          password: password,
          displayName: name,
        });
  
        const accessToken = generateToken(user._id, user.isAdmin);
        const refreshToken = generateRefreshToken(user._id);
  
        user.refreshToken = refreshToken;
        await user.save();
  
        res.status(201).json({
          success: true,
          data: {
            _id: user._id,
            name: user.name,
            email: user.email,
            token: accessToken,
            refreshToken: refreshToken,
          },
        });
      } catch (firebaseError) {
        await User.findByIdAndDelete(user._id);
        res.status(500);
        throw new Error(`Firebase registration failed: ${firebaseError.message}`);
      }
    }
  });
  
  exports.loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
  
    if (!user || !(await user.matchPassword(password))) {
      res.status(401);
      throw new Error("Invalid email or password");
    }
  
    const accessToken = generateToken(user._id, user.isAdmin);
    const refreshToken = generateRefreshToken(user._id);
    const firebaseToken = await admin.auth().createCustomToken(user._id.toString());
  
    user.refreshToken = refreshToken;
    await user.save();
  
    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        token: accessToken,
        refreshToken: refreshToken,
        firebaseToken: firebaseToken,
      },
    });
  });
  
  exports.refreshAccessToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
  
    if (!refreshToken) {
      res.status(401);
      throw new Error("Refresh Token is required");
    }
  
    const user = await User.findOne({ refreshToken });
  
    if (!user) {
      res.status(403);
      throw new Error("Invalid Refresh Token");
    }
  
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const newAccessToken = generateToken(user._id, user.isAdmin);
  
      res.json({
        success: true,
        accessToken: newAccessToken,
      });
    } catch (err) {
      res.status(403);
      throw new Error("Token expired or invalid");
    }
  });

  exports.logoutUser = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
        await User.findOneAndUpdate({ refreshToken }, { refreshToken: null });
    res.status(200).json({ success: true, message: "Logged out successfully" });
  });