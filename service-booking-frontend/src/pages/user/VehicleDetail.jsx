import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../api/axios";
import { useSearch } from "../../context/SearchContext";
import Header from "../../components/user/Header";
import { MapPin, ArrowLeft } from "lucide-react";
import { formatCurrencyVN, formatBookingRange } from "../../utils/formatUtils";
import DiscountModal from "../../components/user/DiscountModal";
import DeliveryLocationModal from "../../components/user/DeliveryLocationModal";

// Import components đã tách
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
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);

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

  //  Sử dụng useMemo để tính toán pickup và ret dựa trên searchData
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
  }, [searchData]); //  Re-calculate khi searchData thay đổi

  //  Tính timeBoxColor dựa trên pickup
  const timeBoxColor = useMemo(() => {
    const pickupHour = pickup.getHours();
    if (pickupHour >= 22 || pickupHour < 6) return "yellow";
    return "gray";
  }, [pickup]);
  
  if (!vehicle) return <div className="text-center text-gray-700 py-10">Đang tải...</div>;

  // Tính toán giá - useMemo để tránh re-calculate không cần thiết
  const totalHours = Math.max(Math.round((ret - pickup) / (1000 * 60 * 60)), 0);
  const images = vehicle.images || [];

  const calcDiscountRate = (hours) => {
    if (hours <= 4) return 0;
    if (hours <= 8) return 0.3;
    if (hours <= 12) return 0.4667;
    return 0.6667;
  };

  const discountRate = calcDiscountRate(totalHours);
  const baseFee = vehicle.pricePerHour * totalHours;
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
  
  const price4h = roundTo(vehicle.pricePerHour * 4, 1000);
  const price8h = roundTo(vehicle.pricePerHour * 8 * (1 - 0.3), 1000);
  const price12h = roundTo(vehicle.pricePerHour * 12 * (1 - 0.4667), 1000);
  const price24h = roundTo(vehicle.pricePerHour * 24 * (1 - 0.6667), 1000);
  
  const discountAmount = selectedDiscount?.discountAmount || 0;
  const VATRounded = Math.round(VAT);
  const totalRounded = Math.round(rentFeeRounded + insuranceFee + VATRounded + deliveryFee - discountAmount);
  const rangeDisplay = formatBookingRange(pickup, ret, { slash: true });

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

  //  Validate availability trước khi chuyển sang trang confirm
  const handleGoToConfirmation = async () => {
    if (isReturnTimeInvalid) {
      alert('Vui lòng chọn giờ trả xe hợp lệ (7:00 - 22:00) hoặc chọn "Khách trả xe tại vị trí xe đậu"');
      return;
    }

    //  Kiểm tra availability trước khi proceed
    try {
      const res = await API.post(`/api/vehicles/${id}/check-availability`, {
        pickupDate: pickup.toISOString(),
        returnDate: ret.toISOString()
      });

      if (!res.data.available) {
        alert('Xe đã được đặt trong khung giờ này. Vui lòng chọn thời gian khác.');
        // Mở modal chọn thời gian
        setShowTimeModal(true);
        return;
      }
    } catch (err) {
      console.error('Error checking availability:', err);
      alert('Không thể kiểm tra tình trạng xe. Vui lòng thử lại.');
      return;
    }

    //  Nếu available, tiếp tục sang trang confirm
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
        discountAmount,
        discountCode: selectedDiscount?.code,
        totalRounded,
        selectedInsurance,
        selfReturn,
        holdFee,
        depositAmount: totalDeposit
      }
    });
  };

  const handleTimeConfirm = (timeData) => {
    //  Cập nhật searchData với thời gian mới
    setSearchData({
      ...searchData,
      ...timeData
    });

    setShowTimeModal(false);
  };

  return (
    <div className="bg-white text-gray-900 min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-40">
        <Header />
        <div className="bg-gray-900 text-white py-3 px-4 flex items-center gap-3 shadow-md">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-gray-200 hover:text-white">
            <ArrowLeft size={18} /> Quay lại
          </button>
          <h1 className="text-xl font-semibold ml-3">Chi tiết xe</h1>
        </div>
      </div>

      {/* Image Gallery */}
      <ImageGallery images={images} />

      {/* Thông tin xe */}
      <div className="max-w-7xl mx-auto mt-8 px-4 grid md:grid-cols-3 gap-6">
        {/* Cột trái - Thông tin xe */}
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

          {/* Google Map */}
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

        {/* Cột phải - Pricing Card */}
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
          // Pickup props
          selectedPickup={selectedPickup}
          onPickupChange={handlePickupChange}
          deliveryLocation={deliveryLocation}
          onDeliveryLocationClick={handleDeliveryOptionClick}
          onDeliveryLocationChange={() => setShowDeliveryModal(true)}
          selfReturn={selfReturn}
          onSelfReturnChange={setSelfReturn}
          deliveryFeePerTrip={deliveryFeePerTrip}
          isReturnTimeInvalid={isReturnTimeInvalid}
          // Insurance & pricing
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

      {/* Form chọn thời gian */}
      {showTimeModal && (
        <TimeSelectionModal
          initialPickup={pickup}
          initialReturn={ret}
          vehicleId={id}
          onConfirm={handleTimeConfirm}
          onClose={() => setShowTimeModal(false)}
        />
      )}

      {/* Discount Modal */}
      {showDiscountModal && (
        <DiscountModal
          onClose={() => setShowDiscountModal(false)}
          onSelect={(discount) => {
            setSelectedDiscount(discount);
            setShowDiscountModal(false);
          }}
          totalAmount={rentFeeRounded}
          pickupDate={pickup}
          returnDate={ret}
        />
      )}

      {/* Delivery Location Modal */}
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