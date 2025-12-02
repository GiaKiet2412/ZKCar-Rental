import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  phone: { type: String, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  
  // Tracking cho discount
  usedDiscountCodes: [{
    code: { type: String },
    usedAt: { type: Date, default: Date.now }
  }],
  
  totalBookings: { type: Number, default: 0 },
  completedBookings: { type: Number, default: 0 },
  
  isEmailVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Hash password trước khi lưu
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// So sánh mật khẩu khi login
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method kiểm tra đã dùng mã giảm giá chưa
userSchema.methods.hasUsedDiscount = function(code) {
  return this.usedDiscountCodes.some(d => d.code === code.toUpperCase());
};

// Method thêm mã đã dùng
userSchema.methods.addUsedDiscount = function(code) {
  if (!this.hasUsedDiscount(code)) {
    this.usedDiscountCodes.push({
      code: code.toUpperCase(),
      usedAt: new Date()
    });
  }
};

const User = mongoose.model('User', userSchema);
export default User;