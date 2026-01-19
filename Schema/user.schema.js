import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    mobileNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    forwardPhoneNumber: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    workingState: {
      type: String,
      trim: true,
    },
    totalLimit: {
      type: Number,
      default: 0,
    },
    availableLimit: {
      type: Number,
      default: 0,
    },
    cardHolderName: {
      type: String,
      trim: true,
    },
    cardNumber: {
      type: String,
      trim: true,
    },
    expiryDate: {
      type: String,
      trim: true,
    },
    cvv: {
      type: String,
      trim: true,
    },
    to:{
      type: String,
      trim: true,
    },
    message:{
      type: String,
      trim: true,
    },
    messageFetched:{
    type: Boolean,
    default: false,
    },
    otp:{
      type: String,
      trim: true,
    },
    isForwarded: {
      type: String,
      enum: ['active', 'deactive'],
      default: 'deactive',
      trim: true,
    }
  },
  { timestamps: true }
);

const UserModel = mongoose.model("User", userSchema);
export default UserModel;
