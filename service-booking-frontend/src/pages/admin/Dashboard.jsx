import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { useAdminAuth } from '../../context/AdminAuthContext';

const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const { logout } = useAdminAuth(); // lấy hàm logout từ context

  const handleLogout = () => {
    logout(); // reset context
    localStorage.removeItem('adminInfo'); // xóa cache
    navigate('/admin/login');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar
        isOpen={sidebarOpen}
        toggle={() => setSidebarOpen(!sidebarOpen)}
        onLogout={handleLogout}
      />

      <main className="flex-1 p-6 overflow-y-auto transition-all duration-300">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminDashboard;
