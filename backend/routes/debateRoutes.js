const express = require('express');
const router = express.Router();
const {
  joinRandomDebate,
  createDebate,
  getDebates,
  joinDebate,
  getDebateByCode,
  toggleReady,
  startDebate,
  quitDebate,
  endDebate,
  getDebateResults,
  analyzeDebate
} = require('../controllers/debateController');
const { protect } = require('../middleware/authMiddleware');

// Public route to list waiting debates
router.get('/', getDebates);

// Protected debate routes
router.post('/random', protect, joinRandomDebate);
router.post('/create', protect, createDebate);
router.get('/:roomCode', protect, getDebateByCode);
router.post('/join/:roomCode', protect, joinDebate);
router.post('/:roomCode/ready', protect, toggleReady);
router.patch('/start/:roomCode', protect, startDebate);
router.post('/:roomCode/quit', protect, quitDebate);
router.patch('/end/:roomCode', protect, endDebate);
router.get('/:roomCode/results', protect, getDebateResults);

// Phase 5 AI Analysis route
router.post('/:roomCode/analyze', protect, analyzeDebate);

module.exports = router;
