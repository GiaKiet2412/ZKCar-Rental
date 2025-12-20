import sgMail from '@sendgrid/mail';
import { formatCurrencyVN } from '../utils/formatUtils.js';
import dotenv from 'dotenv';
dotenv.config();

class EmailService {
  constructor() {
    // Kiểm tra credentials
    if (!process.env.SENDGRID_API_KEY) {
      console.warn(' SendGrid API key not configured');
      this.isConfigured = false;
      return;
    }

    if (!process.env.EMAIL_FROM) {
      console.warn(' EMAIL_FROM not configured');
      this.isConfigured = false;
      return;
    }

    try {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      this.isConfigured = true;
      console.log(' SendGrid email service ready');
    } catch (error) {
      console.error(' SendGrid initialization failed:', error.message);
      this.isConfigured = false;
    }
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

  // GỬI MÃ TRACKING CHO GUEST
  async sendTrackingCode(email, trackingCode, bookingsCount) {
    if (!this.isConfigured) {
      const errorMsg = 'Email service not configured';
      console.error('', errorMsg);
      throw new Error(errorMsg);
    }

    try {
      const msg = {
        to: email,
        from: {
          email: process.env.EMAIL_FROM,
          name: 'ZK CAR - Thuê Xe Tự Lái'
        },
        subject: 'Mã xác thực tra cứu đơn hàng - ZK CAR',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f4f7fa; margin: 0; padding: 0; }
              .container { max-width: 600px; margin: 30px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
              .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px 30px; text-align: center; }
              .header h1 { margin: 0; font-size: 28px; }
              .content { padding: 40px 30px; }
              .tracking-code-box { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; margin: 30px 0; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); }
              .tracking-code { font-size: 48px; font-weight: 900; letter-spacing: 8px; margin: 15px 0; font-family: 'Courier New', monospace; }
              .info-box { background: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .info-box strong { color: #059669; display: block; margin-bottom: 10px; font-size: 16px; }
              .info-box ul { margin: 10px 0; padding-left: 20px; }
              .info-box li { margin: 8px 0; color: #374151; }
              .warning-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0; }
              .footer { background: #f9fafb; padding: 30px; text-align: center; color: #6b7280; font-size: 13px; border-top: 1px solid #e5e7eb; }
              .button { display: inline-block; background: #10b981; color: white; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; transition: background 0.3s; }
              @media only screen and (max-width: 600px) {
                .container { margin: 10px; }
                .content { padding: 20px 15px; }
                .tracking-code { font-size: 36px; letter-spacing: 4px; }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Mã Xác Thực Tra Cứu Đơn Hàng</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.95; font-size: 16px;">ZK CAR - Thuê Xe Điện Tự Lái</p>
              </div>
              
              <div class="content">
                <p style="font-size: 16px; color: #374151;">Xin chào,</p>
                <p style="font-size: 16px; color: #374151;">Bạn vừa yêu cầu tra cứu đơn đặt xe. Chúng tôi tìm thấy <strong style="color: #10b981;">${bookingsCount} đơn hàng</strong> liên kết với email này.</p>

                <div class="tracking-code-box">
                  <p style="margin: 0; font-size: 16px; opacity: 0.9;">MÃ XÁC THỰC CỦA BẠN</p>
                  <div class="tracking-code">${trackingCode}</div>
                  <p style="margin: 15px 0 0 0; font-size: 14px; opacity: 0.85;">Mã có hiệu lực trong <strong>10 phút</strong></p>
                </div>

                <div class="info-box">
                  <strong>Cách sử dụng mã xác thực:</strong>
                  <ul>
                    <li>Truy cập trang tra cứu đơn hàng</li>
                    <li>Nhập email và mã xác thực <strong>${trackingCode}</strong></li>
                    <li>Nhấn "Xác thực" để xem danh sách đơn hàng</li>
                    <li>Chọn đơn hàng cần xem chi tiết</li>
                  </ul>
                </div>

                <div style="text-align: center;">
                  <a href="${process.env.CLIENT_URL}/guest-tracking" class="button">
                    Tra Cứu Đơn Hàng Ngay
                  </a>
                </div>

                <div class="warning-box">
                  <p style="margin: 0; color: #92400e; font-weight: 600;">Lưu ý quan trọng:</p>
                  <p style="margin: 8px 0 0 0; color: #92400e;">
                    Mã xác thực chỉ có hiệu lực trong 10 phút<br>
                    Không chia sẻ mã này với bất kỳ ai<br>
                    Nếu bạn không yêu cầu tra cứu, vui lòng bỏ qua email này
                  </p>
                </div>
              </div>

              <div class="footer">
                <p><strong>ZK CAR - Thuê Xe Điện Tự Lái</strong></p>
                <p>Hotline: 1900 xxxx | Email: support@zkcar.com</p>
                <p>Website: ${process.env.CLIENT_URL}</p>
                <p style="margin-top: 15px; font-size: 11px; color: #9ca3af;">
                  Email này được gửi tự động. Vui lòng không trả lời email này.
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

      const result = await sgMail.send(msg);
      console.log(` Tracking code sent to ${email}. StatusCode: ${result[0].statusCode}`);
      
      return { success: true, messageId: result[0].headers['x-message-id'] };
    } catch (error) {
      console.error(' Error sending tracking code:', error.message);
      if (error.response) {
        console.error('SendGrid error details:', error.response.body);
      }
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  // Gửi email xác nhận booking
  async sendBookingConfirmation(booking, recipientEmail) {
    if (!this.isConfigured) {
      console.warn('Email service not configured. Skipping email.');
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

      const msg = {
        to: recipientEmail,
        from: {
          email: process.env.EMAIL_FROM,
          name: 'ZK CAR - Thuê Xe Tự Lái'
        },
        subject: `Xác nhận đặt xe thành công - Mã ${bookingCode}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
              @media only screen and (max-width: 600px) {
                .container { padding: 10px; }
                .content { padding: 20px 15px; }
                .info-row { flex-direction: column; }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 28px;">Đặt xe thành công!</h1>
                <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Cảm ơn bạn đã tin tưởng ZK CAR</p>
              </div>
              
              <div class="content">
                <p>Xin chào <strong>${customerName}</strong>,</p>
                <p>Đơn đặt xe của bạn đã được xác nhận thành công! Dưới đây là thông tin chi tiết:</p>

                <div class="booking-card">
                  <h3 style="margin-top: 0; color: #10b981;">Thông tin đặt xe</h3>
                  
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
                  <strong>Các bước tiếp theo:</strong>
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
                  Vui lòng đến đúng giờ để không mất phí giữ chỗ<br>
                  Kiểm tra xe kỹ và báo ngay nếu có vấn đề<br>
                  Giữ liên lạc qua hotline: <strong>1900 xxxx</strong>
                </p>

                <div class="footer">
                  <p><strong>ZK CAR - Thuê Xe Điện Tự Lái</strong></p>
                  <p>Hotline: 1900 xxxx | Email: support@zkcar.com</p>
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

      const result = await sgMail.send(msg);
      console.log(` Booking confirmation sent to ${recipientEmail}`);
      
      return { success: true, messageId: result[0].headers['x-message-id'] };
    } catch (error) {
      console.error(' Error sending booking confirmation:', error.message);
      if (error.response) {
        console.error('SendGrid error details:', error.response.body);
      }
      throw error;
    }
  }

  // Gửi email thông báo hủy
  async sendCancellationEmail(booking, recipientEmail, reason = '') {
    if (!this.isConfigured) {
      console.warn('Email service not configured. Skipping email.');
      return { success: false, message: 'Email service not configured' };
    }

    try {
      const customerName = 
        booking.customerInfo?.name || 
        booking.user?.name || 
        booking.guestInfo?.name || 
        'Quý khách';

      const bookingCode = booking._id.toString().slice(-8).toUpperCase();

      const msg = {
        to: recipientEmail,
        from: {
          email: process.env.EMAIL_FROM,
          name: 'ZK CAR - Thuê Xe Tự Lái'
        },
        subject: `Đơn đặt xe đã bị hủy - Mã ${bookingCode}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
                  <p><strong>ZK CAR - Thuê Xe Điện Tự Lái</strong></p>
                  <p>Hotline: 1900 xxxx | Email: support@zkcar.com</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
      };

      const result = await sgMail.send(msg);
      console.log(` Cancellation email sent to ${recipientEmail}`);
      
      return { success: true, messageId: result[0].headers['x-message-id'] };
    } catch (error) {
      console.error(' Error sending cancellation email:', error.message);
      if (error.response) {
        console.error('SendGrid error details:', error.response.body);
      }
      throw error;
    }
  }
}

export default new EmailService();