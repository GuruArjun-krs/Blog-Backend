const cloudinary = require("cloudinary");
const multer = require("multer");
const multerCloudinary = require("multer-storage-cloudinary");

const CloudinaryStorage =
  multerCloudinary.CloudinaryStorage ||
  multerCloudinary.default?.CloudinaryStorage ||
  multerCloudinary;

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "user_profiles",
    allowed_formats: ["jpg", "jpeg", "png"],
    transformation: [{ width: 500, height: 500, crop: "fill" }],
  },
});

const upload = multer({ storage });

module.exports = { cloudinary: cloudinary.v2, upload };
