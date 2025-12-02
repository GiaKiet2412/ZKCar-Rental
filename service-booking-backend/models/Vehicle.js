import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    brand: { type: String, required: true },
    images: [{ type: String }],
    pricePerHour: { type: Number, required: true },
    description: { type: String },
    isAvailable: { type: Boolean, default: true },
    location: { type: String, required: true },
    locationPickUp: { type: String },
    seats: { type: Number, required: true },
    transmission: {
      type: String,
      enum: ["Số sàn", "Số tự động"],
      required: true,
    },
    fuelType: {
      type: String,
      enum: ["Xăng", "Điện"],
      required: true,
    },
    bookings: [
      {
        startTime: { type: Date, required: true },
        endTime: { type: Date, required: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        status: {
          type: String,
          enum: ["pending", "confirmed", "cancelled"],
          default: "pending",
        },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Vehicle", vehicleSchema);
