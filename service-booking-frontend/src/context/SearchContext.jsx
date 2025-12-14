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
    let pickup = addHours(now, 2);
    
    // Làm tròn lên giờ tiếp theo
    if (pickup.getMinutes() > 0) {
      pickup = setHours(pickup, pickup.getHours() + 1);
      pickup = setMinutes(pickup, 0);
    }
    
    const ret = addHours(pickup, 52); // Mặc định thuê 52 giờ
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
      console.log(`Đã idle ${Math.floor(idleMinutes)} phút, làm mới thời gian`);
      return {
        ...data,
        ...recalculateTimes(data),
        timestamp: now.toISOString()
      };
    }

    return data;
  };

  // Tính toán lại thời gian giữ nguyên khoảng cách
  const recalculateTimes = (oldData) => {
    const now = new Date();
    let pickup = addHours(now, 2);
    
    if (pickup.getMinutes() > 0) {
      pickup = setHours(pickup, pickup.getHours() + 1);
      pickup = setMinutes(pickup, 0);
    }

    // Giữ nguyên khoảng thời gian thuê
    const durationHours = oldData.totalHours || 52;
    const ret = addHours(pickup, durationHours);
    
    const totalDays = Math.floor(durationHours / 24);
    const remainHours = durationHours % 24;

    return {
      pickupDate: pickup.toISOString().split("T")[0],
      pickupTime: pickup.getHours().toString().padStart(2, "0") + ":00",
      returnDate: ret.toISOString().split("T")[0],
      returnTime: ret.getHours().toString().padStart(2, "0") + ":00",
      pickupFull: `${pickup.toISOString().split("T")[0]} ${pickup.getHours().toString().padStart(2, "0")}:00`,
      returnFull: `${ret.toISOString().split("T")[0]} ${ret.getHours().toString().padStart(2, "0")}:00`,
      totalHours: durationHours,
      totalDays,
      remainHours
    };
  };

  const [searchData, setSearchData] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    
    try {
      const parsed = JSON.parse(saved);
      return validateAndRefreshSearchData(parsed);
    } catch (error) {
      console.error("Lỗi parse searchData:", error);
      return null;
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
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [searchData]);

  // Auto-check và refresh định kỳ
  useEffect(() => {
    const interval = setInterval(() => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;

      try {
        const parsed = JSON.parse(saved);
        const validated = validateAndRefreshSearchData(parsed);
        
        // Chỉ update nếu có thay đổi
        if (JSON.stringify(validated) !== JSON.stringify(parsed)) {
          setSearchData(validated);
        }
      } catch (error) {
        console.error("Lỗi validate searchData:", error);
      }
    }, CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  // Xử lý khi tab được focus lại
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            const validated = validateAndRefreshSearchData(parsed);
            setSearchData(validated);
          } catch (error) {
            console.error("Lỗi refresh searchData:", error);
          }
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
    setSearchData(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  // Update searchData với validation
  const updateSearchData = (newData) => {
    // Validate pickup và return time
    const pickup = new Date(newData.pickupFull || `${newData.pickupDate}T${newData.pickupTime}`);
    const returnTime = new Date(newData.returnFull || `${newData.returnDate}T${newData.returnTime}`);
    
    if (isAfter(pickup, returnTime)) {
      console.warn("Invalid time range: pickup after return");
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