const asyncHandler = require("express-async-handler");
const User = require("../models/User");

exports.getUserById = asyncHandler(async (req, res) => {
  const user = await User.findOne({
    _id: req.params.id,
    isDeleted: false,
  }).select("-password");

  if (!user) {
    res.status(404);
    throw new Error("User not found or has been deactivated");
  }

  res.status(200).json({ success: true, data: user });
});

exports.updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user || user.isDeleted) {
    res.status(404);
    throw new Error("User not found");
  }

  const fieldsToUpdate = [
    "name",
    "nickname",
    "gender",
    "dob",
    "bio",
    "profileImg",
  ];

  fieldsToUpdate.forEach((field) => {
    if (req.body[field] !== undefined) user[field] = req.body[field];
  });

  if (req.body.password) user.password = req.body.password;

  const updatedUser = await user.save();
  res.status(200).json({ success: true, data: updatedUser });
});

exports.softDeleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  user.isDeleted = true;
  user.deletedAt = Date.now();
  user.deletedBy = req.user._id;

  await user.save();

  res.status(200).json({
    success: true,
    message: "User account deactivated (soft deleted)",
  });
});
