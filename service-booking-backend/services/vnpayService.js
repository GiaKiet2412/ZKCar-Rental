import crypto from 'crypto';
import querystring from 'qs';
import moment from 'moment';
import config from '../config.js';

class VNPayService {
  constructor() {
    this.vnp_TmnCode = process.env.VNP_TMN_CODE;
    this.vnp_HashSecret = process.env.VNP_HASH_SECRET;
    this.vnp_Url = process.env.VNP_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    this.vnp_ReturnUrl = process.env.VNP_RETURN_URL || 'http://localhost:5000/api/payment/vnpay-return';
    
    // THÊM VALIDATION
    if (!this.vnp_TmnCode || !this.vnp_HashSecret) {
      throw new Error('VNPay configuration is missing!');
    }
  }

  /**
   * Tạo URL thanh toán VNPay
   */
  createPaymentUrl(req, orderId, amount, orderInfo, bankCode = '') {
    try {
      const date = new Date();
      const createDate = moment(date).format('YYYYMMDDHHmmss');
      
      const ipAddr = req.headers['x-forwarded-for'] || 
                     req.connection.remoteAddress || 
                     req.socket.remoteAddress || 
                     '127.0.0.1';

      let vnp_Params = {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: this.vnp_TmnCode,
        vnp_Locale: 'vn',
        vnp_CurrCode: 'VND',
        vnp_TxnRef: orderId,
        vnp_OrderInfo: orderInfo,
        vnp_OrderType: 'other',
        vnp_Amount: amount * 100,
        vnp_ReturnUrl: this.vnp_ReturnUrl,
        vnp_IpAddr: ipAddr,
        vnp_CreateDate: createDate
      };

      if (bankCode) {
        vnp_Params.vnp_BankCode = bankCode;
      }

      // Sort params
      vnp_Params = this.sortObject(vnp_Params);

      // Tạo chữ ký
      const signData = querystring.stringify(vnp_Params, { encode: false });

      const hmac = crypto.createHmac('sha512', this.vnp_HashSecret);
      const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
      vnp_Params.vnp_SecureHash = signed;

      // Tạo URL
      const paymentUrl = this.vnp_Url + '?' + querystring.stringify(vnp_Params, { encode: false });
      
      return paymentUrl;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Xác thực return URL từ VNPay - QUAN TRỌNG
   * Method này BẮT BUỘC phải có để xử lý callback
   */
  verifyReturnUrl(vnpParams) {
    try {
      const secureHash = vnpParams.vnp_SecureHash;
      
      // Lưu lại các giá trị quan trọng trước khi xóa
      const responseCode = vnpParams.vnp_ResponseCode;
      const transactionNo = vnpParams.vnp_TransactionNo;
      const bankCode = vnpParams.vnp_BankCode;
      const amount = vnpParams.vnp_Amount ? parseInt(vnpParams.vnp_Amount) / 100 : 0;
      const orderId = vnpParams.vnp_TxnRef;
      const orderInfo = vnpParams.vnp_OrderInfo;
      const payDate = vnpParams.vnp_PayDate;
      
      // Xóa các tham số không cần thiết để verify
      const paramsToVerify = { ...vnpParams };
      delete paramsToVerify.vnp_SecureHash;
      delete paramsToVerify.vnp_SecureHashType;

      // Sắp xếp params
      const sortedParams = this.sortObject(paramsToVerify);

      // Tạo chữ ký để so sánh
      const signData = querystring.stringify(sortedParams, { encode: false });
      const hmac = crypto.createHmac('sha512', this.vnp_HashSecret);
      const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

      const isValid = secureHash === signed;

      // Return đầy đủ thông tin
      return {
        isValid,
        responseCode,
        transactionNo,
        bankCode,
        amount,
        orderId,
        orderInfo,
        payDate
      };
    } catch (error) {
      return {
        isValid: false,
        responseCode: '99',
        error: error.message
      };
    }
  }

  /**
   * Sắp xếp object theo key alphabet
   * QUAN TRỌNG: Phải encode theo chuẩn VNPay
   */
  sortObject(obj) {
    const sorted = {};
    const str = [];
    
    // Lấy tất cả keys và encode
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        str.push(encodeURIComponent(key));
      }
    }
    
    str.sort();
    
    // Encode cả key và value, replace space thành +
    for (let key = 0; key < str.length; key++) {
      sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, '+');
    }
    
    return sorted;
  }

  /**
   * Parse response code từ VNPay
   */
  getResponseMessage(responseCode) {
    const messages = {
      '00': 'Giao dịch thành công',
      '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường)',
      '09': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng',
      '10': 'Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
      '11': 'Giao dịch không thành công do: Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch',
      '12': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa',
      '13': 'Giao dịch không thành công do Quý khách nhập sai mật khẩu xác thực giao dịch (OTP)',
      '24': 'Giao dịch không thành công do: Khách hàng hủy giao dịch',
      '51': 'Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch',
      '65': 'Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày',
      '72': 'Giao dịch không thành công do: Dữ liệu gửi sang không đúng định dạng',
      '75': 'Ngân hàng thanh toán đang bảo trì',
      '79': 'Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định',
      '97': 'Chữ ký không hợp lệ',
      '99': 'Lỗi hệ thống'
    };

    return messages[responseCode] || 'Lỗi không xác định';
  }

  /**
   * Tạo refund request (hoàn tiền)
   */
  createRefundRequest(orderId, amount, transactionNo, transDate, createBy) {
    try {
      const date = new Date();
      const createDate = moment(date).format('YYYYMMDDHHmmss');
      const requestId = moment(date).format('HHmmss');

      let vnp_Params = {
        vnp_Version: '2.1.0',
        vnp_Command: 'refund',
        vnp_TmnCode: this.vnp_TmnCode,
        vnp_TransactionType: '02', // 02: Hoàn trả toàn phần
        vnp_TxnRef: orderId,
        vnp_Amount: amount * 100,
        vnp_OrderInfo: `Hoan tien GD ${orderId}`,
        vnp_TransactionNo: transactionNo,
        vnp_TransactionDate: transDate,
        vnp_CreateBy: createBy,
        vnp_CreateDate: createDate,
        vnp_IpAddr: '127.0.0.1',
        vnp_RequestId: requestId
      };

      vnp_Params = this.sortObject(vnp_Params);

      const signData = querystring.stringify(vnp_Params, { encode: false });
      const hmac = crypto.createHmac('sha512', this.vnp_HashSecret);
      const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
      vnp_Params.vnp_SecureHash = signed;

      return vnp_Params;
    } catch (error) {

      throw new Error('Không thể tạo yêu cầu hoàn tiền');
    }
  }
}

export default new VNPayService();