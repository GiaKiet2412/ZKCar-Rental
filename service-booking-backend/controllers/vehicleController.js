import Vehicle from '../models/Vehicle.js';
import Brand from "../models/Brand.js";
import Booking from '../models/Booking.js';
import fs from 'fs';
import path from 'path';

const deleteImageFile = (imagePath) => {
  if (imagePath && imagePath.startsWith('/uploads/vehicles/')) {
    const fullPath = path.join(path.resolve(), imagePath);
    fs.unlink(fullPath, (err) => {
      if (err) console.error('Lỗi xóa file ảnh:', err);
      else console.log('Đã xóa file ảnh:', fullPath);
    });
  }
};

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

// Lấy danh sách xe với sắp xếp thông minh
export const getVehicles = async (req, res) => {
  try {
    const { 
      brand, 
      seats, 
      fuelType, 
      transmission, 
      sort,
      pickupDate,
      returnDate,
      location,
      minPrice,
      maxPrice
    } = req.query;
    
    const query = {};

    if (brand) query.brand = { $in: brand.split(",") };
    if (seats) query.seats = { $in: seats.split(",").map(Number) };
    if (fuelType) {
      query.fuelType = { 
        $in: fuelType.split(",").map(f => 
          new RegExp(`^${f}$`, 'i')
        ) 
      };
    }
    if (transmission) {
      query.transmission = { 
        $in: transmission.split(",").map(t => 
          new RegExp(`^${t}$`, 'i')
        ) 
      };
    }
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.pricePerHour = {};
      if (minPrice) query.pricePerHour.$gte = Number(minPrice);
      if (maxPrice) query.pricePerHour.$lte = Number(maxPrice);
    }

    let vehicles = await Vehicle.find(query).lean();

    // Nếu có pickupDate và returnDate, tính toán availability status
    if (pickupDate && returnDate) {
      const pickup = new Date(pickupDate);
      const returnD = new Date(returnDate);

      // Lấy tất cả bookings trong khoảng thời gian
      const allBookings = await Booking.find({
        vehicle: { $in: vehicles.map(v => v._id) },
        status: { $in: ['pending', 'confirmed', 'ongoing'] },
        paymentStatus: 'paid',
        $or: [
          { pickupDate: { $lte: returnD }, returnDate: { $gte: pickup } }
        ]
      }).lean();

      // Map bookings theo vehicle
      const bookingsByVehicle = {};
      allBookings.forEach(booking => {
        const vehicleId = booking.vehicle.toString();
        if (!bookingsByVehicle[vehicleId]) {
          bookingsByVehicle[vehicleId] = [];
        }
        bookingsByVehicle[vehicleId].push(booking);
      });

      // Tính toán status cho mỗi xe
      vehicles = vehicles.map(vehicle => {
        const vehicleId = vehicle._id.toString();
        const vehicleBookings = bookingsByVehicle[vehicleId] || [];
        
        let availabilityStatus = 'available';
        let nextAvailableTime = null;
        let currentBookingEnd = null;

        if (vehicleBookings.length > 0) {
          // Kiểm tra xem có conflict không
          const hasConflict = vehicleBookings.some(booking => {
            const bookingStart = new Date(booking.pickupDate);
            const bookingEnd = new Date(booking.returnDate);
            return !(returnD <= bookingStart || pickup >= bookingEnd);
          });

          if (hasConflict) {
            availabilityStatus = 'booked';
            // Tìm thời gian trống tiếp theo
            const sortedBookings = vehicleBookings.sort((a, b) => 
              new Date(a.returnDate) - new Date(b.returnDate)
            );
            nextAvailableTime = new Date(sortedBookings[0].returnDate);
          } else {
            // Xe trống nhưng có booking gần
            const upcomingBooking = vehicleBookings
              .filter(b => new Date(b.pickupDate) > returnD)
              .sort((a, b) => new Date(a.pickupDate) - new Date(b.pickupDate))[0];
            
            if (upcomingBooking) {
              availabilityStatus = 'available_with_upcoming';
              nextAvailableTime = new Date(upcomingBooking.pickupDate);
            }

            // Kiểm tra xe sắp trả (trong vòng 6 giờ)
            const recentReturn = vehicleBookings
              .filter(b => {
                const returnTime = new Date(b.returnDate);
                return returnTime < pickup && 
                       (pickup - returnTime) / (1000 * 60 * 60) <= 6;
              })
              .sort((a, b) => new Date(b.returnDate) - new Date(a.returnDate))[0];
            
            if (recentReturn) {
              availabilityStatus = 'soon_available';
              currentBookingEnd = new Date(recentReturn.returnDate);
            }
          }
        }

        return {
          ...vehicle,
          availabilityStatus,
          nextAvailableTime,
          currentBookingEnd,
          sortPriority: getSortPriority(availabilityStatus)
        };
      });

      // Sắp xếp theo độ ưu tiên availability
      vehicles.sort((a, b) => {
        if (a.sortPriority !== b.sortPriority) {
          return a.sortPriority - b.sortPriority;
        }
        // Nếu cùng priority, sắp xếp theo giá
        return a.pricePerHour - b.pricePerHour;
      });
    }

    // Áp dụng sắp xếp theo giá nếu được yêu cầu
    if (sort === "asc") {
      vehicles.sort((a, b) => a.pricePerHour - b.pricePerHour);
    } else if (sort === "desc") {
      vehicles.sort((a, b) => b.pricePerHour - a.pricePerHour);
    }

    res.json(vehicles);
  } catch (err) {
    console.error('Lỗi lấy danh sách xe:', err);
    res.status(500).json({ message: "Không thể lấy danh sách xe", error: err.message });
  }
};

// Hàm xác định độ ưu tiên sắp xếp
const getSortPriority = (status) => {
  switch (status) {
    case 'available': return 1;
    case 'soon_available': return 2;
    case 'available_with_upcoming': return 3;
    case 'booked': return 4;
    default: return 5;
  }
};

export const getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ message: 'Không tìm thấy xe' });
    res.json(vehicle);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

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

export const deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ message: 'Không tìm thấy xe' });

    if (vehicle.images && vehicle.images.length > 0) {
      vehicle.images.forEach(deleteImageFile);
    }

    await Vehicle.findByIdAndDelete(req.params.id);
    res.json({ message: 'Đã xóa xe thành công' });
  } catch (err) {
    res.status(500).json({ message: 'Không thể xóa xe', error: err.message });
  }
};

export const getBookedSlots = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    const query = {
      vehicle: id,
      status: { $in: ['pending', 'confirmed', 'ongoing'] },
      paymentStatus: 'paid'
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

    const conflictingBooking = await Booking.findOne({
      vehicle: id,
      status: { $in: ['pending', 'confirmed', 'ongoing'] },
      paymentStatus: 'paid',
      $or: [
        {
          pickupDate: { $lte: pickup },
          returnDate: { $gte: pickup }
        },
        {
          pickupDate: { $lte: returnD },
          returnDate: { $gte: returnD }
        },
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

// API mới: Lấy danh sách hãng xe từ database
export const getBrands = async (req, res) => {
  try {
    const brands = await Brand.find().sort({ name: 1 }).lean();
    res.json(brands);
  } catch (err) {
    console.error('Lỗi lấy danh sách hãng:', err);
    res.status(500).json({ message: "Không thể lấy danh sách hãng xe", error: err.message });
  }
};

// API mới: Lấy filter options từ database
export const getFilterOptions = async (req, res) => {
  try {
    const [brands, seats, transmissions, fuelTypes] = await Promise.all([
      Vehicle.distinct('brand'),
      Vehicle.distinct('seats'),
      Vehicle.distinct('transmission'),
      Vehicle.distinct('fuelType')
    ]);

    // Chuẩn hóa dữ liệu: loại bỏ trùng lặp case-insensitive
    const normalizeAndUnique = (arr) => {
      const normalized = {};
      arr.forEach(item => {
        if (item) {
          const key = item.toLowerCase();
          // Lưu version capitalize
          if (!normalized[key]) {
            normalized[key] = item.charAt(0).toUpperCase() + item.slice(1).toLowerCase();
          }
        }
      });
      return Object.values(normalized).sort();
    };

    res.json({
      brands: brands.filter(Boolean).sort(),
      seats: seats.filter(Boolean).sort((a, b) => a - b),
      transmissions: normalizeAndUnique(transmissions),
      fuelTypes: normalizeAndUnique(fuelTypes)
    });
  } catch (err) {
    console.error('Lỗi lấy filter options:', err);
    res.status(500).json({ message: "Không thể lấy filter options", error: err.message });
  }
};

// API mới: Lấy price range
export const getPriceRange = async (req, res) => {
  try {
    const result = await Vehicle.aggregate([
      { $match: { isAvailable: true } },
      {
        $group: {
          _id: null,
          minPrice: { $min: "$pricePerHour" },
          maxPrice: { $max: "$pricePerHour" },
          avgPrice: { $avg: "$pricePerHour" }
        }
      }
    ]);

    if (result.length === 0) {
      return res.json({
        minPrice: 0,
        maxPrice: 1000000,
        avgPrice: 300000
      });
    }

    res.json({
      minPrice: Math.floor(result[0].minPrice / 10000) * 10000, // Làm tròn xuống 10k
      maxPrice: Math.ceil(result[0].maxPrice / 10000) * 10000, // Làm tròn lên 10k
      avgPrice: Math.round(result[0].avgPrice / 10000) * 10000
    });
  } catch (err) {
    console.error('Lỗi lấy price range:', err);
    res.status(500).json({ message: "Không thể lấy price range", error: err.message });
  }
};