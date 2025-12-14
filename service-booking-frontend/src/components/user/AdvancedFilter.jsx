import React, { useState, useEffect, useRef } from "react";
import API from "../../api/axios";

const AdvancedFilter = ({ onApply, onSortChange, isSticky, currentFilters = {} }) => {
  const [openFilter, setOpenFilter] = useState(null);
  const [filters, setFilters] = useState({
    brand: currentFilters.brand || [],
    seats: currentFilters.seats || [],
    fuelType: currentFilters.fuelType || [],
    transmission: currentFilters.transmission || [],
    minPrice: currentFilters.minPrice || null,
    maxPrice: currentFilters.maxPrice || null,
  });
  const [sortOrder, setSortOrder] = useState(currentFilters.sort || "");
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // State cho filter options từ database
  const [filterOptions, setFilterOptions] = useState({
    brands: [],
    seats: [],
    fuelTypes: [],
    transmissions: []
  });
  const [priceRange, setPriceRange] = useState({
    min: 0,
    max: 1000000,
    avg: 300000
  });
  const [tempPriceRange, setTempPriceRange] = useState([0, 1000000]);
  const [optionsLoading, setOptionsLoading] = useState(true);

  const sortOptions = [
    { label: "Giá tăng dần", value: "asc" },
    { label: "Giá giảm dần", value: "desc" },
    { label: "Mặc định (Theo tình trạng)", value: "" }
  ];

  // Fetch filter options từ database
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const [optionsRes, priceRes] = await Promise.all([
          API.get('/api/vehicles/filter-options'),
          API.get('/api/vehicles/price-range')
        ]);
        
        setFilterOptions({
          brands: optionsRes.data.brands || [],
          seats: optionsRes.data.seats || [],
          fuelTypes: optionsRes.data.fuelTypes || [],
          transmissions: optionsRes.data.transmissions || []
        });

        const { minPrice, maxPrice, avgPrice } = priceRes.data;
        setPriceRange({ min: minPrice, max: maxPrice, avg: avgPrice });
        setTempPriceRange([
          currentFilters.minPrice || minPrice,
          currentFilters.maxPrice || maxPrice
        ]);
      } catch (err) {
        console.error('Lỗi khi lấy filter options:', err);
        // Fallback values nếu API fail
        setFilterOptions({
          brands: ["VINFAST", "TOYOTA", "HONDA", "TESLA"],
          seats: [4, 5, 7],
          fuelTypes: ["Điện", "Xăng"],
          transmissions: ["Số tự động", "Số sàn"]
        });
      } finally {
        setOptionsLoading(false);
      }
    };

    fetchFilterOptions();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenFilter(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCheckboxChange = (group, value) => {
    setFilters((prev) => {
      let val = value;
      if (group === "seats") {
        val = Number(value);
      } else if (group === "fuelType" || group === "transmission") {
        val = value.toLowerCase();
      }
      
      const current = prev[group];
      const newValues = current.includes(val)
        ? current.filter((v) => v !== val)
        : [...current, val];
      return { ...prev, [group]: newValues };
    });
  };

  const handleApply = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 300));
    if (onApply) onApply(filters);
    setLoading(false);
    setOpenFilter(null);
  };

  const handleSortChange = (value) => {
    setSortOrder(value);
    setOpenFilter(null);
    setTimeout(() => {
      onSortChange && onSortChange(value);
    }, 300);
  };

  const handleClearFilter = (group) => {
    setFilters((prev) => ({ ...prev, [group]: [] }));
  };

  const handleClearAll = () => {
    const emptyFilters = {
      brand: [],
      seats: [],
      fuelType: [],
      transmission: [],
      minPrice: null,
      maxPrice: null,
    };
    setFilters(emptyFilters);
    setTempPriceRange([priceRange.min, priceRange.max]);
    setSortOrder("");
    if (onApply) onApply(emptyFilters);
    if (onSortChange) onSortChange("");
  };

  const getTotalActiveFilters = () => {
    let count = filters.brand.length + 
           filters.seats.length + 
           filters.fuelType.length + 
           filters.transmission.length;
    
    // Count price filter if it's not default range
    if (filters.minPrice !== null || filters.maxPrice !== null) {
      count++;
    }
    
    return count;
  };

  const formatCurrency = (val) => {
    if (val >= 1000000) {
      return (val / 1000000).toFixed(1) + 'tr';
    } else if (val >= 1000) {
      return (val / 1000).toFixed(0) + 'k';
    }
    return val.toString();
  };

  const handlePriceApply = () => {
    setFilters(prev => ({
      ...prev,
      minPrice: tempPriceRange[0],
      maxPrice: tempPriceRange[1]
    }));
    handleApply();
  };

  const handlePriceClear = () => {
    setTempPriceRange([priceRange.min, priceRange.max]);
    setFilters(prev => ({
      ...prev,
      minPrice: null,
      maxPrice: null
    }));
  };

  const FilterGroup = () => (
    <div className="flex flex-wrap gap-3 justify-center items-center" ref={dropdownRef}>
      {/* Hãng xe */}
      <div className="relative">
        <button
          onClick={() => setOpenFilter(openFilter === "brand" ? null : "brand")}
          className={`px-4 py-2 border rounded-xl hover:bg-gray-100 transition ${
            filters.brand.length > 0 ? "border-green-500 bg-green-50" : ""
          }`}
        >
          Hãng xe
          {filters.brand.length > 0 && (
            <span className="ml-2 text-green-600 font-medium">
              ({filters.brand.length})
            </span>
          )}
        </button>
        {openFilter === "brand" && (
          <div className="absolute left-0 mt-2 w-56 bg-white border rounded-xl shadow-lg p-3 z-50 max-h-80 overflow-y-auto">
            {optionsLoading ? (
              <div className="text-center py-2 text-gray-500">Đang tải...</div>
            ) : filterOptions.brands.length > 0 ? (
              <>
                {filterOptions.brands.map((brand) => (
                  <label key={brand} className="flex items-center gap-2 mb-2 hover:bg-gray-50 p-1 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.brand.includes(brand)}
                      onChange={() => handleCheckboxChange("brand", brand)}
                      className="cursor-pointer"
                    />
                    <span>{brand}</span>
                  </label>
                ))}
                <div className="flex justify-between mt-3 pt-2 border-t">
                  <button
                    className="text-sm text-gray-500 hover:text-gray-700"
                    onClick={() => handleClearFilter("brand")}
                  >
                    Xóa
                  </button>
                  <button
                    className="text-sm text-green-600 font-medium hover:underline"
                    onClick={handleApply}
                  >
                    Áp dụng
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-2 text-gray-500">Không có dữ liệu</div>
            )}
          </div>
        )}
      </div>

      {/* Số chỗ */}
      <div className="relative">
        <button
          onClick={() => setOpenFilter(openFilter === "seats" ? null : "seats")}
          className={`px-4 py-2 border rounded-xl hover:bg-gray-100 transition ${
            filters.seats.length > 0 ? "border-green-500 bg-green-50" : ""
          }`}
        >
          Số chỗ
          {filters.seats.length > 0 && (
            <span className="ml-2 text-green-600 font-medium">
              ({filters.seats.length})
            </span>
          )}
        </button>
        {openFilter === "seats" && (
          <div className="absolute left-0 mt-2 w-48 bg-white border rounded-xl shadow-lg p-3 z-50">
            {optionsLoading ? (
              <div className="text-center py-2 text-gray-500">Đang tải...</div>
            ) : filterOptions.seats.length > 0 ? (
              <>
                {filterOptions.seats.map((seat) => (
                  <label key={seat} className="flex items-center gap-2 mb-2 hover:bg-gray-50 p-1 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.seats.includes(seat)}
                      onChange={() => handleCheckboxChange("seats", seat)}
                      className="cursor-pointer"
                    />
                    <span>{seat} chỗ</span>
                  </label>
                ))}
                <div className="flex justify-between mt-3 pt-2 border-t">
                  <button
                    className="text-sm text-gray-500 hover:text-gray-700"
                    onClick={() => handleClearFilter("seats")}
                  >
                    Xóa
                  </button>
                  <button
                    className="text-sm text-green-600 font-medium hover:underline"
                    onClick={handleApply}
                  >
                    Áp dụng
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-2 text-gray-500">Không có dữ liệu</div>
            )}
          </div>
        )}
      </div>

      {/* Nhiên liệu */}
      <div className="relative">
        <button
          onClick={() => setOpenFilter(openFilter === "fuelType" ? null : "fuelType")}
          className={`px-4 py-2 border rounded-xl hover:bg-gray-100 transition ${
            filters.fuelType.length > 0 ? "border-green-500 bg-green-50" : ""
          }`}
        >
          Nhiên liệu
          {filters.fuelType.length > 0 && (
            <span className="ml-2 text-green-600 font-medium">
              ({filters.fuelType.length})
            </span>
          )}
        </button>
        {openFilter === "fuelType" && (
          <div className="absolute left-0 mt-2 w-48 bg-white border rounded-xl shadow-lg p-3 z-50">
            {optionsLoading ? (
              <div className="text-center py-2 text-gray-500">Đang tải...</div>
            ) : filterOptions.fuelTypes.length > 0 ? (
              <>
                {filterOptions.fuelTypes.map((fuel) => (
                  <label key={fuel} className="flex items-center gap-2 mb-2 hover:bg-gray-50 p-1 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.fuelType.includes(fuel.toLowerCase())}
                      onChange={() => handleCheckboxChange("fuelType", fuel)}
                      className="cursor-pointer"
                    />
                    <span>{fuel}</span>
                  </label>
                ))}
                <div className="flex justify-between mt-3 pt-2 border-t">
                  <button
                    className="text-sm text-gray-500 hover:text-gray-700"
                    onClick={() => handleClearFilter("fuelType")}
                  >
                    Xóa
                  </button>
                  <button
                    className="text-sm text-green-600 font-medium hover:underline"
                    onClick={handleApply}
                  >
                    Áp dụng
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-2 text-gray-500">Không có dữ liệu</div>
            )}
          </div>
        )}
      </div>

      {/* Loại xe */}
      <div className="relative">
        <button
          onClick={() => setOpenFilter(openFilter === "transmission" ? null : "transmission")}
          className={`px-4 py-2 border rounded-xl hover:bg-gray-100 transition ${
            filters.transmission.length > 0 ? "border-green-500 bg-green-50" : ""
          }`}
        >
          Loại xe
          {filters.transmission.length > 0 && (
            <span className="ml-2 text-green-600 font-medium">
              ({filters.transmission.length})
            </span>
          )}
        </button>
        {openFilter === "transmission" && (
          <div className="absolute left-0 mt-2 w-48 bg-white border rounded-xl shadow-lg p-3 z-50">
            {optionsLoading ? (
              <div className="text-center py-2 text-gray-500">Đang tải...</div>
            ) : filterOptions.transmissions.length > 0 ? (
              <>
                {filterOptions.transmissions.map((trans) => (
                  <label key={trans} className="flex items-center gap-2 mb-2 hover:bg-gray-50 p-1 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.transmission.includes(trans.toLowerCase())}
                      onChange={() => handleCheckboxChange("transmission", trans)}
                      className="cursor-pointer"
                    />
                    <span>{trans}</span>
                  </label>
                ))}
                <div className="flex justify-between mt-3 pt-2 border-t">
                  <button
                    className="text-sm text-gray-500 hover:text-gray-700"
                    onClick={() => handleClearFilter("transmission")}
                  >
                    Xóa
                  </button>
                  <button
                    className="text-sm text-green-600 font-medium hover:underline"
                    onClick={handleApply}
                  >
                    Áp dụng
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-2 text-gray-500">Không có dữ liệu</div>
            )}
          </div>
        )}
      </div>

      {/* Giá */}
      <div className="relative">
        <button
          onClick={() => setOpenFilter(openFilter === "price" ? null : "price")}
          className={`px-4 py-2 border rounded-xl hover:bg-gray-100 transition ${
            (filters.minPrice !== null || filters.maxPrice !== null) ? "border-green-500 bg-green-50" : ""
          }`}
        >
          Giá
          {(filters.minPrice !== null || filters.maxPrice !== null) && (
            <span className="ml-2 text-green-600 font-medium">•</span>
          )}
        </button>
        {openFilter === "price" && (
          <div className="absolute left-0 mt-2 w-80 bg-white border rounded-xl shadow-lg p-4 z-50">
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>{formatCurrency(tempPriceRange[0])} VNĐ/giờ</span>
                <span>{formatCurrency(tempPriceRange[1])} VNĐ/giờ</span>
              </div>
              
              <div className="relative pt-1">
                <input
                  type="range"
                  min={priceRange.min}
                  max={priceRange.max}
                  step={10000}
                  value={tempPriceRange[0]}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (val < tempPriceRange[1]) {
                      setTempPriceRange([val, tempPriceRange[1]]);
                    }
                  }}
                  className="absolute w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer pointer-events-auto"
                  style={{
                    zIndex: tempPriceRange[0] > priceRange.min + (priceRange.max - priceRange.min) * 0.5 ? 5 : 3
                  }}
                />
                <input
                  type="range"
                  min={priceRange.min}
                  max={priceRange.max}
                  step={10000}
                  value={tempPriceRange[1]}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (val > tempPriceRange[0]) {
                      setTempPriceRange([tempPriceRange[0], val]);
                    }
                  }}
                  className="absolute w-full h-2 bg-transparent rounded-lg appearance-none cursor-pointer pointer-events-auto"
                  style={{ zIndex: 4 }}
                />
                <div className="relative h-2 bg-gray-200 rounded-lg">
                  <div
                    className="absolute h-2 bg-green-500 rounded-lg"
                    style={{
                      left: `${((tempPriceRange[0] - priceRange.min) / (priceRange.max - priceRange.min)) * 100}%`,
                      right: `${100 - ((tempPriceRange[1] - priceRange.min) / (priceRange.max - priceRange.min)) * 100}%`
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <label className="text-xs text-gray-500">Từ</label>
                <input
                  type="number"
                  value={tempPriceRange[0]}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (val >= priceRange.min && val < tempPriceRange[1]) {
                      setTempPriceRange([val, tempPriceRange[1]]);
                    }
                  }}
                  className="w-full border rounded px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Đến</label>
                <input
                  type="number"
                  value={tempPriceRange[1]}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (val <= priceRange.max && val > tempPriceRange[0]) {
                      setTempPriceRange([tempPriceRange[0], val]);
                    }
                  }}
                  className="w-full border rounded px-2 py-1 text-sm"
                />
              </div>
            </div>

            <div className="flex justify-between">
              <button
                className="text-sm text-gray-500 hover:text-gray-700"
                onClick={handlePriceClear}
              >
                Xóa
              </button>
              <button
                className="text-sm text-green-600 font-medium hover:underline"
                onClick={handlePriceApply}
              >
                Áp dụng
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sắp xếp */}
      <div className="relative">
        <button
          onClick={() => setOpenFilter(openFilter === "sort" ? null : "sort")}
          className={`px-4 py-2 border rounded-xl hover:bg-gray-100 transition ${
            sortOrder ? "border-blue-500 bg-blue-50" : ""
          }`}
        >
          Sắp xếp
          {sortOrder && <span className="ml-2 text-blue-600 font-medium">•</span>}
        </button>
        {openFilter === "sort" && (
          <div className="absolute left-0 mt-2 w-56 bg-white border rounded-xl shadow-lg p-3 z-50">
            {sortOptions.map(({ label, value }) => (
              <label key={value} className="flex items-center gap-2 mb-2 hover:bg-gray-50 p-1 rounded cursor-pointer">
                <input
                  type="radio"
                  name="sort"
                  value={value}
                  checked={sortOrder === value}
                  onChange={() => handleSortChange(value)}
                  className="cursor-pointer"
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Nút xóa tất cả */}
      {getTotalActiveFilters() > 0 && (
        <button
          onClick={handleClearAll}
          className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl transition border border-red-200"
        >
          Xóa tất cả ({getTotalActiveFilters()})
        </button>
      )}
    </div>
  );

  return (
    <div
      className={`transition-all duration-300 z-[26] w-full ${
        isSticky
          ? "fixed top-[60px] left-0 bg-white border-t border-b border-gray-200 shadow-md"
          : "relative bg-white border-t border-b border-gray-100"
      }`}
      style={{ transition: "all 0.3s ease" }}
    >
      <div className="max-w-6xl mx-auto px-4 py-3 relative">
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        )}
        <FilterGroup />
      </div>
    </div>
  );
};

export default AdvancedFilter;