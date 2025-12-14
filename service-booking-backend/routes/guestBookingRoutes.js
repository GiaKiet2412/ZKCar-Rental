import express from 'express';
import { sendTrackingCode, verifyTrackingCode, getGuestBookingDetail,} from '../controllers/guestBookingController.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 5, // Tối đa 5 request
  message: { 
    message: 'Quá nhiều yêu cầu từ IP này. Vui lòng thử lại sau 15 phút.' 
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/request-tracking', otpLimiter, sendTrackingCode);
router.post('/verify-tracking', verifyTrackingCode);
router.get('/:bookingId', getGuestBookingDetail);

export default router;