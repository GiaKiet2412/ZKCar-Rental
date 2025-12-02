import React, { useState, useEffect, useRef } from "react";

const AdvancedFilter = ({ onApply, onSortChange, isSticky }) => {
  const [openFilter, setOpenFilter] = useState(null);
  const [filters, setFilters] = useState({
    brand: [],
    seats: [],
    fuelType: [],
    transmission: [],
  });
  const [sortOrder, setSortOrder] = useState("");
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const brands = ["VINFAST", "TOYOTA", "HONDA", "TESLA"];
  const seatOptions = [4, 5, 7];
  const fuelTypes = [
    { label: "Điện", value: "điện" },
    { label: "Xăng", value: "xăng" },
  ];
  const transmissions = [
    { label: "Số Tự Động", value: "Số tự động" },
    { label: "Số Sàn", value: "Số sàn" },
  ];
  const sortOptions = [
    { label: "Giá tăng dần", value: "asc" },
    { label: "Giá giảm dần", value: "desc" },
  ];

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
      const val = group === "seats" ? Number(value) : value;
      const current = prev[group];
      const newValues = current.includes(val)
        ? current.filter((v) => v !== val)
        : [...current, val];
      return { ...prev, [group]: newValues };
    });
  };

  const handleApply = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800)); // mô phỏng thời gian tải
    if (onApply) onApply(filters);
    setLoading(false);
    setOpenFilter(null);
  };

  const handleSortChange = (value) => {
    setSortOrder(value);
    setOpenFilter(null);
    setTimeout(() => {
      onSortChange && onSortChange(value);
    }, 800);
  };

  const FilterGroup = () => (
    <div className="flex flex-wrap gap-3 justify-center" ref={dropdownRef}>
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
          <div className="absolute left-0 mt-2 w-48 bg-white border rounded-xl shadow-lg p-3 z-50">
            {brands.map((option) => (
              <label key={option} className="flex items-center gap-2 mb-1">
                <input
                  type="checkbox"
                  checked={filters.brand.includes(option)}
                  onChange={() => handleCheckboxChange("brand", option)}
                />
                <span>{option}</span>
              </label>
            ))}
            <div className="flex justify-between mt-3">
              <button
                className="text-sm text-gray-500 hover:text-gray-700"
                onClick={() => setFilters((prev) => ({ ...prev, brand: [] }))}
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
            {seatOptions.map((option) => (
              <label key={option} className="flex items-center gap-2 mb-1">
                <input
                  type="checkbox"
                  checked={filters.seats.includes(option)}
                  onChange={() => handleCheckboxChange("seats", option)}
                />
                <span>{option} chỗ</span>
              </label>
            ))}
            <div className="flex justify-between mt-3">
              <button
                className="text-sm text-gray-500 hover:text-gray-700"
                onClick={() => setFilters((prev) => ({ ...prev, seats: [] }))}
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
          </div>
        )}
      </div>

      {/* Nhiên liệu */}
      <div className="relative">
        <button
          onClick={() =>
            setOpenFilter(openFilter === "fuelType" ? null : "fuelType")
          }
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
            {fuelTypes.map(({ label, value }) => (
              <label key={value} className="flex items-center gap-2 mb-1">
                <input
                  type="checkbox"
                  checked={filters.fuelType.includes(value)}
                  onChange={() => handleCheckboxChange("fuelType", value)}
                />
                <span>{label}</span>
              </label>
            ))}
            <div className="flex justify-between mt-3">
              <button
                className="text-sm text-gray-500 hover:text-gray-700"
                onClick={() => setFilters((prev) => ({ ...prev, fuelType: [] }))}
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
          </div>
        )}
      </div>

      {/* Loại xe */}
      <div className="relative">
        <button
          onClick={() =>
            setOpenFilter(openFilter === "transmission" ? null : "transmission")
          }
          className={`px-4 py-2 border rounded-xl hover:bg-gray-100 transition ${
            filters.transmission.length > 0
              ? "border-green-500 bg-green-50"
              : ""
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
            {transmissions.map(({ label, value }) => (
              <label key={value} className="flex items-center gap-2 mb-1">
                <input
                  type="checkbox"
                  checked={filters.transmission.includes(value)}
                  onChange={() => handleCheckboxChange("transmission", value)}
                />
                <span>{label}</span>
              </label>
            ))}
            <div className="flex justify-between mt-3">
              <button
                className="text-sm text-gray-500 hover:text-gray-700"
                onClick={() =>
                  setFilters((prev) => ({ ...prev, transmission: [] }))
                }
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
          </div>
        )}
      </div>

      {/* Sắp xếp theo giá */}
      <div className="relative">
        <button
          onClick={() => setOpenFilter(openFilter === "sort" ? null : "sort")}
          className={`px-4 py-2 border rounded-xl hover:bg-gray-100 transition ${
            sortOrder ? "border-blue-500 bg-blue-50" : ""
          }`}
        >
          Sắp xếp
        </button>
        {openFilter === "sort" && (
          <div className="absolute left-0 mt-2 w-48 bg-white border rounded-xl shadow-lg p-3 z-50">
            {sortOptions.map(({ label, value }) => (
              <label key={value} className="flex items-center gap-2 mb-2">
                <input
                  type="radio"
                  name="sort"
                  value={value}
                  checked={sortOrder === value}
                  onChange={() => handleSortChange(value)}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        )}
      </div>
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
        {loading}
        <FilterGroup />
      </div>
    </div>
  );
};

export default AdvancedFilter;