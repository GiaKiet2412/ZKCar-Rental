import User from '../models/User.js';
import Booking from '../models/Booking.js';

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }

    // Lấy tất cả bookings
    const bookings = await Booking.find({ user: user._id });
    
    // Đếm completed bookings (cho totalRentals)
    const completedBookings = bookings.filter(b => b.status === 'completed');
    
    // Tính totalSpent: bao gồm booking đã thanh toán (confirmed, ongoing, completed)
    // KHÔNG tính pending và cancelled
    const paidBookings = bookings.filter(b => 
      b.status === 'confirmed' || 
      b.status === 'ongoing' || 
      b.status === 'completed'
    );
    
    const totalSpent = paidBookings.reduce((sum, booking) => {
      // Ưu tiên paidAmount (số tiền thực tế đã trả)
      // Fallback sang finalAmount nếu không có paidAmount
      const amountPaid = booking.paidAmount || booking.finalAmount || booking.totalPrice || 0;
      return sum + amountPaid;
    }, 0);

    console.log('User profile stats:', {
      userId: user._id,
      totalBookings: bookings.length,
      completedBookings: completedBookings.length,
      paidBookings: paidBookings.length,
      totalSpent: totalSpent
    });

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
      totalRentals: completedBookings.length, // Chỉ đếm completed
      totalSpent: totalSpent // Tính cả confirmed, ongoing, completed
    });
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }

    // Update allowed fields only
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
};

export const getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('vehicle', 'name images pricePerDay location locationPickUp')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    console.error('Error getting user bookings:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

export const getUserStats = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id });
    
    // Tính tổng chi tiêu từ các booking đã thanh toán
    const paidBookings = bookings.filter(b => 
      b.status === 'confirmed' || 
      b.status === 'ongoing' || 
      b.status === 'completed'
    );
    
    const totalSpent = paidBookings.reduce((sum, booking) => {
      const amountPaid = booking.paidAmount || booking.finalAmount || booking.totalPrice || 0;
      return sum + amountPaid;
    }, 0);
    
    const stats = {
      totalBookings: bookings.length,
      completedBookings: bookings.filter(b => b.status === 'completed').length,
      activeBookings: bookings.filter(b => b.status === 'confirmed' || b.status === 'ongoing').length,
      cancelledBookings: bookings.filter(b => b.status === 'cancelled').length,
      pendingBookings: bookings.filter(b => b.status === 'pending').length,
      totalSpent: totalSpent
    };

    res.json(stats);
  } catch (error) {
    console.error('Error getting user stats:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};