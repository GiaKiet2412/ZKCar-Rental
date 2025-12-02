import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CreditCard, ChevronRight, Shield, Clock, AlertCircle, Copy, CheckCircle, DollarSign } from 'lucide-react';
import API from '../../api/axios';
import { formatCurrencyVN } from '../../utils/formatUtils';

const PaymentPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedBank, setSelectedBank] = useState('');
  const [paymentOption, setPaymentOption] = useState('hold');
  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const [copied, setCopied] = useState('');

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const fetchBooking = async () => {
    try {
      const res = await API.get(`/api/bookings/${bookingId}`);
      if (res.data.success) {
        setBooking(res.data.booking);
        
        if (res.data.booking.paymentStatus === 'paid') {
          navigate(`/booking/${bookingId}`);
        }
      }
    } catch (err) {
      console.error('Error fetching booking:', err);
    } finally {
      setLoading(false);
    }
  };

  const banks = [
    { code: 'VNPAYQR', name: 'Thanh toán qua QR Code', icon: '📱' },
    { code: 'VNBANK', name: 'Thẻ ATM/Tài khoản nội địa', icon: '🏦' },
    { code: 'INTCARD', name: 'Thẻ quốc tế (Visa/Master)', icon: '💳' },
    { code: 'NCB', name: 'Ngân hàng NCB', icon: '🏛️' },
    { code: 'VIETCOMBANK', name: 'Vietcombank', icon: '🏛️' },
    { code: 'TECHCOMBANK', name: 'Techcombank', icon: '🏛️' },
    { code: 'BIDV', name: 'BIDV', icon: '🏛️' },
    { code: 'VIETINBANK', name: 'VietinBank', icon: '🏛️' },
    { code: 'MBBANK', name: 'MBBank', icon: '🏛️' },
    { code: 'SACOMBANK', name: 'Sacombank', icon: '🏛️' }
  ];

  const handlePayment = async () => {
    if (!selectedBank) {
      alert('Vui lòng chọn phương thức thanh toán');
      return;
    }

    try {
      setProcessing(true);
      
      // Tính số tiền thanh toán
      const paymentAmount = paymentOption === 'full' 
        ? booking.finalAmount + booking.depositAmount
        : booking.holdFee;
      
      const res = await API.post('/api/payment/create-payment-url', {
        bookingId: booking._id,
        amount: paymentAmount,
        bankCode: selectedBank,
        paymentType: paymentOption // Thêm field này để backend biết
      });

      if (res.data.success) {
        window.location.href = res.data.paymentUrl;
      }
    } catch (err) {
      console.error('Error creating payment:', err);
      alert('Không thể tạo thanh toán. Vui lòng thử lại.');
    } finally {
      setProcessing(false);
    }
  };

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(''), 2000);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
          <p className="text-gray-600 mb-4">Không tìm thấy đơn hàng</p>
          <button onClick={() => navigate('/')} className="text-green-600 hover:underline">
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  const totalFullPayment = booking.finalAmount + booking.depositAmount;
  const totalPayOnPickup = paymentOption === 'full' 
    ? 0 
    : booking.finalAmount + booking.depositAmount - booking.holdFee;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header với countdown */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Shield className="text-green-600" size={28} />
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Thanh toán đặt xe</h1>
                <p className="text-3xl font-bold text-green-600 mt-1">
                  {paymentOption === 'full' 
                    ? formatCurrencyVN(totalFullPayment)
                    : formatCurrencyVN(booking.holdFee)
                  }
                </p>
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Thời gian giữ chỗ còn lại</p>
              <div className={`text-3xl font-bold ${timeLeft < 300 ? 'text-red-600' : 'text-green-600'}`}>
                {formatTime(timeLeft)}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Mã đặt xe</p>
                <p className="font-semibold text-gray-800">
                  #{booking._id.slice(-8).toUpperCase()}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Loại xe</p>
                <p className="font-semibold text-gray-800">
                  {booking.vehicle?.name || 'N/A'}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-gray-600">Ngày nhận - trả xe</p>
                <p className="font-semibold text-gray-800">
                  {formatDateTime(booking.pickupDate)} đến {formatDateTime(booking.returnDate)}
                </p>
              </div>
              {booking.guestInfo && (
                <>
                  <div>
                    <p className="text-gray-600 text-xs mb-1">Tên khách thuê</p>
                    <p className="font-semibold text-gray-800">{booking.guestInfo.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs mb-1">Số điện thoại</p>
                    <p className="font-semibold text-gray-800">{booking.guestInfo.phone}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {/* Chọn phương thức thanh toán */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Chọn loại thanh toán
              </h2>
              
              <div className="space-y-3 mb-6">
                {/* Thanh toán giữ chỗ */}
                <label
                  className={`flex items-start justify-between p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    paymentOption === 'hold'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1">
                    <input
                      type="radio"
                      name="paymentOption"
                      value="hold"
                      checked={paymentOption === 'hold'}
                      onChange={(e) => setPaymentOption(e.target.value)}
                      className="mt-1 w-4 h-4 text-green-600 accent-green-600"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign size={20} className="text-green-600" />
                        <span className="font-semibold text-gray-800">Thanh toán tiền giữ chỗ</span>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                          Phổ biến
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-green-600 mb-2">
                        {formatCurrencyVN(booking.holdFee)}
                      </p>
                      <p className="text-sm text-gray-600">
                        Thanh toán phần còn lại khi nhận xe
                      </p>
                    </div>
                  </div>
                </label>

                {/* Thanh toán 100% */}
                <label
                  className={`flex items-start justify-between p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    paymentOption === 'full'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1">
                    <input
                      type="radio"
                      name="paymentOption"
                      value="full"
                      checked={paymentOption === 'full'}
                      onChange={(e) => setPaymentOption(e.target.value)}
                      className="mt-1 w-4 h-4 text-green-600 accent-green-600"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CreditCard size={20} className="text-blue-600" />
                        <span className="font-semibold text-gray-800">Thanh toán 100% ngay</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-600 mb-2">
                        {formatCurrencyVN(totalFullPayment)}
                      </p>
                      <p className="text-sm text-gray-600">
                        Bao gồm tiền thuê + tiền thế chấp (hoàn lại khi trả xe)
                      </p>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Chọn ngân hàng */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Chọn phương thức thanh toán
              </h2>
              
              <div className="space-y-3">
                {banks.map((bank) => (
                  <label
                    key={bank.code}
                    className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      selectedBank === bank.code
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="bank"
                        value={bank.code}
                        checked={selectedBank === bank.code}
                        onChange={(e) => setSelectedBank(e.target.value)}
                        className="w-4 h-4 text-green-600 accent-green-600"
                      />
                      <span className="text-2xl">{bank.icon}</span>
                      <span className="font-medium text-gray-800">{bank.name}</span>
                    </div>
                    <ChevronRight className="text-gray-400" size={20} />
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Chi tiết thanh toán
              </h3>

              {paymentOption === 'hold' ? (
                // Thanh toán giữ chỗ
                <>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm font-semibold text-gray-800 mb-2">
                      Thanh toán ngay
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrencyVN(booking.holdFee)}
                    </p>
                    <p className="text-xs text-gray-600 mt-2">
                      Tiền giữ chỗ sẽ được trừ vào tiền thế chấp
                    </p>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-sm font-semibold text-gray-800 mb-2">
                      Thanh toán khi nhận xe
                    </p>
                    <p className="text-2xl font-bold text-gray-800">
                      {formatCurrencyVN(totalPayOnPickup)}
                    </p>
                    <div className="mt-3 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tiền thuê:</span>
                        <span className="font-medium">{formatCurrencyVN(booking.finalAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tiền thế chấp còn lại:</span>
                        <span className="font-medium text-green-600">
                          {formatCurrencyVN(booking.depositAmount - booking.holdFee)}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                // Thanh toán 100%
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm font-semibold text-gray-800 mb-2">
                      Thanh toán ngay
                    </p>
                    <p className="text-2xl font-bold text-blue-600 mb-3">
                      {formatCurrencyVN(totalFullPayment)}
                    </p>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tiền thuê:</span>
                        <span className="font-medium">{formatCurrencyVN(booking.finalAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tiền thế chấp:</span>
                        <span className="font-medium">{formatCurrencyVN(booking.depositAmount)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm font-semibold text-green-800 mb-1">
                      Thanh toán khi nhận xe: 0 VNĐ
                    </p>
                    <p className="text-xs text-gray-600">
                      Tiền thế chấp sẽ được hoàn lại khi trả xe
                    </p>
                  </div>
                </>
              )}

              <button
                onClick={handlePayment}
                disabled={!selectedBank || processing || timeLeft <= 0}
                className={`w-full py-3 rounded-xl font-semibold transition-all ${
                  !selectedBank || processing || timeLeft <= 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl'
                }`}
              >
                {processing ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Đang xử lý...
                  </span>
                ) : timeLeft <= 0 ? (
                  'Hết thời gian giữ chỗ'
                ) : (
                  `Thanh toán ${paymentOption === 'full' ? formatCurrencyVN(totalFullPayment) : formatCurrencyVN(booking.holdFee)}`
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;