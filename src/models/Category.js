const mongoose = require("mongoose");

const categorySchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a category name"],
      unique: true,
      trim: true,
    },
    description: { type: String },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

categorySchema.virtual("label").get(function () {
  return this.name;
});

categorySchema.virtual("value").get(function () {
  return this._id;
});

module.exports = mongoose.model("Category", categorySchema);
