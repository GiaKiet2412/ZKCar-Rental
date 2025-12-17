import express from 'express';
import { protect, checkRole } from '../middleware/authMiddleware.js';
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserStatistics,
  searchUsers,
  getUserBookingHistory
} from '../controllers/adminUserController.js';

const router = express.Router();

// Tất cả routes đều yêu cầu đăng nhập và có role admin
router.use(protect);
router.use(checkRole('admin'));

// GET /api/admin/users - Lấy tất cả users
router.get('/', getAllUsers);

// GET /api/admin/users/statistics - Lấy thống kê
router.get('/statistics', getUserStatistics);

// GET /api/admin/users/search - Tìm kiếm và lọc
router.get('/search', searchUsers);

// GET /api/admin/users/:id - Lấy chi tiết user
router.get('/:id', getUserById);

// GET /api/admin/users/:id/bookings - Lấy lịch sử booking của user
router.get('/:id/bookings', getUserBookingHistory);

// PUT /api/admin/users/:id - Cập nhật user
router.put('/:id', updateUser);

// DELETE /api/admin/users/:id - Xóa user
router.delete('/:id', deleteUser);

export default router;