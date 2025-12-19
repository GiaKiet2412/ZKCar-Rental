import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cấu hình Cloudinary Storage cho Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'zkcar-vehicles', // Tên folder trên Cloudinary
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [
      { width: 1200, height: 800, crop: 'limit' }, // Resize để tối ưu
      { quality: 'auto' } // Tự động tối ưu chất lượng
    ],
  },
});

// File filter để chỉ chấp nhận ảnh
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(file.originalname.toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Chỉ chấp nhận file ảnh (jpeg, jpg, png, gif, webp)'));
};

// Cấu hình Multer với Cloudinary Storage
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { 
    fileSize: 10 * 1024 * 1024 // 10MB (Cloudinary free plan cho phép 10MB/file)
  }
});

// Export cloudinary để sử dụng cho việc xóa ảnh
export default cloudinary;