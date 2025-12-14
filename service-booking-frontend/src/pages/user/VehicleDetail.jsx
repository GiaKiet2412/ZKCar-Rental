import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../api/axios";
import { useSearch } from "../../context/SearchContext";
import Header from "../../components/user/Header";
import { MapPin, ArrowLeft } from "lucide-react";
import { formatCurrencyVN, formatBookingRange } from "../../utils/formatUtils";
import DiscountModal from "../../components/user/DiscountModal";
import DeliveryLocationModal from "../../components/user/DeliveryLocationModal";
import ImageGallery from "../../components/user/ImageGallery";
import PricingCard from "../../components/user/PricingCard";
import TimeSelectionModal from "../../components/user/TimeSelectionModal";

const VehicleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { searchData, setSearchData } = useSearch();

  const [vehicle, setVehicle] = useState(null);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState(null);
  const [selectedPickup, setSelectedPickup] = useState("self");
  const [deliveryLocation, setDeliveryLocation] = useState(searchData?.location || "");
  const [selectedInsurance, setSelectedInsurance] = useState('premium');
  const [selfReturn, setSelfReturn] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);

  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        const res = await API.get(`/api/vehicles/${id}`);
        setVehicle(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchVehicle();
  }, [id]);

  const { pickup, ret } = useMemo(() => {
    const now = new Date();
    
    if (searchData?.pickupFull && searchData?.returnFull) {
      return {
        pickup: new Date(searchData.pickupFull),
        ret: new Date(searchData.returnFull)
      };
    } else {
      let defaultPickup = new Date(now);
      if (defaultPickup.getMinutes() > 15) {
        defaultPickup.setHours(defaultPickup.getHours() + 1);
        defaultPickup.setMinutes(0);
      } else {
        defaultPickup.setMinutes(0);
      }

      defaultPickup.setHours(defaultPickup.getHours() + 2);
      const defaultRet = new Date(defaultPickup);
      defaultRet.setHours(defaultRet.getHours() + 52);

      return {
        pickup: defaultPickup,
        ret: defaultRet
      };
    }
  }, [searchData]);

  const timeBoxColor = useMemo(() => {
    const pickupHour = pickup.getHours();
    if (pickupHour >= 22 || pickupHour < 6) return "yellow";
    return "gray";
  }, [pickup]);

  // Tính toán giá
  const totalHours = Math.max(Math.round((ret - pickup) / (1000 * 60 * 60)), 0);
  const images = vehicle?.images || [];

  const calcDiscountRate = (hours) => {
    if (hours <= 4) return 0;
    if (hours <= 8) return 0.3;
    if (hours <= 12) return 0.4667;
    return 0.6667;
  };

  const discountRate = calcDiscountRate(totalHours);
  const baseFee = (vehicle?.pricePerHour || 0) * totalHours;
  const rentFee = baseFee * (1 - discountRate);
  const roundTo = (num, step) => Math.round(num / step) * step;
  const rentFeeRounded = roundTo(rentFee, 500);

  const insuranceRates = {
    basic: 0.012,
    standard: 0.013,
    premium: 0.014
  };
  const insuranceFee = Math.round(rentFeeRounded * insuranceRates[selectedInsurance]);

  const deliveryFeePerTrip = 150000;
  let deliveryFee = 0;
  if (selectedPickup === "delivery" && deliveryLocation) {
    if (selfReturn) {
      deliveryFee = deliveryFeePerTrip;
    } else {
      deliveryFee = deliveryFeePerTrip * 2;
    }
  }

  const returnHour = ret.getHours();
  const isReturnTimeInvalid = (returnHour < 7 || returnHour >= 22) && selectedPickup === "delivery" && !selfReturn;

  const VAT = rentFeeRounded * 0.1;
  const totalDeposit = 3000000;
  const holdFee = 500000;
  
  const price4h = roundTo((vehicle?.pricePerHour || 0) * 4, 1000);
  const price8h = roundTo((vehicle?.pricePerHour || 0) * 8 * (1 - 0.3), 1000);
  const price12h = roundTo((vehicle?.pricePerHour || 0) * 12 * (1 - 0.4667), 1000);
  const price24h = roundTo((vehicle?.pricePerHour || 0) * 24 * (1 - 0.6667), 1000);
  
  const discountAmount = selectedDiscount?.discountAmount || 0;
  const VATRounded = Math.round(VAT);
  const totalRounded = Math.round(rentFeeRounded + insuranceFee + VATRounded + deliveryFee - discountAmount);
  const rangeDisplay = formatBookingRange(pickup, ret, { slash: true });

  // CRITICAL: Auto-revalidate discount khi giá thay đổi
  useEffect(() => {
    const revalidateDiscount = async () => {
      if (!selectedDiscount) return;

      try {
        const res = await API.post("/api/discounts/validate", {
          code: selectedDiscount.code,
          totalAmount: rentFeeRounded,
          pickupDate: pickup.toISOString(),
          returnDate: ret.toISOString()
        });

        if (!res.data.valid) {
          // Mã không còn hợp lệ với giá mới
          setSelectedDiscount(null);
          alert(`Mã giảm giá "${selectedDiscount.code}" không còn áp dụng được do thay đổi thông tin đơn hàng: ${res.data.message || 'Không đủ điều kiện'}`);
        } else {
          // Cập nhật lại discountAmount nếu có thay đổi
          if (res.data.discount.discountAmount !== selectedDiscount.discountAmount) {
            setSelectedDiscount(res.data.discount);
          }
        }
      } catch (err) {
        // Nếu validate fail, xóa mã
        console.error('Discount revalidation failed:', err);
        setSelectedDiscount(null);
        alert(`Mã giảm giá "${selectedDiscount.code}" đã bị xóa do không còn hợp lệ`);
      }
    };

    revalidateDiscount();
  }, [rentFeeRounded, pickup, ret]); // Re-validate khi giá hoặc thời gian thay đổi

  // Handlers
  const handleDeliveryOptionClick = () => {
    if (!deliveryLocation || deliveryLocation.trim() === "") {
      setShowDeliveryModal(true);
    } else {
      setSelectedPickup("delivery");
    }
  };

  const handleDeliveryLocationConfirm = (location, locationData) => {
    setDeliveryLocation(location);
    setSelectedPickup("delivery");
    setSearchData({
      ...searchData,
      location,
      locationData,
    });
  };

  const handlePickupChange = (type) => {
    setSelectedPickup(type);
    if (type === 'self') {
      setSelfReturn(false);
    }
  };

  const handleGoToConfirmation = async () => {
    if (isReturnTimeInvalid) {
      alert('Vui lòng chọn giờ trả xe hợp lệ (7:00 - 22:00) hoặc chọn "Khách trả xe tại vị trí xe đậu"');
      return;
    }

    // CRITICAL: Final validation trước khi chuyển trang
    // 1. Check availability
    try {
      const availabilityRes = await API.post(`/api/vehicles/${id}/check-availability`, {
        pickupDate: pickup.toISOString(),
        returnDate: ret.toISOString()
      });

      if (!availabilityRes.data.available) {
        alert('Xe đã được đặt trong khung giờ này. Vui lòng chọn thời gian khác.');
        setShowTimeModal(true);
        return;
      }
    } catch (err) {
      console.error('Error checking availability:', err);
      alert('Không thể kiểm tra tình trạng xe. Vui lòng thử lại.');
      return;
    }

    // 2. Final discount validation (nếu có mã)
    if (selectedDiscount) {
      try {
        const discountRes = await API.post("/api/discounts/validate", {
          code: selectedDiscount.code,
          totalAmount: rentFeeRounded,
          pickupDate: pickup.toISOString(),
          returnDate: ret.toISOString()
        });

        if (!discountRes.data.valid) {
          alert(`Mã giảm giá không hợp lệ: ${discountRes.data.message}`);
          setSelectedDiscount(null);
          return;
        }

        // Cập nhật lại discountAmount để đảm bảo chính xác
        if (discountRes.data.discount.discountAmount !== selectedDiscount.discountAmount) {
          setSelectedDiscount(discountRes.data.discount);
        }
      } catch (err) {
        console.error('Final discount validation failed:', err);
        alert('Không thể xác thực mã giảm giá. Vui lòng thử lại.');
        setSelectedDiscount(null);
        return;
      }
    }

    // 3. Navigate to confirmation
    navigate('/booking/confirm', {
      state: {
        vehicle,
        pickup: pickup.toISOString(),
        returnDate: ret.toISOString(),
        selectedPickup,
        deliveryLocation,
        rentFeeRounded,
        insuranceFee,
        deliveryFee,
        VATRounded,
        discountAmount: selectedDiscount?.discountAmount || 0,
        discountCode: selectedDiscount?.code || null,
        totalRounded,
        selectedInsurance,
        selfReturn,
        holdFee,
        depositAmount: totalDeposit
      }
    });
  };

  const handleTimeConfirm = (timeData) => {
    setSearchData({
      ...searchData,
      ...timeData
    });
    setShowTimeModal(false);
  };

  // Handler cho discount modal - validate ngay khi chọn
  const handleDiscountSelect = async (discount) => {
    try {
      // Validate với giá hiện tại
      const res = await API.post("/api/discounts/validate", {
        code: discount.code,
        totalAmount: rentFeeRounded,
        pickupDate: pickup.toISOString(),
        returnDate: ret.toISOString()
      });

      if (res.data.valid) {
        setSelectedDiscount(res.data.discount);
        setShowDiscountModal(false);
      } else {
        alert(res.data.message || 'Mã giảm giá không hợp lệ');
      }
    } catch (err) {
      const message = err.response?.data?.message || "Không thể áp dụng mã này";
      alert(message);
    }
  };

  if (!vehicle) return <div className="text-center text-gray-700 py-10">Đang tải...</div>;
  
  return (
    <div className="bg-white text-gray-900 min-h-screen">
      <div className="sticky top-0 z-40">
        <Header />
        <div className="bg-gray-900 text-white py-3 px-4 flex items-center gap-3 shadow-md">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-gray-200 hover:text-white">
            <ArrowLeft size={18} /> Quay lại
          </button>
          <h1 className="text-xl font-semibold ml-3">Chi tiết xe</h1>
        </div>
      </div>

      <ImageGallery images={images} />

      <div className="max-w-7xl mx-auto mt-8 px-4 grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-3xl font-semibold">{vehicle.name}</h2>
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin size={18} /> {vehicle.location}
          </div>
          <hr />
          <div className="flex gap-6 mt-2 text-gray-600">
            <p>{vehicle.seats} chỗ</p>
            <p>{vehicle.transmission}</p>
            <p>{vehicle.fuelType}</p>
          </div>
          <p className="text-gray-700 mt-4 leading-relaxed whitespace-pre-wrap">{vehicle.description}</p>

          <div className="mt-6 rounded-lg overflow-hidden">
            <iframe
              title="Google Map"
              src={`https://www.google.com/maps?q=${encodeURIComponent(vehicle.locationPickUp)}&output=embed`}
              width="100%"
              height="300"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
            ></iframe>
          </div>
        </div>

        <PricingCard
          vehicle={vehicle}
          price4h={price4h}
          price8h={price8h}
          price12h={price12h}
          price24h={price24h}
          timeBoxColor={timeBoxColor}
          rangeDisplay={rangeDisplay}
          totalHours={totalHours}
          onTimeClick={() => setShowTimeModal(true)}
          selectedPickup={selectedPickup}
          onPickupChange={handlePickupChange}
          deliveryLocation={deliveryLocation}
          onDeliveryLocationClick={handleDeliveryOptionClick}
          onDeliveryLocationChange={() => setShowDeliveryModal(true)}
          selfReturn={selfReturn}
          onSelfReturnChange={setSelfReturn}
          deliveryFeePerTrip={deliveryFeePerTrip}
          isReturnTimeInvalid={isReturnTimeInvalid}
          selectedInsurance={selectedInsurance}
          onInsuranceChange={(e) => setSelectedInsurance(e.target.value)}
          rentFeeRounded={rentFeeRounded}
          insuranceFee={insuranceFee}
          deliveryFee={deliveryFee}
          VATRounded={VATRounded}
          totalRounded={totalRounded}
          holdFee={holdFee}
          totalDeposit={totalDeposit}
          selectedDiscount={selectedDiscount}
          onDiscountClick={() => setShowDiscountModal(true)}
          isCreatingBooking={false}
          onConfirm={handleGoToConfirmation}
        />
      </div>

      {showTimeModal && (
        <TimeSelectionModal
          initialPickup={pickup}
          initialReturn={ret}
          vehicleId={id}
          onConfirm={handleTimeConfirm}
          onClose={() => setShowTimeModal(false)}
        />
      )}

      {showDiscountModal && (
        <DiscountModal
          onClose={() => setShowDiscountModal(false)}
          onSelect={handleDiscountSelect}
          totalAmount={rentFeeRounded}
          pickupDate={pickup}
          returnDate={ret}
        />
      )}

      {showDeliveryModal && (
        <DeliveryLocationModal
          onClose={() => setShowDeliveryModal(false)}
          onConfirm={handleDeliveryLocationConfirm}
          initialLocation={deliveryLocation}
        />
      )}
    </div>
  );
};

export default VehicleDetail;