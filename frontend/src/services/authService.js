import API from './api';

// Register API call
export const registerApi = async (name, email, password) => {
  const response = await API.post('/auth/register', { name, email, password });
  return response.data;
};

// Login API call
export const loginApi = async (email, password) => {
  const response = await API.post('/auth/login', { email, password });
  return response.data;
};

// Get current user profile call
export const getMeApi = async () => {
  const response = await API.get('/auth/me');
  return response.data;
};

// Check backend server status
export const checkServerStatusApi = async () => {
  const response = await API.get('/');
  return response.data;
};
