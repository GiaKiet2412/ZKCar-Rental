import React, { useState, useEffect } from "react";
import API from "../../api/axios";
import { FaPlus, FaEdit, FaTrash, FaToggleOn, FaToggleOff, FaInfoCircle } from "react-icons/fa";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { useToast } from "../../context/ToastContext";

const DiscountManagementPage = () => {
  const { setToast } = useToast();

  const [discounts, setDiscounts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editDiscount, setEditDiscount] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discountType: "percent",
    discountValue: "",
    maxDiscountAmount: "",
    minOrderAmount: "",
    quantity: "",
    validFrom: "",
    validTo: "",
    rentalStart: "",
    rentalEnd: "",
    forNewUsersOnly: false,
    forNthOrder: "",
    requirePreBookingDays: "",
    exclusive: true,
    isActive: true,
  });

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const fetchDiscounts = async () => {
    try {
      const res = await API.get("/api/discounts");
      setDiscounts(res.data);
    } catch (err) {
      console.error(err);
      setToast({ message: "Lỗi khi tải danh sách mã giảm giá", type: "error" });
    }
  };

  const resetForm = () => {
    setFormData({
      code: "",
      description: "",
      discountType: "percent",
      discountValue: "",
      maxDiscountAmount: "",
      minOrderAmount: "",
      quantity: "",
      validFrom: "",
      validTo: "",
      rentalStart: "",
      rentalEnd: "",
      forNewUsersOnly: false,
      forNthOrder: "",
      requirePreBookingDays: "",
      exclusive: true,
      isActive: true,
    });
    setEditDiscount(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Nếu chọn forNewUsersOnly, tự động xóa forNthOrder
    if (name === "forNewUsersOnly" && checked) {
      setFormData({
        ...formData,
        forNewUsersOnly: true,
        forNthOrder: ""
      });
      return;
    }

    // Nếu nhập forNthOrder, tự động bỏ forNewUsersOnly
    if (name === "forNthOrder" && value) {
      setFormData({
        ...formData,
        forNewUsersOnly: false,
        forNthOrder: value
      });
      return;
    }

    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate
    if (formData.forNewUsersOnly && formData.forNthOrder) {
      setToast({ 
        message: "Không thể chọn cả 'Khách hàng mới' và 'Lần thuê thứ N' cùng lúc", 
        type: "error" 
      });
      return;
    }

    try {
      // Chuẩn bị data gửi lên server
      const submitData = {
        ...formData,
        // Chuyển đổi các giá trị rỗng thành null hoặc 0
        maxDiscountAmount: formData.maxDiscountAmount || 0,
        minOrderAmount: formData.minOrderAmount || 0,
        forNthOrder: formData.forNthOrder ? parseInt(formData.forNthOrder) : null,
        requirePreBookingDays: formData.requirePreBookingDays ? parseInt(formData.requirePreBookingDays) : 0,
        rentalStart: formData.rentalStart || null,
        rentalEnd: formData.rentalEnd || null,
      };

      if (editDiscount) {
        await API.put(`/api/discounts/${editDiscount._id}`, submitData);
        setToast({ message: "Cập nhật mã giảm giá thành công", type: "success" });
      } else {
        await API.post("/api/discounts", submitData);
        setToast({ message: "Tạo mã giảm giá thành công", type: "success" });
      }
      setShowForm(false);
      resetForm();
      fetchDiscounts();
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || "Lỗi khi lưu mã giảm giá";
      setToast({ message: errorMsg, type: "error" });
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await API.delete(`/api/discounts/${confirmDelete._id}`);
      setToast({ message: `Đã xóa mã ${confirmDelete.code}`, type: "success" });
      setConfirmDelete(null);
      fetchDiscounts();
    } catch (err) {
      console.error(err);
      setToast({ message: "Lỗi khi xóa mã", type: "error" });
    }
  };

  const handleToggle = async (id) => {
    try {
      await API.patch(`/api/discounts/${id}/toggle`);
      setToast({ message: "Đã thay đổi trạng thái mã", type: "success" });
      fetchDiscounts();
    } catch (err) {
      console.error(err);
      setToast({ message: "Lỗi khi thay đổi trạng thái", type: "error" });
    }
  };

  const handleEdit = (discount) => {
    setEditDiscount(discount);
    setFormData({
      code: discount.code || "",
      description: discount.description || "",
      discountType: discount.discountType || "percent",
      discountValue: discount.discountValue || "",
      maxDiscountAmount: discount.maxDiscountAmount || "",
      minOrderAmount: discount.minOrderAmount || "",
      quantity: discount.quantity || "",
      validFrom: discount.validFrom?.split("T")[0] || "",
      validTo: discount.validTo?.split("T")[0] || "",
      rentalStart: discount.rentalStart?.split("T")[0] || "",
      rentalEnd: discount.rentalEnd?.split("T")[0] || "",
      forNewUsersOnly: discount.forNewUsersOnly || false,
      forNthOrder: discount.forNthOrder || "",
      requirePreBookingDays: discount.requirePreBookingDays || "",
      exclusive: discount.exclusive !== undefined ? discount.exclusive : true,
      isActive: discount.isActive !== undefined ? discount.isActive : true,
    });
    setShowForm(true);
  };

  // Helper để hiển thị điều kiện
  const renderConditions = (discount) => {
    const conditions = [];
    
    if (discount.forNewUsersOnly) {
      conditions.push(<span key="new" className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Khách mới</span>);
    }
    
    if (discount.forNthOrder) {
      conditions.push(<span key="nth" className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">Lần {discount.forNthOrder}</span>);
    }
    
    if (discount.requirePreBookingDays > 0) {
      conditions.push(<span key="prebook" className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">Đặt trước {discount.requirePreBookingDays} ngày</span>);
    }

    if (discount.minOrderAmount > 0) {
      conditions.push(<span key="min" className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Tối thiểu {discount.minOrderAmount.toLocaleString()}đ</span>);
    }
    
    return conditions.length > 0 ? conditions : <span className="text-xs text-gray-400">Không có điều kiện</span>;
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-blue-700">Quản lý Mã giảm giá</h2>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <FaPlus /> Thêm mã
        </button>
      </div>

      {/* Bảng danh sách */}
      <div className="overflow-x-auto bg-white rounded-xl shadow">
        <table className="min-w-full text-sm text-left border">
          <thead className="bg-blue-600 text-white text-sm">
            <tr>
              <th className="px-3 py-2 w-[80px]">Mã</th>
              <th className="px-3 py-2 w-[180px]">Mô tả</th>
              <th className="px-3 py-2 w-[100px]">Giảm</th>
              <th className="px-3 py-2 w-[60px] text-center">SL</th>
              <th className="px-3 py-2 w-[200px]">Điều kiện</th>
              <th className="px-3 py-2 w-[160px]">Hiệu lực</th>
              <th className="px-3 py-2 w-[100px] text-center">Trạng thái</th>
              <th className="px-3 py-2 text-center w-[120px]">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {discounts.map((d) => (
              <tr key={d._id} className="border-b hover:bg-gray-50">
                <td className="px-3 py-2 font-semibold">{d.code}</td>
                <td className="px-3 py-2 max-w-[180px] truncate" title={d.description}>
                  {d.description || "-"}
                </td>
                <td className="px-3 py-2">
                  {d.discountType === "percent"
                    ? `${d.discountValue}%`
                    : `${d.discountValue.toLocaleString()}đ`}
                  {d.maxDiscountAmount > 0
                    ? ` (≤${d.maxDiscountAmount.toLocaleString()}đ)`
                    : ""}
                </td>
                <td className="px-3 py-2 text-center">{d.quantity}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    {renderConditions(d)}
                  </div>
                </td>
                <td className="px-3 py-2 text-sm text-gray-700">
                  {new Date(d.validFrom).toLocaleDateString("vi-VN")} →{" "}
                  {new Date(d.validTo).toLocaleDateString("vi-VN")}
                </td>
                <td className="px-3 py-2 text-center">
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                      d.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {d.isActive ? "Đang mở" : "Đang tắt"}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <div className="flex justify-center items-center gap-4 text-lg">
                    <button
                      onClick={() => handleToggle(d._id)}
                      title={d.isActive ? "Tắt mã" : "Mở mã"}
                      className="hover:scale-110 transition"
                    >
                      {d.isActive ? (
                        <FaToggleOn className="text-green-600" />
                      ) : (
                        <FaToggleOff className="text-gray-400" />
                      )}
                    </button>
                    <button
                      onClick={() => handleEdit(d)}
                      title="Sửa"
                      className="text-blue-600 hover:text-blue-800 hover:scale-110 transition"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(d)}
                      title="Xóa"
                      className="text-red-600 hover:text-red-800 hover:scale-110 transition"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Form tạo/sửa */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 z-10">
              <h3 className="text-xl font-bold text-blue-700">
                {editDiscount ? "Chỉnh sửa mã" : "Thêm mã giảm giá"}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Thông tin cơ bản */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-700 mb-3">Thông tin cơ bản</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Mã giảm giá *</label>
                    <input
                      type="text"
                      name="code"
                      value={formData.code}
                      onChange={handleChange}
                      className="w-full border rounded-lg p-2 uppercase"
                      placeholder="VD: NEWUSER20"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Loại giảm *</label>
                    <select
                      name="discountType"
                      value={formData.discountType}
                      onChange={handleChange}
                      className="w-full border rounded-lg p-2"
                    >
                      <option value="percent">Phần trăm (%)</option>
                      <option value="amount">Số tiền cố định (VNĐ)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Giá trị giảm * {formData.discountType === "percent" ? "(%)" : "(VNĐ)"}
                    </label>
                    <input
                      type="number"
                      name="discountValue"
                      value={formData.discountValue}
                      onChange={handleChange}
                      className="w-full border rounded-lg p-2"
                      placeholder={formData.discountType === "percent" ? "VD: 20" : "VD: 50000"}
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Giảm tối đa (VNĐ)
                      <span className="text-gray-400 text-xs ml-1">(Chỉ với %)</span>
                    </label>
                    <input
                      type="number"
                      name="maxDiscountAmount"
                      value={formData.maxDiscountAmount}
                      onChange={handleChange}
                      className="w-full border rounded-lg p-2"
                      placeholder="VD: 100000"
                      min="0"
                      disabled={formData.discountType === "amount"}
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block text-sm font-medium mb-1">Mô tả</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full border rounded-lg p-2"
                    rows="2"
                    placeholder="Mô tả chi tiết về mã giảm giá"
                  />
                </div>
              </div>

              {/* Điều kiện áp dụng */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <FaInfoCircle className="text-blue-600" />
                  Điều kiện áp dụng
                </h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Số lượng mã *</label>
                    <input
                      type="number"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleChange}
                      className="w-full border rounded-lg p-2"
                      placeholder="VD: 100"
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Đơn tối thiểu (VNĐ)</label>
                    <input
                      type="number"
                      name="minOrderAmount"
                      value={formData.minOrderAmount}
                      onChange={handleChange}
                      className="w-full border rounded-lg p-2"
                      placeholder="VD: 500000"
                      min="0"
                    />
                  </div>
                </div>

                {/* Điều kiện đặc biệt */}
                <div className="mt-3 space-y-3">
                  <div className="flex items-center gap-2 bg-white p-3 rounded-lg border">
                    <input
                      type="checkbox"
                      id="forNewUsersOnly"
                      name="forNewUsersOnly"
                      checked={formData.forNewUsersOnly}
                      onChange={handleChange}
                      className="w-4 h-4"
                    />
                    <label htmlFor="forNewUsersOnly" className="text-sm font-medium flex-1">
                      Chỉ dành cho khách hàng mới
                      <span className="block text-xs text-gray-500">Chỉ áp dụng cho người dùng chưa từng thuê xe</span>
                    </label>
                  </div>

                  <div className="bg-white p-3 rounded-lg border">
                    <label className="block text-sm font-medium mb-2">
                      Áp dụng cho lần thuê thứ
                      <span className="block text-xs text-gray-500">VD: Nhập 2 để áp dụng cho lần thuê thứ 2</span>
                    </label>
                    <input
                      type="number"
                      name="forNthOrder"
                      value={formData.forNthOrder}
                      onChange={handleChange}
                      className="w-full border rounded-lg p-2"
                      placeholder="VD: 2, 3, 5..."
                      min="1"
                      disabled={formData.forNewUsersOnly}
                    />
                    {formData.forNewUsersOnly && (
                      <p className="text-xs text-orange-600 mt-1">
                        Không thể kết hợp với "Khách hàng mới"
                      </p>
                    )}
                  </div>

                  <div className="bg-white p-3 rounded-lg border">
                    <label className="block text-sm font-medium mb-2">
                      Yêu cầu đặt trước (ngày)
                      <span className="block text-xs text-gray-500">Khách phải đặt trước ít nhất X ngày</span>
                    </label>
                    <input
                      type="number"
                      name="requirePreBookingDays"
                      value={formData.requirePreBookingDays}
                      onChange={handleChange}
                      className="w-full border rounded-lg p-2"
                      placeholder="VD: 7"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              {/* Thời gian hiệu lực */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-700 mb-3">Thời gian hiệu lực</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Từ ngày *</label>
                    <input
                      type="date"
                      name="validFrom"
                      value={formData.validFrom}
                      onChange={handleChange}
                      className="w-full border rounded-lg p-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Đến ngày *</label>
                    <input
                      type="date"
                      name="validTo"
                      value={formData.validTo}
                      onChange={handleChange}
                      className="w-full border rounded-lg p-2"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Chuyến đi từ ngày
                      <span className="text-gray-400 text-xs ml-1">(Tùy chọn)</span>
                    </label>
                    <input
                      type="date"
                      name="rentalStart"
                      value={formData.rentalStart}
                      onChange={handleChange}
                      className="w-full border rounded-lg p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Chuyến đi đến ngày
                      <span className="text-gray-400 text-xs ml-1">(Tùy chọn)</span>
                    </label>
                    <input
                      type="date"
                      name="rentalEnd"
                      value={formData.rentalEnd}
                      onChange={handleChange}
                      className="w-full border rounded-lg p-2"
                    />
                  </div>
                </div>
              </div>

              {/* Cài đặt khác */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="exclusive"
                    name="exclusive"
                    checked={formData.exclusive}
                    onChange={handleChange}
                    className="w-4 h-4"
                  />
                  <label htmlFor="exclusive" className="text-sm font-medium">
                    Không kết hợp với mã khác
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="w-4 h-4"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium">
                    Kích hoạt ngay
                  </label>
                </div>
              </div>

              {/* Nút hành động */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="px-6 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  {editDiscount ? "Cập nhật" : "Tạo mã"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Xác nhận xóa */}
      {confirmDelete && (
        <ConfirmDialog
          title="Xác nhận xóa"
          message={`Bạn có chắc muốn xóa mã ${confirmDelete.code}?`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
};

export default DiscountManagementPage;