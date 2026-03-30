const asyncHandler = require("express-async-handler");
const Category = require("../models/Category");

exports.getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({}).sort({ name: 1 });

  const formattedData = categories.map((cat) => ({
    label: cat.name,
    value: cat._id,
    description: cat.description || "",
  }));

  res.status(200).json({
    success: true,
    message: "Categories fetched successfully",
    count: formattedData.length,
    data: formattedData,
  });
});

exports.createCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  const categoryExists = await Category.findOne({ name });
  if (categoryExists) {
    res.status(400);
    throw new Error("Category already exists");
  }

  const category = await Category.create({ name, description });

  res.status(201).json({
    success: true,
    message: "Category added successfully",
    data: category,
  });
});

exports.updateCategory = asyncHandler(async (req, res) => {
  let category = await Category.findById(req.params.id);

  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }

  category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    message: "Category updated successfully",
    data: category,
  });
});

exports.deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }

  // if any Blogs are currently using this category before deleting
  const Post = require("../models/Post");
  const isUsed = await Post.findOne({ category: req.params.id });
  if (isUsed) {
    res.status(400);
    throw new Error(
      "Cannot delete category; it is currently linked to blog posts",
    );
  }

  await category.deleteOne();

  res.status(200).json({
    success: true,
    message: "Category deleted successfully",
    data: {},
  });
});
