import { useNavigate } from 'react-router-dom';
import { FaCar, FaUserCog, FaBars, FaTag, FaClipboardList } from 'react-icons/fa';
import { FaArrowRightFromBracket } from 'react-icons/fa6';
import { useToast } from '../../context/ToastContext';

const AdminSidebar = ({ isOpen, toggle, onLogout }) => {
  const navigate = useNavigate();
  const { setToast } = useToast();

  const handleLogoutClick = () => {
      onLogout();
      setToast({ message: "Đăng xuất thành công!", type: "success" });
  };

  return (
    <div
      className={`${
        isOpen ? 'w-64' : 'w-16'
      } bg-blue-700 text-white flex flex-col justify-between transition-all duration-300 overflow-hidden`}
    >
      {/* --- Header --- */}
      <div className="flex items-center justify-between p-4 border-b border-blue-500 flex-shrink-0">
        {isOpen && <h2 className="text-lg font-bold">Admin Panel</h2>}
        <button onClick={toggle} className="text-white">
          <FaBars size={20} />
        </button>
      </div>

      {/* --- Menu items --- */}
      <nav className="flex-1 mt-4 space-y-1 overflow-y-auto">
        <button
          onClick={() => navigate('/admin/users')}
          className={`flex items-center w-full px-4 py-2 hover:bg-blue-600 transition-all ${
            isOpen ? 'justify-start' : 'justify-center'
          }`}
        >
          <FaUserCog className={`text-lg ${isOpen ? 'mr-3' : ''}`} />
          {isOpen && 'Quản lý User'}
        </button>

        <button
          onClick={() => navigate('/admin/vehicles')}
          className={`flex items-center w-full px-4 py-2 hover:bg-blue-600 transition-all ${
            isOpen ? 'justify-start' : 'justify-center'
          }`}
        >
          <FaCar className={`text-lg ${isOpen ? 'mr-3' : ''}`} />
          {isOpen && 'Quản lý Xe'}
        </button>

        <button
          onClick={() => navigate('/admin/discounts')}
          className={`flex items-center w-full px-4 py-2 hover:bg-blue-600 transition-all ${
            isOpen ? 'justify-start' : 'justify-center'
          }`}
        >
          <FaTag className={`text-lg ${isOpen ? 'mr-3' : ''}`} />
          {isOpen && 'Quản lý mã giảm giá'}
        </button>

        <button
          onClick={() => navigate('/admin/bookings')}
          className={`flex items-center w-full px-4 py-2 hover:bg-blue-600 transition-all ${
            isOpen ? 'justify-start' : 'justify-center'
          }`}
        >
          <FaClipboardList className={`text-lg ${isOpen ? 'mr-3' : ''}`} />
          {isOpen && 'Quản lý đơn đặt xe'}
        </button>

      </nav>

      {/* --- Logout button --- */}
      <div className="border-t border-blue-500 flex-shrink-0">
        <button
          onClick={handleLogoutClick}
          className={`flex items-center w-full px-4 py-3 hover:bg-blue-600 transition-all ${
            isOpen ? 'justify-start' : 'justify-center'
          }`}
        >
          <FaArrowRightFromBracket
            className={`text-lg min-w-[20px] ${isOpen ? 'mr-3' : ''}`}
          />
          {isOpen && 'Đăng xuất'}
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;