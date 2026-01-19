// multerConfig.js
import multer from "multer";

const storage = multer.memoryStorage(); // use memory for Sharp

export const uploadVideo = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("video/")) cb(null, true);
    else cb(new Error("Only videos are allowed"));
  },
});
