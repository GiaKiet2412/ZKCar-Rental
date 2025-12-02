/**
 * Utility functions để xử lý logic tìm kiếm xe theo quận
 * Bao gồm mapping các quận lân cận và Phường → Quận ở TP.HCM
 */

// Map Phường → Quận (để tìm quận khi chỉ có phường)
export const WARD_TO_DISTRICT = {
  // Quận Bình Tân
  "binh tri dong": "quan binh tan",
  "binh tri dong a": "quan binh tan",
  "binh tri dong b": "quan binh tan",
  "binh hung hoa": "quan binh tan",
  "binh hung hoa a": "quan binh tan",
  "binh hung hoa b": "quan binh tan",
  "an lac": "quan binh tan",
  "an lac a": "quan binh tan",
  
  // Quận Tân Phú
  "tan quy": "quan tan phu",
  "tan son nhi": "quan tan phu",
  "tan thanh": "quan tan phu",
  "phu thanh": "quan tan phu",
  "phu tho hoa": "quan tan phu",
  "hoa thanh": "quan tan phu",
  "hiep tan": "quan tan phu",
  "tan thoi hoa": "quan tan phu",
  "son ky": "quan tan phu",
  "tan thoi nhat": "quan tan phu",
  "tay thanh": "quan tan phu",
  
  // Quận 1
  "ben nghe": "quan 1",
  "ben thanh": "quan 1",
  "nguyen thai binh": "quan 1",
  "pham ngu lao": "quan 1",
  "cau ong lanh": "quan 1",
  "co giang": "quan 1",
  "da kao": "quan 1",
  "nguyen cu trinh": "quan 1",
  "cau kho": "quan 1",
  "tan dinh": "quan 1",
  
  // Quận 3
  "vo thi sau": "quan 3",
  "pham dinh ho": "quan 3",
  "9": "quan 3",
  "10": "quan 3",
  "11": "quan 3",
  "12": "quan 3",
  "13": "quan 3",
  "14": "quan 3",
  
  // Quận Gò Vấp
  "go vap": "quan go vap",
  "hanh thong": "quan go vap",
  "an nhon": "quan go vap",
  "an hoi dong": "quan go vap",
  "thong tay hoi": "quan go vap",
  "an hoi tay": "quan go vap",
  
  // Quận Tân Bình
  "tan son nhat": "quan tan binh",
  "tan son hoa": "quan tan binh",
  "tan hoa": "quan tan binh",
  "bay hien": "quan tan binh",
  "tan binh": "quan tan binh",
  "tan son": "quan tan binh",
};

// Map các quận lân cận (dựa trên vị trí địa lý thực tế)
export const NEARBY_DISTRICTS = {
  "quan 1": ["quan 3", "quan 4", "quan 5", "quan 10", "quan phu nhuan"],
  "quan 3": ["quan 1", "quan 10", "quan phu nhuan", "quan binh thanh"],
  "quan 4": ["quan 1", "quan 7", "quan 8"],
  "quan 5": ["quan 1", "quan 6", "quan 10", "quan 11", "quan tan phu"],
  "quan 6": ["quan 5", "quan 8", "quan 11", "quan binh tan"],
  "quan 7": ["quan 4", "quan 8", "huyen nha be"],
  "quan 8": ["quan 4", "quan 6", "quan 7", "quan binh tan", "huyen binh chanh"],
  "quan 10": ["quan 1", "quan 3", "quan 5", "quan 11", "quan tan binh", "quan phu nhuan"],
  "quan 11": ["quan 5", "quan 6", "quan 10", "quan tan binh", "quan tan phu"],
  "quan 12": ["quan go vap", "thanh pho thu duc", "huyen hoc mon", "huyen cu chi"],
  "quan binh thanh": ["quan 3", "quan phu nhuan", "quan go vap", "thanh pho thu duc"],
  "quan go vap": ["quan 12", "quan binh thanh", "quan phu nhuan", "quan tan binh", "quan tan phu", "thanh pho thu duc"],
  "quan tan phu": ["quan 5", "quan 11", "quan go vap", "quan tan binh", "huyen hoc mon"],
  "quan phu nhuan": ["quan 1", "quan 3", "quan 10", "quan binh thanh", "quan go vap", "quan tan binh"],
  "quan tan binh": ["quan 10", "quan 11", "quan phu nhuan", "quan go vap", "quan tan phu"],
  "quan binh tan": ["quan 6", "quan 8", "huyen binh chanh", "huyen hoc mon"],
  "huyen cu chi": ["quan 12", "huyen hoc mon"],
  "huyen hoc mon": ["quan 12", "quan tan phu", "quan binh tan", "huyen cu chi"],
  "huyen nha be": ["quan 7", "huyen binh chanh"],
  "huyen binh chanh": ["quan 8", "quan binh tan", "huyen nha be"],
  "thanh pho thu duc": ["quan 12", "quan binh thanh", "quan go vap", "thanh pho di an", "thanh pho thuan an"],
  "thanh pho thuan an": ["thanh pho thu duc", "binh duong"],
  "thanh pho di an": ["thanh pho thu duc", "binh duong"],
  "thanh pho thu dau mot": ["binh duong"],
  "binh duong": ["thanh pho thuan an", "thanh pho di an", "thanh pho thu dau mot"],
};

/**
 * Chuẩn hóa tên quận/phường (loại bỏ dấu, chuyển thường, loại bỏ khoảng trắng thừa)
 */
export const normalizeDistrictName = (name) => {
  if (!name) return "";
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Loại bỏ dấu
    .replace(/đ/g, "d")
    .trim();
};

/**
 * Trích xuất tên quận từ chuỗi địa chỉ - CẢI THIỆN
 * VD: "Phường Bình Trị Đông, Quận Bình Tân" -> "Quận Bình Tân"
 */
export const extractDistrictFromAddress = (address) => {
  if (!address) return null;
  
  // Pattern cải thiện: match chính xác đến dấu phẩy
  const patterns = [
    /(?:Quận|Huyện)\s+[A-Za-zÀ-ỹ0-9\s]+?(?=\s*,)/gi,
    /Thành phố\s+[A-Za-zÀ-ỹ0-9\s]+?(?=\s*,)/gi,
  ];
  
  for (const pattern of patterns) {
    const matches = address.match(pattern);
    if (matches && matches.length > 0) {
      // Lấy match đầu tiên và trim
      return matches[0].trim();
    }
  }
  
  return null;
};

/**
 * Tìm quận từ tên phường
 */
export const getDistrictFromWard = (wardName) => {
  if (!wardName) return null;
  
  const normalized = normalizeDistrictName(wardName);
  
  // Loại bỏ tiền tố "phuong" nếu có
  const cleanWard = normalized
    .replace(/^phuong\s+/i, "")
    .replace(/^xa\s+/i, "")
    .trim();
  
  // Tìm trong mapping
  return WARD_TO_DISTRICT[cleanWard] || WARD_TO_DISTRICT[normalized] || null;
};

/**
 * Lấy danh sách quận lân cận (bao gồm cả quận hiện tại)
 */
export const getNearbyDistricts = (district) => {
  if (!district) return [];
  
  const normalized = normalizeDistrictName(district);
  const nearby = NEARBY_DISTRICTS[normalized] || [];
  
  // Trả về mảng bao gồm quận hiện tại + quận lân cận
  return [normalized, ...nearby.map(normalizeDistrictName)];
};

/**
 * Kiểm tra xem một xe có match với địa điểm tìm kiếm không
 * Hỗ trợ tìm theo: District hoặc Ward (tìm District từ Ward)
 */
export const isVehicleMatchLocation = (vehicleLocation, searchLocation) => {
  if (!vehicleLocation || !searchLocation) return false;
  
  const normalizedVehicle = normalizeDistrictName(vehicleLocation);
  const normalizedSearch = normalizeDistrictName(searchLocation);
  
  // 1. Trích xuất quận từ vehicle location
  const vehicleDistrict = extractDistrictFromAddress(vehicleLocation);
  const normalizedVehicleDistrict = vehicleDistrict ? normalizeDistrictName(vehicleDistrict) : normalizedVehicle;
  
  // 2. Xử lý search location
  let searchDistrict = extractDistrictFromAddress(searchLocation);
  
  // 3. Nếu không tìm thấy quận trong searchLocation, thử tìm từ phường
  if (!searchDistrict) {
    // Kiểm tra xem có phải là phường không
    if (normalizedSearch.includes("phuong") || normalizedSearch.includes("xa")) {
      // Tìm quận từ phường
      const districtFromWard = getDistrictFromWard(searchLocation);
      if (districtFromWard) {
        searchDistrict = districtFromWard;
        console.log(`🔍 Tìm quận từ phường: ${searchLocation} → ${districtFromWard}`);
      }
    } else {
      // Fallback: coi searchLocation là tên quận luôn
      searchDistrict = searchLocation;
    }
  }
  
  const normalizedSearchDistrict = normalizeDistrictName(searchDistrict);
  
  // 4. So sánh chính xác giữa các quận (tránh match "Quận B" với "Quận Bình Thạnh")
  if (normalizedVehicleDistrict === normalizedSearchDistrict) {
    return true;
  }
  
  // 5. Kiểm tra quận lân cận
  const nearbyDistricts = getNearbyDistricts(normalizedSearchDistrict);
  if (nearbyDistricts.includes(normalizedVehicleDistrict)) {
    return true;
  }
  
  // 6. Fallback: Match một phần nếu cả hai đều là quận đầy đủ
  // VD: "quan binh tan" contains "quan binh tan"
  if (normalizedVehicleDistrict.includes(normalizedSearchDistrict) && 
      normalizedSearchDistrict.length > 10) { // Đảm bảo không phải "quan b"
    return true;
  }
  
  return false;
};

/**
 * Lọc danh sách xe theo địa điểm
 * locationData: {districtOnly, ward, district, ...}
 * fallbackLocation: string address
 */
export const filterVehiclesByLocation = (vehicles, locationData, fallbackLocation) => {
  if (!locationData && !fallbackLocation) {
    return vehicles; // Không có điều kiện lọc
  }
  
  // Ưu tiên dùng districtOnly từ locationData
  if (locationData?.districtOnly) {
    const searchLocation = locationData.districtOnly;
    
    return vehicles.filter(v => {
      if (!v.location) return false;
      return isVehicleMatchLocation(v.location, searchLocation);
    });
  }
  
  // Fallback: tìm kiếm text thông thường
  if (fallbackLocation) {
    return vehicles.filter(v => {
      if (!v.location) return false;
      return isVehicleMatchLocation(v.location, fallbackLocation);
    });
  }
  
  return vehicles;
};