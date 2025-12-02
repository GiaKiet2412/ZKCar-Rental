import React, { useState, useEffect } from "react";
import API from "../../api/axios";
import { 
  FaClipboardList, 
  FaCheckCircle, 
  FaSpinner, 
  FaTimesCircle,
  FaDollarSign,
  FaCar
} from "react-icons/fa";

const BookingStatisticsCard = () => {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState({
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    fetchStatistics();
  }, [dateFilter]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (dateFilter.startDate) queryParams.append("startDate", dateFilter.startDate);
      if (dateFilter.endDate) queryParams.append("endDate", dateFilter.endDate);

      const response = await API.get(`/bookings/admin/statistics?${queryParams.toString()}`);
      if (response.data.success) {
        setStatistics(response.data.statistics);
      }
    } catch (error) {
      console.error("Error fetching statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const getStatusCount = (status) => {
    const stat = statistics?.statusStats?.find((s) => s._id === status);
    return stat?.count || 0;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center py-8">
          <FaSpinner className="animate-spin text-blue-500 text-3xl" />
          <span className="ml-3 text-gray-600">Đang tải thống kê...</span>
        </div>
      </div>
    );
  }

  if (!statistics) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Date Filter */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="text-lg font-semibold mb-4">Bộ lọc thời gian</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Từ ngày</label>
            <input
              type="date"
              value={dateFilter.startDate}
              onChange={(e) =>
                setDateFilter({ ...dateFilter, startDate: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Đến ngày</label>
            <input
              type="date"
              value={dateFilter.endDate}
              onChange={(e) =>
                setDateFilter({ ...dateFilter, endDate: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Status Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Chờ xác nhận"
          value={getStatusCount("pending")}
          icon={<FaClipboardList />}
          color="bg-yellow-500"
        />
        <StatCard
          title="Đã xác nhận"
          value={getStatusCount("confirmed")}
          icon={<FaCheckCircle />}
          color="bg-blue-500"
        />
        <StatCard
          title="Hoàn thành"
          value={getStatusCount("completed")}
          icon={<FaCheckCircle />}
          color="bg-green-500"
        />
        <StatCard
          title="Đã hủy"
          value={getStatusCount("cancelled")}
          icon={<FaTimesCircle />}
          color="bg-red-500"
        />
      </div>

      {/* Revenue Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Tổng doanh thu"
          value={formatCurrency(statistics.revenue.totalRevenue)}
          icon={<FaDollarSign />}
          color="bg-green-600"
          valueSize="text-xl"
        />
        <StatCard
          title="Số đơn đã thanh toán"
          value={statistics.revenue.totalBookings}
          icon={<FaCheckCircle />}
          color="bg-blue-600"
        />
        <StatCard
          title="Giá trị TB/đơn"
          value={formatCurrency(statistics.revenue.averageBookingValue)}
          icon={<FaDollarSign />}
          color="bg-purple-600"
        />
      </div>

      {/* Top Vehicles */}
      {statistics.topVehicles && statistics.topVehicles.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FaCar className="text-blue-500" />
            Top 5 xe được thuê nhiều nhất
          </h3>
          <div className="space-y-3">
            {statistics.topVehicles.map((item, index) => (
              <div
                key={item._id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-gray-400">
                    #{index + 1}
                  </span>
                  {item.vehicleInfo?.images?.[0] && (
                    <img
                      src={`http://localhost:5000${item.vehicleInfo.images[0]}`}
                      alt={item.vehicleInfo.name}
                      className="w-12 h-12 rounded-md object-cover"
                    />
                  )}
                  <div>
                    <p className="font-medium">{item.vehicleInfo?.name}</p>
                    <p className="text-sm text-gray-500">
                      {item.vehicleInfo?.location}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-blue-600">{item.count}</p>
                  <p className="text-xs text-gray-500">lượt thuê</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily Revenue Chart */}
      {statistics.dailyRevenue && statistics.dailyRevenue.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Doanh thu 7 ngày gần nhất</h3>
          <div className="space-y-2">
            {statistics.dailyRevenue.map((day) => (
              <div key={day._id} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{day._id}</span>
                <div className="flex-1 mx-4">
                  <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-blue-500 h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${
                          (day.revenue / Math.max(...statistics.dailyRevenue.map((d) => d.revenue))) * 100
                        }%`,
                      }}
                    />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">
                    {formatCurrency(day.revenue)}
                  </p>
                  <p className="text-xs text-gray-500">{day.bookings} đơn</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ title, value, icon, color, valueSize = "text-2xl" }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-2">{title}</p>
          <p className={`${valueSize} font-bold text-gray-800`}>{value}</p>
        </div>
        <div className={`${color} p-3 rounded-lg text-white`}>{icon}</div>
      </div>
    </div>
  );
};

export default BookingStatisticsCard;