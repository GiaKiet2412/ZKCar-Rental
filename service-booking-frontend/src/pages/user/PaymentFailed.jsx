import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { XCircle, AlertCircle, Home, RefreshCw } from 'lucide-react';

const PaymentFailed = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const message = searchParams.get('message') || 'Thanh toán thất bại';
  const bookingId = searchParams.get('bookingId');

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Failed Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
            <XCircle className="text-red-600" size={48} />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Thanh toán thất bại
          </h1>
          <p className="text-gray-600">
            Giao dịch của bạn không thể hoàn tất
          </p>
        </div>

        {/* Error Message */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-start gap-3 mb-4">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-1" size={24} />
            <div>
              <p className="font-semibold text-gray-800 mb-1">Lý do thất bại:</p>
              <p className="text-gray-600">{decodeURIComponent(message)}</p>
            </div>
          </div>

          {bookingId && (
            <div className="border-t pt-4">
              <p className="text-sm text-gray-600 mb-1">Mã đặt xe của bạn</p>
              <p className="text-xl font-mono font-bold text-gray-800">
                #{bookingId.slice(-8).toUpperCase()}
              </p>
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 mb-6">
          <h3 className="font-semibold text-gray-800 mb-3">💡 Thông tin quan trọng:</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex gap-2">
              <span>•</span>
              <span>Đơn hàng của bạn vẫn được giữ trong <strong>15 phút</strong></span>
            </li>
            <li className="flex gap-2">
              <span>•</span>
              <span>Bạn có thể thử lại thanh toán hoặc chọn phương thức khác</span>
            </li>
            <li className="flex gap-2">
              <span>•</span>
              <span>Nếu gặp sự cố, vui lòng liên hệ hotline để được hỗ trợ</span>
            </li>
          </ul>
        </div>

        {/* Common Reasons */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h3 className="font-semibold text-gray-800 mb-3">Nguyên nhân thường gặp:</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex gap-2">
              <span>1.</span>
              <span>Số dư tài khoản không đủ</span>
            </li>
            <li className="flex gap-2">
              <span>2.</span>
              <span>Nhập sai thông tin thẻ hoặc OTP</span>
            </li>
            <li className="flex gap-2">
              <span>3.</span>
              <span>Thẻ chưa đăng ký Internet Banking</span>
            </li>
            <li className="flex gap-2">
              <span>4.</span>
              <span>Đã hủy giao dịch trong quá trình thanh toán</span>
            </li>
            <li className="flex gap-2">
              <span>5.</span>
              <span>Lỗi kết nối mạng hoặc ngân hàng đang bảo trì</span>
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          {bookingId ? (
            <>
              <button
                onClick={() => navigate(`/payment/${bookingId}`)}
                className="flex-1 bg-red-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-red-700 transition flex items-center justify-center gap-2"
              >
                <RefreshCw size={20} />
                Thử lại thanh toán
              </button>
              <button
                onClick={() => navigate(`/booking/${bookingId}`)}
                className="flex-1 bg-white text-gray-800 py-3 px-6 rounded-xl font-semibold border-2 border-gray-200 hover:bg-gray-50 transition"
              >
                Xem đơn hàng
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate('/')}
              className="w-full bg-white text-gray-800 py-3 px-6 rounded-xl font-semibold border-2 border-gray-200 hover:bg-gray-50 transition flex items-center justify-center gap-2"
            >
              <Home size={20} />
              Về trang chủ
            </button>
          )}
        </div>

        {/* Support */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600 mb-2">
            Cần hỗ trợ ngay?
          </p>
          <div className="flex items-center justify-center gap-4">
            <a 
              href="tel:1900xxxx" 
              className="text-red-600 font-semibold hover:underline flex items-center gap-1"
            >
              📞 1900 xxxx
            </a>
            <span className="text-gray-300">|</span>
            <a 
              href="mailto:support@kietcar.com" 
              className="text-red-600 font-semibold hover:underline flex items-center gap-1"
            >
              ✉️ support@kietcar.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailed;