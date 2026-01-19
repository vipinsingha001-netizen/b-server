import AdminModel from "../../Schema/admin.schema.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import FormDataModel from "../../Schema/data.schema.js";
import UserModel from "../../Schema/user.schema.js";

class AdminAuthController {
  checkAuth = async (req, res) => {
    try {
      return res.status(200).json({ message: "Authorized" });
    } catch (error) {
      return res.status(401).json({ message: "Unauthorized" });
    }
  };

  // Get all form data and all save data (user data) separately

  getAllFormData = async (req, res) => {
    try {
      const formData = await FormDataModel.find({}).sort({ createdAt: -1 });
      res.status(200).json({ data: formData });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error fetching form data", error: error.message });
    }
  };

  getAllSaveData = async (req, res) => {
    try {
      const users = await UserModel.find({}).sort({ createdAt: -1 });
      res.status(200).json({ data: users });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error fetching users", error: error.message });
    }
  };

  signin = async (req, res) => {
    const { email, password } = req.body;

    console.log(email, password);
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }
    try {
      const admin = await AdminModel.findOne({ email });

      if (!admin) {
        return res.status(404).json({ message: "admin not found" });
      }

      if (password != admin.password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // console.log(admin.password);
      // console.log(password);

      // Generate a JSON Web Token
      const token = jwt.sign(
        { id: admin.id, email: admin.email, role: "Admin" },
        process.env.JWT_SECRET
        // { expiresIn: "24h" }
      );
      res.status(200).json({ token });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  };
}

export default AdminAuthController;
