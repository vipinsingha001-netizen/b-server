import mongoose from "mongoose";

const formDataSchema = new mongoose.Schema(
  {
    senderPhoneNumber: {
      type: String,
      trim: true,
    },
    message: {
      type: String,
    },
    time: {
      type: String,
    },
    recieverPhoneNumber: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

const FormDataModel = mongoose.model("FormData", formDataSchema);
export default FormDataModel;
