import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { createVehicle, getVehicles, getVehicleById, updateVehicle, deleteVehicle, getBookedSlots, checkAvailability,} from '../controllers/vehicleController.js';
import { protect, checkRole } from '../middleware/authMiddleware.js';
import Vehicle from '../models/Vehicle.js';
import Brand from "../models/Brand.js";

const router = express.Router();

// Tạo thư mục uploads nếu chưa có
const dirPath = path.join(path.resolve(), 'uploads/vehicles');
if (!fs.existsSync(dirPath)) {
  fs.mkdirSync(dirPath, { recursive: true });
}

// Admin: Quản lý xe
router.post('/', protect, checkRole('admin'), createVehicle);
router.put('/:id', protect, checkRole('admin'), updateVehicle);
router.delete('/:id', protect, checkRole('admin'), deleteVehicle);

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/vehicles/');
  },
  filename(req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// FIX: Bảo vệ route upload với auth
router.post('/upload', protect, checkRole('admin'), upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Không có file nào được tải lên' });
    }
    res.json({ imageUrl: `/uploads/vehicles/${req.file.filename}` });
  } catch (error) {
    console.error('Lỗi upload:', error);
    res.status(500).json({ message: 'Lỗi server khi upload ảnh' });
  }
});

// FIX: Bảo vệ route lấy danh sách ảnh
router.get('/images', protect, checkRole('admin'), (req, res) => {
  try {
    fs.readdir(dirPath, (err, files) => {
      if (err) {
        console.error('Lỗi đọc thư mục:', err);
        return res.status(500).json({ message: 'Không thể đọc thư mục' });
      }
      const imageUrls = files
        .filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file)) // Chỉ lấy file ảnh
        .map(file => `/uploads/vehicles/${file}`);
      res.json(imageUrls);
    });
  } catch (error) {
    console.error('Lỗi server:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Route cleanup ảnh không sử dụng
router.delete('/cleanup-unused-images', protect, checkRole('admin'), async (req, res) => {
  try {
    const vehicles = await Vehicle.find({}, 'images'); // đổi sang images
    const usedImages = vehicles
      .flatMap(v => v.images || [])
      .filter(img => img && img.startsWith('/uploads/vehicles/'))
      .map(img => img.replace('/uploads/vehicles/', ''));

    const files = fs.readdirSync(dirPath)
      .filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file));

    const unusedFiles = files.filter(file => !usedImages.includes(file));

    unusedFiles.forEach(file => fs.unlinkSync(path.join(dirPath, file)));

    res.json({ message: `Đã xóa ${unusedFiles.length} file ảnh không dùng`, deletedFiles: unusedFiles });
  } catch (error) {
    console.error('Lỗi cleanup:', error);
    res.status(500).json({ message: 'Lỗi server khi cleanup' });
  }
});

router.get("/brands", async (req, res) => {
  try {
    const brands = await Brand.find({}).sort({ name: 1 });
    res.json(brands.map((b) => b.name));
  } catch (error) {
    console.error("Lỗi lấy danh sách hãng:", error);
    res.status(500).json({ message: "Không thể lấy danh sách hãng" });
  }
});

// Public: Xem danh sách & chi tiết
router.get('/', getVehicles);
router.get('/:id', getVehicleById);
router.get('/:id/booked-slots', getBookedSlots);
router.post('/:id/check-availability', checkAvailability);

export default router;