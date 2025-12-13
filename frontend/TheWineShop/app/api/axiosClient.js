import axios from 'axios';
import { toast } from 'react-toastify';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL, 
  headers: {
    'Content-Type': 'application/json',
  },
});

const getSessionId = () => {
    let sessionId = localStorage.getItem('x-session-id');
    if (!sessionId) {
        sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
        localStorage.setItem('x-session-id', sessionId);
    }
    return sessionId;
};

axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    config.headers['x-session-id'] = getSessionId();

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