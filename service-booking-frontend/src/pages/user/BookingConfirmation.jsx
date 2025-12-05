import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Calendar, 
  MapPin, 
  Clock,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  CreditCard
} from 'lucide-react';
import API from '../../api/axios';
import { formatCurrencyVN } from '../../utils/formatUtils';
import Header from '../../components/user/Header';

const BookingConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    email: ''
  });
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const bookingData = location.state;

  useEffect(() => {
    if (!bookingData) {
      navigate('/');
      return;
    }
  }, [bookingData, navigate]);

  if (!bookingData) {
    return null;
  }

  const {
    vehicle,
    pickup,
    returnDate,
    selectedPickup,
    deliveryLocation,
    rentFeeRounded,
    insuranceFee,
    deliveryFee,
    VATRounded,
    discountAmount,
    discountCode,
    totalRounded,
    selectedInsurance,
    selfReturn,
    holdFee,
    depositAmount
  } = bookingData;

  const handleConfirmBooking = async () => {
    // Validate
    if (!customerInfo.name.trim()) {
      setError('Vui lòng nhập họ tên');
      return;
    }
    if (!customerInfo.phone.trim()) {
      setError('Vui lòng nhập số điện thoại');
      return;
    }
    if (!/^[0-9]{10}$/.test(customerInfo.phone)) {
      setError('Số điện thoại không hợp lệ (10 chữ số)');
      return;
    }

    try {
      setIsCreating(true);
      setError('');

      // GỬI customerInfo thay vì guestInfo
      const requestData = {
        vehicleId: vehicle._id,
        pickupDate: pickup,
        returnDate: returnDate,
        pickupType: selectedPickup,
        deliveryLocation: selectedPickup === 'delivery' ? deliveryLocation : null,
        originalAmount: rentFeeRounded,
        insuranceFee: insuranceFee,
        deliveryFee: deliveryFee,
        VAT: VATRounded,
        discountCode: discountCode || null,
        customerInfo: {  // THAY ĐỔI: dùng customerInfo
          name: customerInfo.name,
          phone: customerInfo.phone,
          email: customerInfo.email || null
        },
        notes: `Gói bảo hiểm: ${selectedInsurance}${selfReturn ? ', Tự trả xe' : ''}`
      };

      console.log('Creating booking with data:', requestData);

      const res = await API.post('/api/bookings', requestData);

      if (res.data.success) {
        navigate(`/payment/${res.data.booking._id}`);
      } else {
        setError(res.data.message || 'Không thể tạo đơn đặt xe');
      }
    } catch (err) {
      console.error('Error creating booking:', err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsCreating(false);
    }
  };

  const formatDateTime = (date) => {
    const d = new Date(date);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${hours}:${minutes}, ${day}/${month}/${year}`;
  };

  const totalPayOnPickup = totalRounded + depositAmount - holdFee;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Quay lại</span>
        </button>

        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Xác nhận đặt xe</h1>
          <p className="text-gray-600">
            Vui lòng kiểm tra thông tin và nhập thông tin liên hệ để hoàn tất đặt xe
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          {/* Thông tin chính */}
          <div className="md:col-span-2 space-y-6">
            {/* Thông tin khách hàng */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Thông tin người đặt xe
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                    placeholder="Nhập họ tên của bạn"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                    placeholder="Nhập số điện thoại (10 chữ số)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email (không bắt buộc)
                  </label>
                  <input
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                    placeholder="Nhập email (nếu có)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-green-500"
                  />
                </div>
              </div>
            </div>

            {/* Thông tin đơn hàng */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Thông tin đơn hàng
              </h2>

              {/* Thông tin xe */}
              <div className="flex gap-4 mb-6 pb-6 border-b">
                {vehicle.images?.[0] && (
                  <img
                    src={`http://localhost:5000${vehicle.images[0]}`}
                    alt={vehicle.name}
                    className="w-24 h-24 object-cover rounded-xl"
                  />
                )}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">{vehicle.name}</h3>
                  <div className="flex items-center gap-2 text-gray-600 text-sm">
                    <MapPin size={16} />
                    <span>{vehicle.location}</span>
                  </div>
                </div>
              </div>

              {/* Thời gian thuê */}
              <div className="mb-6 pb-6 border-b">
                <div className="flex items-center gap-2 text-gray-800 font-medium mb-3">
                  <Calendar size={20} />
                  <span>Thời gian thuê</span>
                </div>
                <p className="text-gray-700">
                  {formatDateTime(pickup)} đến {formatDateTime(returnDate)}
                </p>
              </div>

              {/* Địa điểm nhận xe */}
              <div>
                <div className="flex items-center gap-2 text-gray-800 font-medium mb-3">
                  <MapPin size={20} />
                  <span>
                    {selectedPickup === 'delivery' 
                      ? 'Giao xe tận nơi' 
                      : 'Nhận xe tại vị trí xe hiện tại'}
                  </span>
                </div>
                <p className="text-gray-700">
                  {selectedPickup === 'delivery' 
                    ? deliveryLocation 
                    : vehicle.locationPickUp}
                </p>
              </div>
            </div>
          </div>

          {/* Tóm tắt thanh toán */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Chi tiết thanh toán
              </h3>

              <div className="space-y-3 text-sm mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Phí thuê xe:</span>
                  <span className="font-medium">{formatCurrencyVN(rentFeeRounded)}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Giảm giá ({discountCode}):</span>
                    <span className="font-medium">-{formatCurrencyVN(discountAmount)}</span>
                  </div>
                )}

                {insuranceFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bảo hiểm:</span>
                    <span className="font-medium">{formatCurrencyVN(insuranceFee)}</span>
                  </div>
                )}

                {deliveryFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phí giao xe:</span>
                    <span className="font-medium">{formatCurrencyVN(deliveryFee)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-gray-600">Thuế VAT:</span>
                  <span className="font-medium">{formatCurrencyVN(VATRounded)}</span>
                </div>

                <div className="border-t pt-3">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-semibold text-gray-800">Tổng cộng tiền thuê:</span>
                    <span className="text-xl font-bold text-green-600">
                      {formatCurrencyVN(totalRounded)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Các bước thanh toán */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-800 mb-3">Các bước thanh toán</h4>
                
                <div className="space-y-4">
                  {/* Bước 1 */}
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                        1
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800 mb-1">
                          Thanh toán giữ chỗ qua KIETCAR
                        </p>
                        <p className="text-2xl font-bold text-green-600 mb-2">
                          {formatCurrencyVN(holdFee)}
                        </p>
                        <p className="text-xs text-gray-600">
                          Tiền này để xác nhận đơn thuê và giữ xe, sẽ được trừ vào tiền thế chấp khi nhận xe.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Bước 2 */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-gray-400 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                        2
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800 mb-2">
                          Thanh toán khi nhận xe
                        </p>
                        <p className="text-2xl font-bold text-gray-800 mb-3">
                          {formatCurrencyVN(totalPayOnPickup)}
                        </p>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Tiền thuê:</span>
                            <span className="font-medium">{formatCurrencyVN(totalRounded)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Tiền thế chấp:</span>
                            <div className="text-right">
                              <span className="line-through text-gray-400 mr-2">
                                {formatCurrencyVN(depositAmount)}
                              </span>
                              <span className="font-medium text-green-600">
                                {formatCurrencyVN(depositAmount - holdFee)}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 italic mt-2">
                            Tiền thế chấp sẽ hoàn lại khi trả xe
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleConfirmBooking}
                disabled={isCreating || !customerInfo.name || !customerInfo.phone}
                className={`w-full mt-6 py-3 rounded-xl font-semibold transition-all ${
                  isCreating || !customerInfo.name || !customerInfo.phone
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl'
                }`}
              >
                {isCreating ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Đang xử lý...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <CheckCircle2 size={20} />
                    Xác nhận đặt xe
                  </span>
                )}
              </button>

              <p className="text-xs text-gray-500 text-center mt-3">
                Bằng việc xác nhận, bạn đồng ý với{' '}
                <a href="/terms" className="text-green-600 hover:underline">
                  Điều khoản dịch vụ
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;