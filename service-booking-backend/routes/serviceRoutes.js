import express from 'express';
import {
  createService,
  getAllServices,
  getServiceById,
  updateService,
  deleteService,
} from '../controllers/serviceController.js';
import { protect, checkRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getAllServices);
router.get('/:id', getServiceById);
router.post('/', protect, checkRole('admin'), createService); // sẽ bổ sung kiểm tra admin sau
router.put('/:id', protect, checkRole('admin'), updateService);
router.delete('/:id', protect, checkRole('admin'), deleteService);

export default router;
