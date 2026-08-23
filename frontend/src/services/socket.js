import { io } from 'socket.io-client';

// Connect to backend Socket.io server
const socket = io('http://localhost:5000', {
  autoConnect: false,
});

export default socket;
