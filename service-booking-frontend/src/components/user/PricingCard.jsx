import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { formatCurrencyVN } from '../../utils/formatUtils';
import PickupTypeSelector from './PickupTypeSelector'; // IMPORT COMPONENT

const PricingCard = ({
  vehicle,
  price4h,
  price8h,
  price12h,
  price24h,
  timeBoxColor,
  rangeDisplay,
  totalHours,
  onTimeClick,
  // Pickup props
  selectedPickup,
  onPickupChange,
  deliveryLocation,
  onDeliveryLocationClick,
  onDeliveryLocationChange,
  selfReturn,
  onSelfReturnChange,
  deliveryFeePerTrip,
  isReturnTimeInvalid,
  // Insurance & pricing
  selectedInsurance,
  onInsuranceChange,
  rentFeeRounded,
  insuranceFee,
  deliveryFee,
  VATRounded,
  totalRounded,
  holdFee,
  totalDeposit,
  selectedDiscount,
  onDiscountClick,
  isCreatingBooking,
  onConfirm
}) => {
  return (
    <div className="bg-gray-50 rounded-2xl p-5 shadow-lg space-y-4">
      {/* Bảng giá */}
      <div className="grid grid-cols-2 gap-2 text-sm text-gray-800">
        <div className="bg-white border rounded-lg p-2 text-center">
          <p className="font-semibold">4h</p>
          <p>{formatCurrencyVN(price4h)}</p>
        </div>
        <div className="bg-white border rounded-lg p-2 text-center">
          <p className="font-semibold">8h</p>
          <p>{formatCurrencyVN(price8h)}</p>
        </div>
        <div className="bg-white border rounded-lg p-2 text-center">
          <p className="font-semibold">12h</p>
          <p>{formatCurrencyVN(price12h)}</p>
        </div>
        <div className="bg-white border rounded-lg p-2 text-center">
          <p className="font-semibold">24h</p>
          <p>{formatCurrencyVN(price24h)}</p>
        </div>
      </div>

      <p className="text-xs text-gray-500 mt-2">
        Đơn giá gói chỉ áp dụng cho ngày thường. Giá ngày Lễ / Tết có thể điều chỉnh theo nhu cầu.
      </p>

      {/* Thời gian thuê */}
      <div
        onClick={onTimeClick}
        className={`p-4 rounded-lg border-2 transition-all cursor-pointer group ${
          timeBoxColor === "gray" 
            ? "border-gray-300 bg-gray-50 hover:border-green-400 hover:bg-green-50" 
            : timeBoxColor === "yellow" 
            ? "border-yellow-400 bg-yellow-50 hover:border-yellow-500 hover:bg-yellow-100" 
            : "border-red-400 bg-red-50 hover:border-red-500 hover:bg-red-100"
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1 flex items-center gap-2">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-4 w-4" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Thời gian thuê xe
            </p>
            
            <p className="font-semibold text-gray-900 mt-1 group-hover:text-green-700 transition-colors">
              {rangeDisplay || "Chưa chọn thời gian"}
            </p>
            
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-gray-600">
                Tổng: <span className="font-medium text-gray-800">{totalHours} giờ</span>
              </span>
            </div>

            {timeBoxColor === "yellow" && (
              <div className="mt-3 pt-3 border-t border-yellow-200">
                <p className="text-xs text-yellow-700 flex items-start gap-2">
                  <span className="text-base">⚠️</span>
                  <span>
                    Khung giờ buổi khuya (22:00 - 7:00) có thể có ít lựa chọn xe hơn so với các khung giờ khác.
                  </span>
                </p>
              </div>
            )}

            {timeBoxColor === "red" && (
              <div className="mt-3 pt-3 border-t border-red-200">
                <p className="text-xs text-red-700 flex items-start gap-2">
                  <span className="text-base">🚫</span>
                  <span>
                    Thời gian không hợp lệ. Vui lòng chọn lại.
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* Icon chỉnh sửa */}
          <div className="ml-3 flex-shrink-0">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 text-gray-400 group-hover:text-green-600 transition-colors" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
        </div>
      </div>

      <hr />

      {/* Hình thức nhận xe - SỬ DỤNG COMPONENT */}
      <PickupTypeSelector
        vehicle={vehicle}
        selectedPickup={selectedPickup}
        onPickupChange={onPickupChange}
        deliveryLocation={deliveryLocation}
        onDeliveryLocationClick={onDeliveryLocationClick}
        onDeliveryLocationChange={onDeliveryLocationChange}
        selfReturn={selfReturn}
        onSelfReturnChange={onSelfReturnChange}
        deliveryFeePerTrip={deliveryFeePerTrip}
        isReturnTimeInvalid={isReturnTimeInvalid}
      />

      <hr />

      {/* Bảo hiểm */}
      <div className="space-y-1 text-gray-700 text-sm">
        <div className="mt-5">
          <p className="font-semibold text-gray-800 mb-1 flex items-center gap-2">
            <ShieldCheck size={18} className="text-green-600" />
            An tâm lái xe với bảo hiểm chuyến đi
          </p>
          <p className="text-sm text-gray-600 mb-3">
            Bảo hiểm chuyến đi của KIETCAR bao gồm cả Bảo hiểm tài sản xe và Bảo hiểm người ngồi trên xe.
          </p>

          <div className="border rounded-xl p-3 bg-white shadow-sm">
            <label className="block">
              <p className="font-semibold text-gray-800 mb-2">Chọn gói bảo hiểm</p>
              <select
                value={selectedInsurance}
                onChange={onInsuranceChange}
                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:border-green-500"
              >
                <option value="premium">11 quyền lợi - 1.4% ({formatCurrencyVN(Math.round(rentFeeRounded * 0.014))})</option>
                <option value="standard">7 quyền lợi - 1.3% ({formatCurrencyVN(Math.round(rentFeeRounded * 0.013))})</option>
                <option value="basic">4 quyền lợi - 1.2% ({formatCurrencyVN(Math.round(rentFeeRounded * 0.012))})</option>
              </select>
            </label>

            <div className="flex justify-between mt-3 text-sm">
              <button className="underline text-green-600">Xem chi tiết quyền lợi</button>
            </div>
          </div>
        </div>

        <hr />

        {/* Chi tiết giá */}
        <p>Phí thuê xe: {formatCurrencyVN(rentFeeRounded)}</p>
        <p>Phí bảo hiểm ({selectedInsurance === 'premium' ? '11' : selectedInsurance === 'standard' ? '7' : '4'} quyền lợi): {formatCurrencyVN(insuranceFee)}</p>
        {selectedPickup === "delivery" && deliveryLocation && (
          <p>Phí giao/nhận xe: {formatCurrencyVN(deliveryFee)}</p>
        )}

        <hr />
        
        {/* Giảm giá */}
        <div className="mt-5">
          <p className="font-semibold text-gray-800">Giảm giá</p>
          {selectedDiscount ? (
            <div className="mt-2 bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-green-700">
                    {selectedDiscount.code}
                  </p>
                  {selectedDiscount.description && (
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedDiscount.description}
                    </p>
                  )}
                  <p className="text-sm font-medium text-green-600 mt-1">
                    - {formatCurrencyVN(selectedDiscount.discountAmount || 0)}
                  </p>
                </div>
                <button
                  onClick={onDiscountClick}
                  className="text-xs text-blue-600 underline whitespace-nowrap ml-2"
                >
                  Đổi mã
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={onDiscountClick}
              className="mt-2 w-full border-2 border-dashed border-gray-300 rounded-lg p-3 text-green-600 hover:border-green-400 hover:bg-green-50 transition text-sm font-medium"
            >
              + Áp dụng mã khuyến mãi
            </button>
          )}
        </div>

        <p>VAT (10%): {formatCurrencyVN(VATRounded)}</p>
        <hr />
        <p className="text-lg font-semibold">Tổng cộng tiền thuê: {formatCurrencyVN(totalRounded)}</p>

        {/* Giữ chỗ & Cọc */}
        <div className="mt-4">
          <p className="font-semibold">Tổng giữ chỗ: {formatCurrencyVN(holdFee)}</p>
          <p className="text-gray-600 text-xs mt-1">
            Tiền giữ chỗ không phải phụ phí và sẽ được hoàn lại sau chuyến đi. 
            Lưu ý: Tham khảo chính sách hoàn giữ chỗ khi huỷ chuyến.
          </p>
        </div>

        <div className="mt-4">
          <p className="font-semibold">Cọc xe: {formatCurrencyVN(totalDeposit)}</p>
          <p className="text-gray-600 text-xs mt-1">
            Thanh toán khi nhận xe và kiểm tra xe, không nhận cọc xe máy. 
            Mức cọc có thể cao hơn đối với bằng lái mới được cấp dưới 1 năm.
          </p>
        </div>
      </div>

      <hr />

      {/* Các chi phí khác */}
      <div className="text-sm text-gray-700">
        <h4 className="font-semibold mb-1">Các chi phí khác</h4>

        {vehicle.fuelType === "Điện" ? (
          <>
            <p className="font-medium mt-2">Phụ phí điện và pin</p>
            <p className="text-gray-600 text-xs">
              1.000đ / km di chuyển (chỉ áp dụng cho xe điện)
            </p>
          </>
        ) : (
          <>
            <p className="font-medium mt-2">Phụ phí xăng</p>
            <p className="text-gray-600 text-xs">
              27.000đ / lít
            </p>
            <p className="text-gray-600 text-xs mt-1">
              Bonbon chỉ thu khi vạch xăng thấp hơn lúc nhận xe. Trả lại đúng vạch xăng như lúc nhận để không phải trả phí này.
            </p>
          </>
        )}

        <p className="font-medium mt-3">Phí vệ sinh</p>
        <p className="text-gray-600 text-xs">
          120.000đ - 150.000đ (tuỳ hiện trạng xe khi trả)
        </p>
      </div>

      {/* Button xác nhận */}
      <button
        onClick={onConfirm}
        disabled={isReturnTimeInvalid || isCreatingBooking}
        className={`w-full py-3 rounded-lg font-semibold text-white mt-3 transition ${
          isReturnTimeInvalid || isCreatingBooking
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-green-600 hover:bg-green-700'
        }`}
      >
        {isCreatingBooking ? (
          <span className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            Đang xử lý...
          </span>
        ) : isReturnTimeInvalid ? (
          'Vui lòng chọn giờ trả xe hợp lệ'
        ) : (
          'Thuê xe ngay'
        )}
      </button>
    </div>
  );
};

export default PricingCard;