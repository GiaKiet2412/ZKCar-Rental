/**
 * Utility functions cho pricing calculation
 */

/**
 * Tính discount rate dựa trên số giờ thuê
 */
export const getDiscountRate = (hours) => {
  if (hours <= 4) return 0;        // 0% - full price
  if (hours <= 8) return 0.3;      // 30% discount
  if (hours <= 12) return 0.4667;  // 46.67% discount
  return 0.6667;                   // 66.67% discount (24h+)
};

/**
 * Tính giá sau discount cho mỗi gói giờ
 */
export const calculatePackagePrice = (pricePerHour, hours) => {
  const discountRate = getDiscountRate(hours);
  const basePrice = pricePerHour * hours;
  const discountedPrice = basePrice * (1 - discountRate);
  
  // Làm tròn đến 500 VNĐ
  return Math.round(discountedPrice / 500) * 500;
};

/**
 * Tính giá cho các gói cố định (4h, 8h, 12h, 24h)
 */
export const getFixedPackagePrices = (pricePerHour) => {
  return {
    price4h: calculatePackagePrice(pricePerHour, 4),
    price8h: calculatePackagePrice(pricePerHour, 8),
    price12h: calculatePackagePrice(pricePerHour, 12),
    price24h: calculatePackagePrice(pricePerHour, 24)
  };
};

/**
 * Tính giá cho số giờ bất kỳ
 */
export const calculatePriceForHours = (pricePerHour, hours) => {
  if (!pricePerHour || !hours || hours <= 0) return 0;
  
  const discountRate = getDiscountRate(hours);
  const basePrice = pricePerHour * hours;
  const finalPrice = basePrice * (1 - discountRate);
  
  // Làm tròn đến 500 VNĐ
  return Math.round(finalPrice / 500) * 500;
};

/**
 * Format giá hiển thị trên card xe
 * Hiển thị 2 mức giá đại diện (thường là 8h và 24h)
 */
export const getCardDisplayPrices = (pricePerHour, totalHours = null) => {
  const { price8h, price24h } = getFixedPackagePrices(pricePerHour);
  
  // Nếu có totalHours từ search, hiển thị giá cho duration đó
  if (totalHours && totalHours > 0) {
    const currentPrice = calculatePriceForHours(pricePerHour, totalHours);
    
    // Nếu duration <= 8h, hiển thị giá 8h
    if (totalHours <= 8) {
      return {
        primary: { price: price8h, label: '8h' },
        secondary: { price: price24h, label: '24h' }
      };
    }
    
    // Nếu duration <= 12h, hiển thị giá hiện tại và 24h
    if (totalHours <= 12) {
      return {
        primary: { price: currentPrice, label: `${totalHours}h` },
        secondary: { price: price24h, label: '24h' }
      };
    }
    
    // Nếu duration > 12h, hiển thị giá hiện tại và per day
    const days = Math.ceil(totalHours / 24);
    return {
      primary: { price: currentPrice, label: `${days} ngày` },
      secondary: { price: price24h, label: '24h' }
    };
  }
  
  // Default: hiển thị 8h và 24h
  return {
    primary: { price: price8h, label: '8h' },
    secondary: { price: price24h, label: '24h' }
  };
};

/**
 * Tính tổng số ngày và giờ lẻ
 */
export const calculateDaysAndHours = (totalHours) => {
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  return { days, hours };
};

/**
 * Format label hiển thị duration
 */
export const formatDurationLabel = (totalHours) => {
  if (!totalHours || totalHours <= 0) return '';
  
  const { days, hours } = calculateDaysAndHours(totalHours);
  
  if (days === 0) return `${hours}h`;
  if (hours === 0) return `${days} ngày`;
  return `${days} ngày ${hours}h`;
};

/**
 * Get best price suggestion (giá tốt nhất cho duration)
 */
export const getBestPriceSuggestion = (pricePerHour, totalHours) => {
  if (!totalHours || totalHours <= 0) {
    return getFixedPackagePrices(pricePerHour);
  }
  
  const currentPrice = calculatePriceForHours(pricePerHour, totalHours);
  const packages = getFixedPackagePrices(pricePerHour);
  
  return {
    ...packages,
    currentPrice,
    currentHours: totalHours,
    currentLabel: formatDurationLabel(totalHours)
  };
};

export default {
  getDiscountRate,
  calculatePackagePrice,
  getFixedPackagePrices,
  calculatePriceForHours,
  getCardDisplayPrices,
  calculateDaysAndHours,
  formatDurationLabel,
  getBestPriceSuggestion
};