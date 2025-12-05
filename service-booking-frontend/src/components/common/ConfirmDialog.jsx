const ConfirmDialog = ({ 
  title = "Xác nhận", 
  message, 
  onConfirm, 
  onCancel,
  confirmText = "Xác nhận",
  confirmColor = "bg-blue-600 hover:bg-blue-700",
  type = "default" // "default" | "delete" | "warning" | "success"
}) => {
  // Tự động xác định màu và text dựa trên type
  const getConfig = () => {
    switch (type) {
      case "delete":
        return {
          color: "bg-red-600 hover:bg-red-700",
          text: "Xóa"
        };
      case "warning":
        return {
          color: "bg-yellow-600 hover:bg-yellow-700",
          text: "Tiếp tục"
        };
      case "success":
        return {
          color: "bg-green-600 hover:bg-green-700",
          text: "Xác nhận"
        };
      default:
        return {
          color: confirmColor,
          text: confirmText
        };
    }
  };

  const config = getConfig();

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
      <div className="bg-white rounded-xl shadow-lg p-6 w-96 text-center">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">{title}</h2>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-center gap-3">
          <button
            onClick={onCancel}
            className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            className={`px-5 py-2 text-white rounded-lg transition-colors ${config.color}`}
          >
            {config.text}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;