import Booking from '../models/Booking.js';
import Discount from '../models/Discount.js';
import User from '../models/User.js';
import vnpayService from '../services/vnpayService.js';
import emailService from '../services/emailService.js';

// Tạo URL thanh toán VNPay
export const createPaymentUrl = async (req, res) => {
  try {
    const { bookingId, amount, bankCode, paymentType } = req.body;

    // Validate input
    if (!bookingId || !amount) {
      return res.status(400).json({ 
        success: false,
        message: 'Thiếu thông tin bookingId hoặc amount' 
      });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ 
        success: false,
        message: 'Không tìm thấy booking' 
      });
    }

    if (booking.paymentStatus === 'paid') {
      return res.status(400).json({ 
        success: false,
        message: 'Booking đã được thanh toán' 
      });
    }

    const orderId = `${bookingId}_${Date.now()}`;
    
    // Lưu paymentType vào booking
    booking.paymentType = paymentType || 'hold';
    booking.paidAmount = amount;
    
    // Tính remaining amount
    if (paymentType === 'full') {
      booking.remainingAmount = 0;
    } else {
      booking.remainingAmount = booking.finalAmount + booking.depositAmount - booking.holdFee;
    }

    const orderInfo = `Thanh toan thue xe ${bookingId}`;
    
    const paymentUrl = vnpayService.createPaymentUrl(
      req,
      orderId,
      amount,
      orderInfo,
      bankCode
    );

    booking.vnpayOrderId = orderId;
    await booking.save();

    res.json({
      success: true,
      paymentUrl,
      orderId
    });

  } catch (error) {
    console.error('❌ Error creating payment URL:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi khi tạo URL thanh toán',
      error: error.message 
    });
  }
};

// ==========================================
// HELPER: Cập nhật booking sau thanh toán
// ==========================================
const updateBookingAfterPayment = async (bookingId, transactionNo, bankCode) => {
  const booking = await Booking.findById(bookingId)
    .populate('vehicle')
    .populate('user', 'name email phone');
    
  if (!booking) {
    throw new Error('Booking not found');
  }

  // Nếu đã thanh toán rồi thì skip
  if (booking.paymentStatus === 'paid') {
    return booking;
  }

  // Cập nhật trạng thái
  booking.paymentStatus = 'paid';
  booking.status = 'confirmed';
  booking.vnpayTransactionNo = transactionNo;
  booking.vnpayBankCode = bankCode;
  booking.paidAt = new Date();

  await booking.save();

  // Giảm số lượng discount nếu có
  if (booking.discountCode) {
    await Discount.findOneAndUpdate(
      { code: booking.discountCode },
      { $inc: { quantity: -1 } }
    );
  }

  // Cập nhật user statistics
  if (booking.user) {
    const user = await User.findById(booking.user);
    if (user && booking.discountCode) {
      user.addUsedDiscount(booking.discountCode);
      await user.save();
    }
  }

  // GỬI EMAIL XÁC NHẬN
  try {
    // Ưu tiên: customerInfo.email > user.email > guestInfo.email
    const customerEmail = 
      booking.customerInfo?.email || 
      booking.user?.email || 
      booking.guestInfo?.email;

    if (customerEmail) {
      await emailService.sendBookingConfirmation(booking, customerEmail);
      console.log(`Đã gửi email xác nhận đến: ${customerEmail}`);
    } else {
      console.warn('Không có email để gửi xác nhận');
    }
  } catch (emailError) {
    // Log lỗi nhưng không throw để không ảnh hưởng đến luồng thanh toán
    console.error('Lỗi gửi email xác nhận:', emailError);
  }

  return booking;
};

// Xử lý callback từ VNPay (IPN - Instant Payment Notification)
export const vnpayIPN = async (req, res) => {
  try {
    const vnpParams = req.query;
    
    // Verify signature
    const verifyResult = vnpayService.verifyReturnUrl(vnpParams);

    if (!verifyResult.isValid) {
      return res.status(400).json({
        RspCode: '97',
        Message: 'Chu ky khong hop le'
      });
    }

    // Lấy booking từ orderId
    const orderId = verifyResult.orderId;
    const bookingId = orderId.split('_')[0];
    
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        RspCode: '01',
        Message: 'Order not found'
      });
    }

    // Kiểm tra đã xử lý chưa
    if (booking.paymentStatus === 'paid') {
      return res.json({
        RspCode: '00',
        Message: 'Confirm Success'
      });
    }

    // Xử lý theo response code
    if (verifyResult.responseCode === '00') {
      // Thanh toán thành công
      await updateBookingAfterPayment(
        bookingId,
        verifyResult.transactionNo,
        verifyResult.bankCode
      );

      return res.json({
        RspCode: '00',
        Message: 'Confirm Success'
      });
    } else {
      // Thanh toán thất bại
      booking.paymentStatus = 'failed';
      booking.status = 'cancelled';
      await booking.save();

      return res.json({
        RspCode: '00',
        Message: 'Confirm Success'
      });
    }

  } catch (error) {
    console.error('Error processing VNPay IPN:', error);
    return res.status(500).json({
      RspCode: '99',
      Message: 'System error'
    });
  }
};

// Xử lý return từ VNPay (sau khi khách hàng thanh toán)
export const vnpayReturn = async (req, res) => {
  try {
    const vnpParams = req.query;
    // Verify signature
    const verifyResult = vnpayService.verifyReturnUrl(vnpParams);

    if (!verifyResult.isValid) {
      return res.redirect(
        `${process.env.CLIENT_URL}/payment/failed?message=Chu ky khong hop le`
      );
    }

    // Lấy booking
    const orderId = verifyResult.orderId;
    const bookingId = orderId.split('_')[0];
    
    const booking = await Booking.findById(bookingId)
      .populate('vehicle')
      .populate('user');

    if (!booking) {
      return res.redirect(
        `${process.env.CLIENT_URL}/payment/failed?message=Khong tim thay booking`
      );
    }

    // Xử lý theo kết quả thanh toán
    if (verifyResult.responseCode === '00') {
      try {
        await updateBookingAfterPayment(
          bookingId,
          verifyResult.transactionNo,
          verifyResult.bankCode
        );
      } catch (error) {
        console.error('Error updating booking after payment:', error);
      }

      // Redirect đến trang success
      return res.redirect(
        `${process.env.CLIENT_URL}/payment/success?bookingId=${bookingId}&amount=${verifyResult.amount}`
      );
    } else {
      // THANH TOÁN THẤT BẠI
      booking.paymentStatus = 'failed';
      booking.status = 'cancelled';
      await booking.save();

      const message = vnpayService.getResponseMessage(verifyResult.responseCode);
      return res.redirect(
        `${process.env.CLIENT_URL}/payment/failed?message=${encodeURIComponent(message)}&bookingId=${bookingId}`
      );
    }

  } catch (error) {
    console.error('Error processing VNPay return:', error);
    return res.redirect(
      `${process.env.CLIENT_URL}/payment/failed?message=Loi he thong`
    );
  }
};

// Lấy thông tin thanh toán
export const getPaymentInfo = async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    const booking = await Booking.findById(bookingId)
      .select('paymentStatus paidAt vnpayTransactionNo vnpayBankCode finalAmount');

    if (!booking) {
      return res.status(404).json({ message: 'Không tìm thấy booking' });
    }

    res.json({
      success: true,
      payment: {
        status: booking.paymentStatus,
        amount: booking.finalAmount,
        paidAt: booking.paidAt,
        transactionNo: booking.vnpayTransactionNo,
        bankCode: booking.vnpayBankCode
      }
    });

  } catch (error) {
    console.error('Error getting payment info:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi khi lấy thông tin thanh toán' 
    });
  }
};

// Hoàn tiền (refund)
export const refundPayment = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user._id;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Không tìm thấy booking' });
    }

    if (booking.paymentStatus !== 'paid') {
      return res.status(400).json({ message: 'Booking chưa được thanh toán' });
    }

    // Tạo refund request
    const refundData = vnpayService.createRefundRequest(
      booking.vnpayOrderId,
      booking.finalAmount,
      booking.vnpayTransactionNo,
      booking.paidAt,
      userId
    );

    // Gọi API VNPay để hoàn tiền (cần implement thêm)
    // const refundResult = await axios.post(vnpayRefundUrl, refundData);

    booking.paymentStatus = 'refunded';
    booking.status = 'cancelled';
    await booking.save();

    // Hoàn lại số lượng discount
    if (booking.discountCode) {
      await Discount.findOneAndUpdate(
        { code: booking.discountCode },
        { $inc: { quantity: 1 } }
      );
    }

    res.json({
      success: true,
      message: 'Hoàn tiền thành công',
      refundData
    });

  } catch (error) {
    console.error('Error refunding payment:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi khi hoàn tiền' 
    });
  }
};