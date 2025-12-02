import React, { useEffect } from "react";

const ToastNotification = ({ message, type = "success", onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000); // tự đóng sau 3s
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-lg shadow-lg text-white flex items-center gap-2
        ${type === "success" ? "bg-green-500" : "bg-red-500"} animate-fade-in`}
    >
      <span>{message}</span>
      <div className="absolute bottom-0 left-0 h-1 bg-white opacity-70 animate-timer w-full"></div>
    </div>
  );
};

export default ToastNotification;