import express from 'express';
import sgMail from '@sendgrid/mail';
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import EmailVerification from "../models/EmailVerification.js";
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  console.log(' SendGrid API initialized for auth routes');
} else {
  console.warn(' SendGrid API key not found for auth routes');
}

// Gửi mã OTP
router.post("/send-otp", async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ message: "Email là bắt buộc" });
  }

  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await EmailVerification.deleteOne({ email });
    await EmailVerification.create({ email, otp, expiresAt });

    // Kiểm tra SendGrid có được config không
    if (!process.env.SENDGRID_API_KEY || !process.env.EMAIL_FROM) {
      console.error('SendGrid not configured');
      return res.status(500).json({ 
        message: "Dịch vụ email chưa được cấu hình. Vui lòng liên hệ quản trị viên." 
      });
    }

    const msg = {
      to: email,
      from: {
        email: process.env.EMAIL_FROM,
        name: 'KIETCAR - Thuê Xe Tự Lái'
      },
      subject: "Mã xác nhận đăng ký tài khoản - KIETCAR",
      text: `Xin chào,

      Cảm ơn bạn đã đăng ký tài khoản tại KIETCAR. 

      MÃ XÁC NHẬN CỦA BẠN: ${otp}

      Mã này sẽ hết hạn sau 5 phút.

      Lưu ý: Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này. Đừng chia sẻ mã OTP với bất kỳ ai để đảm bảo an toàn tài khoản.

      ---
      KIETCAR - Thuê Xe Điện Tự Lái
      Website: ${process.env.CLIENT_URL}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #16a34a; margin: 0;">KIETCAR</h1>
            <p style="color: #666; margin-top: 5px;">Dịch vụ cho thuê xe điện tự lái</p>
          </div>
          
          <h2 style="color: #333;">Xác nhận đăng ký tài khoản</h2>
          
          <p style="color: #555; line-height: 1.6;">
            Chào bạn,<br><br>
            Cảm ơn bạn đã đăng ký tài khoản tại <strong>KIETCAR</strong>. 
            Vui lòng sử dụng mã OTP dưới đây để hoàn tất quá trình đăng ký:
          </p>
          
          <div style="background-color: #f0fdf4; border: 2px dashed #16a34a; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
            <p style="color: #666; margin: 0 0 10px 0; font-size: 14px;">Mã xác nhận của bạn:</p>
            <h1 style="color: #16a34a; margin: 0; font-size: 36px; letter-spacing: 5px;">${otp}</h1>
          </div>
          
          <p style="color: #ef4444; font-weight: bold; text-align: center;">
             Mã này sẽ hết hạn sau 5 phút
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <p style="color: #888; font-size: 12px; line-height: 1.5;">
              <strong>Lưu ý:</strong> Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.
              Đừng chia sẻ mã OTP với bất kỳ ai để đảm bảo an toàn tài khoản.
            </p>
            
            <p style="color: #888; font-size: 12px; margin-top: 20px;">
              Trân trọng,<br>
              <strong style="color: #16a34a;">Đội ngũ KIETCAR</strong><br><br>
              <em>Để nhận email quan trọng: Vui lòng thêm ${process.env.EMAIL_FROM} vào danh bạ hoặc đánh dấu "Không phải spam".</em>
            </p>
          </div>
        </div>
      `
    };

    await sgMail.send(msg);
    console.log(` OTP sent to ${email}`);

    res.json({ message: "Đã gửi mã xác nhận đến email của bạn" });
  } catch (error) {
    console.error('Error sending OTP:', error);
    if (error.response) {
      console.error('SendGrid error:', error.response.body);
    }
    res.status(500).json({ 
      message: "Lỗi khi gửi mã OTP. Vui lòng kiểm tra lại email hoặc thử lại sau." 
    });
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

// ĐĂNG KÝ
router.post("/register", async (req, res) => {
  const { name, email, phone, password } = req.body;
  
  try {
    const verified = await EmailVerification.findOne({ email });
    if (!verified)
      return res.status(400).json({ message: "Email chưa được xác minh" });

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email đã tồn tại" });

    const newUser = await User.create({
      name,
      email,
      phone: phone || null,
      password,
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
        phone: newUser.phone,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Lỗi đăng ký tài khoản" });
  }
});

// ĐĂNG NHẬP
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
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Lỗi đăng nhập" });
  }
});

router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }

    const Booking = (await import('../models/Booking.js')).default;
    const bookings = await Booking.find({ user: user._id })
      .populate('vehicle', 'location');
    
    const completedBookings = bookings.filter(b => b.status === 'completed');
    const totalSpent = completedBookings.reduce((sum, booking) => {
      return sum + (booking.finalAmount || 0);
    }, 0);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      address: user.address || '',
      drivingLicense: user.drivingLicense || '',
      role: user.role,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      totalRentals: completedBookings.length,
      totalSpent: totalSpent
    });
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

router.put('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }

    user.name = req.body.name || user.name;
    user.phone = req.body.phone || user.phone;
    user.address = req.body.address || user.address;
    user.drivingLicense = req.body.drivingLicense || user.drivingLicense;

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      address: updatedUser.address,
      drivingLicense: updatedUser.drivingLicense,
      message: 'Cập nhật thông tin thành công'
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

export default router;