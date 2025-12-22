import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { addHours, setHours, setMinutes, differenceInHours, isPast, isAfter } from "date-fns";

const SearchContext = createContext();

const STORAGE_KEY = "searchData";
const MAX_IDLE_MINUTES = 15;
const CHECK_INTERVAL = 60000; // 1 phút

export const SearchProvider = ({ children }) => {
  const isInitialized = useRef(false);

  // Tạo searchData mặc định
  const createDefaultSearchData = () => {
    const now = new Date();
    
    // Pickup = bây giờ + 2 giờ, làm tròn LÊN giờ tiếp theo
    let pickup = addHours(now, 2);
    
    // Luôn làm tròn lên giờ tròn tiếp theo
    const minutes = pickup.getMinutes();
    if (minutes > 0) {
      pickup = addHours(pickup, 1); // +1 giờ nữa
      pickup = setMinutes(pickup, 0);
      pickup.setSeconds(0);
      pickup.setMilliseconds(0);
    }
    
    // Return = Pickup + ĐÚNG 52 giờ
    const ret = addHours(pickup, 52);
    
    const totalHours = differenceInHours(ret, pickup);
    const totalDays = Math.floor(totalHours / 24);
    const remainHours = totalHours % 24;

    return {
      location: "",
      locationData: null,
      pickupDate: pickup.toISOString().split("T")[0],
      pickupTime: pickup.getHours().toString().padStart(2, "0") + ":00",
      returnDate: ret.toISOString().split("T")[0],
      returnTime: ret.getHours().toString().padStart(2, "0") + ":00",
      pickupFull: `${pickup.toISOString().split("T")[0]} ${pickup.getHours().toString().padStart(2, "0")}:00`,
      returnFull: `${ret.toISOString().split("T")[0]} ${ret.getHours().toString().padStart(2, "0")}:00`,
      totalHours,
      totalDays,
      remainHours,
      timestamp: now.toISOString()
    };
  };

  // Kiểm tra và làm mới searchData nếu cần
  const validateAndRefreshSearchData = (data) => {
    if (!data) return createDefaultSearchData();

    const now = new Date();
    const pickupDate = new Date(data.pickupFull);
    const lastUpdate = data.timestamp ? new Date(data.timestamp) : now;
    
    // Kiểm tra thời gian pickup đã qua chưa
    if (isPast(pickupDate)) {
      console.log("Pickup time đã qua, tạo searchData mới");
      return createDefaultSearchData();
    }

    // Kiểm tra idle time
    const idleMinutes = (now - lastUpdate) / (1000 * 60);
    if (idleMinutes > MAX_IDLE_MINUTES) {
      console.log(`Đã idle ${Math.floor(idleMinutes)} phút, làm mới thời gian VÀ reset về 52h`);
      // Luôn tạo mới với 52h, không giữ duration cũ
      return createDefaultSearchData();
    }

    return data;
  };

  // ============ CRITICAL FIX: LUÔN KHỞI TẠO SEARCHDATA ============
  const [searchData, setSearchData] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    
    // Nếu KHÔNG có localStorage -> TẠO MỚI ngay lập tức
    if (!saved) {
      const newData = createDefaultSearchData();
      // Lưu vào localStorage ngay
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      console.log("SearchData mới");
      return newData;
    }
    
    // Nếu CÓ localStorage -> validate và refresh nếu cần
    try {
      const parsed = JSON.parse(saved);
      const validated = validateAndRefreshSearchData(parsed);
      
      // Nếu data đã được refresh, lưu lại
      if (JSON.stringify(validated) !== JSON.stringify(parsed)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(validated));
        console.log("refresh searchData");
      }
      
      return validated;
    } catch (error) {
      // Nếu parse lỗi -> tạo mới
      const newData = createDefaultSearchData();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      return newData;
    }
  });

  // Lưu vào localStorage khi searchData thay đổi
  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      return;
    }
    
    if (searchData) {
      const dataToSave = {
        ...searchData,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      console.log("Lưu searchData");
    } else {
      // Nếu searchData bị xóa -> tạo lại ngay
      const newData = createDefaultSearchData();
      setSearchData(newData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      console.log("SearchData null -> tạo");
    }
  }, [searchData]);

  // Auto-check và refresh định kỳ
  useEffect(() => {
    const interval = setInterval(() => {
      const saved = localStorage.getItem(STORAGE_KEY);
      
      // Nếu không có localStorage -> tạo mới
      if (!saved) {
        console.log("SearchData bị xóa, tạo mới");
        const newData = createDefaultSearchData();
        setSearchData(newData);
        return;
      }

      try {
        const parsed = JSON.parse(saved);
        const validated = validateAndRefreshSearchData(parsed);
        
        // Chỉ update nếu có thay đổi
        if (JSON.stringify(validated) !== JSON.stringify(parsed)) {
          console.log("Auto-refresh");
          setSearchData(validated);
        }
      } catch (error) {
        console.error("Lỗi validate searchData:", error);
        // Parse lỗi -> tạo mới
        const newData = createDefaultSearchData();
        setSearchData(newData);
      }
    }, CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  // Xử lý khi tab được focus lại
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const saved = localStorage.getItem(STORAGE_KEY);
        
        // Nếu không có localStorage -> tạo mới
        if (!saved) {
          const newData = createDefaultSearchData();
          setSearchData(newData);
          return;
        }
        
        try {
          const parsed = JSON.parse(saved);
          const validated = validateAndRefreshSearchData(parsed);
          
          if (JSON.stringify(validated) !== JSON.stringify(parsed)) {
            setSearchData(validated);
          }
        } catch (error) {
          const newData = createDefaultSearchData();
          setSearchData(newData);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const getDurationHours = () => {
    if (searchData?.totalHours) {
      return searchData.totalHours;
    }
    return 52; // fallback
  };

  const clearSearchData = () => {
    // Không cho phép xóa hoàn toàn, chỉ reset về mặc định
    const newData = createDefaultSearchData();
    setSearchData(newData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
  };

  // Update searchData với validation
  const updateSearchData = (newData) => {
    // Validate pickup và return time
    const pickup = new Date(newData.pickupFull || `${newData.pickupDate}T${newData.pickupTime}`);
    const returnTime = new Date(newData.returnFull || `${newData.returnDate}T${newData.returnTime}`);
    
    if (isAfter(pickup, returnTime)) {
      return;
    }

    const updated = {
      ...newData,
      timestamp: new Date().toISOString()
    };
    setSearchData(updated);
  };

  // Helper: Check if search data is valid
  const isSearchDataValid = () => {
    if (!searchData) return false;
    const pickup = new Date(searchData.pickupFull);
    return !isPast(pickup) && searchData.totalHours >= 4;
  };

  // Helper: Get formatted search summary
  const getSearchSummary = () => {
    if (!searchData) return null;
    return {
      location: searchData.location || "Tất cả khu vực",
      duration: `${searchData.totalDays} ngày ${searchData.remainHours} giờ`,
      pickupTime: searchData.pickupFull,
      returnTime: searchData.returnFull
    };
  };

  return (
    <SearchContext.Provider value={{ 
      searchData, 
      setSearchData: updateSearchData,
      clearSearchData, 
      getDurationHours,
      createDefaultSearchData,
      isSearchDataValid,
      getSearchSummary
    }}>
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error("useSearch must be used within SearchProvider");
  }
  return context;
};