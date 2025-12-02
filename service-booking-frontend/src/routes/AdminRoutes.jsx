import { Navigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";

const AdminRoute = ({ children }) => {
  const { admin } = useAdminAuth();

  // Nếu chưa đăng nhập admin → quay về trang login
  if (!admin) {
    return <Navigate to="/login" replace />;
  }

  // Nếu đăng nhập nhưng role không phải admin → quay về trang chủ
  if (admin.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  // Nếu hợp lệ → cho vào trang admin
  return children;
};

export default AdminRoute;