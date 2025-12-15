import React, { useState, useEffect } from "react";
import { FaSyncAlt } from "react-icons/fa";
import { useAdminRealtime } from "../../context/AdminRealtimeContext";
import VehicleForm from "../../components/admin/VehicleForm";
import VehicleTable from "../../components/admin/VehicleTable";
import ToastNotification from "../../components/common/ToastNotification";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import API from "../../api/axios";

const VehicleManagementPage = () => {
  const {
    vehicles: realtimeVehicles,
    lastUpdate,
    isPolling,
    startPolling,
    stopPolling,
    fetchVehicles
  } = useAdminRealtime();

  const [vehicles, setVehicles] = useState([]);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Start polling when component mounts
  useEffect(() => {
    startPolling();
    return () => stopPolling();
  }, [startPolling, stopPolling]);

  // Load vehicles on mount
  useEffect(() => {
    loadVehicles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update vehicles from realtime context
  useEffect(() => {
    if (realtimeVehicles.length > 0) {
      setVehicles(realtimeVehicles);
    }
  }, [realtimeVehicles]);

  const loadVehicles = async () => {
    try {
      const data = await fetchVehicles();
      if (data) {
        setVehicles(data);
      }
    } catch (err) {
      console.error("Lỗi khi lấy danh sách xe:", err);
    }
  };

  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      await loadVehicles();
      setToast({ 
        message: "Đã cập nhật danh sách xe mới nhất", 
        type: "success" 
      });
    } catch (error) {
      setToast({
        message: "Lỗi khi làm mới dữ liệu",
        type: "error",
      });
    } finally {
      setRefreshing(false);
    }
  };

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
      type: "delete",
      onConfirm: async () => {
        try {
          const admin = JSON.parse(localStorage.getItem("adminInfo"));
          await API.delete(`api/vehicles/${vehicleId}`, {
            headers: { Authorization: `Bearer ${admin?.token}` },
          });
          await loadVehicles();
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

  const handleSuccess = async () => {
    await loadVehicles();
    setShowForm(false);
    setToast({ 
      message: editingVehicle ? "Cập nhật xe thành công!" : "Thêm xe thành công!", 
      type: "success" 
    });
  };

  const formatLastUpdate = () => {
    const now = new Date();
    const diff = Math.floor((now - lastUpdate) / 1000);
    
    if (diff < 60) return `${diff} giây trước`;
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    return `${Math.floor(diff / 3600)} giờ trước`;
  };

  return (
    <div className="relative flex-1 p-6 bg-gray-50 min-h-screen">
      <div className="bg-white shadow-md rounded-xl p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-blue-700 mb-2">Quản lý xe cho thuê</h2>
            <div className="flex items-center gap-4">
              <p className="text-gray-600">
                Tổng số xe: {vehicles.length}
              </p>
              {isPolling && (
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                  <span>Tự động cập nhật</span>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Cập nhật lần cuối: {formatLastUpdate()}
            </p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleManualRefresh}
              disabled={refreshing}
              className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                refreshing 
                  ? 'bg-gray-300 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <FaSyncAlt className={refreshing ? 'animate-spin' : ''} size={16} />
              <span>{refreshing ? 'Đang cập nhật...' : 'Làm mới'}</span>
            </button>
            
            <button
              onClick={handleAddClick}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition font-semibold"
            >
              + Thêm xe
            </button>
          </div>
        </div>

        <VehicleTable 
          vehicles={vehicles} 
          onEdit={handleEdit} 
          onDelete={handleDelete} 
          refreshData={loadVehicles} 
        />
      </div>

      {/* Overlay form thêm/sửa */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40">
          <div className="bg-white p-6 rounded-2xl shadow-lg w-[90%] max-w-3xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowForm(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl w-8 h-8 flex items-center justify-center"
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
      {confirmDialog && (
        <ConfirmDialog 
          title={confirmDialog.title}
          message={confirmDialog.message}
          type={confirmDialog.type}
          onConfirm={confirmDialog.onConfirm}
          onCancel={confirmDialog.onCancel}
        />
      )}
    </div>
  );
};

export default VehicleManagementPage;