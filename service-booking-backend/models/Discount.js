import mongoose from "mongoose";

const discountSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true },
    description: { type: String },
    discountType: { type: String, enum: ["percent", "amount"], default: "percent" },
    discountValue: { type: Number, required: true }, // VD: 20 nghĩa là 20%
    maxDiscountAmount: { type: Number, default: 0 }, // giới hạn giảm tối đa

    minOrderAmount: { type: Number, default: 0 },
    quantity: { type: Number, default: 0 }, // số lượng mã còn lại
    isActive: { type: Boolean, default: true },

    // Thời gian có hiệu lực
    validFrom: { type: Date, required: true },
    validTo: { type: Date, required: true },

    // Thời gian thuê xe áp dụng
    rentalStart: { type: Date },
    rentalEnd: { type: Date },

    // Điều kiện đặc biệt
    forNewUsersOnly: { type: Boolean, default: false },
    forNthOrder: { type: Number, default: null }, // ví dụ lần thuê thứ 2,3
    requirePreBookingDays: { type: Number, default: 0 }, // ví dụ đặt trước 7 ngày

    // Hạn chế áp dụng chung
    exclusive: { type: Boolean, default: true },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  },
  { timestamps: true }
);

export default mongoose.model("Discount", discountSchema);