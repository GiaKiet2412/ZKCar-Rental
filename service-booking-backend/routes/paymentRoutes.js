import express from 'express';
import {
  createPaymentUrl,
  vnpayIPN,
  vnpayReturn,
  getPaymentInfo,
  refundPayment
} from '../controllers/paymentController.js';
import { protect, checkRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Tạo URL thanh toán (user hoặc guest)
router.post('/create-payment-url', createPaymentUrl);

// VNPay callbacks
router.get('/vnpay-ipn', vnpayIPN); // Webhook từ VNPay
router.get('/vnpay-return', vnpayReturn); // Return URL sau khi thanh toán

// Lấy thông tin thanh toán
router.get('/:bookingId', getPaymentInfo);

// Hoàn tiền (admin only)
router.post('/:bookingId/refund', protect, checkRole('admin'), refundPayment);

export default router;