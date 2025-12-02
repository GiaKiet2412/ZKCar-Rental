import React, { useEffect, useState } from "react";
import { X, Tag, Clock, AlertCircle } from "lucide-react";
import API from "../../api/axios";
import { formatCurrencyVN } from "../../utils/formatUtils";

const DiscountModal = ({ onClose, onSelect, totalAmount, pickupDate, returnDate }) => {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCode, setSelectedCode] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const fetchDiscounts = async () => {
    try {
      setLoading(true);
      // FIXED: Đổi từ /api/discounts sang /api/discounts/available
      const res = await API.get("/api/discounts/available");
      setDiscounts(res.data || []);
    } catch (err) {
      console.error("Lỗi khi tải danh sách mã giảm giá:", err);
      setError("Không thể tải danh sách mã giảm giá");
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (discount) => {
    try {
      // Validate mã trước khi áp dụng
      const res = await API.post("/api/discounts/validate", {
        code: discount.code,
        totalAmount: totalAmount || 0,
        pickupDate: pickupDate || new Date(),
        returnDate: returnDate || new Date()
      });

      if (res.data.valid) {
        setSelectedCode(discount.code);
        // Trả về discount object với discountAmount đã tính
        onSelect(res.data.discount);
        onClose();
      }
    } catch (err) {
      const message = err.response?.data?.message || "Không thể áp dụng mã này";
      setError(message);
      
      // Clear error sau 3s
      setTimeout(() => setError(""), 3000);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getDiscountText = (discount) => {
    if (discount.discountType === "percent") {
      const text = `Giảm ${discount.discountValue}%`;
      return discount.maxDiscountAmount > 0 
        ? `${text} (tối đa ${formatCurrencyVN(discount.maxDiscountAmount)})`
        : text;
    }
    return `Giảm ${formatCurrencyVN(discount.discountValue)}`;
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-[200] flex items-center justify-center px-3">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b bg-gradient-to-r from-green-50 to-blue-50">
          <div className="flex items-center gap-2">
            <Tag className="text-green-600" size={22} />
            <h2 className="text-lg font-semibold text-gray-800">Mã khuyến mãi</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition">
            <X size={22} />
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Nội dung */}
        <div className="max-h-[70vh] overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
            </div>
          ) : discounts.length === 0 ? (
            <div className="text-center py-8">
              <Tag className="mx-auto mb-3 text-gray-400" size={48} />
              <p className="text-gray-500">Hiện chưa có mã khuyến mãi nào</p>
            </div>
          ) : (
            <div className="space-y-3">
              {discounts.map((d) => {
                const isExpiringSoon = new Date(d.validTo) - new Date() < 7 * 24 * 60 * 60 * 1000;
                const isLowQuantity = d.quantity <= 10;

                return (
                  <div
                    key={d._id}
                    onClick={() => handleSelect(d)}
                    className={`border rounded-xl p-4 cursor-pointer transition-all relative overflow-hidden ${
                      selectedCode === d.code
                        ? "border-green-500 bg-green-50 shadow-md"
                        : "border-gray-200 hover:border-green-400 hover:bg-green-50 hover:shadow-sm"
                    }`}
                  >
                    {/* Badge góc trên phải */}
                    <div className="absolute top-3 right-3">
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-green-100 text-green-700">
                        {getDiscountText(d)}
                      </span>
                    </div>

                    {/* Mã code */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg font-bold text-gray-800 bg-gray-100 px-3 py-1 rounded-lg border-2 border-dashed border-green-400">
                        {d.code}
                      </span>
                    </div>

                    {/* Mô tả */}
                    {d.description && (
                      <p className="text-sm text-gray-700 mb-2 pr-20">
                        {d.description}
                      </p>
                    )}

                    {/* Điều kiện */}
                    <div className="space-y-1 text-xs text-gray-600">
                      {d.minOrderAmount > 0 && (
                        <p>• Đơn tối thiểu: {formatCurrencyVN(d.minOrderAmount)}</p>
                      )}
                      
                      {d.forNewUsersOnly && (
                        <p className="text-blue-600 font-medium">• Dành cho khách hàng mới</p>
                      )}
                      
                      {d.forNthOrder && (
                        <p className="text-purple-600 font-medium">• Áp dụng cho lần thuê thứ {d.forNthOrder}</p>
                      )}
                      
                      {d.requirePreBookingDays > 0 && (
                        <p>• Đặt trước ít nhất {d.requirePreBookingDays} ngày</p>
                      )}
                    </div>

                    {/* Thời gian và số lượng */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock size={14} />
                        <span>HSD: {formatDate(d.validTo)}</span>
                        {isExpiringSoon && (
                          <span className="ml-1 text-orange-600 font-medium">(Sắp hết hạn)</span>
                        )}
                      </div>
                      
                      <div className="text-xs">
                        <span className={`font-medium ${isLowQuantity ? 'text-red-600' : 'text-gray-600'}`}>
                          Còn {d.quantity} mã
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
          <p className="text-xs text-gray-500">
            Chọn một mã để áp dụng vào đơn hàng
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiscountModal;