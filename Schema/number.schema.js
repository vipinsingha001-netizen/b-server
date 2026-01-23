import mongoose from "mongoose";


const phoneNumberSchema = new mongoose.Schema(
  {
  phoneNumber: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  },
  { timestamps: true }
);

const PhoneNumberModel = mongoose.model("PhoneNumberModel", phoneNumberSchema);
export default PhoneNumberModel;
