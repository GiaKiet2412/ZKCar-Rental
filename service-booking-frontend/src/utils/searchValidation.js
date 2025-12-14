import { 
  differenceInHours, 
  isBefore, 
  isAfter, 
  addHours,
  isPast 
} from 'date-fns';

/**
 * Validation rules cho search form
 */
export const SEARCH_RULES = {
  MIN_RENTAL_HOURS: 4,
  MIN_ADVANCE_HOURS: 2, // Phải đặt trước ít nhất 2 giờ
  MAX_RENTAL_DAYS: 30,
  DEFAULT_RENTAL_HOURS: 52
};

/**
 * Kiểm tra thời gian pickup có hợp lệ
 */
export const validatePickupTime = (pickupDate, pickupTime) => {
  const pickup = new Date(`${pickupDate}T${pickupTime}`);
  const now = new Date();
  const minPickup = addHours(now, SEARCH_RULES.MIN_ADVANCE_HOURS);

  if (isPast(pickup)) {
    return {
      valid: false,
      error: 'Thời gian nhận xe không thể ở quá khứ'
    };
  }

  if (isBefore(pickup, minPickup)) {
    return {
      valid: false,
      error: `Vui lòng đặt xe trước ít nhất ${SEARCH_RULES.MIN_ADVANCE_HOURS} giờ`
    };
  }

  return { valid: true };
};

/**
 * Kiểm tra thời gian return có hợp lệ
 */
export const validateReturnTime = (pickupDate, pickupTime, returnDate, returnTime) => {
  const pickup = new Date(`${pickupDate}T${pickupTime}`);
  const returnD = new Date(`${returnDate}T${returnTime}`);

  if (isBefore(returnD, pickup) || returnD.getTime() === pickup.getTime()) {
    return {
      valid: false,
      error: 'Thời gian trả xe phải sau thời gian nhận xe'
    };
  }

  const hours = differenceInHours(returnD, pickup);

  if (hours < SEARCH_RULES.MIN_RENTAL_HOURS) {
    return {
      valid: false,
      error: `Thời gian thuê tối thiểu là ${SEARCH_RULES.MIN_RENTAL_HOURS} giờ`
    };
  }

  if (hours > SEARCH_RULES.MAX_RENTAL_DAYS * 24) {
    return {
      valid: false,
      error: `Thời gian thuê tối đa là ${SEARCH_RULES.MAX_RENTAL_DAYS} ngày`
    };
  }

  return { valid: true, hours };
};

/**
 * Validate toàn bộ search form
 */
export const validateSearchForm = (form) => {
  const errors = {};

  // Validate pickup
  const pickupValidation = validatePickupTime(form.pickupDate, form.pickupTime);
  if (!pickupValidation.valid) {
    errors.pickup = pickupValidation.error;
  }

  // Validate return
  const returnValidation = validateReturnTime(
    form.pickupDate, 
    form.pickupTime, 
    form.returnDate, 
    form.returnTime
  );
  if (!returnValidation.valid) {
    errors.return = returnValidation.error;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    totalHours: returnValidation.hours
  };
};

/**
 * Tính toán giá dự kiến dựa trên số giờ
 */
export const calculateEstimatedPrice = (pricePerHour, totalHours) => {
  if (!pricePerHour || !totalHours) return 0;

  let multiplier;
  if (totalHours <= 8) {
    multiplier = 8;
  } else if (totalHours <= 12) {
    multiplier = 12;
  } else {
    const days = Math.ceil(totalHours / 24);
    multiplier = days * 24;
  }

  return pricePerHour * multiplier;
};

/**
 * Format thời gian thuê để hiển thị
 */
export const formatRentalDuration = (totalHours) => {
  if (!totalHours || totalHours < 0) return "Không hợp lệ";

  if (totalHours < 24) {
    return `${totalHours} giờ`;
  }

  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;

  if (hours === 0) {
    return `${days} ngày`;
  }

  return `${days} ngày ${hours} giờ`;
};

/**
 * Chuẩn hóa search data trước khi lưu
 */
export const normalizeSearchData = (form) => {
  const pickup = new Date(`${form.pickupDate}T${form.pickupTime}`);
  const returnD = new Date(`${form.returnDate}T${form.returnTime}`);
  
  const totalHours = differenceInHours(returnD, pickup);
  const totalDays = Math.floor(totalHours / 24);
  const remainHours = totalHours % 24;

  return {
    location: form.location || "",
    locationData: form.locationData || null,
    pickupDate: form.pickupDate,
    pickupTime: form.pickupTime,
    returnDate: form.returnDate,
    returnTime: form.returnTime,
    pickupFull: `${form.pickupDate} ${form.pickupTime}`,
    returnFull: `${form.returnDate} ${form.returnTime}`,
    totalHours,
    totalDays,
    remainHours,
    timestamp: new Date().toISOString()
  };
};

/**
 * Kiểm tra xem có thể sửa search data không
 */
export const canModifySearch = (searchData) => {
  if (!searchData) return true;
  
  const pickup = new Date(searchData.pickupFull);
  const now = new Date();
  
  // Không thể sửa nếu thời gian nhận xe đã quá gần (< 1 giờ)
  const hoursUntilPickup = differenceInHours(pickup, now);
  return hoursUntilPickup >= 1;
};

/**
 * Suggest thời gian mặc định thông minh
 */
export const getSuggestedTimes = () => {
  const now = new Date();
  const currentHour = now.getHours();
  
  // Nếu là buổi sáng (6-11h), suggest thuê cả ngày
  if (currentHour >= 6 && currentHour < 11) {
    return {
      duration: 24,
      label: "Thuê cả ngày"
    };
  }
  
  // Nếu là buổi chiều (11-17h), suggest thuê nửa ngày
  if (currentHour >= 11 && currentHour < 17) {
    return {
      duration: 12,
      label: "Thuê nửa ngày"
    };
  }
  
  // Nếu là tối/đêm, suggest thuê qua đêm
  return {
    duration: 52,
    label: "Thuê qua đêm"
  };
};

export default {
  SEARCH_RULES,
  validatePickupTime,
  validateReturnTime,
  validateSearchForm,
  calculateEstimatedPrice,
  formatRentalDuration,
  normalizeSearchData,
  canModifySearch,
  getSuggestedTimes
};