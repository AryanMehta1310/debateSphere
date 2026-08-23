const express = require('express');
const router = express.Router();
const {
  submitArgument,
  getArguments,
  voteArgument
} = require('../controllers/argumentController');
const { protect } = require('../middleware/authMiddleware');

router.post('/:roomCode', protect, submitArgument);
router.get('/:roomCode', protect, getArguments);
router.post('/vote/:argumentId', protect, voteArgument);

module.exports = router;
