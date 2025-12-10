import Booking from '../models/Booking.js';
import Discount from '../models/Discount.js';
import User from '../models/User.js';
import Vehicle from '../models/Vehicle.js';
import emailService from '../services/emailService.js';

// Tạo booking mới
export const createBooking = async (req, res) => {
  try {
    const { 
      vehicleId, 
      pickupDate, 
      returnDate, 
      discountCode,
      originalAmount,
      insuranceFee,
      deliveryFee,
      VAT,
      pickupType,
      deliveryLocation,
      customerInfo, 
      guestInfo,    
      notes
    } = req.body;

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ message: 'Không tìm thấy xe' });
    }

    const pickup = new Date(pickupDate);
    const returnD = new Date(returnDate);
    const pickupWithBuffer = new Date(pickup.getTime() - 60 * 60 * 1000);
    const returnWithBuffer = new Date(returnD.getTime() + 60 * 60 * 1000);

    const conflictingBooking = await Booking.findOne({
      vehicle: vehicleId,
      status: { $in: ['pending', 'confirmed', 'ongoing'] },
      paymentStatus: 'paid',
      $or: [
        {
          pickupDate: { $lte: pickupWithBuffer },
          returnDate: { $gte: pickupWithBuffer }
        },
        {
          pickupDate: { $lte: returnWithBuffer },
          returnDate: { $gte: returnWithBuffer }
        },
        {
          pickupDate: { $gte: pickupWithBuffer },
          returnDate: { $lte: returnWithBuffer }
        }
      ]
    });

    if (conflictingBooking) {
      return res.status(400).json({
        success: false,
        message: 'Xe đã được đặt trong khung giờ này. Vui lòng chọn thời gian khác.',
        conflictingBooking: {
          pickupDate: conflictingBooking.pickupDate,
          returnDate: conflictingBooking.returnDate
        }
      });
    }
    
    const userId = req.user?._id;
    let finalDiscountAmount = 0;
    let discountInfo = null;

    let finalCustomerInfo = customerInfo || guestInfo;
    
    if (userId) {
      const user = await User.findById(userId);
      if (user) {
        finalCustomerInfo = {
          name: customerInfo?.name || user.name,
          email: customerInfo?.email || user.email,
          phone: customerInfo?.phone || user.phone || 'Chưa cập nhật'
        };
      }
    }

    // ===== VALIDATION BỔ SUNG: ĐẢM BẢO EMAIL LUÔN CÓ =====
    if (!finalCustomerInfo || !finalCustomerInfo.email || !finalCustomerInfo.email.includes('@')) {
      return res.status(400).json({ 
        message: 'Vui lòng nhập địa chỉ email hợp lệ. Email cần thiết để nhận thông tin đặt xe và tra cứu đơn hàng.' 
      });
    }

    // Validate phone
    if (!finalCustomerInfo || !finalCustomerInfo.phone) {
      return res.status(400).json({ 
        message: 'Vui lòng nhập số điện thoại' 
      });
    }

    // Validate name
    if (!finalCustomerInfo || !finalCustomerInfo.name) {
      return res.status(400).json({ 
        message: 'Vui lòng nhập họ tên' 
      });
    }
    // ===== KẾT THÚC VALIDATION =====

    if (discountCode) {
      const discount = await Discount.findOne({ 
        code: discountCode.toUpperCase(),
        isActive: true 
      });

      if (!discount) {
        return res.status(400).json({ message: 'Mã giảm giá không hợp lệ' });
      }

      const now = new Date();
      if (now < discount.validFrom || now > discount.validTo) {
        return res.status(400).json({ message: 'Mã giảm giá đã hết hạn' });
      }

      if (discount.quantity <= 0) {
        return res.status(400).json({ message: 'Mã giảm giá đã hết lượt sử dụng' });
      }

      if (originalAmount < discount.minOrderAmount) {
        return res.status(400).json({ 
          message: `Đơn hàng phải từ ${discount.minOrderAmount.toLocaleString()}đ trở lên` 
        });
      }

      if (userId) {
        const user = await User.findById(userId);
        
        if (discount.forNewUsersOnly) {
          if (user.hasUsedDiscount(discountCode)) {
            return res.status(400).json({ message: 'Bạn đã sử dụng mã này rồi' });
          }
          
          if (user.completedBookings > 0) {
            return res.status(400).json({ message: 'Mã chỉ dành cho khách hàng mới' });
          }
        }

        if (discount.forNthOrder) {
          const bookingCount = await Booking.countDocuments({ 
            user: userId,
            status: { $in: ['completed', 'confirmed', 'ongoing'] }
          });
          
          if (bookingCount + 1 !== discount.forNthOrder) {
            return res.status(400).json({ 
              message: `Mã chỉ áp dụng cho lần thuê thứ ${discount.forNthOrder}` 
            });
          }
        }
      }

      if (discount.requirePreBookingDays > 0) {
        const daysInAdvance = Math.floor(
          (new Date(pickupDate) - now) / (1000 * 60 * 60 * 24)
        );
        if (daysInAdvance < discount.requirePreBookingDays) {
          return res.status(400).json({ 
            message: `Phải đặt trước ít nhất ${discount.requirePreBookingDays} ngày` 
          });
        }
      }

      if (discount.discountType === 'percent') {
        finalDiscountAmount = (originalAmount * discount.discountValue) / 100;
        if (discount.maxDiscountAmount > 0) {
          finalDiscountAmount = Math.min(finalDiscountAmount, discount.maxDiscountAmount);
        }
      } else {
        finalDiscountAmount = discount.discountValue;
      }

      finalDiscountAmount = Math.round(finalDiscountAmount);

      discountInfo = {
        code: discount.code,
        type: discount.discountType,
        value: discount.discountValue,
        amount: finalDiscountAmount
      };
    }

    const finalAmount = Math.round(
      originalAmount + (insuranceFee || 0) + (deliveryFee || 0) + (VAT || 0) - finalDiscountAmount
    );

    const booking = new Booking({
      vehicle: vehicleId,
      user: userId || null,
      customerInfo: finalCustomerInfo, 
      guestInfo: userId ? null : finalCustomerInfo, 
      pickupDate,
      returnDate,
      pickupType: pickupType || 'self',
      deliveryLocation: pickupType === 'delivery' ? deliveryLocation : null,
      originalAmount,
      discountCode: discountCode || null,
      discountAmount: finalDiscountAmount,
      insuranceFee: insuranceFee || 0,
      deliveryFee: deliveryFee || 0,
      VAT: VAT || 0,
      finalAmount,
      notes: notes || '',
      status: 'pending',
      paymentStatus: 'pending'
    });

    await booking.save();

    res.status(201).json({ 
      success: true,
      message: 'Tạo booking thành công', 
      booking,
      discountApplied: discountInfo
    });

  } catch (err) {
    console.error('Error creating booking:', err);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi khi tạo booking',
      error: err.message 
    });
  }
};

export const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    const booking = await Booking.findById(id)
      .populate('vehicle')
      .populate('user', 'name email phone');

    if (!booking) {
      return res.status(404).json({ message: 'Không tìm thấy booking' });
    }

    if (userId && booking.user && booking.user._id.toString() !== userId.toString() && req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Không có quyền truy cập' });
    }

    res.json({
      success: true,
      booking
    });
  } catch (err) {
    console.error('Error getting booking:', err);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi khi lấy thông tin booking' 
    });
  }
};

export const getAllBookings = async (req, res) => {
  try {
    const { status, startDate, endDate, page = 1, limit = 20, search } = req.query;

    let query = {};

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.pickupDate = {};
      if (startDate) query.pickupDate.$gte = new Date(startDate);
      if (endDate) query.pickupDate.$lte = new Date(endDate);
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { _id: search.match(/^[0-9a-fA-F]{24}$/) ? search : null },
        { 'customerInfo.name': searchRegex },
        { 'customerInfo.phone': searchRegex },
        { 'customerInfo.email': searchRegex },
        { 'guestInfo.name': searchRegex },
        { 'guestInfo.phone': searchRegex },
        { 'guestInfo.email': searchRegex }
      ];
    }

    const bookings = await Booking.find(query)
      .populate('vehicle', 'name images pricePerHour location')
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Booking.countDocuments(query);

    res.json({
      success: true,
      bookings,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalBookings: count
    });
  } catch (err) {
    console.error('Error getting all bookings:', err);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi khi lấy danh sách booking' 
    });
  }
};

export const getBookingStatistics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    const statusStats = await Booking.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const revenueStats = await Booking.aggregate([
      { 
        $match: { 
          ...dateFilter,
          paymentStatus: 'paid'
        } 
      },
      { 
        $group: { 
          _id: null, 
          totalRevenue: { $sum: '$finalAmount' },
          totalBookings: { $sum: 1 },
          averageBookingValue: { $avg: '$finalAmount' }
        } 
      }
    ]);

    const topVehicles = await Booking.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$vehicle', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { 
        $lookup: {
          from: 'vehicles',
          localField: '_id',
          foreignField: '_id',
          as: 'vehicleInfo'
        }
      },
      { $unwind: '$vehicleInfo' }
    ]);

    const dailyRevenue = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          paymentStatus: 'paid'
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$finalAmount' },
          bookings: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      statistics: {
        statusStats,
        revenue: revenueStats[0] || { totalRevenue: 0, totalBookings: 0, averageBookingValue: 0 },
        topVehicles,
        dailyRevenue
      }
    });
  } catch (err) {
    console.error('Error getting booking statistics:', err);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi khi lấy thống kê' 
    });
  }
};

export const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'ongoing', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
    }

    const booking = await Booking.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate('vehicle').populate('user');

    if (!booking) {
      return res.status(404).json({ message: 'Không tìm thấy booking' });
    }

    if (status === 'completed' && booking.user) {
      await User.findByIdAndUpdate(booking.user._id, {
        $inc: { completedBookings: 1 }
      });
    }

    res.json({
      success: true,
      message: 'Cập nhật trạng thái thành công',
      booking
    });
  } catch (err) {
    console.error('Error updating booking status:', err);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi khi cập nhật trạng thái' 
    });
  }
};

export const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { reason } = req.body; // Có thể nhận lý do hủy từ client

    const booking = await Booking.findById(id)
      .populate('vehicle')
      .populate('user');

    if (!booking) {
      return res.status(404).json({ message: 'Không tìm thấy booking' });
    }

    if (booking.user && booking.user._id.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Không có quyền hủy booking này' });
    }

    if (booking.status !== 'pending' && booking.paymentStatus === 'paid') {
      return res.status(400).json({ 
        message: 'Không thể hủy booking đã thanh toán. Vui lòng liên hệ hỗ trợ.' 
      });
    }

    booking.status = 'cancelled';
    await booking.save();

    // Hoàn lại discount
    if (booking.discountCode && booking.paymentStatus === 'paid') {
      await Discount.findOneAndUpdate(
        { code: booking.discountCode },
        { $inc: { quantity: 1 } }
      );
    }

    // GỬI EMAIL THÔNG BÁO HỦY
    try {
      const customerEmail = 
        booking.customerInfo?.email || 
        booking.user?.email || 
        booking.guestInfo?.email;

      if (customerEmail) {
        await emailService.sendCancellationEmail(booking, customerEmail, reason);
      }
    } catch (emailError) {
      console.error('Lỗi gửi email hủy:', emailError);
    }

    res.json({
      success: true,
      message: 'Đã hủy booking',
      booking
    });
  } catch (err) {
    console.error('Error cancelling booking:', err);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi khi hủy booking' 
    });
  }
};

export const completeBooking = async (req, res) => {
  try {
    const { id } = req.params;
    
    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({ message: 'Không tìm thấy booking' });
    }

    if (!['confirmed', 'ongoing'].includes(booking.status)) {
      return res.status(400).json({ 
        message: 'Chỉ có thể hoàn thành booking đã xác nhận hoặc đang diễn ra' 
      });
    }

    booking.status = 'completed';
    await booking.save();

    if (booking.user) {
      await User.findByIdAndUpdate(booking.user, {
        $inc: { completedBookings: 1 }
      });
    }

    res.json({ 
      success: true,
      message: 'Hoàn thành chuyến đi', 
      booking 
    });
  } catch (err) {
    console.error('Error completing booking:', err);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi khi hoàn thành booking' 
    });
  }
};

export const myBooking = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate({
        path: 'vehicle',
        select: 'name images image location locationPickUp pricePerDay pricePerHour'
      })
      .sort({ createdAt: -1 });

    const transformedBookings = bookings.map(booking => {
      const bookingObj = booking.toObject();

      if (bookingObj.vehicle) {
        const vehicleImages = bookingObj.vehicle.images || 
                             (bookingObj.vehicle.image ? [bookingObj.vehicle.image] : []);
        bookingObj.vehicle.images = vehicleImages;
      }
      
      return bookingObj;
    });

    res.json(transformedBookings);
  } catch (error) {
    console.error('Error getting user bookings:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};