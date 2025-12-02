import React from 'react';
import { MapPin, AlertTriangle } from 'lucide-react';
import { formatCurrencyVN } from '../../utils/formatUtils';

const PickupTypeSelector = ({
  vehicle,
  selectedPickup,
  onPickupChange,
  deliveryLocation,
  onDeliveryLocationClick,
  onDeliveryLocationChange,
  selfReturn,
  onSelfReturnChange,
  deliveryFeePerTrip,
  isReturnTimeInvalid
}) => {
  return (
    <div className="mt-4">
      <p className="font-semibold text-gray-800 mb-2">Hình thức nhận xe</p>
      <div className="space-y-3 text-sm text-gray-700">
        {/* Nhận tại chỗ */}
        <label
          className={`block border rounded-xl p-3 cursor-pointer transition-all ${
            selectedPickup === "self"
              ? "border-green-500 bg-green-50 shadow-sm"
              : "border-gray-300 hover:border-gray-400"
          }`}
          onClick={() => onPickupChange("self")}>
          <div className="flex items-start gap-2">
            <input
              type="radio"
              name="pickupType"
              value="self"
              checked={selectedPickup === "self"}
              readOnly
              className="mt-1 accent-green-600"/>
            <div>
              <p className="font-medium text-gray-800">Khách nhận tại vị trí xe đậu</p>
              <p className="flex items-center gap-1 mt-1">
                <MapPin size={16} className="text-green-600" />
                {vehicle.locationPickUp}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Địa điểm cụ thể sẽ được hiển thị sau khi thanh toán thành công, thời gian lấy xe 24/24.
              </p>
            </div>
          </div>
        </label>

        {/* Giao xe */}
        <label
          className={`block border rounded-xl p-3 cursor-pointer transition-all ${
            selectedPickup === "delivery"
              ? isReturnTimeInvalid
                ? "border-red-500 bg-red-50"
                : "border-green-500 bg-green-50 shadow-sm"
              : "border-gray-300 hover:border-gray-400"
          }`}
          onClick={onDeliveryLocationClick}>
          <div className="flex items-start gap-2">
            <input
              type="radio"
              name="pickupType"
              value="delivery"
              checked={selectedPickup === "delivery"}
              readOnly
              className="mt-1 accent-green-600"/>
            <div className="flex-1">
              <p className="font-medium text-gray-800">KIETCAR giao & nhận xe tại</p>
              
              {deliveryLocation ? (
                <div className="mt-2">
                  <p className="text-sm text-gray-700 flex items-start gap-1">
                    <MapPin size={14} className="text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{deliveryLocation}</span>
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeliveryLocationChange();
                    }}
                    className="text-green-600 hover:text-green-800 underline text-xs mt-1"
                  >
                    Thay đổi địa chỉ
                  </button>

                  <div className="mt-2 text-xs text-gray-600 space-y-1">
                    <p>• Phí giao xe: {formatCurrencyVN(deliveryFeePerTrip)}</p>
                    {!selfReturn && (
                      <p>• Phí nhận xe: {formatCurrencyVN(deliveryFeePerTrip)}</p>
                    )}
                  </div>

                  {isReturnTimeInvalid && (
                    <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded-lg flex items-start gap-2">
                      <AlertTriangle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-red-700 font-medium">
                        Với tùy chọn "KIETCAR giao & nhận xe tại", giờ trả xe phải trong khung giờ 7:00 - 22:00. 
                        Vui lòng chọn giờ trả xe khác.
                      </p>
                    </div>
                  )}

                  <div className="mt-2">
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selfReturn}
                        onChange={(e) => {
                          e.stopPropagation();
                          onSelfReturnChange(e.target.checked);
                        }}
                        className="mt-0.5 accent-green-600"
                      />
                      <span className="text-xs text-gray-700">
                        Khách trả xe tại vị trí xe đậu (miễn phí nhận xe)
                      </span>
                    </label>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-red-500 mt-1">
                  Vui lòng nhập địa chỉ giao xe
                </p>
              )}
            </div>
          </div>
        </label>
      </div>
    </div>
  );
};

export default PickupTypeSelector;