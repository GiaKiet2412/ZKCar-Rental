import React, { useState, useEffect } from "react";
import API from "../../api/axios";
import VehicleForm from "../../components/admin/VehicleForm";
import VehicleTable from "../../components/admin/VehicleTable";
import ToastNotification from "../../components/common/ToastNotification";
import ConfirmDialog from "../../components/common/ConfirmDialog";

const VehicleManagementPage = () => {
  const [vehicles, setVehicles] = useState([]);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const fetchVehicles = async () => {
    try {
      const res = await API.get("/api/vehicles");
      setVehicles(res.data);
    } catch (err) {
      console.error("Lỗi khi lấy danh sách xe:", err);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleAddClick = () => {
    setEditingVehicle(null);
    setShowForm(true);
  };

  const handleEdit = (vehicle) => {
    setEditingVehicle(vehicle);
    setShowForm(true);
  };

  const handleDelete = (vehicleId) => {
    setConfirmDialog({
      title: "Xác nhận xóa xe",
      message: "Bạn có chắc chắn muốn xóa xe này không?",
      onConfirm: async () => {
        try {
          const admin = JSON.parse(localStorage.getItem("adminInfo"));
          await API.delete(`/api/vehicles/${vehicleId}`, {
            headers: { Authorization: `Bearer ${admin?.token}` },
          });
          fetchVehicles();
          setToast({ message: "Xóa xe thành công!", type: "success" });
        } catch (err) {
          setToast({
            message: "Xóa xe thất bại!",
            type: "error",
          });
        } finally {
          setConfirmDialog(null);
        }
      },
      onCancel: () => setConfirmDialog(null),
    });
  };

  const handleSuccess = () => {
    fetchVehicles();
    setShowForm(false);
    setToast({ message: editingVehicle ? "Cập nhật xe thành công!" : "Thêm xe thành công!", type: "success" });
  };

  return (
    <div className="relative flex-1 p-6 bg-gray-50 min-h-screen">
      <div className="bg-white shadow-md rounded-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-blue-700">Quản lý xe cho thuê</h2>
          <button
            onClick={handleAddClick}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            + Thêm xe
          </button>
        </div>

        <VehicleTable vehicles={vehicles} onEdit={handleEdit} onDelete={handleDelete} refreshData={fetchVehicles} />
      </div>

      {/* Overlay form thêm/sửa */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40">
          <div className="bg-white p-6 rounded-2xl shadow-lg w-[90%] max-w-3xl relative">
            <button
              onClick={() => setShowForm(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
            <VehicleForm
              vehicle={editingVehicle}
              onSuccess={handleSuccess}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}

      {/* Thông báo toast */}
      {toast && (
        <ToastNotification
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Hộp thoại xác nhận */}
      {confirmDialog && <ConfirmDialog {...confirmDialog} />}
    </div>
  );
};

export default VehicleManagementPage;