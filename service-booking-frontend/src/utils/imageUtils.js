/**
 * Get full image URL - tất cả image mới đều phải là Cloudinary URL
 * @param {string} imagePath - Path từ backend (phải là Cloudinary URL)
 * @returns {string} Full URL
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) return '/no-image.png';
  
  // Tất cả ảnh mới phải là Cloudinary URL đầy đủ
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // LEGACY DATA: Chỉ hỗ trợ local path cho data cũ (sẽ được migrate dần)
  if (imagePath.startsWith('/uploads/')) {
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    console.warn('Legacy local image detected (cần migrate):', imagePath);
    return `${apiUrl}${imagePath}`;
  }
  
  // Fallback: Nếu không phải format nào trên, log error và dùng placeholder
  console.error('Invalid image path format:', imagePath);
  return '/no-image.png';
};

/**
 * Get multiple image URLs
 * @param {Array<string>} imagePaths 
 * @returns {Array<string>}
 */
export const getImageUrls = (imagePaths) => {
  if (!Array.isArray(imagePaths)) return [];
  return imagePaths.map(getImageUrl);
};

/**
 * Kiểm tra xem có phải Cloudinary URL không
 * @param {string} url 
 * @returns {boolean}
 */
export const isCloudinaryUrl = (url) => {
  return url && url.includes('cloudinary.com');
};

/**
 * Kiểm tra xem có phải legacy local URL không
 * @param {string} url 
 * @returns {boolean}
 */
export const isLegacyLocalUrl = (url) => {
  return url && (url.startsWith('/uploads/') || url.includes('localhost:5000/uploads/'));
};