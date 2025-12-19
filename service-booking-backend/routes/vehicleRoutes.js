import express from 'express';
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
import { upload } from '../config/cloudinary.js';

const router = express.Router();

// ==================== PUBLIC ROUTES ====================

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

// Upload single image to Cloudinary
router.post('/upload', protect, checkRole('admin'), upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'Không có file nào được tải lên' 
      });
    }

    // req.file.path là secure_url từ Cloudinary
    res.json({ 
      success: true,
      imageUrl: req.file.path, // Full URL: https://res.cloudinary.com/...
      publicId: req.file.filename // Public ID để xóa sau này
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

// CRUD operations
router.post('/', protect, checkRole('admin'), createVehicle);
router.put('/:id', protect, checkRole('admin'), updateVehicle);
router.delete('/:id', protect, checkRole('admin'), deleteVehicle);

export default router;