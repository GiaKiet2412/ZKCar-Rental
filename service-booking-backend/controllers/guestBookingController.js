import Booking from '../models/Booking.js';
import crypto from 'crypto';
import emailService from '../services/emailService.js';

const generateTrackingCode = () => {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
};

// Store tracking codes in memory (in production, use Redis)
const trackingCodes = new Map(); // { email: { code, expiresAt, bookingsFound } }

export const sendTrackingCode = async (req, res) => {
  try {
    const { email, phone } = req.body;

    if (!email && !phone) {
      return res.status(400).json({ 
        message: 'Vui lòng cung cấp email hoặc số điện thoại' 
      });
    }

    // Tìm booking theo email hoặc phone
    const query = {};
    if (email) {
      query.$or = [
        { 'customerInfo.email': email },
        { 'guestInfo.email': email }
      ];
    }
    if (phone) {
      if (!query.$or) query.$or = [];
      query.$or.push(
        { 'customerInfo.phone': phone },
        { 'guestInfo.phone': phone }
      );
    }

    const bookings = await Booking.find(query)
      .populate('vehicle', 'name images')
      .sort({ createdAt: -1 })
      .limit(10);

    if (bookings.length === 0) {
      return res.status(404).json({ 
        message: 'Không tìm thấy đơn đặt xe nào với thông tin này' 
      });
    }

    // Lấy email từ booking nếu user chỉ nhập phone
    let recipientEmail = email;
    if (!recipientEmail && phone) {
      // Tìm email từ bookings
      for (const booking of bookings) {
        const foundEmail = booking.customerInfo?.email || booking.guestInfo?.email;
        if (foundEmail && foundEmail.includes('@')) {
          recipientEmail = foundEmail;
          break;
        }
      }
      
      if (!recipientEmail) {
        return res.status(400).json({ 
          message: 'Không tìm thấy email liên kết với số điện thoại này. Vui lòng nhập email để nhận mã xác thực.' 
        });
      }
    }

    // Tạo tracking code
    const trackingCode = generateTrackingCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 phút

    // Lưu tracking code vào memory
    const key = email || phone;
    trackingCodes.set(key, {
      code: trackingCode,
      email: recipientEmail,
      phone: phone || '',
      expiresAt,
      bookingsFound: bookings.length
    });

    // Auto cleanup expired codes
    setTimeout(() => {
      trackingCodes.delete(key);
    }, 10 * 60 * 1000);

    // Gửi email
    await emailService.sendTrackingCode(recipientEmail, trackingCode, bookings.length);

    res.json({
      success: true,
      message: `Mã xác thực đã được gửi đến email ${recipientEmail}`,
      recipientEmail, // Trả về email để frontend biết
      expiresIn: 600,
      bookingsFound: bookings.length
    });

  } catch (error) {
    console.error('Error sending tracking code:', error);
    res.status(500).json({ 
      message: 'Lỗi khi gửi mã xác thực',
      error: error.message 
    });
  }
};

export const verifyTrackingCode = async (req, res) => {
  try {
    const { email, phone, trackingCode } = req.body;

    if (!trackingCode) {
      return res.status(400).json({ message: 'Vui lòng nhập mã xác thực' });
    }

    if (!email && !phone) {
      return res.status(400).json({ message: 'Vui lòng cung cấp email hoặc số điện thoại' });
    }

    // Verify tracking code from memory
    const key = email || phone;
    const storedData = trackingCodes.get(key);

    if (!storedData) {
      return res.status(400).json({ 
        message: 'Mã xác thực không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu mã mới.' 
      });
    }

    if (storedData.expiresAt < new Date()) {
      trackingCodes.delete(key);
      return res.status(400).json({ 
        message: 'Mã xác thực đã hết hạn. Vui lòng yêu cầu mã mới.' 
      });
    }

    if (storedData.code !== trackingCode.toUpperCase()) {
      return res.status(400).json({ 
        message: 'Mã xác thực không đúng. Vui lòng kiểm tra lại.' 
      });
    }

    // Valid code - fetch bookings
    const query = {};
    const searchEmail = email || storedData.email;
    const searchPhone = phone || storedData.phone;

    if (searchEmail) {
      query.$or = [
        { 'customerInfo.email': searchEmail },
        { 'guestInfo.email': searchEmail }
      ];
    }
    if (searchPhone) {
      if (!query.$or) query.$or = [];
      query.$or.push(
        { 'customerInfo.phone': searchPhone },
        { 'guestInfo.phone': searchPhone }
      );
    }

    const bookings = await Booking.find(query)
      .populate('vehicle', 'name images location locationPickUp pricePerHour')
      .sort({ createdAt: -1 });

    if (bookings.length === 0) {
      return res.status(404).json({ 
        message: 'Không tìm thấy đơn đặt xe nào' 
      });
    }

    const transformedBookings = bookings.map(booking => {
      const bookingObj = booking.toObject();
      if (bookingObj.vehicle) {
        const vehicleImages = bookingObj.vehicle.images || [];
        bookingObj.vehicle.images = vehicleImages;
      }
      return bookingObj;
    });

    // Keep tracking code valid for this session (don't delete yet)
    // User might want to go back and see the list again

    res.json({
      success: true,
      bookings: transformedBookings,
      verifiedEmail: searchEmail,
      verifiedPhone: searchPhone,
      message: 'Lấy danh sách đơn hàng thành công'
    });

  } catch (error) {
    console.error('Error verifying tracking code:', error);
    res.status(500).json({ 
      message: 'Lỗi khi xác thực',
      error: error.message 
    });
  }
};

export const getGuestBookingDetail = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { email, phone } = req.query;

    if (!email && !phone) {
      return res.status(400).json({ 
        message: 'Vui lòng cung cấp email hoặc số điện thoại để xác thực' 
      });
    }

    const query = { _id: bookingId };
    
    const orConditions = [];
    if (email) {
      orConditions.push(
        { 'customerInfo.email': email },
        { 'guestInfo.email': email }
      );
    }
    if (phone) {
      orConditions.push(
        { 'customerInfo.phone': phone },
        { 'guestInfo.phone': phone }
      );
    }
    
    if (orConditions.length > 0) {
      query.$or = orConditions;
    }

    const booking = await Booking.findOne(query)
      .populate('vehicle', 'name images location locationPickUp pricePerHour pricePerDay');

    if (!booking) {
      return res.status(404).json({ 
        success: false,
        message: 'Không tìm thấy đơn đặt xe hoặc thông tin không khớp' 
      });
    }

    res.json({
      success: true,
      booking
    });

  } catch (error) {
    console.error('Error getting guest booking detail:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi khi lấy thông tin đặt xe',
      error: error.message 
    });
  }
};

// Cleanup expired tracking codes periodically
setInterval(() => {
  const now = new Date();
  for (const [key, value] of trackingCodes.entries()) {
    if (value.expiresAt < now) {
      trackingCodes.delete(key);
    }
  }
}, 60 * 1000); // Check every minute