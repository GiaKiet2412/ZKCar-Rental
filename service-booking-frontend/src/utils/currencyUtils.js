/**
 * Format số tiền thành chuỗi VNĐ
 * @param {number} amount - Số tiền cần format
 * @param {object} options - Tùy chọn format
 * @returns {string} Chuỗi đã format
 */
export const formatCurrency = (amount, options = {}) => {
  const {
    showUnit = true,
    decimals = 0,
    compact = false
  } = options;

  if (!amount && amount !== 0) return '';

  let formatted;

  if (compact) {
    // Compact format: 1.5tr, 500k, etc.
    if (amount >= 1000000) {
      formatted = (amount / 1000000).toFixed(decimals) + 'tr';
    } else if (amount >= 1000) {
      formatted = (amount / 1000).toFixed(decimals) + 'k';
    } else {
      formatted = amount.toFixed(decimals);
    }
  } else {
    // Full format: 1.500.000
    formatted = amount.toLocaleString('vi-VN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  return showUnit ? `${formatted} VNĐ` : formatted;
};

/**
 * Format giá theo giờ/ngày
 */
export const formatPricePerPeriod = (pricePerHour, hours) => {
  let amount, period;

  if (hours <= 8) {
    amount = pricePerHour * 8;
    period = '8h';
  } else if (hours <= 12) {
    amount = pricePerHour * 12;
    period = '12h';
  } else {
    const days = Math.ceil(hours / 24);
    amount = pricePerHour * 24 * days;
    period = days === 1 ? 'ngày' : `${days} ngày`;
  }

  return {
    amount,
    formatted: formatCurrency(amount),
    period,
    display: `${formatCurrency(amount)}/${period}`
  };
};

/**
 * Parse chuỗi tiền tệ thành số
 */
export const parseCurrency = (str) => {
  if (typeof str === 'number') return str;
  if (!str) return 0;

  // Remove all non-digit characters except decimal point
  const cleaned = str.toString().replace(/[^\d.]/g, '');
  return parseFloat(cleaned) || 0;
};

/**
 * Format range giá
 */
export const formatPriceRange = (minPrice, maxPrice, options = {}) => {
  if (!minPrice && !maxPrice) return 'Tất cả mức giá';
  
  const { compact = true } = options;
  
  if (minPrice && !maxPrice) {
    return `Từ ${formatCurrency(minPrice, { compact })}`;
  }
  
  if (!minPrice && maxPrice) {
    return `Đến ${formatCurrency(maxPrice, { compact })}`;
  }
  
  return `${formatCurrency(minPrice, { compact, showUnit: false })} - ${formatCurrency(maxPrice, { compact })}`;
};

/**
 * Làm tròn giá theo step
 */
export const roundPrice = (price, step = 10000) => {
  return Math.round(price / step) * step;
};

/**
 * Tính % giảm giá
 */
export const calculateDiscount = (originalPrice, discountedPrice) => {
  if (!originalPrice || !discountedPrice) return 0;
  const discount = ((originalPrice - discountedPrice) / originalPrice) * 100;
  return Math.round(discount);
};

/**
 * Format discount percentage
 */
export const formatDiscount = (originalPrice, discountedPrice) => {
  const percent = calculateDiscount(originalPrice, discountedPrice);
  return percent > 0 ? `-${percent}%` : '';
};

export default {
  formatCurrency,
  formatPricePerPeriod,
  parseCurrency,
  formatPriceRange,
  roundPrice,
  calculateDiscount,
  formatDiscount
};