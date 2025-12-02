import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/user/Header";
import SearchBarResult from "../../components/user/SearchBarResult";
import AdvancedFilter from "../../components/user/AdvancedFilter";
import { useSearch } from "../../context/SearchContext";
import API from "../../api/axios";
import { filterVehiclesByLocation } from "../../utils/districtUtils";

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
  });
  const [isSticky, setIsSticky] = useState(false);

  const handleStickyChange = (sticky) => setIsSticky(sticky);

  const fetchVehicles = async (activeFilters = {}) => {
    try {
      const params = new URLSearchParams();

      if (activeFilters.brand?.length)
        params.append("brand", activeFilters.brand.join(","));
      if (activeFilters.seats?.length)
        params.append("seats", activeFilters.seats.join(","));
      if (activeFilters.transmission?.length)
        params.append("transmission", activeFilters.transmission.join(","));
      if (activeFilters.fuelType?.length)
        params.append("fuelType", activeFilters.fuelType.join(","));
      if (activeFilters.sort)
        params.append("sort", activeFilters.sort);

      const res = await API.get(`/api/vehicles?${params.toString()}`);
      setVehicles(res.data.filter((v) => v.isAvailable));
    } catch (err) {
      console.error("Lỗi khi lấy danh sách xe:", err);
    }
  };

  const handleViewDetail = (id) => {
    navigate(`/vehicle/${id}`);
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  useEffect(() => {
    if (!searchData) return;
    const { location, locationData, pickupDate, pickupTime } = searchData;
    const pickupFull = new Date(`${pickupDate}T${pickupTime}`);

    let list = vehicles;

    // Lọc theo thời gian available
    list = list.filter((v) => {
      const availableFrom = v.availableFrom ? new Date(v.availableFrom) : null;
      return !availableFrom || availableFrom <= pickupFull;
    });

    // Lọc theo địa điểm (sử dụng utility - bao gồm quận lân cận)
    if (location && location.trim() !== "") {
      list = filterVehiclesByLocation(list, locationData, location);
    }

    if (filters.brand.length > 0) list = list.filter((v) => filters.brand.includes(v.brand));
    if (filters.seats.length > 0)
      list = list.filter((v) => filters.seats.includes(Number(v.seats)));
    if (filters.transmission.length > 0)
      list = list.filter((v) =>
        filters.transmission.includes(v.transmission?.toLowerCase())
      );
    if (filters.fuelType.length > 0)
      list = list.filter((v) => filters.fuelType.includes(v.fuelType?.toLowerCase()));

    if (filters.sort === "asc") list = [...list].sort((a, b) => a.pricePerHour - b.pricePerHour);
    if (filters.sort === "desc") list = [...list].sort((a, b) => b.pricePerHour - a.pricePerHour);

    setFiltered(list);
  }, [searchData, vehicles, filters]);

  const formatCurrency = (p) => (p ? p.toLocaleString("vi-VN") + " VNĐ" : "");
  const capitalize = (t) => t && t[0].toUpperCase() + t.slice(1);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <SearchBarResult onStickyChange={handleStickyChange} />
      <AdvancedFilter onApply={setFilters} onSortChange={(value) => setFilters((f) => ({ ...f, sort: value }))} isSticky={isSticky}/>
      <main className="p-6 max-w-7xl mx-auto mt-8">
        <h1 className="text-2xl font-bold text-green-600 mb-6">
          Kết quả tìm kiếm
          {searchData?.location && searchData.location.trim() !== "" && (
            <span className="text-gray-600 font-normal text-lg ml-2">tại {searchData.location}</span>
          )}
        </h1>
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((v) => (
              <div
                key={v._id}
                onClick={() => handleViewDetail(v._id)}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition cursor-pointer"
              >
                <img
                  src={v.images?.[0] ? `http://localhost:5000${v.images[0]}` : "/no-image.png"}
                  alt={v.name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4 space-y-2">
                  <h2 className="font-bold text-lg text-gray-800">{v.name}</h2>
                  <p className="text-gray-600">{v.location}</p>
                  <p className="text-green-600 font-semibold">
                    {(() => {
                      const h = searchData?.totalHours || 0;
                      if (h <= 8) return `${formatCurrency(v.pricePerHour * 8)}/8h`;
                      if (h <= 12) return `${formatCurrency(v.pricePerHour * 12)}/12h`;
                      return `${formatCurrency(v.pricePerHour * 24)}/ngày`;
                    })()}
                  </p>
                  <p className="text-gray-500 text-sm">
                    {searchData?.totalDays || 0} ngày {searchData?.remainHours || 0} giờ
                  </p>
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
            <p className="text-xl mb-2">Không tìm thấy xe phù hợp.</p>
            {searchData?.location && searchData.location.trim() !== "" && (
              <p className="text-sm">Thử tìm kiếm lại hoặc bỏ bộ lọc địa điểm để xem tất cả xe.</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default SearchResultPage;