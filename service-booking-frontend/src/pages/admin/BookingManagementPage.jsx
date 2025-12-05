import React, { useState, useEffect } from "react";
import { FaChartLine, FaEyeSlash } from "react-icons/fa";
import API from "../../api/axios";
import BookingTable from "../../components/admin/BookingTable";
import BookingDetailModal from "../../components/admin/BookingDetailModal";
import BookingStatisticsCard from "../../components/admin/BookingStatisticsCard";
import ToastNotification from "../../components/common/ToastNotification";
import ConfirmDialog from "../../components/common/ConfirmDialog";

const BookingManagementPage = () => {
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    status: "",
    startDate: "",
    endDate: "",
    page: 1,
    limit: 20,
  });

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalBookings: 0,
  });

  useEffect(() => {
    fetchBookings();
  }, [filters]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      if (filters.status) queryParams.append("status", filters.status);
      if (filters.startDate) queryParams.append("startDate", filters.startDate);
      if (filters.endDate) queryParams.append("endDate", filters.endDate);
      queryParams.append("page", filters.page);
      queryParams.append("limit", filters.limit);

      const response = await API.get(`api/bookings/admin/all?${queryParams.toString()}`);
      
      if (response.data.success) {
        setBookings(response.data.bookings);
        setPagination({
          currentPage: response.data.currentPage,
          totalPages: response.data.totalPages,
          totalBookings: response.data.totalBookings,
        });
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      setToast({
        message: error.response?.data?.message || "Lỗi khi tải danh sách đơn đặt xe",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (bookingId) => {
    try {
      const response = await API.get(`api/bookings/${bookingId}`);
      if (response.data.success) {
        setSelectedBooking(response.data.booking);
        setShowDetailModal(true);
      }
    } catch (error) {
      setToast({
        message: "Không thể tải chi tiết đơn đặt xe",
        type: "error",
      });
    }
  };

  const handleUpdateStatus = async (bookingId, newStatus) => {
    const statusConfig = {
      confirmed: { title: "Xác nhận đơn đặt xe", type: "success" },
      ongoing: { title: "Bắt đầu chuyến đi", type: "default" },
      cancelled: { title: "Hủy đơn đặt xe", type: "delete" }
    };

    const config = statusConfig[newStatus] || { title: "Cập nhật trạng thái", type: "default" };

    setConfirmDialog({
      title: config.title,
      message: `Bạn có chắc muốn chuyển trạng thái thành "${getStatusText(newStatus)}"?`,
      type: config.type,
      onConfirm: async () => {
        try {
          const response = await API.patch(`api/bookings/${bookingId}/status`, {
            status: newStatus,
          });

          if (response.data.success) {
            setToast({
              message: "Cập nhật trạng thái thành công",
              type: "success",
            });
            fetchBookings();
            if (selectedBooking?._id === bookingId) {
              setSelectedBooking(response.data.booking);
            }
          }
        } catch (error) {
          setToast({
            message: error.response?.data?.message || "Lỗi khi cập nhật trạng thái",
            type: "error",
          });
        }
        setConfirmDialog(null);
      },
      onCancel: () => setConfirmDialog(null),
    });
  };

  const handleCompleteBooking = async (bookingId) => {
    setConfirmDialog({
      title: "Hoàn thành chuyến đi",
      message: "Xác nhận hoàn thành chuyến đi này?",
      type: "success",
      onConfirm: async () => {
        try {
          const response = await API.patch(`api/bookings/${bookingId}/complete`);
          if (response.data.success) {
            setToast({
              message: "Đã hoàn thành chuyến đi",
              type: "success",
            });
            fetchBookings();
          }
        } catch (error) {
          setToast({
            message: error.response?.data?.message || "Lỗi khi hoàn thành đơn",
            type: "error",
          });
        }
        setConfirmDialog(null);
      },
      onCancel: () => setConfirmDialog(null),
    });
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1,
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleResetFilters = () => {
    setFilters({
      status: "",
      startDate: "",
      endDate: "",
      page: 1,
      limit: 20,
    });
  };

  const getStatusText = (status) => {
    const statusMap = {
      pending: "Chờ xác nhận",
      confirmed: "Đã xác nhận",
      ongoing: "Đang diễn ra",
      completed: "Hoàn thành",
      cancelled: "Đã hủy",
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-blue-100 text-blue-800",
      ongoing: "bg-green-100 text-green-800",
      completed: "bg-gray-100 text-gray-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colorMap[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Quản lý đơn đặt xe</h1>
          <p className="text-gray-600">
            Tổng số đơn: {pagination.totalBookings} | Trang {pagination.currentPage}/{pagination.totalPages}
          </p>
        </div>
        <button
          onClick={() => setShowStatistics(!showStatistics)}
          className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 shadow-md hover:shadow-lg ${
            showStatistics 
              ? 'bg-gray-500 hover:bg-gray-600 text-white' 
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {showStatistics ? (
            <>
              <FaEyeSlash size={18} />
              <span>Ẩn thống kê</span>
            </>
          ) : (
            <>
              <FaChartLine size={18} />
              <span>Xem thống kê</span>
            </>
          )}
        </button>
      </div>

      {showStatistics && (
        <div className="mb-6 animate-fadeIn">
          <BookingStatisticsCard />
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">Bộ lọc</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Trạng thái</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả</option>
              <option value="pending">Chờ xác nhận</option>
              <option value="confirmed">Đã xác nhận</option>
              <option value="ongoing">Đang diễn ra</option>
              <option value="completed">Hoàn thành</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Từ ngày</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Đến ngày</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleResetFilters}
              className="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition"
            >
              Đặt lại bộ lọc
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      ) : (
        <>
          <BookingTable
            bookings={bookings}
            onViewDetail={handleViewDetail}
            onUpdateStatus={handleUpdateStatus}
            onComplete={handleCompleteBooking}
            getStatusText={getStatusText}
            getStatusColor={getStatusColor}
          />

          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button
                onClick={() => handlePageChange(filters.page - 1)}
                disabled={filters.page === 1}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
              >
                Trước
              </button>
              
              <span className="px-4 py-2 font-medium">
                Trang {pagination.currentPage} / {pagination.totalPages}
              </span>
              
              <button
                onClick={() => handlePageChange(filters.page + 1)}
                disabled={filters.page === pagination.totalPages}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
              >
                Sau
              </button>
            </div>
          )}
        </>
      )}

      {showDetailModal && selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedBooking(null);
          }}
          onUpdateStatus={handleUpdateStatus}
          onComplete={handleCompleteBooking}
          getStatusText={getStatusText}
          getStatusColor={getStatusColor}
        />
      )}

      {toast && (
        <ToastNotification
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {confirmDialog && (
        <ConfirmDialog
          title={confirmDialog.title}
          message={confirmDialog.message}
          type={confirmDialog.type}
          onConfirm={confirmDialog.onConfirm}
          onCancel={confirmDialog.onCancel}
        />
      )}
    </div>
  );
};

export default BookingManagementPage;