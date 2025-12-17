import User from '../models/User.js';
import Booking from '../models/Booking.js';

// Lấy danh sách tất cả users với thống kê
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });

    // Lấy thống kê booking cho từng user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const bookings = await Booking.find({ user: user._id });
        const completedBookings = bookings.filter(b => b.status === 'completed');
        
        const totalSpent = completedBookings.reduce((sum, b) => {
          return sum + (b.finalAmount || 0);
        }, 0);

        return {
          ...user.toObject(),
          bookingStats: {
            totalBookings: bookings.length,
            completedBookings: completedBookings.length,
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

    // Lấy thống kê booking
    const bookings = await Booking.find({ user: user._id });
    const completedBookings = bookings.filter(b => b.status === 'completed');
    
    const totalSpent = completedBookings.reduce((sum, booking) => {
      return sum + (booking.finalAmount || 0);
    }, 0);

    res.json({
      ...user.toObject(),
      bookingStats: {
        totalBookings: bookings.length,
        completedBookings: completedBookings.length,
        activeBookings: bookings.filter(b => b.status === 'confirmed').length,
        cancelledBookings: bookings.filter(b => b.status === 'cancelled').length,
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

    // Check nếu email mới đã tồn tại cho user khác
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email đã được sử dụng' });
      }
    }

    // Update fields
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

    // Kiểm tra xem user có booking đang active không
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

    // Soft delete: chỉ đánh dấu isActive = false thay vì xóa hẳn
    user.isActive = false;
    await user.save();

    // Nếu muốn xóa hẳn, uncomment dòng dưới và comment dòng trên
    // await User.findByIdAndDelete(req.params.id);

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
    
    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Role filter
    if (role && role !== 'all') {
      query.role = role;
    }
    
    // Status filter
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
      .populate('vehicle', 'name brand model images pricePerDay location')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    console.error('Error getting user booking history:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};