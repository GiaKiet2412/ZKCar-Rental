import React, { useState, useEffect } from "react";
import API from "../../api/axios";

const districts = [
  "Quận 1", "Quận 3", "Quận 4", "Quận 5", "Quận 6", "Quận 7", "Quận 8", "Quận 10",
  "Quận 11", "Quận 12", "Quận Bình Thạnh", "Quận Gò Vấp", "Quận Tân Phú",
  "Quận Phú Nhuận", "Quận Tân Bình", "Quận Bình Tân",
  "Huyện Củ Chi", "Huyện Hóc Môn", "Huyện Nhà Bè", "Huyện Bình Chánh",
  "Thành phố Thuận An", "Thành phố Thủ Đức", "Thành phố Dĩ An",
  "Bình Dương", "Thành phố Thủ Dầu Một",
];

const VehicleForm = ({ vehicle, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    pricePerHour: "",
    description: "",
    location: "",
    locationPickUp: "",
    seats: "",
    transmission: "Số tự động",
    fuelType: "Điện",
    isAvailable: true,
    images: [],
  });

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [brands, setBrands] = useState([]);
  const [isOtherBrand, setIsOtherBrand] = useState(false);
  const [newBrand, setNewBrand] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

  // Helper function để lấy tên brand an toàn
  const getBrandName = (brand) => {
    if (!brand) return "";
    if (typeof brand === "object" && brand.name) return brand.name;
    if (typeof brand === "string") return brand;
    return "";
  };

  useEffect(() => {
    if (vehicle) {
      const brandName = getBrandName(vehicle.brand);
      
      setFormData({
        name: vehicle.name || "",
        brand: brandName,
        pricePerHour: vehicle.pricePerHour || "",
        description: vehicle.description || "",
        location: vehicle.location || "",
        locationPickUp: vehicle.locationPickUp || "",
        seats: vehicle.seats || "",
        transmission: vehicle.transmission || "Số tự động",
        fuelType: vehicle.fuelType || "Điện",
        isAvailable: vehicle.isAvailable ?? true,
        images: vehicle.images || [],
      });

      // CRITICAL FIX: Chỉ dùng URL từ DB (đều là Cloudinary URL)
      setPreviewUrls(vehicle.images || []);

      setIsOtherBrand(brandName === "Hãng Khác");
    } else {
      setFormData({
        name: "",
        brand: "",
        pricePerHour: "",
        description: "",
        location: "",
        locationPickUp: "",
        seats: "",
        transmission: "Số tự động",
        fuelType: "Điện",
        isAvailable: true,
        images: [],
      });
      setPreviewUrls([]);
      setSelectedFiles([]);
      setIsOtherBrand(false);
      setNewBrand("");
    }
  }, [vehicle]);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const res = await API.get("/api/vehicles/brands", {
          headers: { "Cache-Control": "no-cache" },
        });

        // CRITICAL FIX: Luôn extract .name từ brand objects
        const brandNames = res.data.map((b) => {
          if (typeof b === "object" && b.name) return b.name;
          if (typeof b === "string") return b;
          return null;
        }).filter(Boolean);

        setBrands([...brandNames, "Hãng Khác"]);
      } catch (err) {
        console.error("Lỗi lấy danh sách hãng:", err);
        setBrands(["Hãng Khác"]);
      }
    };

    fetchBrands();
  }, []);

  const handleBrandChange = (e) => {
    const value = e.target.value;
    setFormData({ ...formData, brand: value });
    setIsOtherBrand(value === "Hãng Khác");
    if (value !== "Hãng Khác") {
      setNewBrand("");
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
  };

  const handleImageSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    console.log(`🔄 Bắt đầu upload ${files.length} ảnh...`);
    setIsUploading(true);
    setUploadProgress(`Đang upload 0/${files.length}...`);

    const admin = JSON.parse(localStorage.getItem("adminInfo"));
    
    if (!admin?.token) {
      alert("Vui lòng đăng nhập lại!");
      setIsUploading(false);
      return;
    }

    const uploadedUrls = [];
    const failedFiles = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress(`Đang upload ${i + 1}/${files.length}: ${file.name}`);

      try {
        const fd = new FormData();
        fd.append("image", file);
        
        console.log(`📤 Uploading file ${i + 1}: ${file.name} (${(file.size / 1024).toFixed(2)}KB)`);
        
        const res = await API.post("/api/vehicles/upload", fd, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${admin.token}`,
          },
        });

        console.log(`✅ Upload response:`, res.data);

        if (res.data.success && res.data.imageUrl) {
          uploadedUrls.push(res.data.imageUrl);
          console.log(`✅ Upload thành công: ${res.data.imageUrl}`);
        } else {
          console.error(`❌ Response không có imageUrl:`, res.data);
          failedFiles.push(file.name);
        }
      } catch (error) {
        console.error(`❌ Lỗi upload ${file.name}:`, error);
        console.error('Error response:', error.response?.data);
        failedFiles.push(file.name);
      }
    }

    if (uploadedUrls.length > 0) {
      // Cập nhật state với Cloudinary URLs
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls]
      }));
      setPreviewUrls(prev => [...prev, ...uploadedUrls]);
      console.log(`✅ Đã thêm ${uploadedUrls.length} ảnh vào form`);
    }

    if (failedFiles.length > 0) {
      alert(`⚠️ Không thể upload ${failedFiles.length} ảnh:\n${failedFiles.join('\n')}`);
    }

    setIsUploading(false);
    setUploadProgress("");
    // Reset input để có thể chọn lại cùng file
    e.target.value = '';
  };

  const handleRemoveImage = (index) => {
    console.log(`🗑️ Xóa ảnh tại index ${index}`);
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const admin = JSON.parse(localStorage.getItem("adminInfo"));
      const config = { headers: { Authorization: `Bearer ${admin?.token}` } };

      const dataToSend = {
        ...formData,
        // images đã được upload lên Cloudinary rồi, chỉ cần gửi URLs
        newBrand: isOtherBrand ? newBrand : undefined,
      };

      console.log("📤 Submitting vehicle data:", dataToSend);

      if (vehicle?._id) {
        await API.put(`/api/vehicles/${vehicle._id}`, dataToSend, config);
        console.log("✅ Cập nhật xe thành công");
      } else {
        await API.post("/api/vehicles", dataToSend, config);
        console.log("✅ Tạo xe mới thành công");

        // Cập nhật lại danh sách brands sau khi thêm xe mới
        try {
          const brandRes = await API.get("/api/vehicles/brands", {
            headers: { "Cache-Control": "no-cache" },
          });
          
          const brandNames = brandRes.data.map((b) => {
            if (typeof b === "object" && b.name) return b.name;
            if (typeof b === "string") return b;
            return null;
          }).filter(Boolean);
          
          setBrands([...brandNames, "Hãng Khác"]);
        } catch (err) {
          console.error("Lỗi khi cập nhật danh sách hãng sau khi thêm xe:", err);
        }
      }
      
      onSuccess();
    } catch (err) {
      console.error("❌ Lỗi khi lưu xe:", err);
      alert("Có lỗi xảy ra khi lưu xe: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white shadow-lg rounded-2xl p-6 max-w-3xl mx-auto space-y-5"
    >
      <h2 className="text-xl font-semibold text-center text-gray-700">
        {vehicle ? "Cập nhật thông tin xe" : "Thêm xe mới"}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* --- Cột trái --- */}
        <div className="space-y-3">
          <input
            name="name"
            placeholder="Tên xe"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring focus:ring-green-200"
          />

          <select
            name="brand"
            value={formData.brand}
            onChange={handleBrandChange}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">-- Chọn hãng xe --</option>
            {brands.map((brandName) => (
              <option key={brandName} value={brandName}>
                {brandName}
              </option>
            ))}
          </select>
          
          {isOtherBrand && (
            <input
              type="text"
              placeholder="Nhập tên hãng xe mới"
              value={newBrand}
              onChange={(e) => setNewBrand(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 mt-2"
            />
          )}

          <input
            type="number"
            name="pricePerHour"
            placeholder="Giá thuê (VNĐ/giờ)"
            value={formData.pricePerHour}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />

          <select
            name="location"
            value={formData.location}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">-- Chọn quận/huyện --</option>
            {districts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          
          <input
            type="text"
            name="locationPickUp"
            placeholder="Địa chỉ cụ thể nơi lấy xe"
            value={formData.locationPickUp || ""}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />

          <input
            type="number"
            name="seats"
            placeholder="Số chỗ ngồi"
            value={formData.seats}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />

          <select
            name="transmission"
            value={formData.transmission}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="Số tự động">Số tự động</option>
            <option value="Số sàn">Số sàn</option>
          </select>

          <select
            name="fuelType"
            value={formData.fuelType}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="Điện">Điện</option>
            <option value="Xăng">Xăng</option>
          </select>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="isAvailable"
              checked={formData.isAvailable}
              onChange={handleChange}
            />
            Có sẵn cho thuê
          </label>
        </div>

        {/* --- Cột phải: nhiều ảnh + mô tả --- */}
        <div className="space-y-3">
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              disabled={isUploading}
              className="block w-full text-sm text-gray-600 file:bg-green-100 file:text-green-700 file:py-1 file:px-3 file:rounded disabled:opacity-50"
            />
            {isUploading && (
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
                {uploadProgress}
              </div>
            )}
          </div>

          {/* Hiển thị tất cả ảnh đã upload */}
          {previewUrls.length > 0 && (
            <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
              {previewUrls.map((url, i) => (
                <div key={i} className="relative">
                  <img
                    src={url}
                    alt={`preview-${i}`}
                    className="rounded-md w-full object-cover h-32"
                    onError={(e) => {
                      console.error('❌ Lỗi load ảnh:', url);
                      e.target.src = '/no-image.png';
                    }}
                    onLoad={() => {
                      console.log('✅ Load ảnh thành công:', url);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(i)}
                    className="absolute top-1 right-1 bg-red-600 text-white text-xs px-2 py-1 rounded-full hover:bg-red-700"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <textarea
            name="description"
            placeholder="Mô tả"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        {vehicle && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Hủy
          </button>
        )}
        <button
          type="submit"
          disabled={isUploading}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? 'Đang upload...' : (vehicle ? "Cập nhật" : "Thêm mới")}
        </button>
      </div>
    </form>
  );
};

export default VehicleForm;