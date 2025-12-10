import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Middleware bắt buộc đăng nhập
export const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Không có quyền truy cập, vui lòng đăng nhập' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ message: 'Người dùng không tồn tại' });
    }

    next();
  } catch (error) {
    console.error('Auth error:', error.message);
    return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
};

// Middleware không bắt buộc đăng nhập (optional) - CHO PHÉP GUEST
export const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');
      } catch (err) {
        console.log('Invalid token in optionalAuth, continuing as guest');
      }
    }

    next();
  } catch (error) {
    console.error('OptionalAuth error:', error);
    next();
  }
};

// Middleware kiểm tra role
export const checkRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Vui lòng đăng nhập' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Chỉ ${roles.join(', ')} mới có quyền truy cập` 
      });
    }

    next();
  };
};