import API from './api';

// Join or create a random debate room
export const joinRandomDebateApi = async () => {
  const response = await API.post('/debates/random');
  return response.data;
};

// Create a new custom debate room
export const createDebateApi = async (topic, description) => {
  const response = await API.post('/debates/create', { topic, description });
  return response.data;
};

// Get list of available (waiting) debate rooms
export const getDebatesApi = async () => {
  const response = await API.get('/debates');
  return response.data;
};

// Join a debate room using roomCode
export const joinDebateApi = async (roomCode) => {
  const response = await API.post(`/debates/join/${roomCode}`);
  return response.data;
};

// Toggle debater ready status
export const toggleReadyApi = async (roomCode) => {
  const response = await API.post(`/debates/${roomCode}/ready`);
  return response.data;
};

// Get single debate room details using roomCode
export const getDebateByCodeApi = async (roomCode) => {
  const response = await API.get(`/debates/${roomCode}`);
  return response.data;
};

// Start a debate room
export const startDebateApi = async (roomCode) => {
  const response = await API.patch(`/debates/start/${roomCode}`);
  return response.data;
};

// Quit a debate room (Forfeit match)
export const quitDebateApi = async (roomCode) => {
  const response = await API.post(`/debates/${roomCode}/quit`);
  return response.data;
};

// Generate or fetch AI debate analysis
export const analyzeDebateApi = async (roomCode) => {
  const response = await API.post(`/debates/${roomCode}/analyze`);
  return response.data;
};
