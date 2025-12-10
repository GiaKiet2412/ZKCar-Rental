import React, { useState } from "react";
import API from "../../api/axios";
import { useNavigate } from "react-router-dom";

const UserRegisterPage = () => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSendOtp = async () => {
    // Validate phone
    if (!phone.trim()) {
      setError("Vui lòng nhập số điện thoại");
      return;
    }
    if (!/^[0-9]{10}$/.test(phone)) {
      setError("Số điện thoại không hợp lệ (10 chữ số)");
      return;
    }

    try {
      setError("");
      await API.post("/api/auth/send-otp", { email });
      alert("Mã xác nhận đã được gửi đến email của bạn!");
      // Chuyển sang trang xác minh OTP và truyền cả phone
      navigate("/verify-otp", { state: { email, name, phone, password } });
    } catch (error) {
      setError("Không thể gửi mã OTP. Kiểm tra lại email.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-4 text-center">Đăng ký tài khoản</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded mb-3 text-sm">
            {error}
          </div>
        )}

        <input
          type="text"
          placeholder="Họ tên"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border w-full p-2 mb-3 rounded"
          required
        />

        <input
          type="tel"
          placeholder="Số điện thoại (10 chữ số)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="border w-full p-2 mb-3 rounded"
          required
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border w-full p-2 mb-3 rounded"
          required
        />
        <input
          type="password"
          placeholder="Mật khẩu"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border w-full p-2 mb-4 rounded"
          required
        />

        <button
          onClick={handleSendOtp}
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
        >
          Đăng ký
        </button>

        <p className="text-center text-sm mt-3">
          Đã có tài khoản?{" "}
          <span
            onClick={() => navigate("/login")}
            className="text-green-600 cursor-pointer hover:underline"
          >
            Đăng nhập
          </span>
        </p>
      </div>
    </div>
  );
};

export default UserRegisterPage;