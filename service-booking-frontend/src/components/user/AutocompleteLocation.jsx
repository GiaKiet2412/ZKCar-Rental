import React, { useState, useEffect, useRef } from "react";
import { MapPin, X, Navigation } from "lucide-react";
import { getDistrictFromWard } from "../../utils/districtUtils";

/**
 * Component AutocompleteLocation - GOOGLE MAPS STYLE
 * Tối ưu hóa để gợi ý giống Google Maps
 */
const AutocompleteLocation = ({ 
  value, 
  onSelect, 
  placeholder = "Nhập địa chỉ của bạn" 
}) => {
  const [inputValue, setInputValue] = useState(value || "");
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (inputValue.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    timeoutRef.current = setTimeout(() => {
      fetchSuggestions(inputValue);
    }, 400);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [inputValue]);

  /**
   * Chuẩn hóa text để so sánh
   */
  const normalize = (text) => {
    if (!text) return "";
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9\s]/g, "")
      .trim();
  };

  /**
   * Trích xuất district từ address components
   */
  const extractDistrict = (addr, displayName) => {
    // Priority 1: Structured data
    if (addr.city_district) return addr.city_district;
    if (addr.district) return addr.district;
    
    // Priority 2: Parse display_name
    const patterns = [
      /(?:Quận|Huyện)\s+[^,]+/gi,
      /Thành phố\s+[^,]+/gi,
      /District\s+[^,]+/gi,
    ];
    
    for (const pattern of patterns) {
      const match = displayName.match(pattern);
      if (match) {
        const district = match[0].trim();
        // Validate không phải là "Thành phố Hồ Chí Minh"
        const normalized = normalize(district);
        if (!normalized.includes("ho chi minh") && !normalized.includes("hcm")) {
          return district;
        }
      }
    }
    
    return null;
  };

  /**
   * Tìm district từ ward
   */
  const findDistrictFromWard = (ward) => {
    if (!ward) return null;
    
    const district = getDistrictFromWard(ward);
    if (district) {
      // Format: "quan binh tan" → "Quận Bình Tân"
      return district
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
        .replace('Quan', 'Quận')
        .replace('Huyen', 'Huyện')
        .replace('Thanh Pho', 'Thành phố');
    }
    return null;
  };

  /**
   * Format address theo style Google Maps
   * Ví dụ: "Đường ABC" với secondary "Phường X, Quận Y"
   */
  const formatGoogleStyle = (road, ward, district) => {
    const primary = road || ward || district || "";
    const secondaryParts = [];
    
    if (road && ward) secondaryParts.push(ward);
    if (district && district !== ward) secondaryParts.push(district);
    
    return {
      primary: primary,
      secondary: secondaryParts.join(", ") || "TP. Hồ Chí Minh"
    };
  };

  /**
   * Tính điểm relevance (Google Maps style)
   */
  const calculateScore = (item, query) => {
    const normQuery = normalize(query);
    let score = 0;

    // Exact match với road/ward/district
    if (item.road && normalize(item.road).includes(normQuery)) score += 50;
    if (item.ward && normalize(item.ward).includes(normQuery)) score += 40;
    if (item.district && normalize(item.district).includes(normQuery)) score += 30;

    // Có đầy đủ thông tin
    if (item.road && item.ward && item.district) score += 20;
    else if (item.road && item.district) score += 15;
    else if (item.ward && item.district) score += 10;

    // District format chuẩn
    if (item.district && /^(Quận|Huyện|Thành phố)/.test(item.district)) score += 5;

    // POI (Point of Interest) - địa điểm nổi bật
    const amenity = item.amenity || item.type;
    if (amenity) score += 8;

    return score;
  };

  /**
   * Gom nhóm kết quả theo type (Google Maps style)
   */
  const groupResults = (results) => {
    const groups = {
      exact: [],      // Khớp chính xác với query
      streets: [],    // Đường phố
      districts: [],  // Quận/huyện
      pois: [],       // Địa điểm (POI)
      others: []      // Khác
    };

    results.forEach(item => {
      if (item.amenity || item.type === 'poi') {
        groups.pois.push(item);
      } else if (item.road && !item.amenity) {
        groups.streets.push(item);
      } else if (item.district && !item.road && !item.ward) {
        groups.districts.push(item);
      } else {
        groups.others.push(item);
      }
    });

    // Merge theo thứ tự ưu tiên
    return [
      ...groups.pois.slice(0, 2),      // Top 2 POIs
      ...groups.streets.slice(0, 5),   // Top 5 streets
      ...groups.districts.slice(0, 2), // Top 2 districts
      ...groups.others.slice(0, 3)     // Top 3 others
    ].slice(0, 8); // Giới hạn 8 kết quả như Google Maps
  };

  const fetchSuggestions = async (query) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
          `q=${encodeURIComponent(query + ", Ho Chi Minh City, Vietnam")}` +
          `&format=json` +
          `&addressdetails=1` +
          `&limit=20` +
          `&bounded=1` +
          `&viewbox=106.4,10.5,107.0,11.2`,
        {
          headers: {
            "Accept-Language": "vi",
          },
        }
      );

      if (!response.ok) throw new Error("API error");

      const data = await response.json();
      
      // Process results
      const processed = data
        .filter((item) => item.address)
        .map((item) => {
          const addr = item.address;
          
          // Extract components
          let district = extractDistrict(addr, item.display_name);
          const ward = addr.suburb || addr.quarter || addr.neighbourhood || "";
          const road = addr.road || addr.street || "";
          const amenity = addr.amenity || "";
          const name = addr.name || "";
          
          // Fallback: Find district from ward
          if (!district && ward) {
            district = findDistrictFromWard(ward);
          }
          
          // Format address
          const { primary, secondary } = formatGoogleStyle(road, ward, district);
          
          return {
            primary,
            secondary,
            fullAddress: item.display_name,
            lat: item.lat,
            lon: item.lon,
            placeId: item.place_id,
            district: district || "",
            ward,
            road,
            amenity,
            name,
            type: item.type,
            districtOnly: district || ward,
          };
        })
        // Remove duplicates
        .filter((item, index, self) => 
          index === self.findIndex(t => 
            t.primary === item.primary && t.secondary === item.secondary
          )
        )
        // Calculate scores
        .map(item => ({
          ...item,
          score: calculateScore(item, query)
        }))
        // Sort by score
        .sort((a, b) => b.score - a.score);

      // Group and limit results (Google Maps style)
      const grouped = groupResults(processed);

      setSuggestions(grouped);
      setShowDropdown(grouped.length > 0);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (suggestion) => {
    const displayText = suggestion.primary + 
      (suggestion.secondary ? `, ${suggestion.secondary}` : "");
    
    setInputValue(displayText);
    setShowDropdown(false);
    setSuggestions([]);
    
    onSelect(displayText, suggestion);
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
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 pr-20 focus:ring-2 focus:ring-green-500 outline-none text-sm"
        />
        
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {isLoading && (
            <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
          )}
          
          {inputValue && !isLoading && (
            <button
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 transition"
              type="button"
            >
              <X size={16} />
            </button>
          )}
          
          <MapPin size={18} className="text-green-600" />
        </div>
      </div>

      {/* Dropdown - Google Maps Style */}
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-2xl max-h-96 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.placeId || index}
              onClick={() => handleSelect(suggestion)}
              className="px-3 py-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="mt-0.5 flex-shrink-0">
                  {suggestion.amenity || suggestion.type === 'poi' ? (
                    <Navigation size={18} className="text-red-500" />
                  ) : (
                    <MapPin size={18} className="text-gray-400" />
                  )}
                </div>
                
                {/* Text */}
                <div className="flex-1 min-w-0">
                  {/* Primary text (địa chỉ chính) */}
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {suggestion.primary}
                  </p>
                  
                  {/* Secondary text (phường, quận) */}
                  {suggestion.secondary && (
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {suggestion.secondary}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No results */}
      {showDropdown && !isLoading && inputValue.trim().length >= 2 && suggestions.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          <p className="text-sm text-gray-500 text-center">
            Không tìm thấy kết quả
          </p>
          <p className="text-xs text-gray-400 text-center mt-1">
            Thử tìm kiếm với từ khóa khác
          </p>
        </div>
      )}
    </div>
  );
};

export default AutocompleteLocation;