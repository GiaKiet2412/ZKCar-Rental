import React, { useState, useEffect, useRef } from "react";
import { MapPin, X } from "lucide-react";
import { getDistrictFromWard } from "../../utils/districtUtils";

/**
 * Component AutocompleteLocation
 * Sử dụng Nominatim API (miễn phí, không giới hạn với rate limit hợp lý)
 * để tìm kiếm địa chỉ tại Hồ Chí Minh
 */
const AutocompleteLocation = ({ value, onSelect, placeholder = "Nhập địa chỉ của bạn" }) => {
  const [inputValue, setInputValue] = useState(value || "");
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef(null);
  const timeoutRef = useRef(null);

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync với value từ props
  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  // Debounce search
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (inputValue.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    timeoutRef.current = setTimeout(() => {
      fetchSuggestions(inputValue);
    }, 500);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [inputValue]);

  const fetchSuggestions = async (query) => {
    setIsLoading(true);
    try {
      // Sử dụng Nominatim API (OpenStreetMap) - MIỄN PHÍ
      // Giới hạn tìm kiếm trong TP.HCM
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
          `q=${encodeURIComponent(query + ", Ho Chi Minh City, Vietnam")}` +
          `&format=json` +
          `&addressdetails=1` +
          `&limit=10` + // Tăng lên 10 để có nhiều kết quả hơn
          `&bounded=1` +
          `&viewbox=106.4,10.5,107.0,11.2`, // Bounding box của TP.HCM
        {
          headers: {
            "Accept-Language": "vi",
          },
        }
      );

      if (!response.ok) throw new Error("API error");

      const data = await response.json();
      
      // Helper function: Trích xuất tên quận từ nhiều nguồn
      const extractDistrict = (addr, displayName) => {
        // 1. Thử lấy từ city_district hoặc district
        if (addr.city_district) return addr.city_district;
        if (addr.district) return addr.district;
        
        // 2. Thử tìm trong display_name - CẢI THIỆN REGEX
        const districtPatterns = [
          // Match chính xác "Quận/Huyện/Thành phố + Tên" (dừng ở dấu phẩy)
          /(?:Quận|Huyện)\s+[A-Za-zÀ-ỹ0-9\s]+(?=\s*,)/gi,
          /Thành phố\s+[A-Za-zÀ-ỹ0-9\s]+(?=\s*,)/gi,
        ];
        
        for (const pattern of districtPatterns) {
          const match = displayName.match(pattern);
          if (match && match.length > 0) {
            // Lấy match đầu tiên và trim
            return match[0].trim();
          }
        }
        
        return null;
      };
      
      // Format kết quả - Ưu tiên hiển thị Quận
      const formatted = data
        .filter((item) => item.address) // Chỉ lấy kết quả có address
        .map((item) => {
          const addr = item.address;
          
          // Trích xuất thông tin
          let district = extractDistrict(addr, item.display_name);
          const ward = addr.suburb || addr.quarter || addr.neighbourhood || "";
          const road = addr.road || addr.street || "";
          
          // *** QUAN TRỌNG: Xử lý district không chính xác ***
          // Nếu district là "Thành phố Hồ Chí Minh" hoặc không có district, tìm từ ward
          const isInvalidDistrict = !district || 
                                    district.toLowerCase().includes("thành phố hồ chí minh") ||
                                    district.toLowerCase().includes("ho chi minh city");
          
          if (isInvalidDistrict && ward) {
            console.log(`🔍 Đang tìm quận cho phường: ${ward}`);
            const districtFromWard = getDistrictFromWard(ward);
            
            if (districtFromWard) {
              // Convert "quan binh tan" → "Quận Bình Tân"
              const parts = districtFromWard.split(' ');
              district = parts.map(word => {
                // Capitalize first letter
                return word.charAt(0).toUpperCase() + word.slice(1);
              }).join(' ')
                .replace('Quan', 'Quận')
                .replace('Huyen', 'Huyện')
                .replace('Thanh Pho', 'Thành phố');
              
              console.log(`✅ Tìm thấy quận từ phường "${ward}" → "${district}"`);
            } else {
              console.warn(`⚠️ Không tìm thấy quận cho phường: ${ward}`);
              district = ""; // Reset để không dùng district sai
            }
          }
          
          // Tạo label hiển thị
          let label = "";
          if (road && ward && district) {
            label = `${road}, ${ward}, ${district}`;
          } else if (road && ward) {
            label = `${road}, ${ward}`;
          } else if (road && district) {
            label = `${road}, ${district}`;
          } else if (road) {
            label = road;
          } else if (ward && district) {
            label = `${ward}, ${district}`;
          } else if (ward) {
            label = ward;
          } else if (district) {
            label = district;
          } else {
            // Fallback: Lấy phần đầu của display_name
            const parts = item.display_name.split(',').slice(0, 3);
            label = parts.join(',').trim();
          }
          
          return {
            label: label,
            fullAddress: item.display_name,
            lat: item.lat,
            lon: item.lon,
            placeId: item.place_id,
            district: district || "",
            ward: ward,
            road: road,
            // Trường này dùng để lọc xe - ưu tiên district, fallback ward
            districtOnly: district || ward,
          };
        })
        // Loại bỏ duplicate
        .filter((item, index, self) => 
          index === self.findIndex(t => t.label === item.label)
        )
        // Sắp xếp: Kết quả có District rõ ràng lên trước
        .sort((a, b) => {
          // Ưu tiên có "Quận" hoặc "Huyện" trong district
          const aHasDistrict = /^(Quận|Huyện)/.test(a.district);
          const bHasDistrict = /^(Quận|Huyện)/.test(b.district);
          
          if (aHasDistrict && !bHasDistrict) return -1;
          if (!aHasDistrict && bHasDistrict) return 1;
          return 0;
        });

      setSuggestions(formatted);
      setShowDropdown(true);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (suggestion) => {
    setInputValue(suggestion.label);
    setShowDropdown(false);
    setSuggestions([]);
    
    // Callback với label và object đầy đủ
    onSelect(suggestion.label, suggestion);
  };

  const handleClear = () => {
    setInputValue("");
    setSuggestions([]);
    setShowDropdown(false);
    onSelect("", null);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => {
            if (suggestions.length > 0) setShowDropdown(true);
          }}
          placeholder={placeholder}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 pr-20 focus:ring-2 focus:ring-green-500 outline-none"
        />
        
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {isLoading && (
            <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
          )}
          
          {inputValue && !isLoading && (
            <button
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600"
              type="button"
            >
              <X size={18} />
            </button>
          )}
          
          <MapPin size={20} className="text-green-600" />
        </div>
      </div>

      {/* Dropdown suggestions */}
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl max-h-80 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.placeId || index}
              onClick={() => handleSelect(suggestion)}
              className="px-4 py-3 hover:bg-green-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
            >
              <div className="flex items-start gap-2">
                <MapPin size={16} className="text-green-600 mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">
                    {suggestion.label}
                  </p>
                  {suggestion.district && (
                    <p className="text-xs text-green-600 font-medium mt-0.5">
                      📍 {suggestion.district}
                    </p>
                  )}
                  {!suggestion.district && suggestion.ward && (
                    <p className="text-xs text-blue-600 font-medium mt-0.5">
                      📍 {suggestion.ward}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                    {suggestion.fullAddress}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No results */}
      {showDropdown && !isLoading && inputValue.trim().length >= 3 && suggestions.length === 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          <p className="text-sm text-gray-500 text-center">
            Không tìm thấy địa chỉ phù hợp
          </p>
        </div>
      )}
    </div>
  );
};

export default AutocompleteLocation;