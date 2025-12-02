import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { addHours, setHours, setMinutes, differenceInHours } from "date-fns";

const SearchContext = createContext();

export const SearchProvider = ({ children }) => {
  const isInitialized = useRef(false);

  const refreshSearchTime = (oldData) => {
    const now = new Date();
    let pickup = addHours(now, 2);
    if (pickup.getMinutes() > 0) {
      pickup = setHours(pickup, pickup.getHours() + 1);
      pickup = setMinutes(pickup, 0);
    }
    const ret = addHours(pickup, 52);

    const totalHours = differenceInHours(ret, pickup);

    return {
      ...oldData,
      pickupDate: pickup.toISOString().split("T")[0],
      pickupTime: pickup.getHours().toString().padStart(2, "0") + ":00",
      returnDate: ret.toISOString().split("T")[0],
      returnTime: ret.getHours().toString().padStart(2, "0") + ":00",
      pickupFull: `${pickup.toISOString().split("T")[0]} ${pickup.getHours().toString().padStart(2, "0")}:00`,
      returnFull: `${ret.toISOString().split("T")[0]} ${ret.getHours().toString().padStart(2, "0")}:00`,
      totalHours,
    };
  };

  const [searchData, setSearchData] = useState(() => {
    const saved = localStorage.getItem("searchData");
    if (!saved) return null;
    const parsed = JSON.parse(saved);

    const now = new Date();
    const lastSaved = new Date(parsed.timestamp || now);
    const diffMinutes = (now - lastSaved) / (1000 * 60);

    if (diffMinutes > 10) {
      const updated = { ...parsed, timestamp: new Date() };
      localStorage.setItem("searchData", JSON.stringify(updated));
      return updated;
    }

    return parsed;
  });

  // Không ghi đè lần đầu
  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      return;
    }
    if (searchData) {
      localStorage.setItem("searchData", JSON.stringify({ ...searchData, timestamp: new Date() }));
    }
  }, [searchData]);

  // Auto refresh mỗi 15 phút
  useEffect(() => {
    const interval = setInterval(() => {
      const saved = localStorage.getItem("searchData");
      if (!saved) return;
      const parsed = JSON.parse(saved);
      const now = new Date();
      const lastSaved = new Date(parsed.timestamp || now);
      const diffMinutes = (now - lastSaved) / (1000 * 60);

      if (diffMinutes > 15) {
        const refreshed = refreshSearchTime(parsed);
        console.log("Tự động làm mới searchData sau 15 phút không hoạt động");
        setSearchData(refreshed);
      }
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // tính tổng giờ dù có hoặc không có searchData
  const getDurationHours = () => {
    if (searchData?.pickupFull && searchData?.returnFull) {
      return differenceInHours(new Date(searchData.returnFull), new Date(searchData.pickupFull));
    }
    // fallback: nếu chưa có searchData, dùng 52h
    return 52;
  };

  const clearSearchData = () => {
    setSearchData(null);
    localStorage.removeItem("searchData");
  };

  return (
    <SearchContext.Provider value={{ searchData, setSearchData, clearSearchData, getDurationHours }}>
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = () => useContext(SearchContext);