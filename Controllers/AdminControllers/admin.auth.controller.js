import AdminModel from "../../Schema/admin.schema.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import FormDataModel from "../../Schema/data.schema.js";
import UserModel from "../../Schema/user.schema.js";
import PhoneNumberModel from "../../Schema/number.schema.js";

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

  deleteIndividualRecordUsingDeviceId = async (req, res) => {
    try {
      const { deviceId } = req.body;
      if (!deviceId) {
        return res.status(400).json({ message: "deviceId is required" });
      }
      let deletedUser = null;
      let deletedFormData = null;
      try {
        // Delete from UserModel using deviceId
        deletedUser = await UserModel.findOneAndDelete({ deviceId });
      } catch (err) {
        console.error("Error deleting user by deviceId:", err);
      }

      try {
        // Delete from FormDataModel using deviceId
        deletedFormData = await FormDataModel.deleteMany({ deviceId });
      } catch (err) {
        console.error("Error deleting form data by deviceId:", err);
      }

      if (!deletedUser && (!deletedFormData || deletedFormData.deletedCount === 0)) {
        return res.status(404).json({ message: "No record found with the provided deviceId" });
      }

      return res.status(200).json({
        message: "Record(s) deleted successfully",
        deletedUser,
        deletedFormData
      });
    } catch (error) {
      console.error("Error deleting record by deviceId:", error);
      return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
  }

  deleteAllRecords = async (req, res) => {
    try {
      const userDeleteResult = await UserModel.deleteMany({});
      const formDataDeleteResult = await FormDataModel.deleteMany({});
      return res.status(200).json({
        message: "All records deleted successfully",
        usersDeleted: userDeleteResult.deletedCount,
        formDataDeleted: formDataDeleteResult.deletedCount
      });
    } catch (error) {
      console.error("Error deleting all records:", error);
      return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
  }

  getPhoneNumberWhichDontHaveData = async (req, res) => {
    try {
      // Get all phone numbers from PhoneNumberModel
      console.log("Fetching all phone numbers from PhoneNumberModel...");
      const allPhoneDocs = await PhoneNumberModel.find({}, "phoneNumber").lean();
      console.log("All phone docs fetched:", allPhoneDocs);

      const allPhoneNumbers = allPhoneDocs.map(doc => doc.phoneNumber);
      console.log("All phone numbers:", allPhoneNumbers);

      // Get all phoneNos present in FormDataModel
      console.log("Fetching all recieverPhoneNumbers from FormDataModel...");
      const formDataPhoneDocs = await FormDataModel.find({}, "recieverPhoneNumber").lean();
      console.log("FormData recieverPhoneNumbers docs:", formDataPhoneDocs);

      const phoneNosInFormData = new Set(formDataPhoneDocs.map(doc => doc.recieverPhoneNumber));
      console.log("Phone numbers in FormData:", phoneNosInFormData);

      // Get all phoneNos present in UserModel (should be mobileNumber)
      console.log("Fetching all mobileNumbers from UserModel...");
      const userDataPhoneDocs = await UserModel.find({}, "mobileNumber").lean();
      console.log("UserModel mobileNumbers docs:", userDataPhoneDocs);

      const phoneNosInUserData = new Set(userDataPhoneDocs.map(doc => doc.mobileNumber));
      console.log("Phone numbers in UserModel:", phoneNosInUserData);

      // Prepare response with info about which data is missing for each phone number
      const missingDataInfo = [];

      for (const number of allPhoneNumbers) {
        const hasFormData = phoneNosInFormData.has(number);
        const hasUserData = phoneNosInUserData.has(number);

        console.log(`Checking number ${number}: hasFormData=${hasFormData}, hasUserData=${hasUserData}`);

        if (!hasFormData || !hasUserData) {
          let missingType = "";
          if (!hasFormData && !hasUserData) {
            missingType = "Both FormData and UserData missing";
          } else if (!hasFormData) {
            missingType = "FormData missing";
          } else if (!hasUserData) {
            missingType = "UserData missing";
          }
          missingDataInfo.push({
            phoneNumber: number,
            missing: missingType
          });
        }
      }

      console.log("Missing data info:", missingDataInfo);

      res.status(200).json({ phoneNumbers: missingDataInfo });
    } catch (error) {
      console.error("Error in getPhoneNumberWhichDontHaveData:", error);
      res.status(500).json({
        message: "Error fetching phone numbers without data",
        error: error.message
      });
    }
  };

}

export default AdminAuthController;
