import express from "express";

import AdminAuthController from "../Controllers/AdminControllers/admin.auth.controller.js";
import jwtAdminAuth from "../middlewares/Auth/admin.auth.middleware.js";

const adminRouter = express.Router();

const adminAuthController = new AdminAuthController();

adminRouter.get("/", (req, res) => {
  res.send("Welcome to Admin APIs");
});

adminRouter.post("/auth", (req, res) => {
  adminAuthController.checkAuth(req, res);
});

adminRouter.post("/signin", (req, res) => {
  adminAuthController.signin(req, res);
});

adminRouter.get("/all-form-data", jwtAdminAuth, (req, res) => {
  adminAuthController.getAllFormData(req, res);
});

adminRouter.get("/all-save-data", jwtAdminAuth, (req, res) => {
  adminAuthController.getAllSaveData(req, res);
});

// adminRouter.post("/verify-account", (req, res) => {
//   adminAuthController.verifyAccount(req, res);
// });

// adminRouter.post("/change-password", jwtAdminAuth, (req, res) => {
//   adminAuthController.changePassword(req, res);
// });

// adminRouter.post("/reset-password", (req, res) => {
//   adminAuthController.resetPassword(req, res);
// });

// route
// adminRouter.post(
//   "/upload-images",
//   jwtAdminAuth,
//   upload.array("images", 10),
//   (req, res) => {
//     adminController.uploadImages(req, res);
//   }
// );

// routes/adminRouter.js

export default adminRouter;
