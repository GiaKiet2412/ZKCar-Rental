/**
 * Get full image URL from relative path or Cloudinary URL
 * @param {string} imagePath - Path từ backend (local hoặc Cloudinary URL)
 * @returns {string} Full URL
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) return '/no-image.png';
  
  // Nếu đã là URL đầy đủ (Cloudinary hoặc HTTP), return luôn
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Nếu là local path (legacy data chưa migrate)
  if (imagePath.startsWith('/uploads/')) {
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    return `${apiUrl}${imagePath}`;
  }
  
  // Fallback: coi như là Cloudinary URL không có protocol
  return imagePath;
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