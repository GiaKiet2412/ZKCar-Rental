import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  CheckCircle, 
  Calendar, 
  MapPin, 
  CreditCard,
  Clock,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import API from '../../api/axios';
import { formatCurrencyVN } from '../../utils/formatUtils';

const BookingDetail = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  const fetchBooking = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/api/bookings/${bookingId}`);
      
      if (res.data.success) {
        setBooking(res.data.booking);
      } else {
        setError('Không tìm thấy thông tin đặt xe');
      }
    } catch (err) {
      console.error('Error fetching booking:', err);
      setError(err.response?.data?.message || 'Lỗi khi tải thông tin đặt xe');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = () => {
    navigate(`/payment/${bookingId}`);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      ongoing: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    const texts = {
      pending: 'Chờ xác nhận',
      confirmed: 'Đã xác nhận',
      ongoing: 'Đang diễn ra',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy'
    };
    return texts[status] || status;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Có lỗi xảy ra</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-colors"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Quay lại</span>
        </button>

        {/* Success Message */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-6 text-center">
          <CheckCircle className="mx-auto text-green-600 mb-4" size={64} />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Đặt xe thành công!
          </h1>
          <p className="text-gray-600 mb-4">
            Mã đặt xe: <span className="font-mono font-semibold text-green-600">
              #{booking._id.slice(-8).toUpperCase()}
            </span>
          </p>
          <div className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(booking.status)}`}>
            {getStatusText(booking.status)}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Chi tiết booking */}
          <div className="md:col-span-2 space-y-6">
            {/* Thông tin xe */}
            {booking.vehicle && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Thông tin xe
                </h2>
                <div className="flex gap-4">
                  {booking.vehicle.images?.[0] && (
                    <img
                      src={booking.vehicle.images[0]}
                      alt={booking.vehicle.name}
                      className="w-32 h-32 object-cover rounded-xl"
                    />
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      {booking.vehicle.name}
                    </h3>
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <MapPin size={16} />
                      <span>{booking.vehicle.location}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Thời gian thuê */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Calendar size={24} />
                Thời gian thuê
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Ngày nhận xe</p>
                  <p className="font-semibold text-gray-800">
                    {new Date(booking.pickupDate).toLocaleString('vi-VN')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Ngày trả xe</p>
                  <p className="font-semibold text-gray-800">
                    {new Date(booking.returnDate).toLocaleString('vi-VN')}
                  </p>
                </div>
              </div>
            </div>

            {/* Địa điểm nhận xe */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <MapPin size={24} />
                Địa điểm nhận xe
              </h2>
              <p className="text-gray-700">
                {booking.pickupType === 'delivery' ? (
                  <>
                    <span className="font-semibold">Giao xe tận nơi:</span> {booking.deliveryLocation}
                  </>
                ) : (
                  <>
                    <span className="font-semibold">Nhận tại địa chỉ xe:</span> {booking.vehicle?.location || 'Chưa cập nhật'}
                  </>
                )}
              </p>
            </div>

            {/* Ghi chú */}
            {booking.notes && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Ghi chú
                </h2>
                <p className="text-gray-700">{booking.notes}</p>
              </div>
            )}
          </div>

          {/* Tóm tắt thanh toán */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Chi tiết thanh toán
              </h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Phí thuê xe:</span>
                  <span className="font-medium">
                    {formatCurrencyVN(booking.originalAmount)}
                  </span>
                </div>

                {booking.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Giảm giá ({booking.discountCode}):</span>
                    <span className="font-medium">
                      -{formatCurrencyVN(booking.discountAmount)}
                    </span>
                  </div>
                )}

                {booking.insuranceFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bảo hiểm:</span>
                    <span className="font-medium">
                      {formatCurrencyVN(booking.insuranceFee)}
                    </span>
                  </div>
                )}

                {booking.deliveryFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phí giao xe:</span>
                    <span className="font-medium">
                      {formatCurrencyVN(booking.deliveryFee)}
                    </span>
                  </div>
                )}

                {booking.VAT > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">VAT:</span>
                    <span className="font-medium">
                      {formatCurrencyVN(booking.VAT)}
                    </span>
                  </div>
                )}

                <div className="border-t pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-800">Tổng cộng:</span>
                    <span className="text-2xl font-bold text-green-600">
                      {formatCurrencyVN(booking.finalAmount)}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-700 font-medium">Trạng thái thanh toán:</span>
                  </div>
                  <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                    booking.paymentStatus === 'paid' 
                      ? 'bg-green-100 text-green-800'
                      : booking.paymentStatus === 'failed'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {booking.paymentStatus === 'paid' ? 'Đã thanh toán' : 
                     booking.paymentStatus === 'failed' ? 'Thất bại' : 'Chờ thanh toán'}
                  </div>
                </div>
              </div>

              {booking.paymentStatus === 'pending' && (
                <button
                  onClick={handlePayment}
                  className="w-full mt-6 bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  <CreditCard size={20} />
                  Thanh toán ngay
                </button>
              )}

              {booking.paymentStatus === 'paid' && booking.paidAt && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                    <div className="text-sm">
                      <p className="font-semibold text-green-800 mb-1">
                        Đã thanh toán
                      </p>
                      <p className="text-green-700">
                        {new Date(booking.paidAt).toLocaleString('vi-VN')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-start gap-2">
                  <Clock className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">Lưu ý</p>
                    <ul className="space-y-1 list-disc list-inside text-blue-700">
                      <li>Vui lòng thanh toán trong vòng 24h</li>
                      <li>Mang theo CCCD khi nhận xe</li>
                      <li>Kiểm tra xe kỹ trước khi nhận</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetail;