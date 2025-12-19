import API from "../../api/axios";
import { FaEdit, FaTrashAlt } from "react-icons/fa";
import { getImageUrl } from "../../utils/imageUtils";

const VehicleTable = ({ vehicles, onEdit, onDelete, refreshData }) => {
  const handleStatusChange = async (vehicle, newStatus) => {
    try {
      const admin = JSON.parse(localStorage.getItem("adminInfo"));
      const updateData = { ...vehicle, isAvailable: newStatus };
      await API.put(`/api/vehicles/${vehicle._id}`, updateData, {
        headers: {
          Authorization: `Bearer ${admin?.token}`,
          "Content-Type": "application/json",
        },
      });
      refreshData();
    } catch (err) {
      console.error("Lỗi cập nhật trạng thái:", err);
      alert(
        "Lỗi cập nhật trạng thái: " +
          (err.response?.data?.message || err.message)
      );
    }
  };

  const formatPrice = (price) => {
    if (!price) return "";
    return price.toLocaleString("vi-VN") + " VNĐ";
  };

  // Helper function để lấy tên brand an toàn
  const getBrandName = (brand) => {
    if (!brand) return "-";
    
    // Nếu brand là object (có thuộc tính name)
    if (typeof brand === "object" && brand.name) {
      return brand.name;
    }
    
    // Nếu brand là string
    if (typeof brand === "string") {
      return brand;
    }
    
    return "-";
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border text-sm">
        <thead className="bg-blue-600 text-white">
          <tr>
            <th className="py-3 px-4 text-left">Ảnh</th>
            <th className="py-3 px-4 text-left">Tên xe</th>
            <th className="py-3 px-4 text-left">Hãng</th>
            <th className="py-3 px-4 text-left">Giá/giờ</th>
            <th className="py-3 px-4 text-left">Vị trí</th>
            <th className="py-3 px-4 text-left">Số chỗ</th>
            <th className="py-3 px-4 text-left">Hộp số</th>
            <th className="py-3 px-4 text-left">Nhiên liệu</th>
            <th className="py-3 px-4 text-left">Trạng thái</th>
            <th className="py-3 px-4 text-center">Thao tác</th>
          </tr>
        </thead>

        <tbody>
          {vehicles.map((v) => (
            <tr
              key={v._id}
              className="hover:bg-blue-50 border-b transition-colors"
            >
              <td className="py-2 px-4">
                <img
                  src={
                    v.images && v.images.length > 0
                      ? getImageUrl(v.images[0])
                      : "/no-image.png"
                  }
                  alt={v.name}
                  className="w-20 h-14 object-cover rounded shadow"
                />
              </td>
              <td className="py-2 px-4 font-medium">{v.name}</td>
              <td className="py-2 px-4">{getBrandName(v.brand)}</td>
              <td className="py-2 px-4">{formatPrice(v.pricePerHour)}</td>
              <td className="py-2 px-4">{v.location}</td>
              <td className="py-2 px-4 text-center">{v.seats || "-"}</td>
              <td className="py-2 px-4 capitalize">{v.transmission}</td>
              <td className="py-2 px-4 capitalize">{v.fuelType}</td>
              <td className="py-2 px-4">
                <select
                  value={v.isAvailable ? "true" : "false"}
                  onChange={(e) =>
                    handleStatusChange(v, e.target.value === "true")
                  }
                  className={`border rounded px-2 py-1 focus:ring focus:ring-blue-300 ${
                    v.isAvailable
                      ? "bg-green-50 border-green-400 text-green-700"
                      : "bg-red-50 border-red-400 text-red-700"
                  }`}
                >
                  <option value="true">Đang cho thuê</option>
                  <option value="false">Tạm ngưng</option>
                </select>
              </td>
              <td className="py-2 px-4 text-center align-middle">
                <div className="inline-flex justify-center gap-3">
                  <button
                    title="Chỉnh sửa"
                    onClick={() => onEdit(v)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <FaEdit size={18} />
                  </button>
                  <button
                    title="Xóa xe"
                    onClick={() => onDelete(v._id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <FaTrashAlt size={18} />
                  </button>
                </div>
              </td>
            </tr>
          ))}

          {vehicles.length === 0 && (
            <tr>
              <td colSpan="10" className="text-center py-6 text-gray-500">
                Chưa có xe nào trong hệ thống.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default VehicleTable;