import Vehicle from '../models/Vehicle.js';
import Brand from "../models/Brand.js";
import Booking from '../models/Booking.js';
import cloudinary from '../config/cloudinary.js';

// Helper: Xóa ảnh trên Cloudinary
const deleteCloudinaryImage = async (imageUrl) => {
  try {
    if (!imageUrl) return;

    // Chỉ xóa nếu là URL Cloudinary
    if (imageUrl.includes('cloudinary.com')) {
      // Extract public_id từ URL
      // Format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{folder}/{public_id}.{format}
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1]; // filename.ext
      const folder = urlParts[urlParts.length - 2]; // folder name
      const publicId = `${folder}/${fileName.split('.')[0]}`; // folder/filename

      await cloudinary.uploader.destroy(publicId);
      console.log('Đã xóa ảnh trên Cloudinary:', publicId);
    } else {
      console.log('Bỏ qua xóa ảnh local (sẽ migrate sau):', imageUrl);
    }
  } catch (err) {
    console.error('Lỗi xóa ảnh Cloudinary:', err);
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
    const vehicleResponse = newVehicle.toObject();
    
    res.status(201).json(vehicleResponse);
  } catch (error) {
    console.error('Lỗi tạo xe:', error);
    res.status(400).json({
      message: 'Không thể tạo xe',
      error: error.message,
    });
  }
};

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

    if (minPrice || maxPrice) {
      query.pricePerHour = {};
      if (minPrice) query.pricePerHour.$gte = Number(minPrice);
      if (maxPrice) query.pricePerHour.$lte = Number(maxPrice);
    }

    let vehicles = await Vehicle.find(query).lean();

    if (pickupDate && returnDate) {
      const pickup = new Date(pickupDate);
      const returnD = new Date(returnDate);

      const BUFFER_HOURS = 1;
      const pickupWithBuffer = new Date(pickup.getTime() - BUFFER_HOURS * 60 * 60 * 1000);
      const returnWithBuffer = new Date(returnD.getTime() + BUFFER_HOURS * 60 * 60 * 1000);

      const allBookings = await Booking.find({
        vehicle: { $in: vehicles.map(v => v._id) },
        status: { $in: ['pending', 'confirmed', 'ongoing'] },
        paymentStatus: 'paid',
        $or: [
          { pickupDate: { $lte: returnWithBuffer }, returnDate: { $gte: pickupWithBuffer } }
        ]
      }).lean();

      const bookingsByVehicle = {};
      allBookings.forEach(booking => {
        const vehicleId = booking.vehicle.toString();
        if (!bookingsByVehicle[vehicleId]) {
          bookingsByVehicle[vehicleId] = [];
        }
        bookingsByVehicle[vehicleId].push(booking);
      });

      vehicles = vehicles.map(vehicle => {
        const vehicleId = vehicle._id.toString();
        const vehicleBookings = bookingsByVehicle[vehicleId] || [];
        
        let availabilityStatus = 'available';
        let nextAvailableTime = null;
        let currentBookingEnd = null;

        if (vehicleBookings.length > 0) {
          const hasConflict = vehicleBookings.some(booking => {
            const bookingStart = new Date(booking.pickupDate);
            const bookingEnd = new Date(booking.returnDate);
            
            return !(returnWithBuffer <= bookingStart || pickupWithBuffer >= bookingEnd);
          });

          if (hasConflict) {
            availabilityStatus = 'booked';
            const sortedBookings = vehicleBookings.sort((a, b) => 
              new Date(a.returnDate) - new Date(b.returnDate)
            );
            nextAvailableTime = new Date(sortedBookings[0].returnDate);
          } else {
            const upcomingBooking = vehicleBookings
              .filter(b => new Date(b.pickupDate) > returnWithBuffer)
              .sort((a, b) => new Date(a.pickupDate) - new Date(b.pickupDate))[0];
            
            if (upcomingBooking) {
              availabilityStatus = 'available_with_upcoming';
              nextAvailableTime = new Date(upcomingBooking.pickupDate);
            }

            const recentReturn = vehicleBookings
              .filter(b => {
                const returnTime = new Date(b.returnDate);
                return returnTime < pickupWithBuffer && 
                       (pickupWithBuffer - returnTime) / (1000 * 60 * 60) <= 6;
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

      vehicles.sort((a, b) => {
        if (a.sortPriority !== b.sortPriority) {
          return a.sortPriority - b.sortPriority;
        }
        return a.pricePerHour - b.pricePerHour;
      });
    }

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
    const vehicle = await Vehicle.findById(req.params.id).lean();
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

    // Xóa ảnh cũ trên Cloudinary nếu có ảnh bị remove
    if (req.body.images && Array.isArray(req.body.images)) {
      const oldImages = vehicle.images || [];
      const newImages = req.body.images;
      const removedImages = oldImages.filter(img => !newImages.includes(img));
      
      // Xóa ảnh cũ (chỉ Cloudinary, bỏ qua local)
      for (const img of removedImages) {
        await deleteCloudinaryImage(img);
      }
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
    }).lean();

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

    // Xóa tất cả ảnh trên Cloudinary
    if (vehicle.images && vehicle.images.length > 0) {
      for (const img of vehicle.images) {
        await deleteCloudinaryImage(img);
      }
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

    const BUFFER_HOURS = 1;
    const pickupWithBuffer = new Date(pickup.getTime() - BUFFER_HOURS * 60 * 60 * 1000);
    const returnWithBuffer = new Date(returnD.getTime() + BUFFER_HOURS * 60 * 60 * 1000);

    const conflictingBooking = await Booking.findOne({
      vehicle: id,
      status: { $in: ['pending', 'confirmed', 'ongoing'] },
      paymentStatus: 'paid',
      $or: [
        {
          pickupDate: { $lte: pickupWithBuffer },
          returnDate: { $gte: pickupWithBuffer }
        },
        {
          pickupDate: { $lte: returnWithBuffer },
          returnDate: { $gte: returnWithBuffer }
        },
        {
          pickupDate: { $gte: pickupWithBuffer },
          returnDate: { $lte: returnWithBuffer }
        }
      ]
    });

    if (conflictingBooking) {
      return res.json({
        success: false,
        available: false,
        message: 'Xe đã được đặt trong khung giờ này (bao gồm buffer 1 giờ)',
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

export const getBrands = async (req, res) => {
  try {
    const brands = await Brand.find().sort({ name: 1 }).lean();
    res.json(brands);
  } catch (err) {
    console.error('Lỗi lấy danh sách hãng:', err);
    res.status(500).json({ message: "Không thể lấy danh sách hãng xe", error: err.message });
  }
};

export const getFilterOptions = async (req, res) => {
  try {
    const [brands, seats, transmissions, fuelTypes] = await Promise.all([
      Vehicle.distinct('brand'),
      Vehicle.distinct('seats'),
      Vehicle.distinct('transmission'),
      Vehicle.distinct('fuelType')
    ]);

    const normalizeAndUnique = (arr) => {
      const normalized = {};
      arr.forEach(item => {
        if (item) {
          const key = item.toLowerCase();
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
      minPrice: Math.floor(result[0].minPrice / 10000) * 10000,
      maxPrice: Math.ceil(result[0].maxPrice / 10000) * 10000,
      avgPrice: Math.round(result[0].avgPrice / 10000) * 10000
    });
  } catch (err) {
    console.error('Lỗi lấy price range:', err);
    res.status(500).json({ message: "Không thể lấy price range", error: err.message });
  }
};