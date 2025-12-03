import Vehicle from '../models/Vehicle.js';
import Brand from "../models/Brand.js";
import Booking from '../models/Booking.js';
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

//Lấy các khung giờ xe đã được đặt
export const getBookedSlots = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    // Tìm tất cả booking của xe trong khoảng thời gian
    const query = {
      vehicle: id,
      status: { $in: ['pending', 'confirmed', 'ongoing'] }, // Chỉ lấy booking còn hiệu lực
      paymentStatus: 'paid' // Chỉ lấy booking đã thanh toán
    };

    if (startDate) {
      query.returnDate = { $gte: new Date(startDate) };
    }
    if (endDate) {
      query.pickupDate = { $lte: new Date(endDate) };
    }

    const bookings = await Booking.find(query)
      .select('pickupDate returnDate status')
      .sort({ pickupDate: 1 });

    // Format kết quả
    const bookedSlots = bookings.map(booking => ({
      start: booking.pickupDate,
      end: booking.returnDate,
      status: booking.status
    }));

    res.json({
      success: true,
      bookedSlots
    });
  } catch (err) {
    console.error('Error getting booked slots:', err);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin lịch đặt xe'
    });
  }
};

//Kiểm tra xe có available trong khoảng thời gian không
export const checkAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { pickupDate, returnDate } = req.body;

    if (!pickupDate || !returnDate) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp thời gian nhận và trả xe'
      });
    }

    const pickup = new Date(pickupDate);
    const returnD = new Date(returnDate);

    // Kiểm tra có booking nào trùng không
    const conflictingBooking = await Booking.findOne({
      vehicle: id,
      status: { $in: ['pending', 'confirmed', 'ongoing'] },
      paymentStatus: 'paid',
      $or: [
        // Trường hợp 1: Pickup mới nằm trong booking cũ
        {
          pickupDate: { $lte: pickup },
          returnDate: { $gte: pickup }
        },
        // Trường hợp 2: Return mới nằm trong booking cũ
        {
          pickupDate: { $lte: returnD },
          returnDate: { $gte: returnD }
        },
        // Trường hợp 3: Booking mới bao trùm booking cũ
        {
          pickupDate: { $gte: pickup },
          returnDate: { $lte: returnD }
        }
      ]
    });

    if (conflictingBooking) {
      return res.json({
        success: false,
        available: false,
        message: 'Xe đã được đặt trong khung giờ này',
        conflictingBooking: {
          pickupDate: conflictingBooking.pickupDate,
          returnDate: conflictingBooking.returnDate
        }
      });
    }

    res.json({
      success: true,
      available: true,
      message: 'Xe có thể đặt trong khung giờ này'
    });
  } catch (err) {
    console.error('Error checking availability:', err);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi kiểm tra tình trạng xe'
    });
  }
};