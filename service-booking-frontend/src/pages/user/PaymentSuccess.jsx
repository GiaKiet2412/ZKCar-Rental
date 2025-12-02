import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Calendar, MapPin, Car, Phone, Mail, User } from 'lucide-react';
import API from '../../api/axios';
import { formatCurrencyVN } from '../../utils/formatUtils';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const bookingId = searchParams.get('bookingId');
  const amount = searchParams.get('amount');
  
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (bookingId) {
      fetchBooking();
    }
  }, [bookingId]);

  const fetchBooking = async () => {
    try {
      const res = await API.get(`/api/bookings/${bookingId}`);
      console.log('Booking response:', res.data);
      
      if (res.data.success) {
        setBooking(res.data.booking);
      } else if (res.data._id) {
        setBooking(res.data);
      }
    } catch (err) {
      console.error('Error fetching booking:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (date) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'N/A';
    
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${hours}:${minutes}, ${day}/${month}/${year}`;
  };

  // ✅ Helper để lấy thông tin khách hàng - Ưu tiên customerInfo
  const getCustomerInfo = () => {
    // Priority 1: customerInfo (from booking form)
    if (booking?.customerInfo && booking.customerInfo.phone) {
      return booking.customerInfo;
    }
    
    // Priority 2: populated user object
    if (booking?.user && typeof booking.user === 'object' && booking.user.phone) {
      return {
        name: booking.user.name,
        email: booking.user.email,
        phone: booking.user.phone
      };
    }
    
    // Priority 3: guestInfo (legacy)
    if (booking?.guestInfo && booking.guestInfo.phone) {
      return booking.guestInfo;
    }
    
    // Fallback
    return { 
      name: booking?.user?.name || 'N/A', 
      email: booking?.user?.email || 'N/A', 
      phone: 'Chưa cập nhật' 
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const customerInfo = getCustomerInfo();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4 animate-bounce">
            <CheckCircle className="text-green-600" size={48} />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Thanh toán thành công!
          </h1>
          <p className="text-gray-600">
            Cảm ơn bạn đã đặt xe tại KIETCAR
          </p>
        </div>

        {/* Booking Info Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="border-b pb-4 mb-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Mã đơn hàng</p>
                <p className="text-xl font-bold text-gray-800">
                  #{bookingId?.slice(-8).toUpperCase()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Số tiền đã thanh toán</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrencyVN(parseInt(amount) || booking?.holdFee || 0)}
                </p>
              </div>
            </div>
          </div>

          {booking && (
            <div className="space-y-4">
              {/* Customer Info */}
              <div className="bg-blue-50 rounded-xl p-4 space-y-3">
                <h3 className="font-semibold text-gray-800 mb-2">Thông tin khách hàng</h3>
                
                <div className="flex items-start gap-3">
                  <User className="text-blue-600 flex-shrink-0 mt-1" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Họ tên</p>
                    <p className="font-semibold text-gray-800">
                      {customerInfo.name || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="text-blue-600 flex-shrink-0 mt-1" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Số điện thoại</p>
                    <p className="font-semibold text-gray-800">
                      {customerInfo.phone || 'Chưa cập nhật'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="text-blue-600 flex-shrink-0 mt-1" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-semibold text-gray-800">
                      {customerInfo.email || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Vehicle Info */}
              {booking.vehicle && (
                <div className="flex items-start gap-3">
                  <Car className="text-green-600 flex-shrink-0 mt-1" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Xe đã đặt</p>
                    <p className="font-semibold text-gray-800">
                      {typeof booking.vehicle === 'object' ? booking.vehicle.name : 'N/A'}
                    </p>
                  </div>
                </div>
              )}

              {/* Pickup Date */}
              <div className="flex items-start gap-3">
                <Calendar className="text-green-600 flex-shrink-0 mt-1" size={20} />
                <div>
                  <p className="text-sm text-gray-500">Thời gian thuê</p>
                  <p className="font-semibold text-gray-800">
                    {formatDateTime(booking.pickupDate)} 
                    {' → '}
                    {formatDateTime(booking.returnDate)}
                  </p>
                </div>
              </div>

              {/* Pickup Location */}
              <div className="flex items-start gap-3">
                <MapPin className="text-green-600 flex-shrink-0 mt-1" size={20} />
                <div>
                  <p className="text-sm text-gray-500">Địa điểm nhận xe</p>
                  <p className="font-semibold text-gray-800">
                    {booking.pickupType === 'delivery' && booking.deliveryLocation
                      ? booking.deliveryLocation
                      : booking.vehicle?.locationPickUp || 'Nhận tại chỗ'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Next Steps */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-6">
          <h3 className="font-semibold text-gray-800 mb-3">Các bước tiếp theo:</h3>
          <ol className="space-y-2 text-sm text-gray-700">
            <li className="flex gap-2">
              <span className="font-semibold">1.</span>
              <span>Chúng tôi đã gửi email xác nhận đến địa chỉ của bạn</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold">2.</span>
              <span>Chuẩn bị CCCD và bằng lái xe khi nhận xe</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold">3.</span>
              <span>Đến địa điểm nhận xe đúng giờ đã đặt</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold">4.</span>
              <span>Kiểm tra xe kỹ và ký biên bản bàn giao</span>
            </li>
          </ol>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={() => navigate(`/booking/${bookingId}`)}
            className="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition"
          >
            Xem chi tiết đơn hàng
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex-1 bg-white text-gray-800 py-3 rounded-xl font-semibold border-2 border-gray-200 hover:bg-gray-50 transition"
          >
            Về trang chủ
          </button>
        </div>

        {/* Support */}
        <div className="text-center mt-6 text-sm text-gray-600">
          <p>Cần hỗ trợ? Liên hệ{' '}
            <a href="tel:1900xxxx" className="text-green-600 font-semibold hover:underline">
              1900 xxxx
            </a>
            {customerInfo.phone && customerInfo.phone !== 'Chưa cập nhật' && (
              <span> hoặc gọi lại số <strong>{customerInfo.phone}</strong></span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;