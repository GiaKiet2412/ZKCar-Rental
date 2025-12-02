import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import API from '../../api/axios';

const PaymentReturn = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [status, setStatus] = useState('processing'); // processing, success, failed
  const [message, setMessage] = useState('');
  const [bookingId, setBookingId] = useState('');

  useEffect(() => {
    verifyPayment();
  }, []);

  const verifyPayment = async () => {
    try {
      // Lấy tất cả query params từ VNPay
      const params = {};
      searchParams.forEach((value, key) => {
        params[key] = value;
      });

      // Gọi API verify
      const res = await API.get('/api/payment/vnpay-return', { params });

      if (res.data.success) {
        setStatus('success');
        setMessage(res.data.message || 'Thanh toán thành công!');
        setBookingId(res.data.bookingId);
      } else {
        setStatus('failed');
        setMessage(res.data.message || 'Thanh toán thất bại!');
      }
    } catch (err) {
      console.error('Error verifying payment:', err);
      setStatus('failed');
      setMessage(err.response?.data?.message || 'Có lỗi xảy ra khi xác thực thanh toán');
    }
  };

  if (status === 'processing') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin mx-auto text-green-600 mb-4" size={48} />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Đang xác thực thanh toán...
          </h2>
          <p className="text-gray-600">Vui lòng đợi trong giây lát</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          {status === 'success' ? (
            <>
              <CheckCircle className="mx-auto text-green-600 mb-4" size={64} />
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Thanh toán thành công!
              </h1>
              <p className="text-gray-600 mb-6">{message}</p>
              
              {bookingId && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                  <p className="text-sm text-green-800 mb-1">Mã đặt xe của bạn</p>
                  <p className="text-xl font-mono font-bold text-green-700">
                    #{bookingId.slice(-8).toUpperCase()}
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={() => navigate(bookingId ? `/booking/${bookingId}` : '/')}
                  className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors"
                >
                  {bookingId ? 'Xem chi tiết đặt xe' : 'Về trang chủ'}
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="w-full bg-white border-2 border-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Thuê xe khác
                </button>
              </div>
            </>
          ) : (
            <>
              <XCircle className="mx-auto text-red-600 mb-4" size={64} />
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Thanh toán thất bại
              </h1>
              <p className="text-gray-600 mb-6">{message}</p>

              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <p className="text-sm text-red-800">
                  Đơn hàng của bạn vẫn được giữ trong vòng 24h. 
                  Vui lòng thử lại hoặc liên hệ hỗ trợ.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => navigate(-2)} // Quay lại trang thanh toán
                  className="w-full bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors"
                >
                  Thử lại thanh toán
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="w-full bg-white border-2 border-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Về trang chủ
                </button>
              </div>
            </>
          )}

          <p className="text-xs text-gray-500 mt-6">
            Cần hỗ trợ? Liên hệ: <a href="tel:1900xxxx" className="text-green-600 hover:underline">1900xxxx</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentReturn;