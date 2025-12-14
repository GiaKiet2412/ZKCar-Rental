import express from 'express';
import {
  getAllDiscounts,
  getAvailableDiscounts,
  validateDiscount,
  createDiscount,
  updateDiscount,
  toggleDiscount,
  deleteDiscount
} from '../controllers/discountController.js';
import { protect, optionalAuth, checkRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// CRITICAL FIX: Public/User routes với optionalAuth
// Cho phép cả guest (req.user = undefined) và logged user (req.user có data)
router.get('/available', optionalAuth, getAvailableDiscounts); 
router.post('/validate', optionalAuth, validateDiscount);

// Admin routes
router.get('/', protect, checkRole('admin'), getAllDiscounts);
router.post('/', protect, checkRole('admin'), createDiscount);
router.put('/:id', protect, checkRole('admin'), updateDiscount);
router.patch('/:id/toggle', protect, checkRole('admin'), toggleDiscount);
router.delete('/:id', protect, checkRole('admin'), deleteDiscount);

export default router;