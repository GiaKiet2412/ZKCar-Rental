import express from 'express';
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import EmailVerification from "../models/EmailVerification.js";

const router = express.Router();

// Gửi mã OTP
router.post("/send-otp", async (req, res) => {
  const { email } = req.body;
  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await EmailVerification.deleteOne({ email });
    await EmailVerification.create({ email, otp, expiresAt });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Mã xác nhận đăng ký tài khoản",
      text: `Mã xác nhận của bạn là: ${otp}. Mã này sẽ hết hạn sau 5 phút.`,
    });

    res.json({ message: "Đã gửi mã xác nhận đến email của bạn" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi khi gửi mã OTP" });
  }
});

// Xác minh OTP
router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;
  try {
    const record = await EmailVerification.findOne({ email, otp });
    if (!record) return res.status(400).json({ message: "Mã OTP không đúng" });

    if (record.expiresAt < new Date())
      return res.status(400).json({ message: "Mã OTP đã hết hạn" });

    res.json({ message: "Xác minh thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi xác minh OTP" });
  }
});

// ✅ ĐĂNG KÝ - LƯU PHONE
router.post("/register", async (req, res) => {
  const { name, email, phone, password } = req.body; // ✅ THÊM PHONE
  
  try {
    const verified = await EmailVerification.findOne({ email });
    if (!verified)
      return res.status(400).json({ message: "Email chưa được xác minh" });

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email đã tồn tại" });

    // ✅ TẠO USER VỚI PHONE
    const newUser = await User.create({
      name,
      email,
      phone: phone || null, // ✅ LƯU PHONE
      password, // Password sẽ tự hash qua pre-save hook
      role: "user",
    });

    await EmailVerification.deleteOne({ email });

    const token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Đăng ký thành công",
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone, // ✅ TRẢ VỀ PHONE
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Lỗi đăng ký tài khoản" });
  }
});

// ✅ ĐĂNG NHẬP - TRẢ VỀ PHONE
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Tài khoản không tồn tại" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Sai mật khẩu" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Đăng nhập thành công",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone, // ✅ TRẢ VỀ PHONE
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Lỗi đăng nhập" });
  }
});

export default router;