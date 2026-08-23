const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');
const Debate = require('./models/Debate');

// Load env vars
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// Enable CORS
app.use(cors());

// Body parser
app.use(express.json());

// Mount API routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/debates', require('./routes/debateRoutes'));
app.use('/api/arguments', require('./routes/argumentRoutes'));

// Root Endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'API Working',
    project: 'DebateSphere – AI Assisted Online Debate Platform',
    phase: 'Phase 9 - Timed Competitive Debate Engine',
    timestamp: '2026-08-21T19:30:00.000Z'
  });
});

// Configure Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE']
  }
});

// Attach io instance to express app
app.set('io', io);

// Store active room sockets and online counts
const roomParticipants = new Map();
const activeTurnTimers = new Map();
const disconnectGraceTimers = new Map();

// Helper to start server-controlled 20-second turn timer
const startTurnTimer = async (roomCode) => {
  // Clear any existing timer for this room
  if (activeTurnTimers.has(roomCode)) {
    clearInterval(activeTurnTimers.get(roomCode).handle);
    activeTurnTimers.delete(roomCode);
  }

  try {
    const debate = await Debate.findOne({ roomCode: roomCode.toUpperCase() })
      .populate('debaters', 'name email');

    if (!debate || debate.status !== 'active') return;

    // Check if max 5 rounds (10 turns) completed
    if (debate.currentRound > 5) {
      debate.status = 'completed';
      await debate.save();
      io.to(roomCode).emit('debateEnded', debate);
      io.to(roomCode).emit('roomStateUpdated', debate);
      return;
    }

    const currentDebater = debate.debaters[debate.currentTurnIndex];
    if (!currentDebater) return;

    let timeLeft = 20;

    const turnData = {
      currentDebaterId: currentDebater._id.toString(),
      currentDebaterName: currentDebater.name,
      round: debate.currentRound,
      turnIndex: debate.currentTurnIndex,
      turnNumber: debate.turnNumber,
      duration: 20,
      startTime: Date.now()
    };

    // Emit turnStarted to room
    io.to(roomCode).emit('turnStarted', turnData);

    const timerHandle = setInterval(async () => {
      timeLeft -= 1;
      io.to(roomCode).emit('timerTick', { roomCode, timeLeft });

      if (timeLeft <= 0) {
        clearInterval(timerHandle);
        activeTurnTimers.delete(roomCode);

        io.to(roomCode).emit('turnEnded', { turnNumber: debate.turnNumber });

        // Advance to next turn
        debate.turnNumber += 1;
        debate.currentTurnIndex = debate.currentTurnIndex === 0 ? 1 : 0;
        if (debate.currentTurnIndex === 0) {
          debate.currentRound += 1;
        }

        await debate.save();

        // Recursively start next turn timer
        startTurnTimer(roomCode);
      }
    }, 1000);

    activeTurnTimers.set(roomCode, { handle: timerHandle, turnData });
  } catch (err) {
    console.error('[Turn Timer Error]:', err.message);
  }
};

// Socket.io Connection Logic
io.on('connection', (socket) => {
  let currentRoom = null;
  let currentUser = null;

  socket.on('joinRoom', async ({ roomCode, userName }) => {
    currentRoom = roomCode;
    currentUser = userName;
    socket.join(roomCode);

    // Cancel disconnect grace timer if debater reconnected
    if (disconnectGraceTimers.has(userName)) {
      clearTimeout(disconnectGraceTimers.get(userName));
      disconnectGraceTimers.delete(userName);
    }

    if (!roomParticipants.has(roomCode)) {
      roomParticipants.set(roomCode, new Set());
    }
    roomParticipants.get(roomCode).add(socket.id);

    const onlineCount = roomParticipants.get(roomCode).size;

    io.to(roomCode).emit('updateParticipants', {
      onlineCount,
      message: `${userName} joined the debate`
    });

    socket.emit('receiveMessage', {
      user: 'System',
      message: `Welcome to room ${roomCode}, ${userName}!`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSystem: true
    });

    // Send active turn timer data if room is currently in an active turn
    if (activeTurnTimers.has(roomCode)) {
      const activeTimer = activeTurnTimers.get(roomCode);
      socket.emit('turnStarted', activeTimer.turnData);
    }
  });

  // Socket event to start debate countdown (3, 2, 1, GO!)
  socket.on('startDebateCountdown', ({ roomCode }) => {
    let count = 3;
    io.to(roomCode).emit('debateCountdown', { count: 3 });

    const countdownInterval = setInterval(() => {
      count -= 1;
      if (count > 0) {
        io.to(roomCode).emit('debateCountdown', { count });
      } else if (count === 0) {
        io.to(roomCode).emit('debateCountdown', { count: 'GO!' });
      } else {
        clearInterval(countdownInterval);
        io.to(roomCode).emit('debateCountdown', { count: null });
        startTurnTimer(roomCode);
      }
    }, 1000);
  });

  socket.on('sendMessage', ({ roomCode, user, message, time }) => {
    io.to(roomCode).emit('receiveMessage', {
      user,
      message,
      time,
      isSystem: false
    });
  });

  socket.on('disconnect', () => {
    if (currentRoom && roomParticipants.has(currentRoom)) {
      roomParticipants.get(currentRoom).delete(socket.id);
      const onlineCount = roomParticipants.get(currentRoom).size;

      io.to(currentRoom).emit('updateParticipants', {
        onlineCount,
        message: `${currentUser || 'A user'} left the debate`
      });

      if (roomParticipants.get(currentRoom).size === 0) {
        roomParticipants.delete(currentRoom);
      }
    }
  });
});

// Custom Error Handler Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
