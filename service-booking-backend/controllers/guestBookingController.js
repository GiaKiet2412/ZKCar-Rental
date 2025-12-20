import Booking from '../models/Booking.js';
import crypto from 'crypto';
import emailService from '../services/emailService.js';

const generateTrackingCode = () => {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
};

const trackingCodes = new Map();

// ===== VALIDATION FUNCTIONS =====
const validateEmail = (email) => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

const validatePhone = (phone) => {
  if (!phone) return false;
  const cleanPhone = phone.replace(/\s+/g, '');
  const phoneRegex = /^0\d{9}$/;
  return phoneRegex.test(cleanPhone);
};

const normalizeInput = (input) => {
  if (!input) return '';
  return input.trim().toLowerCase().replace(/\s+/g, '');
};

const createTrackingKey = (email, phone) => {
  const normalizedEmail = normalizeInput(email);
  const normalizedPhone = normalizeInput(phone);
  
  if (normalizedEmail && normalizedPhone) {
    return `both:${normalizedEmail}:${normalizedPhone}`;
  } else if (normalizedEmail) {
    return `email:${normalizedEmail}`;
  } else if (normalizedPhone) {
    return `phone:${normalizedPhone}`;
  }
  return '';
};

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

    // Validation
    if (!email && !phone) {
      return res.status(400).json({ 
        success: false,
        message: 'Vui lòng cung cấp email hoặc số điện thoại' 
      });
    }

    if (email && !validateEmail(email)) {
      return res.status(400).json({ 
        success: false,
        message: 'Email không hợp lệ. Vui lòng nhập đúng định dạng email@example.com' 
      });
    }

    if (phone && !validatePhone(phone)) {
      return res.status(400).json({ 
        success: false,
        message: 'Số điện thoại không hợp lệ. Vui lòng nhập 10 chữ số bắt đầu bằng 0' 
      });
    }

    // Build search query
    const query = buildSearchQuery(email, phone);
    
    if (!query.$or || query.$or.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Thông tin không hợp lệ' 
      });
    }

    // Find bookings
    const bookings = await Booking.find(query)
      .populate('vehicle', 'name images')
      .sort({ createdAt: -1 })
      .limit(10);

    if (bookings.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Không tìm thấy đơn đặt xe nào với thông tin này' 
      });
    }

    // Determine recipient email
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
          success: false,
          message: 'Không tìm thấy email liên kết với số điện thoại này. Vui lòng nhập email để nhận mã xác thực.' 
        });
      }
    }

    // Generate tracking code
    const trackingCode = generateTrackingCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const trackingKey = createTrackingKey(email, phone);
    
    if (!trackingKey) {
      return res.status(400).json({ 
        success: false,
        message: 'Thông tin không hợp lệ' 
      });
    }
    
    // Clean up old code
    if (trackingCodes.has(trackingKey)) {
      const oldData = trackingCodes.get(trackingKey);
      if (oldData.timeoutId) {
        clearTimeout(oldData.timeoutId);
      }
      trackingCodes.delete(trackingKey);
    }

    // Auto cleanup
    const timeoutId = setTimeout(() => {
      trackingCodes.delete(trackingKey);
    }, 10 * 60 * 1000);

    // Save tracking code
    trackingCodes.set(trackingKey, {
      code: trackingCode,
      recipientEmail: recipientEmail,
      searchEmail: email || null,
      searchPhone: phone || null,
      expiresAt,
      bookingsFound: bookings.length,
      timeoutId
    });

    // Send email
    try {
      const result = await emailService.sendTrackingCode(recipientEmail, trackingCode, bookings.length);
      
      console.log(` Tracking code ${trackingCode} sent successfully to ${recipientEmail}`);
      
      // SUCCESS RESPONSE - QUAN TRỌNG
      return res.status(200).json({
        success: true,
        message: `Mã xác thực đã được gửi đến email ${recipientEmail}`,
        recipientEmail,
        expiresIn: 600,
        bookingsFound: bookings.length
      });
      
    } catch (emailError) {
      console.error(' Email sending failed:', emailError.message);
      
      // Email failed but code is saved, user can still verify manually
      return res.status(200).json({
        success: true,
        message: `Mã xác thực đã được tạo cho ${recipientEmail}. Nếu không nhận được email, vui lòng kiểm tra spam folder.`,
        recipientEmail,
        expiresIn: 600,
        bookingsFound: bookings.length,
        warning: 'Email có thể đã vào spam folder'
      });
    }

  } catch (error) {
    console.error(' Error in sendTrackingCode:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Lỗi hệ thống. Vui lòng thử lại sau.',
      error: error.message 
    });
  }
};

export const verifyTrackingCode = async (req, res) => {
  try {
    const { email, phone, trackingCode } = req.body;

    if (!trackingCode) {
      return res.status(400).json({ 
        success: false,
        message: 'Vui lòng nhập mã xác thực' 
      });
    }

    if (!email && !phone) {
      return res.status(400).json({ 
        success: false,
        message: 'Vui lòng cung cấp email hoặc số điện thoại' 
      });
    }

    const trackingKey = createTrackingKey(email, phone);
    
    if (!trackingKey) {
      return res.status(400).json({ 
        success: false,
        message: 'Thông tin không hợp lệ' 
      });
    }

    const storedData = trackingCodes.get(trackingKey);

    if (!storedData) {
      return res.status(400).json({ 
        success: false,
        message: 'Mã xác thực không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu mã mới.' 
      });
    }

    if (storedData.expiresAt < new Date()) {
      if (storedData.timeoutId) {
        clearTimeout(storedData.timeoutId);
      }
      trackingCodes.delete(trackingKey);
      return res.status(400).json({ 
        success: false,
        message: 'Mã xác thực đã hết hạn. Vui lòng yêu cầu mã mới.' 
      });
    }

    if (storedData.code !== trackingCode.toUpperCase()) {
      return res.status(400).json({ 
        success: false,
        message: 'Mã xác thực không đúng. Vui lòng kiểm tra lại.' 
      });
    }

    // Valid code - fetch bookings
    const query = buildSearchQuery(storedData.searchEmail, storedData.searchPhone);

    const bookings = await Booking.find(query)
      .populate('vehicle', 'name images location locationPickUp pricePerHour')
      .sort({ createdAt: -1 });

    if (bookings.length === 0) {
      return res.status(404).json({ 
        success: false,
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

    // Extend expiry for session browsing
    storedData.expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    
    if (storedData.timeoutId) {
      clearTimeout(storedData.timeoutId);
    }
    storedData.timeoutId = setTimeout(() => {
      trackingCodes.delete(trackingKey);
    }, 30 * 60 * 1000);

    return res.status(200).json({
      success: true,
      bookings: transformedBookings,
      verifiedEmail: storedData.searchEmail,
      verifiedPhone: storedData.searchPhone,
      message: 'Lấy danh sách đơn hàng thành công'
    });

  } catch (error) {
    console.error(' Error verifying tracking code:', error);
    return res.status(500).json({ 
      success: false,
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
        success: false,
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

    return res.status(200).json({
      success: true,
      booking
    });

  } catch (error) {
    console.error(' Error getting guest booking detail:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Lỗi khi lấy thông tin đặt xe',
      error: error.message 
    });
  }
};

// Cleanup expired codes periodically
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
  if (cleaned > 0) {
    console.log(`🧹 Cleaned up ${cleaned} expired tracking codes`);
  }
}, 60 * 1000);