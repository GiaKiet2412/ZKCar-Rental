import User from '../models/User.js';
import Booking from '../models/Booking.js';

const calculateTotalSpent = (bookings) => {
  if (!bookings || bookings.length === 0) return 0;
  
  return bookings.reduce((sum, booking) => {
    let amountToCount = 0;

    if (booking.status === 'completed' || booking.status === 'ongoing') {
      amountToCount = booking.finalAmount || 0;
    }
    else if (booking.status === 'confirmed') {
      if (booking.paidAmount && booking.paidAmount >= (booking.finalAmount || 0)) {
        amountToCount = booking.finalAmount || 0;
      } else {
        amountToCount = booking.paidAmount || 0;
      }
    }
    else if (booking.status === 'pending' || booking.status === 'cancelled') {
      amountToCount = 0;
    }
    else {
      amountToCount = booking.paidAmount || 0;
    }
    
    return sum + amountToCount;
  }, 0);
};

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }

    const bookings = await Booking.find({ user: user._id });
    const completedBookings = bookings.filter(b => b.status === 'completed');
    const totalSpent = calculateTotalSpent(bookings);

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
};

export const updateUserProfile = async (req, res) => {
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
    const totalSpent = calculateTotalSpent(bookings);
    
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