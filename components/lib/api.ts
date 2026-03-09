import axios from 'axios';

const baseURL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL,
  withCredentials: true,
});

/* =========================
   REQUEST INTERCEPTOR
========================= */
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = sessionStorage.getItem('token');

      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;