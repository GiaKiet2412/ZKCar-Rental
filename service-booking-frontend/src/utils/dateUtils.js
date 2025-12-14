import { 
  addHours, 
  setHours, 
  setMinutes, 
  differenceInHours,
  differenceInMinutes,
  isPast,
  isAfter,
  isBefore,
  parseISO,
  format
} from "date-fns";

/**
 * Tạo thời gian pickup mặc định (2 giờ sau, làm tròn lên giờ tiếp theo)
 */
export const getDefaultPickupTime = () => {
  const now = new Date();
  let pickup = addHours(now, 2);
  
  if (pickup.getMinutes() > 0) {
    pickup = setHours(pickup, pickup.getHours() + 1);
    pickup = setMinutes(pickup, 0);
  }
  
  return pickup;
};

/**
 * Tạo thời gian return mặc định (52 giờ sau pickup)
 */
export const getDefaultReturnTime = (pickupTime) => {
  return addHours(pickupTime, 52);
};

/**
 * Format datetime thành string cho searchData
 */
export const formatDateTimeForSearch = (date) => {
  return {
    date: format(date, 'yyyy-MM-dd'),
    time: format(date, 'HH:00'),
    full: format(date, 'yyyy-MM-dd HH:00')
  };
};

/**
 * Tính toán tổng số giờ và phân chia thành ngày/giờ
 */
export const calculateDuration = (pickupTime, returnTime) => {
  const totalHours = differenceInHours(returnTime, pickupTime);
  const totalDays = Math.floor(totalHours / 24);
  const remainHours = totalHours % 24;
  
  return {
    totalHours,
    totalDays,
    remainHours
  };
};

/**
 * Kiểm tra thời gian pickup có hợp lệ không (phải sau thời gian hiện tại ít nhất 1 giờ)
 */
export const isValidPickupTime = (pickupTime) => {
  const now = new Date();
  const minPickup = addHours(now, 1);
  return isAfter(pickupTime, minPickup);
};

/**
 * Kiểm tra thời gian return có hợp lệ không (phải sau pickup ít nhất 4 giờ)
 */
export const isValidReturnTime = (pickupTime, returnTime) => {
  const minReturn = addHours(pickupTime, 4);
  return isAfter(returnTime, minReturn);
};

/**
 * Kiểm tra xem thời gian đã qua chưa
 */
export const isTimeExpired = (dateTime) => {
  return isPast(new Date(dateTime));
};

/**
 * Tính giá thuê xe dựa trên số giờ
 */
export const calculateRentalPrice = (pricePerHour, totalHours) => {
  if (totalHours <= 8) {
    return pricePerHour * 8;
  } else if (totalHours <= 12) {
    return pricePerHour * 12;
  } else {
    const days = Math.ceil(totalHours / 24);
    return pricePerHour * 24 * days;
  }
};

/**
 * Format hiển thị thời gian thuê
 */
export const formatRentalDuration = (totalHours) => {
  if (totalHours <= 8) return "8 giờ";
  if (totalHours <= 12) return "12 giờ";
  
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  
  if (hours === 0) return `${days} ngày`;
  return `${days} ngày ${hours} giờ`;
};

/**
 * Kiểm tra 2 khoảng thời gian có overlap không
 */
export const isTimeRangeOverlap = (start1, end1, start2, end2) => {
  const s1 = new Date(start1);
  const e1 = new Date(end1);
  const s2 = new Date(start2);
  const e2 = new Date(end2);
  
  return !(e1 <= s2 || s1 >= e2);
};

/**
 * Lấy thời gian còn lại đến một mốc thời gian
 */
export const getTimeRemaining = (targetTime) => {
  const now = new Date();
  const target = new Date(targetTime);
  
  if (isPast(target)) return null;
  
  const totalMinutes = differenceInMinutes(target, now);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  return { hours, minutes, totalMinutes };
};

/**
 * Format datetime cho hiển thị người dùng
 */
export const formatDisplayDateTime = (dateTime) => {
  const date = new Date(dateTime);
  return format(date, 'dd/MM/yyyy HH:mm');
};

/**
 * Tạo mảng các giờ có thể chọn (từ 00:00 đến 23:00)
 */
export const getAvailableHours = () => {
  return Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    return { value: `${hour}:00`, label: `${hour}:00` };
  });
};

/**
 * Kiểm tra thời gian có trong giờ làm việc không (6:00 - 22:00)
 */
export const isWorkingHours = (dateTime) => {
  const date = new Date(dateTime);
  const hour = date.getHours();
  return hour >= 6 && hour < 22;
};

/**
 * Tính số phút chênh lệch giữa thời điểm hiện tại và lần cập nhật cuối
 */
export const getMinutesSinceUpdate = (lastUpdateTime) => {
  const now = new Date();
  const lastUpdate = new Date(lastUpdateTime);
  return differenceInMinutes(now, lastUpdate);
};

export default {
  getDefaultPickupTime,
  getDefaultReturnTime,
  formatDateTimeForSearch,
  calculateDuration,
  isValidPickupTime,
  isValidReturnTime,
  isTimeExpired,
  calculateRentalPrice,
  formatRentalDuration,
  isTimeRangeOverlap,
  getTimeRemaining,
  formatDisplayDateTime,
  getAvailableHours,
  isWorkingHours,
  getMinutesSinceUpdate
};