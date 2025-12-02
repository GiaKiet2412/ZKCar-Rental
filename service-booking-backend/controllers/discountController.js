import Discount from '../models/Discount.js';
import Booking from '../models/Booking.js';

// Lấy tất cả mã giảm giá (cho admin)
export const getAllDiscounts = async (req, res) => {
  try {
    const discounts = await Discount.find().sort({ createdAt: -1 });
    res.json(discounts);
  } catch (err) {
    console.error('Error fetching discounts:', err);
    res.status(500).json({ message: 'Lỗi khi tải danh sách mã giảm giá' });
  }
};

// Lấy mã giảm giá khả dụng cho user
export const getAvailableDiscounts = async (req, res) => {
  try {
    const userId = req.user?._id; // Từ middleware auth
    const now = new Date();

    // Lấy tất cả mã đang active và còn hiệu lực
    let discounts = await Discount.find({
      isActive: true,
      validFrom: { $lte: now },
      validTo: { $gte: now },
      quantity: { $gt: 0 }
    }).sort({ discountValue: -1 });

    // Nếu có user, lọc theo điều kiện
    if (userId) {
      // Đếm số lần đã thuê xe
      const bookingCount = await Booking.countDocuments({ 
        user: userId,
        status: { $in: ['completed', 'confirmed', 'ongoing'] }
      });

      // Lọc mã theo điều kiện
      discounts = await Promise.all(
        discounts.map(async (discount) => {
          // Kiểm tra forNewUsersOnly
          if (discount.forNewUsersOnly && bookingCount > 0) {
            return null;
          }

          // Kiểm tra forNthOrder
          if (discount.forNthOrder && bookingCount + 1 !== discount.forNthOrder) {
            return null;
          }

          // Kiểm tra đã sử dụng mã này chưa (nếu forNewUsersOnly = true)
          if (discount.forNewUsersOnly) {
            const usedBefore = await Booking.findOne({
              user: userId,
              discountCode: discount.code
            });
            if (usedBefore) return null;
          }

          return discount;
        })
      );

      // Loại bỏ các mã null
      discounts = discounts.filter(d => d !== null);
    }

    res.json(discounts);
  } catch (err) {
    console.error('Error fetching available discounts:', err);
    res.status(500).json({ message: 'Lỗi khi tải mã giảm giá' });
  }
};

// Validate mã giảm giá
export const validateDiscount = async (req, res) => {
  try {
    const { code, totalAmount, pickupDate, returnDate } = req.body;
    const userId = req.user?._id;

    const discount = await Discount.findOne({ 
      code: code.toUpperCase(),
      isActive: true 
    });

    if (!discount) {
      return res.status(404).json({ 
        valid: false, 
        message: 'Mã giảm giá không tồn tại hoặc đã hết hạn' 
      });
    }

    // Kiểm tra thời gian hiệu lực
    const now = new Date();
    if (now < discount.validFrom || now > discount.validTo) {
      return res.status(400).json({ 
        valid: false, 
        message: 'Mã giảm giá đã hết hạn hoặc chưa có hiệu lực' 
      });
    }

    // Kiểm tra số lượng
    if (discount.quantity <= 0) {
      return res.status(400).json({ 
        valid: false, 
        message: 'Mã giảm giá đã hết lượt sử dụng' 
      });
    }

    // Kiểm tra giá trị đơn hàng tối thiểu
    if (totalAmount < discount.minOrderAmount) {
      return res.status(400).json({ 
        valid: false, 
        message: `Đơn hàng phải từ ${discount.minOrderAmount.toLocaleString()}đ trở lên` 
      });
    }

    // Kiểm tra thời gian thuê xe
    if (discount.rentalStart || discount.rentalEnd) {
      const pickup = new Date(pickupDate);
      const ret = new Date(returnDate);
      
      if (discount.rentalStart && pickup < discount.rentalStart) {
        return res.status(400).json({ 
          valid: false, 
          message: 'Chuyến đi không nằm trong thời gian áp dụng mã' 
        });
      }
      
      if (discount.rentalEnd && ret > discount.rentalEnd) {
        return res.status(400).json({ 
          valid: false, 
          message: 'Chuyến đi không nằm trong thời gian áp dụng mã' 
        });
      }
    }

    // Kiểm tra điều kiện đặc biệt nếu có userId
    if (userId) {
      const bookingCount = await Booking.countDocuments({ 
        user: userId,
        status: { $in: ['completed', 'confirmed', 'ongoing'] }
      });

      // Chỉ dành cho khách hàng mới
      if (discount.forNewUsersOnly && bookingCount > 0) {
        return res.status(400).json({ 
          valid: false, 
          message: 'Mã chỉ dành cho khách hàng mới' 
        });
      }

      // Kiểm tra đã sử dụng mã này chưa
      if (discount.forNewUsersOnly) {
        const usedBefore = await Booking.findOne({
          user: userId,
          discountCode: discount.code
        });
        if (usedBefore) {
          return res.status(400).json({ 
            valid: false, 
            message: 'Bạn đã sử dụng mã này rồi' 
          });
        }
      }

      // Lần thuê thứ N
      if (discount.forNthOrder && bookingCount + 1 !== discount.forNthOrder) {
        return res.status(400).json({ 
          valid: false, 
          message: `Mã chỉ áp dụng cho lần thuê thứ ${discount.forNthOrder}` 
        });
      }
    }

    // Kiểm tra yêu cầu đặt trước
    if (discount.requirePreBookingDays > 0) {
      const daysInAdvance = Math.floor((new Date(pickupDate) - now) / (1000 * 60 * 60 * 24));
      if (daysInAdvance < discount.requirePreBookingDays) {
        return res.status(400).json({ 
          valid: false, 
          message: `Phải đặt trước ít nhất ${discount.requirePreBookingDays} ngày` 
        });
      }
    }

    // Tính toán số tiền giảm
    let discountAmount = 0;
    if (discount.discountType === 'percent') {
      discountAmount = (totalAmount * discount.discountValue) / 100;
      if (discount.maxDiscountAmount > 0) {
        discountAmount = Math.min(discountAmount, discount.maxDiscountAmount);
      }
    } else {
      discountAmount = discount.discountValue;
    }

    res.json({ 
      valid: true, 
      discount: {
        _id: discount._id,
        code: discount.code,
        description: discount.description,
        discountType: discount.discountType,
        discountValue: discount.discountValue,
        discountAmount: Math.round(discountAmount)
      }
    });
  } catch (err) {
    console.error('Error validating discount:', err);
    res.status(500).json({ 
      valid: false, 
      message: 'Lỗi khi kiểm tra mã giảm giá' 
    });
  }
};

// Tạo mã giảm giá mới
export const createDiscount = async (req, res) => {
  try {
    const discount = new Discount(req.body);
    await discount.save();
    res.status(201).json({ 
      message: 'Tạo mã giảm giá thành công', 
      discount 
    });
  } catch (err) {
    console.error('Error creating discount:', err);
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Mã giảm giá đã tồn tại' });
    }
    res.status(500).json({ message: 'Lỗi khi tạo mã giảm giá' });
  }
};

// Cập nhật mã giảm giá
export const updateDiscount = async (req, res) => {
  try {
    const { id } = req.params;
    const discount = await Discount.findByIdAndUpdate(
      id, 
      req.body, 
      { new: true, runValidators: true }
    );
    
    if (!discount) {
      return res.status(404).json({ message: 'Không tìm thấy mã giảm giá' });
    }
    
    res.json({ 
      message: 'Cập nhật mã giảm giá thành công', 
      discount 
    });
  } catch (err) {
    console.error('Error updating discount:', err);
    res.status(500).json({ message: 'Lỗi khi cập nhật mã giảm giá' });
  }
};

// Toggle trạng thái
export const toggleDiscount = async (req, res) => {
  try {
    const { id } = req.params;
    const discount = await Discount.findById(id);
    
    if (!discount) {
      return res.status(404).json({ message: 'Không tìm thấy mã giảm giá' });
    }
    
    discount.isActive = !discount.isActive;
    await discount.save();
    
    res.json({ 
      message: 'Đã thay đổi trạng thái', 
      discount 
    });
  } catch (err) {
    console.error('Error toggling discount:', err);
    res.status(500).json({ message: 'Lỗi khi thay đổi trạng thái' });
  }
};

// Xóa mã giảm giá
export const deleteDiscount = async (req, res) => {
  try {
    const { id } = req.params;
    const discount = await Discount.findByIdAndDelete(id);
    
    if (!discount) {
      return res.status(404).json({ message: 'Không tìm thấy mã giảm giá' });
    }
    
    res.json({ message: 'Xóa mã giảm giá thành công' });
  } catch (err) {
    console.error('Error deleting discount:', err);
    res.status(500).json({ message: 'Lỗi khi xóa mã giảm giá' });
  }
};