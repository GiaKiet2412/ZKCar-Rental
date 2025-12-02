import React, { useState } from "react";
import { X } from "lucide-react";
import AutocompleteLocation from "./AutocompleteLocation";

/**
 * Modal để người dùng nhập địa chỉ giao xe
 * Sử dụng khi chọn option "Giao xe" mà chưa có địa chỉ
 */
const DeliveryLocationModal = ({ onClose, onConfirm, initialLocation = "" }) => {
  const [location, setLocation] = useState(initialLocation);
  const [locationData, setLocationData] = useState(null);
  const [error, setError] = useState("");

  const handleConfirm = () => {
    if (!location || location.trim() === "") {
      setError("Vui lòng nhập địa chỉ giao xe");
      return;
    }

    onConfirm(location, locationData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[600]">
      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-xl w-full max-w-2xl relative animate-fadeIn">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold text-center mb-2">
          Nhập địa chỉ giao xe
        </h2>
        <p className="text-center text-gray-600 mb-6">
          Chúng tôi sẽ giao xe đến địa chỉ của bạn
        </p>

        <div className="mb-6">
          <label className="block font-semibold mb-2">
            Địa chỉ giao xe <span className="text-red-500">*</span>
          </label>
          <AutocompleteLocation
            value={location}
            onSelect={(label, obj) => {
              setLocation(label);
              setLocationData(obj);
              setError("");
            }}
            placeholder="Nhập địa chỉ giao xe tại TP.HCM"
          />
          {error && (
            <p className="text-red-500 text-sm mt-2">{error}</p>
          )}
          <p className="text-xs text-gray-500 mt-2">
            Phí giao xe sẽ được tính dựa trên khoảng cách từ vị trí xe đến địa chỉ của bạn
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-800">
            <strong>Lưu ý:</strong> Phí giao xe dao động từ 50.000đ - 150.000đ tùy khoảng cách. 
            Chi phí cụ thể sẽ được hiển thị sau khi bạn xác nhận địa chỉ.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Hủy
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeliveryLocationModal;