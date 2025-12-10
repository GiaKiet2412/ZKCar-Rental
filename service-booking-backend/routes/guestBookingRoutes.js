import express from 'express';
import { 
  sendTrackingCode, 
  verifyTrackingCode,
  getGuestBookingDetail 
} from '../controllers/guestBookingController.js';

const router = express.Router();

// POST /api/guest-bookings/request-tracking - Yêu cầu mã tracking
router.post('/request-tracking', sendTrackingCode);

// POST /api/guest-bookings/verify-tracking - Xác thực mã tracking và lấy danh sách bookings
router.post('/verify-tracking', verifyTrackingCode);

// GET /api/guest-bookings/:bookingId - Lấy chi tiết booking (cần email/phone để xác thực)
router.get('/:bookingId', getGuestBookingDetail);

export default router;