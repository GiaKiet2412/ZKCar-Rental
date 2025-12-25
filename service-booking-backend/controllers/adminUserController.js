import User from '../models/User.js';
import Booking from '../models/Booking.js';

/**
 * UNIFIED SPENDING CALCULATION (ĐỒNG BỘ VỚI userController)
 * CHỈ tính finalAmount từ các booking đã thanh toán
 * KHÔNG tính depositAmount (tiền thế chấp)
 */
const calculateTotalSpent = (bookings) => {
  if (!bookings || bookings.length === 0) return 0;
  
  const paidBookings = bookings.filter(booking => 
    booking.paymentStatus === 'paid' || 
    booking.status === 'confirmed' || 
    booking.status === 'ongoing' || 
    booking.status === 'completed'
  );
  
  return paidBookings.reduce((sum, booking) => {
    const actualPaid = booking.paidAmount || booking.finalAmount || 0;
    return sum + actualPaid;
  }, 0);
};

// Lấy danh sách tất cả users với thống kê
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });

    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const bookings = await Booking.find({ user: user._id });
        const completedBookings = bookings.filter(b => b.status === 'completed');
        const totalSpent = calculateTotalSpent(bookings);

        return {
          ...user.toObject(),
          bookingStats: {
            totalBookings: bookings.length,
            completedBookings: completedBookings.length,
            activeBookings: bookings.filter(b => b.status === 'confirmed' || b.status === 'ongoing').length,
            totalSpent: totalSpent
          }
        };
      })
    );

    res.json(usersWithStats);
  } catch (error) {
    console.error('Error getting all users:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Lấy chi tiết user theo ID
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }

    const bookings = await Booking.find({ user: user._id });
    const completedBookings = bookings.filter(b => b.status === 'completed');
    const totalSpent = calculateTotalSpent(bookings);

    console.log('📊 Admin View User Stats:', {
      userId: user._id,
      userName: user.name,
      totalBookings: bookings.length,
      completedBookings: completedBookings.length,
      totalSpent: totalSpent
    });

    res.json({
      ...user.toObject(),
      bookingStats: {
        totalBookings: bookings.length,
        completedBookings: completedBookings.length,
        activeBookings: bookings.filter(b => b.status === 'confirmed' || b.status === 'ongoing').length,
        cancelledBookings: bookings.filter(b => b.status === 'cancelled').length,
        pendingBookings: bookings.filter(b => b.status === 'pending').length,
        totalSpent: totalSpent
      }
    });
  } catch (error) {
    console.error('Error getting user by ID:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Cập nhật thông tin user (Admin)
export const updateUser = async (req, res) => {
  try {
    const { name, email, phone, address, drivingLicense, role, isActive } = req.body;
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email đã được sử dụng' });
      }
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    if (drivingLicense !== undefined) user.drivingLicense = drivingLicense;
    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;

    const updatedUser = await user.save();

    res.json({
      message: 'Cập nhật thông tin người dùng thành công',
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        address: updatedUser.address,
        drivingLicense: updatedUser.drivingLicense,
        role: updatedUser.role,
        isActive: updatedUser.isActive
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Xóa user
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }

    const activeBookings = await Booking.find({
      user: user._id,
      status: { $in: ['pending', 'confirmed', 'ongoing'] }
    });

    if (activeBookings.length > 0) {
      return res.status(400).json({
        message: 'Không thể xóa người dùng có booking đang hoạt động',
        activeBookingsCount: activeBookings.length
      });
    }

    // Soft delete
    user.isActive = false;
    await user.save();

    res.json({ message: 'Xóa người dùng thành công' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Lấy thống kê tổng quan
export const getUserStatistics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const admins = await User.countDocuments({ role: 'admin' });
    const regularUsers = await User.countDocuments({ role: 'user' });
    
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email createdAt');

    res.json({
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      admins,
      regularUsers,
      recentUsers
    });
  } catch (error) {
    console.error('Error getting user statistics:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Tìm kiếm và lọc users
export const searchUsers = async (req, res) => {
  try {
    const { search, role, status, sortBy = 'createdAt', order = 'desc' } = req.query;
    
    let query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role && role !== 'all') {
      query.role = role;
    }
    
    if (status && status !== 'all') {
      query.isActive = status === 'active';
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ [sortBy]: order === 'desc' ? -1 : 1 });

    res.json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Lấy lịch sử booking của user
export const getUserBookingHistory = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.params.id })
      .populate('vehicle', 'name brand model images pricePerDay location locationPickUp')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    console.error('Error getting user booking history:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};