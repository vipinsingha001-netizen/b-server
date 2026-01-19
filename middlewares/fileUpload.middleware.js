// multerConfig.js
import multer from "multer";

const storage = multer.memoryStorage(); // use memory for Sharp

export const upload = multer({
  storage,
  limits: { files: 10 }, // Limit max images to 10
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only images are allowed"));
  },
});

// import multer from "multer";
// import fs from "fs";
// import path from "path";

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     let uploadPath = "./uploads"; // default fallback

//     if (file.fieldname === "images") {
//       uploadPath = "./uploads/images";
//     } else if (file.fieldname === "videos") {
//       uploadPath = "./uploads/videos";
//     }

//     fs.mkdirSync(uploadPath, { recursive: true });
//     cb(null, uploadPath);
//   },

//   filename: (req, file, cb) => {
//     const uniqueName = `${Date.now()}-${Math.round(
//       Math.random() * 1e9
//     )}${path.extname(file.originalname)}`;
//     cb(null, uniqueName);
//   },
// });

// const fileFilter = (req, file, cb) => {
//   if (file.fieldname === "images" && file.mimetype.startsWith("image/")) {
//     cb(null, true);
//   } else if (
//     file.fieldname === "videos" &&
//     file.mimetype.startsWith("video/")
//   ) {
//     cb(null, true);
//   } else {
//     cb(new Error("Only valid images or videos are allowed"));
//   }
// };

// export const upload = multer({
//   storage,
//   // limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max
//   fileFilter,
// });
