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

  useEffect(() => {
    if (vehicle) {
      setFormData(vehicle);
      setPreviewUrls(
        vehicle.images?.map((url) => `http://localhost:5000${url}`) || []
      );
    } else {
      setFormData({
        name: "",
        brand: "",
        pricePerHour: "",
        description: "",
        location: "",
        seats: "",
        transmission: "Số tự động",
        fuelType: "Điện",
        isAvailable: true,
        images: [],
      });
      setPreviewUrls([]);
      setSelectedFiles([]);
    }
  }, [vehicle]);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const res = await API.get("/api/vehicles/brands", {
          headers: { "Cache-Control": "no-cache" },
        });
        setBrands([...res.data, "Hãng Khác"]);
      } catch (err) {
        console.error("Lỗi lấy danh sách hãng:", err);
        setBrands(["Hãng Khác"]);
      }
    };

    fetchBrands();
  }, [vehicle]);

  const handleBrandChange = (e) => {
    const value = e.target.value;
    setFormData({ ...formData, brand: value });
    setIsOtherBrand(value === "Hãng Khác");
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles((prev) => [...prev, ...files]);
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls((prev) => [...prev, ...newPreviews]);
  };

  const uploadImages = async (files) => {
    const admin = JSON.parse(localStorage.getItem("adminInfo"));
    const uploadedUrls = [];

    for (const file of files) {
      const fd = new FormData();
      fd.append("image", file);
      const res = await API.post("/api/vehicles/upload", fd, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${admin?.token}`,
        },
      });
      uploadedUrls.push(res.data.imageUrl);
    }
    return uploadedUrls;
  };

  const handleRemoveImage = (index) => {
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const admin = JSON.parse(localStorage.getItem("adminInfo"));
      const config = { headers: { Authorization: `Bearer ${admin?.token}` } };

      let uploadedUrls = [];
      if (selectedFiles.length > 0) {
        uploadedUrls = await uploadImages(selectedFiles);
      }

      const dataToSend = {
        ...formData,
        images: Array.from(new Set([...(formData.images || []), ...uploadedUrls])),
        newBrand: isOtherBrand ? newBrand : undefined,
      };

      if (vehicle?._id) {
        await API.put(`/api/vehicles/${vehicle._id}`, dataToSend, config);
      } else {
        await API.post("/api/vehicles", dataToSend, config);

        try {
          const brandRes = await API.get("/api/vehicles/brands", {
            headers: { "Cache-Control": "no-cache" },
          });
          setBrands([...brandRes.data, "Hãng Khác"]);
        } catch (err) {
          console.error("Lỗi khi cập nhật danh sách hãng sau khi thêm xe:", err);
        }
      }

      previewUrls.forEach((url) => url.startsWith("blob:") && URL.revokeObjectURL(url));
      onSuccess();
    } catch (err) {
      console.error("Lỗi khi lưu xe:", err);
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
            {brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          
          {isOtherBrand && (
            <input
              type="text"
              placeholder="Nhập tên hãng xe mới"
              value={newBrand}
              onChange={(e) => setNewBrand(e.target.value)}
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
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageSelect}
            className="block w-full text-sm text-gray-600 file:bg-green-100 file:text-green-700 file:py-1 file:px-3 file:rounded"
          />

          {/* Hiển thị tất cả ảnh đã chọn */}
          {previewUrls.length > 0 && (
            <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
              {previewUrls.map((url, i) => (
                <div key={i} className="relative">
                  <img
                    src={url}
                    alt={`preview-${i}`}
                    className="rounded-md w-full object-cover h-32"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(i)}
                    className="absolute top-1 right-1 bg-red-600 text-white text-xs px-2 py-1 rounded-full"
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
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md"
          >
            Hủy
          </button>
        )}
        <button
          type="submit"
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          {vehicle ? "Cập nhật" : "Thêm mới"}
        </button>
      </div>
    </form>
  );
};

export default VehicleForm;