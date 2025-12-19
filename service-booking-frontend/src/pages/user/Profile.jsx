// src/pages/user/Profile.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserAuth } from '../../context/UserAuthContext';
import Header from '../../components/user/Header';
import { getImageUrl } from '../../utils/imageUtils';
import API from '../../api/axios';

const Profile = () => {
  const navigate = useNavigate();
  const { user } = useUserAuth();
  const [activeTab, setActiveTab] = useState('info');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // User data state
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    drivingLicense: '',
    joinDate: '',
    membershipTier: 'Thành viên Đồng',
    totalRentals: 0,
    totalSpent: 0
  });

  const [formData, setFormData] = useState({ ...userData });
  const [bookingHistory, setBookingHistory] = useState([]);

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        const response = await API.get('/api/auth/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });

        const data = response.data;

        console.log('Profile data received:', {
          totalRentals: data.totalRentals,
          totalSpent: data.totalSpent
        });

        const profileData = {
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          address: data.address || '',
          drivingLicense: data.drivingLicense || '',
          joinDate: new Date(data.createdAt).toLocaleDateString('vi-VN'),
          membershipTier: calculateMembershipTier(data.totalSpent || 0),
          totalRentals: data.totalRentals || 0,
          totalSpent: data.totalSpent || 0
        };

        setUserData(profileData);
        setFormData(profileData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Không thể tải thông tin người dùng');
        setLoading(false);
      }
    };

    const fetchBookingHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await API.get('/api/bookings/my-bookings', {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Booking history received:', response.data);
        setBookingHistory(response.data);
      } catch (err) {
        console.error('Error fetching bookings:', err);
      }
    };

    if (user) {
      fetchUserProfile();
      fetchBookingHistory();
    } else {
      navigate('/login');
    }
  }, [user, navigate]);

  // Calculate membership tier based on total spent
  const calculateMembershipTier = (totalSpent) => {
    if (totalSpent >= 50000000) return 'Thành viên Kim Cương';
    if (totalSpent >= 30000000) return 'Thành viên Vàng';
    if (totalSpent >= 10000000) return 'Thành viên Bạc';
    return 'Thành viên Đồng';
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      await API.put('/api/auth/profile',
        {
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          drivingLicense: formData.drivingLicense
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setUserData({ ...formData });
      setIsEditing(false);
      setLoading(false);
      alert('Cập nhật thông tin thành công!');
    } catch (err) {
      console.error('Error updating profile:', err);
      alert('Có lỗi xảy ra khi cập nhật thông tin');
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setFormData({ ...userData });
    setIsEditing(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'confirmed': return 'bg-blue-100 text-blue-700';
      case 'ongoing': return 'bg-purple-100 text-purple-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Hoàn thành';
      case 'confirmed': return 'Đã đặt';
      case 'ongoing': return 'Đang diễn ra';
      case 'cancelled': return 'Đã hủy';
      case 'pending': return 'Chờ xác nhận';
      default: return status;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('vi-VN');
    } catch (error) {
      return 'N/A';
    }
  };

  if (loading && !userData.email) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              Về trang chủ
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Profile */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {userData.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{userData.name}</h1>
                  <p className="text-gray-600">{userData.email}</p>
                  <div className="mt-1 inline-block px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                    {userData.membershipTier}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Thành viên từ</p>
                <p className="font-semibold text-gray-900">{userData.joinDate}</p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Tổng chuyến đi</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{userData.totalRentals}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Tổng chi tiêu</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {userData.totalSpent.toLocaleString('vi-VN')}đ
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Xe đang thuê</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {bookingHistory.filter(b => b.status === 'confirmed' || b.status === 'ongoing').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px overflow-x-auto">
                <button
                  onClick={() => setActiveTab('info')}
                  className={`py-4 px-6 font-medium text-sm border-b-2 transition whitespace-nowrap ${
                    activeTab === 'info'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Thông tin cá nhân
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`py-4 px-6 font-medium text-sm border-b-2 transition whitespace-nowrap ${
                    activeTab === 'history'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Lịch sử thuê xe
                </button>
                <button
                  onClick={() => setActiveTab('rental')}
                  className={`py-4 px-6 font-medium text-sm border-b-2 transition whitespace-nowrap ${
                    activeTab === 'rental'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Cho thuê xe
                  <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">Sắp ra mắt</span>
                </button>
              </nav>
            </div>

            <div className="p-6">
              {/* Tab: Thông tin cá nhân */}
              {activeTab === 'info' && (
                <div className="max-w-2xl">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Thông tin cá nhân</h2>
                    {!isEditing && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                      >
                        Chỉnh sửa
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Họ và tên</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-600"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        disabled
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-500 mt-1">Email không thể thay đổi</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Số điện thoại</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-600"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Địa chỉ</label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-600"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Giấy phép lái xe</label>
                      <input
                        type="text"
                        name="drivingLicense"
                        value={formData.drivingLicense}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-600"
                      />
                    </div>

                    {isEditing && (
                      <div className="flex gap-3 pt-4">
                        <button
                          onClick={handleSaveProfile}
                          disabled={loading}
                          className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50"
                        >
                          {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          disabled={loading}
                          className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition disabled:opacity-50"
                        >
                          Hủy
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab: Lịch sử thuê xe */}
              {activeTab === 'history' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Lịch sử thuê xe</h2>
                  
                  {bookingHistory.length === 0 ? (
                    <div className="text-center py-12">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <p className="mt-4 text-gray-500">Bạn chưa có chuyến thuê xe nào</p>
                      <button
                        onClick={() => navigate('/')}
                        className="mt-4 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                      >
                        Khám phá xe ngay
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {bookingHistory.map(booking => {
                        const vehicleImage = getImageUrl(booking.vehicle?.images?.[0]) || 'https://via.placeholder.com/150';

                        let pickupLocation = 'N/A';
    
                        if (booking.pickupType === 'delivery') {
                          pickupLocation = booking.deliveryLocation || 'N/A';
                        } else if (booking.pickupType === 'self') {
                          pickupLocation = booking.vehicle?.locationPickUp || booking.vehicle?.location || 'N/A';
                        } else {
                          pickupLocation = booking.vehicle?.locationPickUp || booking.vehicle?.location || 'N/A';
                        }
                        
                        return (
                          <div key={booking._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                            <div className="flex gap-4 flex-col sm:flex-row">
                              <img
                                src={vehicleImage}
                                alt={booking.vehicle?.name || 'Xe'}
                                className="w-full sm:w-32 h-32 sm:h-24 object-cover rounded-lg"
                                onError={(e) => {
                                  e.target.src = 'https://via.placeholder.com/150';
                                }}
                              />
                              <div className="flex-1">
                                <div className="flex justify-between items-start mb-2 flex-wrap gap-2">
                                  <div>
                                    <h3 className="font-semibold text-gray-900">
                                      {booking.vehicle?.name || 'N/A'}
                                    </h3>
                                    <p className="text-sm text-gray-600">Mã đơn: {booking._id.slice(-8)}</p>
                                  </div>
                                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                                    {getStatusText(booking.status)}
                                  </span>
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <p className="text-gray-600">Ngày nhận xe</p>
                                    <p className="font-medium text-gray-900">{formatDate(booking.pickupDate)}</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-600">Ngày trả xe</p>
                                    <p className="font-medium text-gray-900">{formatDate(booking.returnDate)}</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-600">Địa điểm nhận xe</p>
                                    <p className="font-medium text-gray-900">{pickupLocation}</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-600">Tổng tiền</p>
                                    <p className="font-medium text-green-600">
                                      {booking.finalAmount?.toLocaleString('vi-VN')}đ
                                    </p>
                                  </div>
                                </div>

                                <div className="flex gap-2 mt-4 flex-wrap">
                                  <button
                                    onClick={() => navigate(`/booking/${booking._id}`)}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm"
                                  >
                                    Xem chi tiết
                                  </button>
                                  {booking.status === 'completed' && booking.vehicle && (
                                    <button
                                      onClick={() => navigate(`/vehicle/${booking.vehicle._id}`)}
                                      className="px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition text-sm"
                                    >
                                      Thuê lại
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Cho thuê xe */}
              {activeTab === 'rental' && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Tính năng đang phát triển</h3>
                  <p className="text-gray-600 max-w-md mx-auto px-4">
                    Chúng tôi đang hoàn thiện tính năng cho thuê và ký gửi xe điện. 
                    Tính năng này sẽ cho phép bạn đăng ký xe của mình để cho thuê và kiếm thêm thu nhập.
                  </p>
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg max-w-md mx-auto">
                    <p className="text-sm text-blue-800 px-4">
                      Đăng ký nhận thông báo khi tính năng ra mắt để được ưu đãi đặc biệt!
                    </p>
                    <button className="mt-3 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
                      Đăng ký nhận thông báo
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;