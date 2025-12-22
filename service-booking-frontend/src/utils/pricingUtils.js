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
 * Làm tròn lên các mốc giờ chuẩn (4h, 8h, 12h, 24h)
 */
export const roundUpToStandardHours = (hours) => {
  if (hours <= 4) return 4;
  if (hours <= 8) return 8;
  if (hours <= 12) return 12;
  if (hours <= 24) return 24;
  // Nếu > 24h thì không làm tròn, giữ nguyên
  return hours;
};

/**
 * Format giá hiển thị trên card xe (LOGIC MỚI)
 * - Nếu có searchData (totalHours):
 *   + <= 4h: hiển thị giá 4h
 *   + 5-8h: hiển thị giá 8h
 *   + 9-12h: hiển thị giá 12h
 *   + 13-24h: hiển thị giá 24h
 *   + > 24h: hiển thị giá theo đúng duration của searchData
 * - Nếu không có searchData: hiển thị 8h và 24h (mặc định)
 */
export const getCardDisplayPrices = (pricePerHour, totalHours = null) => {
  const { price4h, price8h, price12h, price24h } = getFixedPackagePrices(pricePerHour);
  
  // Nếu KHÔNG có totalHours -> hiển thị mặc định 8h và 24h
  if (!totalHours || totalHours <= 0) {
    return {
      primary: { price: price8h, label: '8h' },
      secondary: { price: price24h, label: '24h' }
    };
  }
  
  // Nếu CÓ totalHours từ searchData
  // Làm tròn lên mốc giờ chuẩn nếu <= 24h
  if (totalHours <= 24) {
    const roundedHours = roundUpToStandardHours(totalHours);
    let displayPrice;
    let displayLabel;
    
    switch (roundedHours) {
      case 4:
        displayPrice = price4h;
        displayLabel = '4h';
        break;
      case 8:
        displayPrice = price8h;
        displayLabel = '8h';
        break;
      case 12:
        displayPrice = price12h;
        displayLabel = '12h';
        break;
      case 24:
        displayPrice = price24h;
        displayLabel = '24h';
        break;
      default:
        displayPrice = price24h;
        displayLabel = '24h';
    }
    
    return {
      primary: { price: displayPrice, label: displayLabel },
      secondary: null // Không hiển thị giá phụ
    };
  }
  
  // Nếu > 24h: hiển thị giá theo đúng duration của searchData
  const actualPrice = calculatePriceForHours(pricePerHour, totalHours);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  
  let label = '';
  if (hours === 0) {
    label = `${days} ngày`;
  } else {
    label = `${days} ngày ${hours}h`;
  }
  
  return {
    primary: { price: actualPrice, label: label },
    secondary: null // Không hiển thị giá phụ
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
  getBestPriceSuggestion,
  roundUpToStandardHours
};