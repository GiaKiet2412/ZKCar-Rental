import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  CheckCircle, 
  Calendar, 
  MapPin, 
  CreditCard,
  Clock,
  AlertCircle,
  ArrowLeft,
  Info,
  Truck,
  Shield,
  Receipt,
  Wallet
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

  const getStatusConfig = (status) => {
    const configs = {
      pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', label: 'Chờ xác nhận' },
      confirmed: { color: 'bg-blue-100 text-blue-800 border-blue-300', label: 'Đã xác nhận' },
      ongoing: { color: 'bg-purple-100 text-purple-800 border-purple-300', label: 'Đang diễn ra' },
      completed: { color: 'bg-green-100 text-green-800 border-green-300', label: 'Hoàn thành' },
      cancelled: { color: 'bg-red-100 text-red-800 border-red-300', label: 'Đã hủy' }
    };
    return configs[status] || { color: 'bg-gray-100 text-gray-800 border-gray-300', label: status };
  };

  const getPaymentStatusConfig = (status) => {
    const configs = {
      paid: { color: 'bg-green-100 text-green-800 border-green-300', label: 'Đã thanh toán' },
      pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', label: 'Chờ thanh toán' },
      failed: { color: 'bg-red-100 text-red-800 border-red-300', label: 'Thất bại' },
      refunded: { color: 'bg-gray-100 text-gray-800 border-gray-300', label: 'Đã hoàn tiền' }
    };
    return configs[status] || { color: 'bg-gray-100 text-gray-800 border-gray-300', label: status };
  };

  const getPaymentMethodLabel = (method) => {
    const labels = {
      vnpay: 'VNPay',
      cash: 'Tiền mặt',
      transfer: 'Chuyển khoản'
    };
    return labels[method] || method;
  };

  const getPaymentTypeLabel = (type) => {
    return type === 'hold' ? 'Giữ chỗ' : 'Thanh toán toàn bộ';
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

  const statusConfig = getStatusConfig(booking.status);
  const paymentStatusConfig = getPaymentStatusConfig(booking.paymentStatus);
  
  const vehicleImagePath = booking.vehicle?.images?.[0] || booking.vehicle?.image;
  const vehicleImage = vehicleImagePath 
    ? `http://localhost:5000${vehicleImagePath}` 
    : '/no-image.png';

  // Tính tổng tiền cần thanh toán
  const depositAmount = booking.depositAmount || 3000000; // Default 3tr
  const holdFee = booking.holdFee || 500000; // Default 500k
  
  // Tổng tiền phải trả (không bao gồm holdFee vì nó chỉ là phí giữ chỗ)
  const grandTotal = booking.finalAmount + depositAmount;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Quay lại</span>
        </button>

        <div className="bg-white rounded-2xl shadow-sm p-8 mb-6 text-center border-2 border-green-100">
          <CheckCircle className="mx-auto text-green-600 mb-4" size={64} />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Đặt xe thành công!
          </h1>
          <p className="text-gray-600 mb-4">
            Mã đặt xe: <span className="font-mono font-bold text-green-600 text-lg">
              #{booking._id.slice(-8).toUpperCase()}
            </span>
          </p>
          <div className="flex items-center justify-center gap-4">
            <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${statusConfig.color}`}>
              {statusConfig.label}
            </span>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${paymentStatusConfig.color}`}>
              {paymentStatusConfig.label}
            </span>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {booking.vehicle && (
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Thông tin xe</h2>
                <div className="flex gap-4">
                  <img
                    src={vehicleImage}
                    alt={booking.vehicle.name}
                    className="w-40 h-32 object-cover rounded-xl border border-gray-200"
                    onError={(e) => {
                      e.target.src = '/no-image.png';
                    }}
                  />
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800 mb-2">
                      {booking.vehicle.name}
                    </h3>
                    <div className="flex items-center gap-2 text-gray-600 text-sm mb-2">
                      <MapPin size={16} className="text-green-600" />
                      <span>{booking.vehicle.location}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-semibold">{formatCurrencyVN(booking.vehicle.pricePerHour)}</span>/giờ
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Calendar size={24} className="text-green-600" />
                Thời gian thuê
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1 font-medium">Ngày nhận xe</p>
                  <p className="font-bold text-gray-800">
                    {new Date(booking.pickupDate).toLocaleString('vi-VN')}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1 font-medium">Ngày trả xe</p>
                  <p className="font-bold text-gray-800">
                    {new Date(booking.returnDate).toLocaleString('vi-VN')}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <MapPin size={24} className="text-green-600" />
                Địa điểm nhận xe
              </h2>
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                {booking.pickupType === 'delivery' ? (
                  <div className="flex items-start gap-3">
                    <Truck className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                      <p className="font-semibold text-blue-900 mb-1">Giao xe tận nơi</p>
                      <p className="text-blue-700">{booking.deliveryLocation}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <MapPin className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                      <p className="font-semibold text-blue-900 mb-1">Nhận tại địa chỉ xe</p>
                      <p className="text-blue-700">{booking.vehicle?.location || 'Chưa cập nhật'}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {booking.notes && (
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Info size={24} className="text-green-600" />
                  Ghi chú
                </h2>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-xl">{booking.notes}</p>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 sticky top-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Receipt size={24} className="text-green-600" />
                Chi tiết thanh toán
              </h3>

              <div className="space-y-3 mb-4 pb-4 border-b">
                <h4 className="font-semibold text-gray-700 text-sm">Phí thuê xe</h4>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tiền thuê xe:</span>
                  <span className="font-semibold text-gray-800">
                    {formatCurrencyVN(booking.originalAmount)}
                  </span>
                </div>

                {booking.insuranceFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 flex items-center gap-1">
                      <Shield size={14} />
                      Bảo hiểm:
                    </span>
                    <span className="font-semibold text-gray-800">
                      {formatCurrencyVN(booking.insuranceFee)}
                    </span>
                  </div>
                )}

                {booking.deliveryFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 flex items-center gap-1">
                      <Truck size={14} />
                      Phí giao xe:
                    </span>
                    <span className="font-semibold text-gray-800">
                      {formatCurrencyVN(booking.deliveryFee)}
                    </span>
                  </div>
                )}

                {booking.VAT > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">VAT:</span>
                    <span className="font-semibold text-gray-800">
                      {formatCurrencyVN(booking.VAT)}
                    </span>
                  </div>
                )}

                {booking.discountAmount > 0 && (
                  <div className="flex justify-between text-sm pt-2 border-t">
                    <span className="text-green-600 font-medium">Giảm giá ({booking.discountCode}):</span>
                    <span className="font-bold text-green-600">
                      -{formatCurrencyVN(booking.discountAmount)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="font-semibold text-gray-700">Tạm tính:</span>
                  <span className="font-bold text-gray-800">
                    {formatCurrencyVN(booking.finalAmount)}
                  </span>
                </div>
              </div>

              <div className="space-y-3 mb-4 pb-4 border-b">
                <h4 className="font-semibold text-gray-700 text-sm">Phí bổ sung</h4>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-1">
                    <Wallet size={14} />
                    Tiền thế chấp:
                  </span>
                  <span className="font-semibold text-gray-800">
                    {formatCurrencyVN(depositAmount)}
                  </span>
                </div>

                {booking.paymentType === 'hold' && (
                  <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-xs text-amber-700">
                    <p className="font-semibold mb-1">Lưu ý về phí giữ chỗ:</p>
                    <p>Phí giữ chỗ {formatCurrencyVN(holdFee)} được tính riêng để đặt cọc trước. Số tiền này sẽ được trừ vào tổng tiền khi nhận xe.</p>
                  </div>
                )}
              </div>

              <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl border-2 border-green-200 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-base font-bold text-gray-800">TỔNG CỘNG:</span>
                  <span className="text-2xl font-bold text-green-600">
                    {formatCurrencyVN(grandTotal)}
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-gray-700">Hình thức:</span>
                  <span className="text-sm font-bold text-gray-800">
                    {getPaymentMethodLabel(booking.paymentMethod)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-700">Loại thanh toán:</span>
                  <span className="text-sm font-bold text-gray-800">
                    {getPaymentTypeLabel(booking.paymentType)}
                  </span>
                </div>
              </div>

              {booking.paymentType === 'hold' && (
                <div className="bg-blue-50 p-4 rounded-xl border-2 border-blue-200 mb-4">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-700 font-medium">Phí giữ chỗ (đã trả):</span>
                      <span className="text-blue-900 font-bold">
                        {formatCurrencyVN(holdFee)}
                      </span>
                    </div>
                    <div className="border-t border-blue-200 pt-3">
                      <div className="flex justify-between font-bold text-base mb-2">
                        <span className="text-blue-800">Còn lại phải trả khi nhận xe:</span>
                        <span className="text-blue-900 text-lg">
                          {formatCurrencyVN(grandTotal - holdFee)}
                        </span>
                      </div>
                      <div className="text-xs text-blue-600 space-y-1 pl-4">
                        <p>• Phí thuê xe: {formatCurrencyVN(booking.finalAmount)}</p>
                        <p>• Tiền thế chấp: {formatCurrencyVN(depositAmount)}</p>
                        <p className="font-semibold pt-1">= Tổng: {formatCurrencyVN(grandTotal - holdFee)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {booking.paymentType === 'full' && booking.paymentStatus === 'paid' && (
                <div className="bg-green-50 p-4 rounded-xl border-2 border-green-200 mb-4">
                  <div className="text-center">
                    <p className="font-bold text-green-900 mb-1">Đã thanh toán toàn bộ</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrencyVN(grandTotal)}
                    </p>
                  </div>
                </div>
              )}

              {booking.paymentStatus === 'pending' && (
                <button
                  onClick={handlePayment}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-xl font-bold hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  <CreditCard size={20} />
                  Thanh toán ngay
                </button>
              )}

              {booking.paymentStatus === 'paid' && booking.paidAt && (
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                    <div className="flex-1">
                      <p className="font-bold text-green-900 mb-1">Đã thanh toán</p>
                      <p className="text-sm text-green-700">
                        {new Date(booking.paidAt).toLocaleString('vi-VN')}
                      </p>
                      {booking.vnpayBankCode && (
                        <p className="text-xs text-green-600 mt-1">
                          Ngân hàng: {booking.vnpayBankCode}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start gap-2">
                  <Clock className="text-amber-600 flex-shrink-0 mt-0.5" size={18} />
                  <div className="text-xs text-amber-800">
                    <p className="font-bold mb-2">Lưu ý quan trọng:</p>
                    <ul className="space-y-1 list-disc list-inside">
                      <li>Thanh toán trong vòng 24h</li>
                      <li>Mang CCCD khi nhận xe</li>
                      <li>Kiểm tra xe kỹ trước khi nhận</li>
                      {booking.paymentType === 'hold' && (
                        <li>Thanh toán số tiền còn lại khi nhận xe</li>
                      )}
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