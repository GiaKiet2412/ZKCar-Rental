import React from "react";
import { FaEye, FaCheck, FaTimes, FaInfoCircle } from "react-icons/fa";

const BookingTable = ({
  bookings,
  onViewDetail,
  onUpdateStatus,
  onComplete,
  getStatusText,
  getStatusColor,
}) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const getPaymentStatusColor = (status) => {
    const colorMap = {
      pending: "bg-yellow-100 text-yellow-800",
      paid: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
      refunded: "bg-gray-100 text-gray-800",
    };
    return colorMap[status] || "bg-gray-100 text-gray-800";
  };

  const getPaymentStatusText = (booking) => {
    if (booking.paymentStatus !== 'paid') {
      const textMap = {
        pending: "Chờ thanh toán",
        failed: "Thất bại",
        refunded: "Đã hoàn tiền",
      };
      return textMap[booking.paymentStatus] || booking.paymentStatus;
    }

    // Nếu đã thanh toán, hiển thị chi tiết
    if (booking.paymentType === 'hold') {
      return `Đã cọc ${formatCurrency(booking.paidAmount || booking.holdFee)}`;
    } else {
      return `Đã thanh toán ${formatCurrency(booking.paidAmount)}`;
    }
  };

  const canUpdateToConfirmed = (booking) => {
    return booking.status === "pending" && booking.paymentStatus === "paid";
  };

  const canUpdateToOngoing = (booking) => {
    return booking.status === "confirmed";
  };

  const canComplete = (booking) => {
    return ["confirmed", "ongoing"].includes(booking.status);
  };

  if (bookings.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-500 text-lg">Không có đơn đặt xe nào</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mã đơn
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Xe
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Khách hàng
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thời gian thuê
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tổng tiền
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thanh toán
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trạng thái
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {bookings.map((booking) => (
              <tr key={booking._id} className="hover:bg-gray-50 transition">
                <td className="px-4 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                  #{booking._id.slice(-6).toUpperCase()}
                </td>
                
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {booking.vehicle?.images?.[0] && (
                      <img
                        src={`http://localhost:5000${booking.vehicle.images[0]}`}
                        alt={booking.vehicle.name}
                        className="h-10 w-10 rounded-md object-cover mr-3"
                      />
                    )}
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {booking.vehicle?.name || "N/A"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {booking.vehicle?.location || ""}
                      </div>
                    </div>
                  </div>
                </td>
                
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">
                      {booking.user?.name || booking.guestInfo?.name || "Khách vãng lai"}
                    </div>
                    <div className="text-gray-500">
                      {booking.user?.phone || booking.guestInfo?.phone || ""}
                    </div>
                  </div>
                </td>
                
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div>{formatDate(booking.pickupDate)}</div>
                  <div className="text-xs text-gray-500">
                    đến {formatDate(booking.returnDate)}
                  </div>
                </td>
                
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm">
                    <div className="font-semibold text-gray-900">
                      {formatCurrency(booking.finalAmount)}
                    </div>
                    {booking.discountAmount > 0 && (
                      <div className="text-xs text-green-600">
                        Giảm: {formatCurrency(booking.discountAmount)}
                      </div>
                    )}
                    {booking.paymentType === 'hold' && (
                      <div className="text-xs text-blue-600 mt-1">
                        + Cọc: {formatCurrency(booking.depositAmount || 3000000)}
                      </div>
                    )}
                  </div>
                </td>
                
                <td className="px-4 py-4">
                  <div className="space-y-1">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full whitespace-nowrap ${getPaymentStatusColor(
                        booking.paymentStatus
                      )}`}
                    >
                      {getPaymentStatusText(booking)}
                    </span>
                    
                    {/* Hiển thị số tiền còn phải trả */}
                    {booking.paymentStatus === 'paid' && 
                     booking.paymentType === 'hold' && 
                     booking.remainingAmount > 0 && (
                      <div className="text-xs text-orange-600 font-medium flex items-center gap-1">
                        <FaInfoCircle size={10} />
                        Còn: {formatCurrency(booking.remainingAmount)}
                      </div>
                    )}
                  </div>
                </td>
                
                <td className="px-4 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                      booking.status
                    )}`}
                  >
                    {getStatusText(booking.status)}
                  </span>
                </td>
                
                <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => onViewDetail(booking._id)}
                      className="text-blue-600 hover:text-blue-900 p-2 rounded-md hover:bg-blue-50 transition"
                      title="Xem chi tiết"
                    >
                      <FaEye size={16} />
                    </button>
                    
                    {canUpdateToConfirmed(booking) && (
                      <button
                        onClick={() => onUpdateStatus(booking._id, "confirmed")}
                        className="text-green-600 hover:text-green-900 p-2 rounded-md hover:bg-green-50 transition"
                        title="Xác nhận đơn"
                      >
                        <FaCheck size={16} />
                      </button>
                    )}
                    
                    {canUpdateToOngoing(booking) && (
                      <button
                        onClick={() => onUpdateStatus(booking._id, "ongoing")}
                        className="text-blue-600 hover:text-blue-900 p-2 rounded-md hover:bg-blue-50 transition"
                        title="Bắt đầu chuyến đi"
                      >
                        <FaCheck size={16} />
                      </button>
                    )}
                    
                    {canComplete(booking) && (
                      <button
                        onClick={() => onComplete(booking._id)}
                        className="text-purple-600 hover:text-purple-900 p-2 rounded-md hover:bg-purple-50 transition"
                        title="Hoàn thành"
                      >
                        <FaCheck size={16} />
                      </button>
                    )}
                    
                    {booking.status === "pending" && (
                      <button
                        onClick={() => onUpdateStatus(booking._id, "cancelled")}
                        className="text-red-600 hover:text-red-900 p-2 rounded-md hover:bg-red-50 transition"
                        title="Hủy đơn"
                      >
                        <FaTimes size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BookingTable;