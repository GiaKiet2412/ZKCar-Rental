import Vehicle from '../models/Vehicle.js';
import Brand from "../models/Brand.js";
import fs from 'fs';
import path from 'path';

// Xóa file ảnh
const deleteImageFile = (imagePath) => {
  if (imagePath && imagePath.startsWith('/uploads/vehicles/')) {
    const fullPath = path.join(path.resolve(), imagePath);
    fs.unlink(fullPath, (err) => {
      if (err) console.error('Lỗi xóa file ảnh:', err);
      else console.log('Đã xóa file ảnh:', fullPath);
    });
  }
};

// Tạo xe mới
export const createVehicle = async (req, res) => {
  try {
    if (req.body.images && !Array.isArray(req.body.images)) {
      req.body.images = [req.body.images];
    }

    if (req.body.newBrand && req.body.newBrand.trim() !== "") {
      const brandName = req.body.newBrand.trim().toUpperCase();
      const existingBrand = await Brand.findOne({ name: brandName });
      if (!existingBrand) {
        await Brand.create({ name: brandName });
      }
      req.body.brand = brandName;
      delete req.body.newBrand;
    }

    const newVehicle = await Vehicle.create(req.body);
    res.status(201).json(newVehicle);
  } catch (error) {
    console.error('Lỗi tạo xe:', error);
    res.status(400).json({
      message: 'Không thể tạo xe',
      error: error.message,
    });
  }
};

// Lấy danh sách xe
export const getVehicles = async (req, res) => {
  try {
    const { brand, seats, fuelType, transmission, sort } = req.query;
    const query = {};

    if (brand) query.brand = { $in: brand.split(",") };
    if (seats) query.seats = { $in: seats.split(",").map(Number) };
    if (fuelType) query.fuelType = { $in: fuelType.split(",") };
    if (transmission) query.transmission = { $in: transmission.split(",") };

    let vehicles = Vehicle.find(query);

    if (sort === "asc") vehicles = vehicles.sort({ pricePerHour: 1 });
    if (sort === "desc") vehicles = vehicles.sort({ pricePerHour: -1 });

    const result = await vehicles;
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Không thể lấy danh sách xe", error: err.message });
  }
};

// Lấy chi tiết xe
export const getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ message: 'Không tìm thấy xe' });
    res.json(vehicle);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// Cập nhật xe
export const updateVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ message: 'Không tìm thấy xe' });

    if (req.body.images && Array.isArray(req.body.images)) {
      const oldImages = vehicle.images || [];
      const newImages = req.body.images;
      const removedImages = oldImages.filter(img => !newImages.includes(img));
      removedImages.forEach(deleteImageFile);
    }

    if (req.body.newBrand && req.body.newBrand.trim() !== "") {
      const brandName = req.body.newBrand.trim().toUpperCase();
      const existingBrand = await Brand.findOne({ name: brandName });
      if (!existingBrand) {
        await Brand.create({ name: brandName });
      }
      req.body.brand = brandName;
      delete req.body.newBrand;
    }
    
    const updated = await Vehicle.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json(updated);
  } catch (err) {
    console.error('Lỗi cập nhật xe:', err);
    res.status(400).json({ message: 'Không thể cập nhật xe', error: err.message });
  }
};

// Xóa xe + ảnh
export const deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ message: 'Không tìm thấy xe' });

    // Xóa tất cả ảnh liên quan
    if (vehicle.images && vehicle.images.length > 0) {
      vehicle.images.forEach(deleteImageFile);
    }

    await Vehicle.findByIdAndDelete(req.params.id);
    res.json({ message: 'Đã xóa xe thành công' });
  } catch (err) {
    res.status(500).json({ message: 'Không thể xóa xe', error: err.message });
  }
};