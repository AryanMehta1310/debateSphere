import axios from 'axios';

// Create base Axios instance
const API = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT Authorization token if available in localStorage
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('debatesphere_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling central errors (e.g. 401 unauthorized)
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear invalid token if unauthenticated
      if (localStorage.getItem('debatesphere_token')) {
        localStorage.removeItem('debatesphere_token');
        localStorage.removeItem('debatesphere_user');
      }
    }
    return Promise.reject(error);
  }
);

export default API;
