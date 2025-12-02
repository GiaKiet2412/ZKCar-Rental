import React, { createContext, useContext, useState, useCallback } from "react";
import ToastNotification from "../components/common/ToastNotification";

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toast, setToastState] = useState(null);

  const setToast = useCallback(({ message, type = "success" }) => {
    setToastState({ message, type });
  }, []);

  const clearToast = useCallback(() => {
    setToastState(null);
  }, []);

  return (
    <ToastContext.Provider value={{ setToast }}>
      {children}
      {toast && (
        <ToastNotification
          message={toast.message}
          type={toast.type}
          onClose={clearToast}
        />
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);