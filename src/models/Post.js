const mongoose = require("mongoose");

const postSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    title: { type: String, required: [true, "Please add a title"] },
    content: { type: String, required: [true, "Please add content"] },
    image: { type: String, default: "default-blog.jpg" },
    category: { type: String, required: [true, "Please add a category"] },
    isPublished: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Post", postSchema);
