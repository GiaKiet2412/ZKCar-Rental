import React from 'react';
import { FaTimes } from 'react-icons/fa';

const UserDetailModal = ({ user, onClose }) => {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('vi-VN');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Chi tiết người dùng</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <FaTimes size={24} />
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Họ tên
                </label>
                <div className="text-gray-900">{user.name}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Email
                </label>
                <div className="text-gray-900">{user.email}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Số điện thoại
                </label>
                <div className="text-gray-900">{user.phone || 'Chưa có'}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Vai trò
                </label>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  user.role === 'admin' 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {user.role === 'admin' ? 'Admin' : 'Người dùng'}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Trạng thái
                </label>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  user.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {user.isActive ? 'Hoạt động' : 'Không hoạt động'}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Ngày tạo
                </label>
                <div className="text-gray-900">{formatDate(user.createdAt)}</div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Địa chỉ
              </label>
              <div className="text-gray-900">{user.address || 'Chưa có'}</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Giấy phép lái xe
              </label>
              <div className="text-gray-900">{user.drivingLicense || 'Chưa có'}</div>
            </div>

            {user.bookingStats && (
              <div className="border-t pt-4 mt-4">
                <h3 className="font-semibold text-gray-800 mb-3">Thống kê đặt xe</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-600">Tổng số chuyến</div>
                    <div className="text-xl font-bold text-blue-600">
                      {user.bookingStats.totalBookings || 0}
                    </div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-600">Hoàn thành</div>
                    <div className="text-xl font-bold text-green-600">
                      {user.bookingStats.completedBookings || 0}
                    </div>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-600">Tổng chi tiêu</div>
                    <div className="text-xl font-bold text-purple-600">
                      {formatCurrency(user.bookingStats.totalSpent || 0)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetailModal;