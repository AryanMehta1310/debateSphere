import API from './api';

// Submit argument to active debate
export const submitArgumentApi = async (roomCode, content) => {
  const response = await API.post(`/arguments/${roomCode}`, { content });
  return response.data;
};

// Get arguments list & user voted argument IDs for room
export const getArgumentsApi = async (roomCode) => {
  const response = await API.get(`/arguments/${roomCode}`);
  return response.data;
};

// Vote for an argument
export const voteArgumentApi = async (argumentId) => {
  const response = await API.post(`/arguments/vote/${argumentId}`);
  return response.data;
};

// End debate (Host only)
export const endDebateApi = async (roomCode) => {
  const response = await API.patch(`/debates/end/${roomCode}`);
  return response.data;
};

// Get completed debate results summary
export const getDebateResultsApi = async (roomCode) => {
  const response = await API.get(`/debates/${roomCode}/results`);
  return response.data;
};
