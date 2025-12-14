import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { 
  createVehicle, 
  getVehicles, 
  getVehicleById, 
  updateVehicle, 
  deleteVehicle, 
  getBookedSlots, 
  checkAvailability, 
  getBrands, 
  getFilterOptions,
  getPriceRange
} from '../controllers/vehicleController.js';
import { protect, checkRole } from '../middleware/authMiddleware.js';
import Vehicle from '../models/Vehicle.js';

const router = express.Router();

// Tạo thư mục uploads nếu chưa có
const dirPath = path.join(path.resolve(), 'uploads/vehicles');
if (!fs.existsSync(dirPath)) {
  fs.mkdirSync(dirPath, { recursive: true });
}

// Cấu hình multer
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/vehicles/');
  },
  filename(req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Chỉ chấp nhận file ảnh (jpeg, jpg, png, gif, webp)'));
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// ==================== PUBLIC ROUTES ====================
// Lưu ý: Đặt routes cụ thể trước routes có params động

// Lấy filter options
router.get('/filter-options', getFilterOptions);

// Lấy price range
router.get('/price-range', getPriceRange);

// Lấy danh sách brands
router.get('/brands', getBrands);

// Lấy danh sách xe (có thể filter)
router.get('/', getVehicles);

// Lấy booked slots của xe
router.get('/:id/booked-slots', getBookedSlots);

// Check availability
router.post('/:id/check-availability', checkAvailability);

// Lấy chi tiết xe
router.get('/:id', getVehicleById);

// ==================== ADMIN ROUTES ====================

// Upload single image
router.post('/upload', protect, checkRole('admin'), upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'Không có file nào được tải lên' 
      });
    }
    res.json({ 
      success: true,
      imageUrl: `/uploads/vehicles/${req.file.filename}` 
    });
  } catch (error) {
    console.error('Lỗi upload:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi server khi upload ảnh',
      error: error.message 
    });
  }
});

// Lấy danh sách ảnh trong thư mục
router.get('/images/list', protect, checkRole('admin'), (req, res) => {
  try {
    fs.readdir(dirPath, (err, files) => {
      if (err) {
        console.error('Lỗi đọc thư mục:', err);
        return res.status(500).json({ 
          success: false,
          message: 'Không thể đọc thư mục' 
        });
      }
      const imageUrls = files
        .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
        .map(file => ({
          url: `/uploads/vehicles/${file}`,
          filename: file,
          size: fs.statSync(path.join(dirPath, file)).size
        }))
        .sort((a, b) => b.filename.localeCompare(a.filename)); // Mới nhất trước
      
      res.json({
        success: true,
        images: imageUrls,
        total: imageUrls.length
      });
    });
  } catch (error) {
    console.error('Lỗi server:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi server',
      error: error.message 
    });
  }
});

// Cleanup ảnh không sử dụng
router.delete('/images/cleanup', protect, checkRole('admin'), async (req, res) => {
  try {
    const vehicles = await Vehicle.find({}, 'images');
    const usedImages = vehicles
      .flatMap(v => v.images || [])
      .filter(img => img && img.startsWith('/uploads/vehicles/'))
      .map(img => img.replace('/uploads/vehicles/', ''));

    const files = fs.readdirSync(dirPath)
      .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file));

    const unusedFiles = files.filter(file => !usedImages.includes(file));

    let deletedCount = 0;
    const errors = [];

    unusedFiles.forEach(file => {
      try {
        fs.unlinkSync(path.join(dirPath, file));
        deletedCount++;
      } catch (err) {
        errors.push({ file, error: err.message });
      }
    });

    res.json({ 
      success: true,
      message: `Đã xóa ${deletedCount}/${unusedFiles.length} file ảnh không dùng`,
      deletedCount,
      totalUnused: unusedFiles.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Lỗi cleanup:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi server khi cleanup',
      error: error.message 
    });
  }
});

// CRUD operations
router.post('/', protect, checkRole('admin'), createVehicle);
router.put('/:id', protect, checkRole('admin'), updateVehicle);
router.delete('/:id', protect, checkRole('admin'), deleteVehicle);

export default router;