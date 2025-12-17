import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import { getCardDisplayPrices } from "../../utils/pricingUtils";

const UserVehicleList = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setLoading(true);
        const res = await API.get("/api/vehicles");
        const available = res.data.filter((v) => v.isAvailable);
        setVehicles(available);
      } catch (err) {
        console.error("Lỗi khi lấy danh sách xe:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchVehicles();
  }, []);

  const handleViewDetail = (id) => {
    navigate(`/vehicle/${id}`);
  };

  // Format tiền
  const formatCurrency = (price) => {
    if (!price) return "";
    return price.toLocaleString("vi-VN") + " VNĐ";
  };

  // Viết hoa chữ cái đầu
  const capitalizeWords = (text) => {
    if (!text) return "";
    return text
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-green-600">
            Xe đang cho thuê
          </h1>
          <div className="text-gray-600">
            {loading ? (
              <span>Đang tải...</span>
            ) : (
              <span>{vehicles.length} xe</span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : vehicles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((v) => {
              // Lấy giá hiển thị (mặc định: 8h và 24h)
              const { primary, secondary } = getCardDisplayPrices(v.pricePerHour);
              
              return (
                <div
                  key={v._id}
                  onClick={() => handleViewDetail(v._id)}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition cursor-pointer"
                >
                  <img
                    src={v.images?.[0] ? `http://localhost:5000${v.images[0]}` : "/no-image.png"}
                    alt={v.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4 space-y-2">
                    <h2 className="font-bold text-lg text-gray-800">{v.name}</h2>
                    <p className="text-gray-600 text-sm">{v.location || "Không rõ vị trí"}</p>
                    
                    {/* Giá theo gói */}
                    <p className="text-green-600 font-semibold">
                      {formatCurrency(primary.price)}/{primary.label}
                      {secondary && (
                        <>
                          {' '}•{' '}
                          {formatCurrency(secondary.price)}/{secondary.label}
                        </>
                      )}
                    </p>
                    
                    {/* Thông tin xe */}
                    <div className="flex justify-between text-sm text-gray-500 pt-2 border-t">
                      <span>{v.seats} chỗ</span>
                      <span>{capitalizeWords(v.transmission)}</span>
                      <span>{capitalizeWords(v.fuelType)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-gray-500 mt-10">
            <div className="bg-white rounded-xl p-8 shadow-md max-w-md mx-auto">
              <svg
                className="w-24 h-24 mx-auto mb-4 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-xl mb-2 font-semibold">Chưa có xe nào</p>
              <p className="text-sm text-gray-500">
                Hiện chưa có xe nào được cho thuê
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserVehicleList;