import React from "react";
import { FaTimes, FaCheck, FaMapMarkerAlt, FaPhone, FaEnvelope } from "react-icons/fa";

const BookingDetailModal = ({
  booking,
  onClose,
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

  const getPaymentStatusText = (status) => {
    const textMap = {
      pending: "Chờ thanh toán",
      paid: "Đã thanh toán",
      failed: "Thất bại",
      refunded: "Đã hoàn tiền",
    };
    return textMap[status] || status;
  };

  const getPaymentTypeText = (type) => {
    return type === "hold" ? "Giữ chỗ" : "Toàn bộ";
  };

  const canUpdateToConfirmed = () => {
    return booking.status === "pending" && booking.paymentStatus === "paid";
  };

  const canUpdateToOngoing = () => {
    return booking.status === "confirmed";
  };

  const canComplete = () => {
    return ["confirmed", "ongoing"].includes(booking.status);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Chi tiết đơn đặt xe</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status and Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span
                className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(
                  booking.status
                )}`}
              >
                {getStatusText(booking.status)}
              </span>
              <span
                className={`px-4 py-2 rounded-full text-sm font-semibold ${getPaymentStatusColor(
                  booking.paymentStatus
                )}`}
              >
                {getPaymentStatusText(booking.paymentStatus)}
              </span>
            </div>
            
            <div className="flex gap-2">
              {canUpdateToConfirmed() && (
                <button
                  onClick={() => onUpdateStatus(booking._id, "confirmed")}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center gap-2"
                >
                  <FaCheck /> Xác nhận đơn
                </button>
              )}
              
              {canUpdateToOngoing() && (
                <button
                  onClick={() => onUpdateStatus(booking._id, "ongoing")}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-2"
                >
                  <FaCheck /> Bắt đầu chuyến
                </button>
              )}
              
              {canComplete() && (
                <button
                  onClick={() => onComplete(booking._id)}
                  className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 flex items-center gap-2"
                >
                  <FaCheck /> Hoàn thành
                </button>
              )}
              
              {booking.status === "pending" && (
                <button
                  onClick={() => onUpdateStatus(booking._id, "cancelled")}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                >
                  Hủy đơn
                </button>
              )}
            </div>
          </div>

          {/* Booking ID */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Mã đơn hàng</p>
            <p className="text-lg font-mono font-semibold">
              #{booking._id.toUpperCase()}
            </p>
          </div>

          {/* Vehicle Info */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">Thông tin xe</h3>
            <div className="flex gap-4">
              {booking.vehicle?.images?.[0] && (
                <img
                  src={`http://localhost:5000${booking.vehicle.images[0]}`}
                  alt={booking.vehicle.name}
                  className="w-32 h-32 rounded-lg object-cover"
                />
              )}
              <div className="flex-1 space-y-2">
                <p className="text-xl font-semibold">{booking.vehicle?.name}</p>
                <p className="text-gray-600 flex items-center gap-2">
                  <FaMapMarkerAlt /> {booking.vehicle?.location}
                </p>
                <p className="text-blue-600 font-semibold">
                  {formatCurrency(booking.vehicle?.pricePerHour)}/giờ
                </p>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">Thông tin khách hàng</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Họ tên</p>
                <p className="font-medium">
                  {booking.user?.name || booking.guestInfo?.name || "N/A"}
                  {!booking.user && (
                    <span className="ml-2 text-xs bg-gray-200 px-2 py-1 rounded">
                      Khách vãng lai
                    </span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <FaPhone /> Số điện thoại
                </p>
                <p className="font-medium">
                  {booking.user?.phone || booking.guestInfo?.phone || "N/A"}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <FaEnvelope /> Email
                </p>
                <p className="font-medium">
                  {booking.user?.email || booking.guestInfo?.email || "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Rental Period */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">Thời gian thuê</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Ngày nhận xe</p>
                <p className="font-medium">{formatDate(booking.pickupDate)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Ngày trả xe</p>
                <p className="font-medium">{formatDate(booking.returnDate)}</p>
              </div>
            </div>
          </div>

          {/* Pickup Info */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">Thông tin nhận xe</h3>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-gray-600">Hình thức nhận xe</p>
                <p className="font-medium">
                  {booking.pickupType === "delivery" ? "Giao xe tận nơi" : "Tự đến lấy"}
                </p>
              </div>
              {booking.pickupType === "delivery" && booking.deliveryLocation && (
                <div>
                  <p className="text-sm text-gray-600">Địa chỉ giao xe</p>
                  <p className="font-medium">{booking.deliveryLocation}</p>
                </div>
              )}
            </div>
          </div>

          {/* Payment Details */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">Chi tiết thanh toán</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Giá thuê xe:</span>
                <span className="font-medium">{formatCurrency(booking.originalAmount)}</span>
              </div>
              
              {booking.insuranceFee > 0 && (
                <div className="flex justify-between">
                  <span>Phí bảo hiểm:</span>
                  <span className="font-medium">{formatCurrency(booking.insuranceFee)}</span>
                </div>
              )}
              
              {booking.deliveryFee > 0 && (
                <div className="flex justify-between">
                  <span>Phí giao xe:</span>
                  <span className="font-medium">{formatCurrency(booking.deliveryFee)}</span>
                </div>
              )}
              
              {booking.VAT > 0 && (
                <div className="flex justify-between">
                  <span>VAT:</span>
                  <span className="font-medium">{formatCurrency(booking.VAT)}</span>
                </div>
              )}
              
              {booking.discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Giảm giá ({booking.discountCode}):</span>
                  <span className="font-medium">-{formatCurrency(booking.discountAmount)}</span>
                </div>
              )}
              
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between text-lg font-bold">
                  <span>Tổng tiền:</span>
                  <span className="text-blue-600">{formatCurrency(booking.finalAmount)}</span>
                </div>
              </div>
              
              <div className="flex justify-between text-sm">
                <span>Hình thức thanh toán:</span>
                <span className="font-medium">
                  {getPaymentTypeText(booking.paymentType)}
                </span>
              </div>
              
              {booking.paidAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Đã thanh toán:</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(booking.paidAmount)}
                  </span>
                </div>
              )}
              
              {booking.remainingAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Còn phải trả:</span>
                  <span className="font-medium text-orange-600">
                    {formatCurrency(booking.remainingAmount)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* VNPay Info */}
          {booking.paymentStatus === "paid" && booking.vnpayOrderId && (
            <div className="border rounded-lg p-4 bg-green-50">
              <h3 className="text-lg font-semibold mb-3">Thông tin thanh toán VNPay</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Mã giao dịch VNPay:</span>
                  <span className="font-mono">{booking.vnpayOrderId}</span>
                </div>
                {booking.vnpayTransactionNo && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mã giao dịch ngân hàng:</span>
                    <span className="font-mono">{booking.vnpayTransactionNo}</span>
                  </div>
                )}
                {booking.vnpayBankCode && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ngân hàng:</span>
                    <span className="font-medium">{booking.vnpayBankCode}</span>
                  </div>
                )}
                {booking.paidAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Thời gian thanh toán:</span>
                    <span>{formatDate(booking.paidAt)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {booking.notes && (
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">Ghi chú</h3>
              <p className="text-gray-700">{booking.notes}</p>
            </div>
          )}

          {/* Rating & Review */}
          {booking.rating && (
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">Đánh giá</h3>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-yellow-500 text-xl">
                  {"★".repeat(booking.rating)}{"☆".repeat(5 - booking.rating)}
                </span>
                <span className="font-medium">{booking.rating}/5</span>
              </div>
              {booking.review && <p className="text-gray-700">{booking.review}</p>}
            </div>
          )}

          {/* Timestamps */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Ngày tạo đơn</p>
                <p className="font-medium">{formatDate(booking.createdAt)}</p>
              </div>
              <div>
                <p className="text-gray-600">Cập nhật lần cuối</p>
                <p className="font-medium">{formatDate(booking.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetailModal;