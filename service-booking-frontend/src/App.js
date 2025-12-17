import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AdminAuthProvider } from "./context/AdminAuthContext";
import { UserAuthProvider } from "./context/UserAuthContext";
import { AdminRealtimeProvider } from "./context/AdminRealtimeContext";

// PAGES
import LoginPage from "./pages/LoginPage";

// ADMIN
import AdminRoute from "./routes/AdminRoutes";
import AdminDashboard from "./pages/admin/Dashboard";
import VehicleManagementPage from "./pages/admin/VehicleManagementPage";
import DiscountManagementPage from "./pages/admin/DiscountManagementPage";
import BookingManagementPage from "./pages/admin/BookingManagementPage";
import UserManagementPage from "./pages/admin/UserManagementPage";

// USER
import HomePage from "./pages/user/HomePage";
import RegisterPage from "./pages/user/UserRegisterPage";
import UserVerifyOtp from "./pages/user/UserVerifyOtp";
import { SearchProvider } from "./context/SearchContext";
import SearchResult from "./pages/user/SearchResult";
import VehicleDetail from "./pages/user/VehicleDetail";
import BookingConfirmation from "./pages/user/BookingConfirmation";
import BookingDetail from "./pages/user/BookingDetail";
import PaymentPage from "./pages/user/PaymentPage";
import PaymentSuccess from "./pages/user/PaymentSuccess";
import PaymentFailed from "./pages/user/PaymentFailed";
import PaymentReturn from "./pages/user/PaymentReturn";
import Profile from "./pages/user/Profile";
import GuestTrackingPage from "./pages/user/GuestTrackingPage";

function App() {
  return (
    <AdminAuthProvider>
      <UserAuthProvider>
        <AdminRealtimeProvider>
          <SearchProvider>
            <Router>
              <Routes>
                {/* ========== LOGIN (DÙNG CHUNG) ========== */}
                <Route path="/login" element={<LoginPage />} />

                {/* ========== ADMIN ROUTES ========== */}
                <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>}>
                  <Route path="users" element={<UserManagementPage />} />
                  <Route path="vehicles" element={<VehicleManagementPage />} />
                  <Route path="discounts" element={<DiscountManagementPage />} />
                  <Route path="bookings" element={<BookingManagementPage />} />
                </Route>

                {/* ========== USER ROUTES ========== */}
                <Route path="/" element={<HomePage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/verify-otp" element={<UserVerifyOtp />} />
                <Route path="/vehicles" element={<SearchResult />} />
                <Route path="/vehicle/:id" element={<VehicleDetail />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/guest-tracking" element={<GuestTrackingPage />} />
                
                {/* BOOKING & PAYMENT ROUTES */}
                <Route path="/booking/confirm" element={<BookingConfirmation />} />
                <Route path="/booking/:bookingId" element={<BookingDetail />} />
                <Route path="/payment/success" element={<PaymentSuccess />} />
                <Route path="/payment/failed" element={<PaymentFailed />} />  
                <Route path="/payment/:bookingId" element={<PaymentPage />} />
                <Route path="/payment/vnpay-return" element={<PaymentReturn />} />
              </Routes>
            </Router>
          </SearchProvider>
        </AdminRealtimeProvider>
      </UserAuthProvider>
    </AdminAuthProvider>
  );
}

export default App;