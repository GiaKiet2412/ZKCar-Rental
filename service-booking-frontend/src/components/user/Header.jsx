import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useUserAuth } from "../../context/UserAuthContext";
import { useToast } from '../../context/ToastContext';
import { Search } from 'lucide-react';

const Header = () => {
  const navigate = useNavigate();
  const { user, logout } = useUserAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const { setToast } = useToast();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
    setToast({ message: "Đăng xuất thành công!", type: "success" });
  };

  return (
    <header className="flex justify-between items-center px-8 py-4 bg-white border-b border-gray-100 relative z-[250]">
      {/* Logo */}
      <div
        className="text-2xl font-bold text-green-600 cursor-pointer"
        onClick={() => navigate("/")}
      >
        ⚡ VN Rental
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-4">
        {/* Guest Tracking Link */}
        <button
          onClick={() => navigate('/guest-tracking')}
          className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
        >
          <Search size={18} />
          <span className="font-medium">Tra cứu đơn hàng</span>
        </button>

        {/* Login/User Menu */}
        {!user ? (
          <button
            onClick={() => navigate("/login")}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-medium"
          >
            Đăng nhập
          </button>
        ) : (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              <span className="font-medium text-gray-700">{user.name}</span>
              <svg
                className={`w-4 h-4 transform transition-transform ${menuOpen ? "rotate-180" : ""}`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg z-[300]">
                <button
                  onClick={() => {
                    navigate("/profile");
                    setMenuOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                >
                  Trang cá nhân
                </button>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
                >
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;