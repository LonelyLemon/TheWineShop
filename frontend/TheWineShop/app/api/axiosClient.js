import axios from 'axios';
import { toast } from 'react-toastify';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL, 
  headers: {
  },
});

axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;

    if (error.response && error.response.status === 401 && !originalRequest._retry) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        
        if (!window.location.pathname.includes('/login')) {
             toast.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
             window.location.href = '/login';
        }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;