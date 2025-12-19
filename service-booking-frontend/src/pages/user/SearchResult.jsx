import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/user/Header";
import SearchBarResult from "../../components/user/SearchBarResult";
import AdvancedFilter from "../../components/user/AdvancedFilter";
import { useSearch } from "../../context/SearchContext";
import API from "../../api/axios";
import { filterVehiclesByLocation } from "../../utils/districtUtils";
import { getCardDisplayPrices } from "../../utils/pricingUtils";
import { getImageUrl } from "../../utils/imageUtils";

const SearchResultPage = () => {
  const navigate = useNavigate();
  const { searchData } = useSearch();
  const [vehicles, setVehicles] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [filters, setFilters] = useState({
    brand: [],
    seats: [],
    transmission: [],
    fuelType: [],
    sort: "",
    minPrice: null,
    maxPrice: null,
  });
  const [isSticky, setIsSticky] = useState(false);
  const [loading, setLoading] = useState(true);

  const handleStickyChange = (sticky) => setIsSticky(sticky);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      // Thêm filters
      if (filters.brand?.length) params.append("brand", filters.brand.join(","));
      if (filters.seats?.length) params.append("seats", filters.seats.join(","));
      if (filters.transmission?.length) params.append("transmission", filters.transmission.join(","));
      if (filters.fuelType?.length) params.append("fuelType", filters.fuelType.join(","));
      if (filters.sort) params.append("sort", filters.sort);
      
      // Thêm price range
      if (filters.minPrice !== null) params.append("minPrice", filters.minPrice);
      if (filters.maxPrice !== null) params.append("maxPrice", filters.maxPrice);

      // Thêm thời gian để backend tính availability
      if (searchData?.pickupFull) params.append("pickupDate", searchData.pickupFull);
      if (searchData?.returnFull) params.append("returnDate", searchData.returnFull);

      const res = await API.get(`/api/vehicles?${params.toString()}`);
      const availableVehicles = res.data.filter((v) => v.isAvailable);
      
      setVehicles(availableVehicles);
    } catch (err) {
      console.error("Lỗi khi lấy danh sách xe:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (id) => {
    navigate(`/vehicle/${id}`);
  };

  useEffect(() => {
    fetchVehicles();
  }, [filters, searchData]);

  useEffect(() => {
    if (!searchData) {
      setFiltered(vehicles);
      return;
    }

    const { location, locationData } = searchData;
    let list = [...vehicles];

    // Lọc theo địa điểm (sử dụng utility - bao gồm quận lân cận)
    if (location && location.trim() !== "") {
      list = filterVehiclesByLocation(list, locationData, location);
    }

    setFiltered(list);
  }, [searchData, vehicles]);

  const formatCurrency = (p) => (p ? p.toLocaleString("vi-VN") + " VNĐ" : "");
  const capitalize = (t) => t && t[0].toUpperCase() + t.slice(1);

  const getAvailabilityBadge = (vehicle) => {
    if (!vehicle.availabilityStatus) return null;

    const badges = {
      available: { text: "Còn trống", color: "bg-green-100 text-green-700" },
      soon_available: { text: "Sắp trả", color: "bg-blue-100 text-blue-700" },
      available_with_upcoming: { text: "Có lịch sắp tới", color: "bg-yellow-100 text-yellow-700" },
      booked: { text: "Đã đặt", color: "bg-red-100 text-red-700" }
    };

    const badge = badges[vehicle.availabilityStatus];
    if (!badge) return null;

    return (
      <span className={`text-xs px-2 py-1 rounded-full ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  const getAvailabilityInfo = (vehicle) => {
    if (!vehicle.availabilityStatus) return null;

    const BUFFER_HOURS = 1;

    if (vehicle.availabilityStatus === 'booked' && vehicle.nextAvailableTime) {
      // Thêm 1 giờ buffer để hiển thị thời gian thực tế có thể nhận xe
      const availableTime = new Date(new Date(vehicle.nextAvailableTime).getTime() + BUFFER_HOURS * 60 * 60 * 1000);
      
      return (
        <p className="text-xs text-gray-500 mt-1">
          Trống từ: {availableTime.toLocaleDateString('vi-VN')} {availableTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
        </p>
      );
    }

    if (vehicle.availabilityStatus === 'soon_available' && vehicle.currentBookingEnd) {
      // Hiển thị giờ trả xe (chưa cộng buffer)
      const returnTime = new Date(vehicle.currentBookingEnd);
      // Thêm 1 giờ để hiển thị thời gian thực tế có thể nhận xe
      const availableTime = new Date(returnTime.getTime() + BUFFER_HOURS * 60 * 60 * 1000);
      
      return (
        <p className="text-xs text-blue-600 mt-1">
          Sẽ trả: {returnTime.toLocaleDateString('vi-VN')} {returnTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} 
          <span className="text-gray-500 ml-1">(có thể nhận từ {availableTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })})</span>
        </p>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <SearchBarResult onStickyChange={handleStickyChange} />
      <AdvancedFilter 
        onApply={setFilters} 
        onSortChange={(value) => setFilters((f) => ({ ...f, sort: value }))} 
        isSticky={isSticky}
        currentFilters={filters}
      />
      
      <main className="p-6 max-w-7xl mx-auto mt-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-green-600">
            Kết quả tìm kiếm
            {searchData?.location && searchData.location.trim() !== "" && (
              <span className="text-gray-600 font-normal text-lg ml-2">
                tại {searchData.location}
              </span>
            )}
          </h1>
          <div className="text-gray-600">
            {loading ? (
              <span>Đang tải...</span>
            ) : (
              <span>Tìm thấy {filtered.length} xe</span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((v) => (
              <div
                key={v._id}
                onClick={() => handleViewDetail(v._id)}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition cursor-pointer"
              >
                <div className="relative">
                  <img
                    src={getImageUrl(v.images?.[0])}
                    onError={(e) => { e.target.src = '/no-image.png'; }}
                    alt={v.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    {getAvailabilityBadge(v)}
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  <h2 className="font-bold text-lg text-gray-800">{v.name}</h2>
                  <p className="text-gray-600 text-sm">{v.location}</p>
                  
                  {getAvailabilityInfo(v)}
                  
                  <p className="text-green-600 font-semibold">
                    {(() => {
                      const totalHours = searchData?.totalHours || 0;
                      const { primary, secondary } = getCardDisplayPrices(v.pricePerHour, totalHours);
                      
                      return (
                        <>
                          {formatCurrency(primary.price)}/{primary.label}
                          {secondary && (
                            <>
                              {' '}•{' '}
                              {formatCurrency(secondary.price)}/{secondary.label}
                            </>
                          )}
                        </>
                      );
                    })()}
                  </p>
                  
                  {searchData?.totalHours > 0 && (
                    <p className="text-gray-500 text-sm">
                      {searchData.totalDays > 0 && `${searchData.totalDays} ngày `}
                      {searchData.remainHours > 0 && `${searchData.remainHours} giờ`}
                    </p>
                  )}
                  <div className="flex justify-between text-sm text-gray-500 pt-2 border-t">
                    <span>{v.seats} chỗ</span>
                    <span>{capitalize(v.transmission)}</span>
                    <span>{capitalize(v.fuelType)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 mt-10">
            <div className="bg-white rounded-xl p-8 shadow-md max-w-md mx-auto">
              <svg
                className="w-24 h-24 mx-auto mb-4 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-xl mb-2 font-semibold">Không tìm thấy xe phù hợp</p>
              <p className="text-sm text-gray-500">
                Thử điều chỉnh bộ lọc hoặc thay đổi thời gian tìm kiếm
              </p>
              {searchData?.location && searchData.location.trim() !== "" && (
                <p className="text-sm text-gray-500 mt-2">
                  Hoặc bỏ bộ lọc địa điểm để xem tất cả xe
                </p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default SearchResultPage;