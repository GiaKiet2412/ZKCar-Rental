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
import { protect, checkRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public/User routes - Không cần auth cho guest
router.get('/available', getAvailableDiscounts); // GET /api/discounts/available
router.post('/validate', validateDiscount); // POST /api/discounts/validate

// Admin routes
router.get('/', protect, checkRole('admin'), getAllDiscounts); // GET /api/discounts
router.post('/', protect, checkRole('admin'), createDiscount); // POST /api/discounts
router.put('/:id', protect, checkRole('admin'), updateDiscount); // PUT /api/discounts/:id
router.patch('/:id/toggle', protect, checkRole('admin'), toggleDiscount); // PATCH /api/discounts/:id/toggle
router.delete('/:id', protect, checkRole('admin'), deleteDiscount); // DELETE /api/discounts/:id

export default router;