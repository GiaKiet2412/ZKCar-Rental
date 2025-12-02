import React, { useState, useEffect } from "react";
import API from "../../api/axios";
import { FaPlus, FaEdit, FaTrash, FaToggleOn, FaToggleOff } from "react-icons/fa";
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
    isActive: true,
  });

  // Fetch danh sách mã
  useEffect(() => {
    fetchDiscounts();
  }, []);

  const fetchDiscounts = async () => {
    try {
      const res = await API.get("/api/discounts");
      setDiscounts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Reset form
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
      isActive: true,
    });
    setEditDiscount(null);
  };

  // Xử lý thay đổi input
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // Submit form (tạo hoặc sửa)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editDiscount) {
        await API.put(`/api/discounts/${editDiscount._id}`, formData);
        setToast({ message: "Cập nhật mã giảm giá thành công", type: "success" });
      } else {
        await API.post("/api/discounts", formData);
        setToast({ message: "Tạo mã giảm giá thành công", type: "success" });
      }
      setShowForm(false);
      resetForm();
      fetchDiscounts();
    } catch (err) {
      console.error(err);
      setToast({ message: "Lỗi khi lưu mã giảm giá", type: "error" });
    }
  };

  // Xóa
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

  // Toggle trạng thái
  const handleToggle = async (id) => {
    try {
      await API.patch(`/api/discounts/${id}/toggle`);
      setToast({ message: "Đã thay đổi trạng thái mã", type: "success" });
      fetchDiscounts();
    } catch (err) {
      console.error(err);
    }
  };

  // Chỉnh sửa
  const handleEdit = (discount) => {
    setEditDiscount(discount);
    setFormData({
      ...discount,
      validFrom: discount.validFrom?.split("T")[0] || "",
      validTo: discount.validTo?.split("T")[0] || "",
      rentalStart: discount.rentalStart?.split("T")[0] || "",
      rentalEnd: discount.rentalEnd?.split("T")[0] || "",
    });
    setShowForm(true);
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
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <FaPlus /> Thêm mã
        </button>
      </div>

      {/* --- Bảng danh sách --- */}
      <div className="overflow-x-auto bg-white rounded-xl shadow">
        <table className="min-w-full text-sm text-left border">
          <thead className="bg-blue-600 text-white text-sm">
            <tr>
              <th className="px-3 py-2 w-[80px]">Mã</th>
              <th className="px-3 py-2 w-[180px]">Mô tả</th>
              <th className="px-3 py-2 w-[100px]">Giảm</th>
              <th className="px-3 py-2 w-[60px] text-center">SL</th>
              <th className="px-3 py-2 w-[160px]">Hiệu lực</th>
              <th className="px-3 py-2 w-[100px] text-center">Trạng thái</th>
              <th className="px-3 py-2 text-center w-[120px]">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {discounts.map((d) => (
              <tr key={d._id} className="border-b hover:bg-gray-50">
                <td className="px-3 py-2 font-semibold">{d.code}</td>

                {/* --- Cột mô tả --- */}
                <td className="px-3 py-2 max-w-[180px] truncate" title={d.description}>
                  {d.description || "-"}
                </td>

                {/* --- Giảm giá --- */}
                <td className="px-3 py-2">
                  {d.discountType === "percent"
                    ? `${d.discountValue}%`
                    : `${d.discountValue.toLocaleString()}đ`}
                  {d.maxDiscountAmount
                    ? ` (≤${d.maxDiscountAmount.toLocaleString()}đ)`
                    : ""}
                </td>

                <td className="px-3 py-2 text-center">{d.quantity}</td>

                {/* --- Hiệu lực --- */}
                <td className="px-3 py-2 text-sm text-gray-700">
                  {new Date(d.validFrom).toLocaleDateString("vi-VN")} →{" "}
                  {new Date(d.validTo).toLocaleDateString("vi-VN")}
                </td>

                {/* --- Trạng thái --- */}
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

                {/* --- Hành động --- */}
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

      {/* --- Form tạo/sửa --- */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-[600px] p-6 relative">
            <h3 className="text-xl font-bold mb-4 text-blue-700">
              {editDiscount ? "Chỉnh sửa mã" : "Thêm mã giảm giá"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium">Mã</label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    className="w-full border rounded p-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Loại giảm</label>
                  <select
                    name="discountType"
                    value={formData.discountType}
                    onChange={handleChange}
                    className="w-full border rounded p-2"
                  >
                    <option value="percent">%</option>
                    <option value="amount">VNĐ</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium">Giá trị giảm</label>
                  <input
                    type="number"
                    name="discountValue"
                    value={formData.discountValue}
                    onChange={handleChange}
                    className="w-full border rounded p-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Giảm tối đa (đ)</label>
                  <input
                    type="number"
                    name="maxDiscountAmount"
                    value={formData.maxDiscountAmount}
                    onChange={handleChange}
                    className="w-full border rounded p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium">Mô tả</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full border rounded p-2"
                  rows="2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium">Số lượng mã</label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    className="w-full border rounded p-2"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Đơn tối thiểu (đ)</label>
                  <input
                    type="number"
                    name="minOrderAmount"
                    value={formData.minOrderAmount}
                    onChange={handleChange}
                    className="w-full border rounded p-2"
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium">Từ ngày</label>
                  <input
                    type="date"
                    name="validFrom"
                    value={formData.validFrom}
                    onChange={handleChange}
                    className="w-full border rounded p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Đến ngày</label>
                  <input
                    type="date"
                    name="validTo"
                    value={formData.validTo}
                    onChange={handleChange}
                    className="w-full border rounded p-2"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Xác nhận xóa --- */}
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