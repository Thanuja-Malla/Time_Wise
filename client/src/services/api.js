import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach JWT token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('timewise_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: extract clean error messages and handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized and not already on login, clear token
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('timewise_token');
        localStorage.removeItem('timewise_user');
        window.location.href = '/login';
      }
    }

    let message = error.response?.data?.message;

    // Provide friendly, actionable messages for proxy/connection failures
    if (!message) {
      if (error.code === 'ERR_NETWORK' || !error.response) {
        message = 'Cannot connect to backend server. Please verify the server is running on port 5000.';
      } else if (
        error.response?.status === 500 &&
        (typeof error.response?.data === 'string' || !error.response?.data?.message)
      ) {
        message = 'Backend server unavailable. Please make sure the server is started on port 5000.';
      } else if (error.response?.status === 504 || error.response?.status === 502) {
        message = 'Gateway timeout: The backend server is not responding.';
      } else if (error.message) {
        message = error.message;
      } else {
        message = 'An unexpected error occurred. Please try again.';
      }
    }

    return Promise.reject(new Error(message));
  }
);

export default api;
