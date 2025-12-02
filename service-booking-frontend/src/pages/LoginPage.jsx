import React, { useState } from "react";
import API from "../api/axios";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";
import { useUserAuth } from "../context/UserAuthContext";
import { useToast } from "../context/ToastContext";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { setToast } = useToast();

  const { login: adminLogin } = useAdminAuth();
  const { login: userLogin } = useUserAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await API.post("/api/auth/login", { email, password });
      const { user, token } = res.data;

      setTimeout(() => {
        setIsLoading(false);

        if (user.role === "admin") {
          adminLogin({ ...user, token });
          localStorage.setItem("adminInfo", JSON.stringify({ ...user, token }));
          setToast({ message: "Đăng nhập quản trị thành công!", type: "success" });
          navigate("/admin");
        } else {
          userLogin({ ...user, token });
          localStorage.setItem("userInfo", JSON.stringify({ ...user, token }));
          setToast({ message: "Đăng nhập thành công!", type: "success" });
          navigate("/");
        }
      }, 800); // delay loading 0.8s để hiển thị nút "đang xử lý"
    } catch (err) {
      console.error(err);
      setError("Đăng nhập thất bại! Vui lòng kiểm tra thông tin lại thông tin đăng nhập.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <form onSubmit={handleLogin} className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm">
            <h2 className="text-2xl font-bold mb-4 text-center">Đăng nhập</h2>
            {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

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
              type="submit"
              disabled={isLoading}
              className={`w-full py-2 rounded transition text-white ${
                isLoading ? "bg-green-400 cursor-wait" : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {isLoading ? "Đang tải..." : "Đăng nhập"}
            </button>
            <p className="text-center text-sm mt-3">
                Chưa có tài khoản?{" "}
                <span
                    onClick={() => navigate("/register")}
                    className="text-blue-600 cursor-pointer hover:underline"
                >
                    Đăng ký ngay
                </span>
            </p>
        </form>
    </div>
  );
};

export default LoginPage;