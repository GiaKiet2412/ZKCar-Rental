import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";

const UserVehicleList = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const res = await API.get("/api/vehicles");
        const available = res.data.filter((v) => v.isAvailable);
        setVehicles(available);
      } catch (err) {
        console.error("Lỗi khi lấy danh sách xe:", err);
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

  // Viết hoa chữ cái đầu (cho "điện", "số tự động", ...)
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
        <h1 className="text-2xl font-bold mb-6 text-green-600">
          Xe đang cho thuê
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((v) => (
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
                <p className="text-gray-600">{v.location || "Không rõ vị trí"}</p>
                <p className="text-green-600 font-semibold">
                  {formatCurrency(v.pricePerHour * 4)}/4h &nbsp;•&nbsp;
                  {formatCurrency(v.pricePerHour * 24)}/24h
                </p>
                <div className="flex justify-between text-sm text-gray-500 pt-2 border-t">
                  <span>{v.seats} chỗ</span>
                  <span>{capitalizeWords(v.transmission)}</span>
                  <span>{capitalizeWords(v.fuelType)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {vehicles.length === 0 && (
          <p className="text-center text-gray-500 mt-10">
            Hiện chưa có xe nào được cho thuê.
          </p>
        )}
      </div>
    </div>
  );
};

export default UserVehicleList;