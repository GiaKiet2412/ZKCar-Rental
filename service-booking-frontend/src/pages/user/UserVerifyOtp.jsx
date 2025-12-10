import React, { useState } from "react";
import API from "../../api/axios";
import { useNavigate, useLocation } from "react-router-dom";

const VerifyOTPPage = () => {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { email, name, phone, password } = location.state || {};

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      setError("Vui lòng nhập mã OTP");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Verify OTP
      await API.post("/api/auth/verify-otp", { email, otp });

      // Register user with phone
      const res = await API.post("/api/auth/register", { 
        name, 
        email, 
        phone,
        password 
      });
      
      const { token, user } = res.data;

      localStorage.setItem("token", token);
      localStorage.setItem("userInfo", JSON.stringify({ ...user, token }));

      alert("Đăng ký thành công!");
      navigate("/login");
    } catch (error) {
      setError(error.response?.data?.message || "Mã OTP không đúng hoặc đã hết hạn");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-4 text-center">Xác minh OTP</h2>
        
        <p className="text-sm text-gray-600 mb-4">
          Mã xác nhận đã được gửi đến email: <strong>{email}</strong>
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded mb-3 text-sm">
            {error}
          </div>
        )}

        <input
          type="text"
          placeholder="Nhập mã OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          className="border w-full p-2 mb-4 rounded"
          maxLength={6}
        />

        <button
          onClick={handleVerifyOtp}
          disabled={loading}
          className={`w-full py-2 rounded transition ${
            loading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-green-600 hover:bg-green-700'
          } text-white`}
        >
          {loading ? 'Đang xử lý...' : 'Xác nhận'}
        </button>

        <p className="text-center text-sm mt-3">
          <span
            onClick={() => navigate("/register")}
            className="text-green-600 cursor-pointer hover:underline"
          >
            Quay lại đăng ký
          </span>
        </p>
      </div>
    </div>
  );
};

export default VerifyOTPPage;