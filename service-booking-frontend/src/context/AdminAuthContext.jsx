import React, { createContext, useContext, useState } from 'react';

const AdminAuthContext = createContext();

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(() => {
    const savedAdmin = localStorage.getItem('adminInfo');
    return savedAdmin ? JSON.parse(savedAdmin) : null;
  });

  const login = (data) => {
    setAdmin(data);
    localStorage.setItem('adminInfo', JSON.stringify(data));
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
  };

  const logout = () => {
    setAdmin(null);
    localStorage.removeItem('adminInfo');
    localStorage.removeItem('token');
  };

  return (
    <AdminAuthContext.Provider value={{ admin, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => useContext(AdminAuthContext);
