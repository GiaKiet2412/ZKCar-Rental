import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import API from '../api/axios';

const AdminRealtimeContext = createContext();

export const useAdminRealtime = () => {
  const context = useContext(AdminRealtimeContext);
  if (!context) {
    throw new Error('useAdminRealtime must be used within AdminRealtimeProvider');
  }
  return context;
};

export const AdminRealtimeProvider = ({ children }) => {
  const [bookings, setBookings] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isPolling, setIsPolling] = useState(false);
  const [isTabVisible, setIsTabVisible] = useState(true);

  // Track tab visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = document.visibilityState === 'visible';
      setIsTabVisible(visible);
      
      // Refresh immediately when tab becomes visible
      if (visible && isPolling) {
        console.log('Tab became visible - refreshing data...');
        fetchBookings();
        fetchVehicles();
        fetchStatistics();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isPolling]);

  // Fetch bookings
  const fetchBookings = useCallback(async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.status) queryParams.append("status", filters.status);
      if (filters.startDate) queryParams.append("startDate", filters.startDate);
      if (filters.endDate) queryParams.append("endDate", filters.endDate);
      queryParams.append("page", filters.page || 1);
      queryParams.append("limit", filters.limit || 20);

      const response = await API.get(`api/bookings/admin/all?${queryParams.toString()}`);
      
      if (response.data.success) {
        setBookings(response.data.bookings);
        setLastUpdate(new Date());
        return response.data;
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      return null;
    }
  }, []);

  // Fetch vehicles
  const fetchVehicles = useCallback(async () => {
    try {
      const response = await API.get("api/vehicles");
      setVehicles(response.data);
      setLastUpdate(new Date());
      return response.data;
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      return null;
    }
  }, []);

  // Fetch statistics
  const fetchStatistics = useCallback(async (dateFilter = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (dateFilter.startDate) queryParams.append("startDate", dateFilter.startDate);
      if (dateFilter.endDate) queryParams.append("endDate", dateFilter.endDate);

      const response = await API.get(`api/bookings/admin/statistics?${queryParams.toString()}`);
      
      if (response.data.success) {
        setStatistics(response.data.statistics);
        setLastUpdate(new Date());
        return response.data.statistics;
      }
    } catch (error) {
      console.error("Error fetching statistics:", error);
      return null;
    }
  }, []);

  // Auto-update booking status based on time
  const checkAndUpdateBookingStatuses = useCallback(async () => {
    const now = new Date();
    const updatedBookings = [];

    for (const booking of bookings) {
      const pickupDate = new Date(booking.pickupDate);
      const returnDate = new Date(booking.returnDate);
      
      // Auto update to ongoing if current time is within rental period
      if (
        booking.status === 'confirmed' && 
        booking.paymentStatus === 'paid' &&
        now >= pickupDate && 
        now <= returnDate
      ) {
        try {
          await API.patch(`api/bookings/${booking._id}/status`, {
            status: 'ongoing'
          });
          updatedBookings.push(booking._id);
        } catch (error) {
          console.error(`Error updating booking ${booking._id}:`, error);
        }
      }

      // Auto update to completed if past return date
      if (
        booking.status === 'ongoing' &&
        now > returnDate
      ) {
        try {
          await API.patch(`api/bookings/${booking._id}/complete`);
          updatedBookings.push(booking._id);
        } catch (error) {
          console.error(`Error completing booking ${booking._id}:`, error);
        }
      }
    }

    // Refresh bookings if any were updated
    if (updatedBookings.length > 0) {
      return true;
    }
    return false;
  }, [bookings]);

  // Polling effect
  useEffect(() => {
    if (!isPolling) return;

    const pollInterval = setInterval(async () => {
      // Skip polling if tab is not visible (browser throttles anyway)
      if (!isTabVisible) {
        console.log('Tab not visible - skipping poll');
        return;
      }

      console.log('Polling: Checking for updates...');
      
      // Check and update booking statuses
      const hasStatusUpdates = await checkAndUpdateBookingStatuses();
      
      // ALWAYS refresh data every 30 seconds (không chỉ khi có updates)
      // Để detect booking mới được tạo từ tab/user khác
      await fetchBookings();
      await fetchVehicles();
      
      // Chỉ refresh statistics khi có updates để tiết kiệm bandwidth
      if (hasStatusUpdates) {
        await fetchStatistics();
      }
      
      console.log('Polling: Data refreshed');
    }, 30000); // 30 seconds

    return () => clearInterval(pollInterval);
  }, [isPolling, isTabVisible, checkAndUpdateBookingStatuses, fetchBookings, fetchVehicles, fetchStatistics]);

  // Start/Stop polling
  const startPolling = useCallback(() => {
    setIsPolling(true);
  }, []);

  const stopPolling = useCallback(() => {
    setIsPolling(false);
  }, []);

  // Refresh all data
  const refreshAll = useCallback(async (filters = {}) => {
    const [bookingsData, vehiclesData, statsData] = await Promise.all([
      fetchBookings(filters),
      fetchVehicles(),
      fetchStatistics(filters)
    ]);

    return {
      bookings: bookingsData,
      vehicles: vehiclesData,
      statistics: statsData
    };
  }, [fetchBookings, fetchVehicles, fetchStatistics]);

  const value = {
    // Data
    bookings,
    vehicles,
    statistics,
    lastUpdate,
    isPolling,
    isTabVisible,

    // Actions
    fetchBookings,
    fetchVehicles,
    fetchStatistics,
    refreshAll,
    startPolling,
    stopPolling,
    checkAndUpdateBookingStatuses,

    // Setters (for manual updates)
    setBookings,
    setVehicles,
    setStatistics
  };

  return (
    <AdminRealtimeContext.Provider value={value}>
      {children}
    </AdminRealtimeContext.Provider>
  );
};