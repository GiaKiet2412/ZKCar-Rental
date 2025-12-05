import nodemailer from 'nodemailer';
import { formatCurrencyVN } from '../utils/formatUtils.js';
import dotenv from 'dotenv';
dotenv.config();

class EmailService {
  constructor() {
    // Kiểm tra credentials trước khi tạo transporter
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      this.transporter = null;
      return;
    }

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // App Password (không phải mật khẩu Gmail thông thường)
      },
    });
  }

  // Format ngày giờ
  formatDateTime(date) {
    if (!date) return 'N/A';
    const d = new Date(date);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${hours}:${minutes}, ${day}/${month}/${year}`;
  }

  // Gửi email xác nhận booking
  async sendBookingConfirmation(booking, recipientEmail) {
    if (!this.transporter) {
      console.warn('⚠️ Email service chưa được cấu hình. Bỏ qua gửi email.');
      return { success: false, message: 'Email service not configured' };
    }

    try {
      const customerName = 
        booking.customerInfo?.name || 
        booking.user?.name || 
        booking.guestInfo?.name || 
        'Quý khách';

      const customerPhone = 
        booking.customerInfo?.phone || 
        booking.user?.phone || 
        booking.guestInfo?.phone || 
        'Chưa cập nhật';

      const vehicleName = booking.vehicle?.name || 'Xe đã đặt';
      const bookingCode = booking._id.toString().slice(-8).toUpperCase();

      const mailOptions = {
        from: `"KIETCAR - Thuê Xe Tự Lái" <${process.env.EMAIL_USER}>`,
        to: recipientEmail,
        subject: `✅ Xác nhận đặt xe thành công - Mã ${bookingCode}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .booking-card { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
              .info-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
              .info-label { color: #6b7280; font-weight: 600; }
              .info-value { color: #1f2937; font-weight: bold; }
              .highlight { background: #dcfce7; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #10b981; }
              .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 10px 0; }
              .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 28px;">🎉 Đặt xe thành công!</h1>
                <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Cảm ơn bạn đã tin tưởng KIETCAR</p>
              </div>
              
              <div class="content">
                <p>Xin chào <strong>${customerName}</strong>,</p>
                <p>Đơn đặt xe của bạn đã được xác nhận thành công! Dưới đây là thông tin chi tiết:</p>

                <div class="booking-card">
                  <h3 style="margin-top: 0; color: #10b981;">📋 Thông tin đặt xe</h3>
                  
                  <div class="info-row">
                    <span class="info-label">Mã đơn hàng:</span>
                    <span class="info-value" style="color: #10b981; font-size: 18px;">#${bookingCode}</span>
                  </div>

                  <div class="info-row">
                    <span class="info-label">Xe đã đặt:</span>
                    <span class="info-value">${vehicleName}</span>
                  </div>

                  <div class="info-row">
                    <span class="info-label">Họ tên:</span>
                    <span class="info-value">${customerName}</span>
                  </div>

                  <div class="info-row">
                    <span class="info-label">Số điện thoại:</span>
                    <span class="info-value">${customerPhone}</span>
                  </div>

                  <div class="info-row">
                    <span class="info-label">Ngày nhận xe:</span>
                    <span class="info-value">${this.formatDateTime(booking.pickupDate)}</span>
                  </div>

                  <div class="info-row">
                    <span class="info-label">Ngày trả xe:</span>
                    <span class="info-value">${this.formatDateTime(booking.returnDate)}</span>
                  </div>

                  <div class="info-row">
                    <span class="info-label">Địa điểm nhận xe:</span>
                    <span class="info-value">
                      ${booking.pickupType === 'delivery' && booking.deliveryLocation 
                        ? `Giao tận nơi: ${booking.deliveryLocation}` 
                        : 'Nhận tại vị trí xe'}
                    </span>
                  </div>

                  <div class="info-row" style="border-bottom: none; margin-top: 10px;">
                    <span class="info-label" style="font-size: 16px;">Tổng tiền thuê:</span>
                    <span class="info-value" style="color: #10b981; font-size: 20px;">${formatCurrencyVN(booking.finalAmount)}</span>
                  </div>
                </div>

                <div class="highlight">
                  <strong>⏰ Các bước tiếp theo:</strong>
                  <ol style="margin: 10px 0 0 0; padding-left: 20px;">
                    <li>Chuẩn bị CCCD và Bằng lái xe (bản gốc)</li>
                    <li>Đến đúng địa điểm và giờ nhận xe đã đặt</li>
                    <li>Kiểm tra xe kỹ trước khi nhận</li>
                    <li>Ký biên bản bàn giao và bắt đầu hành trình!</li>
                  </ol>
                </div>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.CLIENT_URL}/booking/${booking._id}" class="button">
                    Xem chi tiết đơn hàng
                  </a>
                </div>

                <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                  <strong>Lưu ý quan trọng:</strong><br>
                  • Vui lòng đến đúng giờ để không mất phí giữ chỗ<br>
                  • Kiểm tra xe kỹ và báo ngay nếu có vấn đề<br>
                  • Giữ liên lạc qua hotline: <strong>1900 xxxx</strong>
                </p>

                <div class="footer">
                  <p><strong>KIETCAR - Thuê Xe Điện Tự Lái</strong></p>
                  <p>Hotline: 1900 xxxx | Email: support@kietcar.com</p>
                  <p>Website: ${process.env.CLIENT_URL}</p>
                  <p style="margin-top: 10px; font-size: 11px; color: #9ca3af;">
                    Email này được gửi tự động. Vui lòng không trả lời email này.
                  </p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email xác nhận đã gửi đến ${recipientEmail}. MessageId: ${info.messageId}`);
      
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Lỗi khi gửi email xác nhận:', error);
      throw error;
    }
  }

  // Gửi email thông báo hủy
  async sendCancellationEmail(booking, recipientEmail, reason = '') {
    if (!this.transporter) {
      console.warn('⚠️ Email service chưa được cấu hình. Bỏ qua gửi email.');
      return { success: false, message: 'Email service not configured' };
    }

    try {
      const customerName = 
        booking.customerInfo?.name || 
        booking.user?.name || 
        booking.guestInfo?.name || 
        'Quý khách';

      const bookingCode = booking._id.toString().slice(-8).toUpperCase();

      const mailOptions = {
        from: `"KIETCAR - Thuê Xe Tự Lái" <${process.env.EMAIL_USER}>`,
        to: recipientEmail,
        subject: `❌ Đơn đặt xe đã bị hủy - Mã ${bookingCode}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .info-box { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
              .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 10px 0; }
              .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 28px;">Đơn đặt xe đã bị hủy</h1>
              </div>
              
              <div class="content">
                <p>Xin chào <strong>${customerName}</strong>,</p>
                <p>Đơn đặt xe <strong>#${bookingCode}</strong> của bạn đã được hủy.</p>

                ${reason ? `
                  <div class="info-box">
                    <strong>Lý do hủy:</strong>
                    <p style="margin: 10px 0 0 0; color: #6b7280;">${reason}</p>
                  </div>
                ` : ''}

                <p>Nếu bạn có thanh toán trước, chúng tôi sẽ hoàn tiền trong vòng 3-5 ngày làm việc.</p>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.CLIENT_URL}" class="button">
                    Đặt xe khác
                  </a>
                </div>

                <p style="color: #6b7280; font-size: 14px;">
                  Nếu cần hỗ trợ, vui lòng liên hệ hotline: <strong>1900 xxxx</strong>
                </p>

                <div class="footer">
                  <p><strong>KIETCAR - Thuê Xe Điện Tự Lái</strong></p>
                  <p>Hotline: 1900 xxxx | Email: support@kietcar.com</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email hủy đơn đã gửi đến ${recipientEmail}`);
      
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Lỗi khi gửi email hủy:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new EmailService();