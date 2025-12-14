import Booking from '../models/Booking.js';
import crypto from 'crypto';
import emailService from '../services/emailService.js';

const generateTrackingCode = () => {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
};

// Store tracking codes in memory (in production, use Redis)
const trackingCodes = new Map();

// Helper function to normalize input
const normalizeInput = (input) => {
  if (!input) return '';
  return input.trim().toLowerCase().replace(/\s+/g, '');
};

// Create unique key based on WHAT USER ACTUALLY ENTERED
const createTrackingKey = (email, phone) => {
  const normalizedEmail = normalizeInput(email);
  const normalizedPhone = normalizeInput(phone);
  
  // Use only what was provided to create the key
  if (normalizedEmail && normalizedPhone) {
    return `both:${normalizedEmail}:${normalizedPhone}`;
  } else if (normalizedEmail) {
    return `email:${normalizedEmail}`;
  } else if (normalizedPhone) {
    return `phone:${normalizedPhone}`;
  }
  return '';
};

// Helper function to build search query
const buildSearchQuery = (email, phone) => {
  const orConditions = [];
  
  if (email) {
    const normalizedEmail = normalizeInput(email);
    orConditions.push(
      { 'customerInfo.email': { $regex: new RegExp(`^${normalizedEmail}$`, 'i') } },
      { 'guestInfo.email': { $regex: new RegExp(`^${normalizedEmail}$`, 'i') } }
    );
  }
  
  if (phone) {
    const normalizedPhone = normalizeInput(phone);
    orConditions.push(
      { 'customerInfo.phone': normalizedPhone },
      { 'guestInfo.phone': normalizedPhone }
    );
  }
  
  return orConditions.length > 0 ? { $or: orConditions } : {};
};

export const sendTrackingCode = async (req, res) => {
  try {
    const { email, phone } = req.body;

    if (!email && !phone) {
      return res.status(400).json({ 
        message: 'Vui lòng cung cấp email hoặc số điện thoại' 
      });
    }

    if (email && !validateEmail(email)) {
      return res.status(400).json({ message: 'Email không hợp lệ' });
    }

    if (phone && !validatePhone(phone)) {
      return res.status(400).json({ message: 'Số điện thoại không hợp lệ (10 chữ số, bắt đầu bằng 0)' });
    }

    // Build search query
    const query = buildSearchQuery(email, phone);
    
    if (!query.$or || query.$or.length === 0) {
      return res.status(400).json({ 
        message: 'Thông tin không hợp lệ' 
      });
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

    // Create unique key based on what user entered
    const trackingKey = createTrackingKey(email, phone);
    
    if (!trackingKey) {
      return res.status(400).json({ 
        message: 'Thông tin không hợp lệ' 
      });
    }
    
    // Delete old code if exists
    if (trackingCodes.has(trackingKey)) {
      const oldData = trackingCodes.get(trackingKey);
      if (oldData.timeoutId) {
        clearTimeout(oldData.timeoutId);
      }
      trackingCodes.delete(trackingKey);
    }

    // Auto cleanup after expiry
    const timeoutId = setTimeout(() => {
      trackingCodes.delete(trackingKey);
    }, 10 * 60 * 1000);

    // Save new tracking code
    trackingCodes.set(trackingKey, {
      code: trackingCode,
      recipientEmail: recipientEmail,
      searchEmail: email || null,
      searchPhone: phone || null,
      expiresAt,
      bookingsFound: bookings.length,
      timeoutId
    });

    // Gửi email
    await emailService.sendTrackingCode(recipientEmail, trackingCode, bookings.length);

    res.json({
      success: true,
      message: `Mã xác thực đã được gửi đến email ${recipientEmail}`,
      recipientEmail,
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

    // Create same key as when sending (must match exactly)
    const trackingKey = createTrackingKey(email, phone);
    
    if (!trackingKey) {
      return res.status(400).json({ message: 'Thông tin không hợp lệ' });
    }

    const storedData = trackingCodes.get(trackingKey);

    if (!storedData) {
      return res.status(400).json({ 
        message: 'Mã xác thực không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu mã mới.' 
      });
    }

    if (storedData.expiresAt < new Date()) {
      // Clean up expired code
      if (storedData.timeoutId) {
        clearTimeout(storedData.timeoutId);
      }
      trackingCodes.delete(trackingKey);
      return res.status(400).json({ 
        message: 'Mã xác thực đã hết hạn. Vui lòng yêu cầu mã mới.' 
      });
    }

    if (storedData.code !== trackingCode.toUpperCase()) {
      return res.status(400).json({ 
        message: 'Mã xác thực không đúng. Vui lòng kiểm tra lại.' 
      });
    }

    // Valid code - use stored search criteria
    const query = buildSearchQuery(storedData.searchEmail, storedData.searchPhone);

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

    // Extend expiry for session browsing (30 minutes)
    storedData.expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    
    if (storedData.timeoutId) {
      clearTimeout(storedData.timeoutId);
    }
    storedData.timeoutId = setTimeout(() => {
      trackingCodes.delete(trackingKey);
    }, 30 * 60 * 1000);

    res.json({
      success: true,
      bookings: transformedBookings,
      verifiedEmail: storedData.searchEmail,
      verifiedPhone: storedData.searchPhone,
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
    const searchQuery = buildSearchQuery(email, phone);
    
    if (searchQuery.$or) {
      query.$or = searchQuery.$or;
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
  let cleaned = 0;
  for (const [key, value] of trackingCodes.entries()) {
    if (value.expiresAt < now) {
      if (value.timeoutId) {
        clearTimeout(value.timeoutId);
      }
      trackingCodes.delete(key);
      cleaned++;
    }
  }
}, 60 * 1000); // Check every minute