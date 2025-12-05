import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getUserProfile,
  updateUserProfile,
  getUserBookings,
  getUserStats
} from '../controllers/userController.js';

const router = express.Router();

// Get user profile
router.get('/profile', protect, getUserProfile);

// Update user profile
router.put('/profile', protect, updateUserProfile);

// Get user bookings
router.get('/bookings', protect, getUserBookings);

// Get user statistics
router.get('/stats', protect, getUserStats);

export default router;