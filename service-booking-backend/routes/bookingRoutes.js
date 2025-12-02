import express from 'express';
import {
  createBooking,
  getUserBookings,
  getBookingById,
  getAllBookings,
  getBookingStatistics,
  updateBookingStatus,
  cancelBooking,
  completeBooking
} from '../controllers/bookingController.js';
import { protect, checkRole, optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Admin routes - PHẢI ĐẶT TRƯỚC các route có :id
router.get('/admin/all', protect, checkRole('admin'), getAllBookings);
router.get('/admin/statistics', protect, checkRole('admin'), getBookingStatistics);
router.patch('/:id/status', protect, checkRole('admin'), updateBookingStatus);
router.patch('/:id/complete', protect, checkRole('admin'), completeBooking);

// User routes - CHO PHÉP GUEST TẠO BOOKING
router.post('/', optionalAuth, createBooking);
router.get('/user', protect, getUserBookings);
router.get('/:id', optionalAuth, getBookingById);
router.patch('/:id/cancel', protect, cancelBooking);

export default router;