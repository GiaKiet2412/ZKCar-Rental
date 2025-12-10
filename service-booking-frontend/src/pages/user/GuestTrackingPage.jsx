import React, { useState, useEffect } from 'react';
import { Mail, Phone, Key, Search, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import Header from '../../components/user/Header';

const GuestTrackingPage = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    trackingCode: ''
  });
  
  const [bookingsFound, setBookingsFound] = useState(0);
  const [bookings, setBookings] = useState([]);
  const [recipientEmail, setRecipientEmail] = useState('');

  // Check if user is returning from booking detail with valid session
  useEffect(() => {
    const guestEmail = sessionStorage.getItem('guestEmail');
    const guestPhone = sessionStorage.getItem('guestPhone');
    const verifiedBookings = sessionStorage.getItem('guestBookings');
    
    if ((guestEmail || guestPhone) && verifiedBookings) {
      try {
        const parsedBookings = JSON.parse(verifiedBookings);
        setFormData({
          email: guestEmail || '',
          phone: guestPhone || '',
          trackingCode: ''
        });
        setBookings(parsedBookings);
        setStep(2);
      } catch (err) {
        console.error('Error parsing stored bookings:', err);
        // Clear invalid data
        sessionStorage.removeItem('guestBookings');
      }
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleRequestCode = async (e) => {
    e.preventDefault();
    
    if (!formData.email && !formData.phone) {
      setError('Vui lòng nhập email hoặc số điện thoại');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const res = await fetch('http://localhost:5000/api/guest-bookings/request-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          phone: formData.phone
        })
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(`Mã xác thực đã được gửi đến email ${data.recipientEmail}`);
        setBookingsFound(data.bookingsFound);
        setRecipientEmail(data.recipientEmail);
        
        // Update email if it was found from phone
        if (!formData.email && data.recipientEmail) {
          setFormData(prev => ({ ...prev, email: data.recipientEmail }));
        }
        
        setStep(2);
      } else {
        setError(data.message || 'Có lỗi xảy ra');
      }
    } catch (err) {
      setError('Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();

    if (!formData.trackingCode) {
      setError('Vui lòng nhập mã xác thực');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const res = await fetch('http://localhost:5000/api/guest-bookings/verify-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          phone: formData.phone,
          trackingCode: formData.trackingCode.toUpperCase()
        })
      });

      const data = await res.json();

      if (data.success) {
        setBookings(data.bookings);
        setSuccess('Xác thực thành công!');
        
        // Store in sessionStorage for returning from detail page
        sessionStorage.setItem('guestEmail', data.verifiedEmail || formData.email);
        sessionStorage.setItem('guestPhone', data.verifiedPhone || formData.phone);
        sessionStorage.setItem('guestBookings', JSON.stringify(data.bookings));
        sessionStorage.setItem('guestSessionExpiry', Date.now() + 30 * 60 * 1000); // 30 min
      } else {
        setError(data.message || 'Mã xác thực không đúng');
      }
    } catch (err) {
      setError('Mã xác thực không đúng hoặc đã hết hạn');
    } finally {
      setLoading(false);
    }
  };

  const handleViewBooking = (bookingId) => {
    // Ensure session data is saved before navigation
    const email = formData.email || sessionStorage.getItem('guestEmail');
    const phone = formData.phone || sessionStorage.getItem('guestPhone');
    
    if (email) sessionStorage.setItem('guestEmail', email);
    if (phone) sessionStorage.setItem('guestPhone', phone);
    
    window.location.href = `/booking/${bookingId}`;
  };

  const handleBackToForm = () => {
    setStep(1);
    setFormData({ email: '', phone: '', trackingCode: '' });
    setBookings([]);
    setError('');
    setSuccess('');
    
    // Clear session
    sessionStorage.removeItem('guestEmail');
    sessionStorage.removeItem('guestPhone');
    sessionStorage.removeItem('guestBookings');
    sessionStorage.removeItem('guestSessionExpiry');
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

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <Search className="text-green-600" size={32} />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Tra Cứu Đơn Hàng</h1>
            <p className="text-gray-600">Nhập thông tin để tra cứu lịch sử đặt xe của bạn</p>
          </div>

          {bookings.length === 0 && (
            <div className="flex items-center justify-center mb-8 gap-4">
              <div className={`flex items-center gap-2 ${step >= 1 ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${step >= 1 ? 'bg-green-100' : 'bg-gray-100'}`}>
                  1
                </div>
                <span className="text-sm font-medium hidden sm:inline">Nhập thông tin</span>
              </div>
              <div className={`w-12 h-1 ${step >= 2 ? 'bg-green-600' : 'bg-gray-300'}`}></div>
              <div className={`flex items-center gap-2 ${step >= 2 ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${step >= 2 ? 'bg-green-100' : 'bg-gray-100'}`}>
                  2
                </div>
                <span className="text-sm font-medium hidden sm:inline">Xác thực</span>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {success && !bookings.length && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-green-800 text-sm">{success}</p>
            </div>
          )}

          {step === 1 && bookings.length === 0 && (
            <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="email@example.com"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="text-center text-gray-500 text-sm">hoặc</div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Số điện thoại</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="0901234567"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Nếu chỉ nhập số điện thoại, mã xác thực sẽ được gửi đến email đã đăng ký
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Clock className="text-blue-600 flex-shrink-0 mt-0.5" size={18} />
                    <div className="text-sm text-blue-800">
                      <p className="font-semibold mb-1">Lưu ý:</p>
                      <p>Mã xác thực sẽ được gửi đến email của bạn và có hiệu lực trong 10 phút.</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleRequestCode}
                  disabled={loading}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Đang gửi...' : 'Gửi mã xác thực'}
                </button>
              </div>
            </div>
          )}

          {step === 2 && !bookings.length && (
            <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
              <div className="mb-6 text-center">
                <p className="text-gray-700 mb-2">
                  Mã xác thực đã được gửi đến email <strong className="text-green-600">{recipientEmail || formData.email}</strong>
                </p>
                <p className="text-sm text-gray-500">Tìm thấy <strong>{bookingsFound}</strong> đơn hàng</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nhập mã xác thực (8 ký tự)
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      name="trackingCode"
                      value={formData.trackingCode}
                      onChange={handleInputChange}
                      placeholder="ABC12345"
                      maxLength={8}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-center text-2xl font-mono font-bold tracking-widest uppercase"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setStep(1);
                      setFormData(prev => ({ ...prev, trackingCode: '' }));
                      setError('');
                    }}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
                  >
                    Quay lại
                  </button>
                  <button
                    onClick={handleVerifyCode}
                    disabled={loading}
                    className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
                  >
                    {loading ? 'Đang xác thực...' : 'Xác thực'}
                  </button>
                </div>
              </div>

              <div className="mt-6 text-center">
                <button
                  onClick={handleRequestCode}
                  disabled={loading}
                  className="text-green-600 hover:text-green-700 text-sm font-medium disabled:opacity-50"
                >
                  Gửi lại mã xác thực
                </button>
              </div>
            </div>
          )}

          {bookings.length > 0 && (
            <div className="space-y-4">
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Tìm thấy {bookings.length} đơn hàng</h2>
                    <p className="text-gray-600 text-sm">Email: <strong>{formData.email}</strong></p>
                  </div>
                  <button
                    onClick={handleBackToForm}
                    className="text-sm text-gray-600 hover:text-gray-800 underline"
                  >
                    Tra cứu mới
                  </button>
                </div>
              </div>

              {bookings.map(booking => {
                const vehicleImage = booking.vehicle?.images?.[0] 
                  ? `http://localhost:5000${booking.vehicle.images[0]}`
                  : '/no-image.png';

                return (
                  <div 
                    key={booking._id} 
                    className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 hover:shadow-md transition cursor-pointer"
                    onClick={() => handleViewBooking(booking._id)}
                  >
                    <div className="flex gap-4 flex-col sm:flex-row">
                      <img
                        src={vehicleImage}
                        alt={booking.vehicle?.name || 'Xe'}
                        className="w-full sm:w-32 h-32 sm:h-24 object-cover rounded-lg"
                        onError={(e) => { e.target.src = '/no-image.png'; }}
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2 flex-wrap gap-2">
                          <div>
                            <h3 className="font-semibold text-gray-900">{booking.vehicle?.name || 'N/A'}</h3>
                            <p className="text-sm text-gray-600">Mã: #{booking._id.slice(-8).toUpperCase()}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                            {getStatusText(booking.status)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm mt-3">
                          <div>
                            <p className="text-gray-600">Ngày nhận</p>
                            <p className="font-medium">{new Date(booking.pickupDate).toLocaleDateString('vi-VN')}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Ngày trả</p>
                            <p className="font-medium">{new Date(booking.returnDate).toLocaleDateString('vi-VN')}</p>
                          </div>
                        </div>

                        <button className="mt-3 text-green-600 hover:text-green-700 text-sm font-medium">
                          Xem chi tiết →
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default GuestTrackingPage;