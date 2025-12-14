import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/',
});

API.interceptors.request.use((req) => {
  const adminInfo = JSON.parse(localStorage.getItem('adminInfo'));
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  // Ưu tiên token của admin khi đang ở trang admin
  const isAdminRoute = window.location.pathname.includes('/admin');
  const token = isAdminRoute ? adminInfo?.token : userInfo?.token;

  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }

  return req;
});

export default API;