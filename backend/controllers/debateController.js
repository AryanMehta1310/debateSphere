const Debate = require('../models/Debate');
const Argument = require('../models/Argument');
const crypto = require('crypto');
const { generateDebateTopic, generateDebateAnalysis } = require('../services/geminiService');

const generateRoomCode = () => {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
};

// @desc    Join or create a random debate room
// @route   POST /api/debates/random
// @access  Private
const joinRandomDebate = async (req, res, next) => {
  try {
    const userId = req.user._id;

    let debate = await Debate.findOne({ isRandom: true, status: 'waiting' });

    if (debate) {
      const isParticipant = debate.participants.some((pId) => pId.toString() === userId.toString());
      if (!isParticipant) {
        debate.participants.push(userId);
      }

      const isDebater = debate.debaters.some((dId) => dId.toString() === userId.toString());
      if (!isDebater && debate.debaters.length < 2) {
        debate.debaters.push(userId);
      }

      await debate.save();
    } else {
      const aiTopic = await generateDebateTopic();

      let roomCode = generateRoomCode();
      let codeExists = await Debate.findOne({ roomCode });
      while (codeExists) {
        roomCode = generateRoomCode();
        codeExists = await Debate.findOne({ roomCode });
      }

      debate = await Debate.create({
        topic: aiTopic,
        description: 'AI-assisted structured debate match.',
        host: userId,
        roomCode,
        isRandom: true,
        participants: [userId],
        debaters: [userId],
        status: 'waiting',
        player1Ready: false,
        player2Ready: false
      });
    }

    const populatedDebate = await Debate.findById(debate._id)
      .populate('host', 'name email')
      .populate('participants', 'name email')
      .populate('debaters', 'name email');

    const io = req.app.get('io');
    if (io) {
      io.to(debate.roomCode).emit('roomStateUpdated', populatedDebate);
    }

    res.status(200).json({
      success: true,
      message: 'Joined random debate room successfully',
      debate: populatedDebate
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new custom debate room
// @route   POST /api/debates/create
// @access  Private
const createDebate = async (req, res, next) => {
  try {
    const { topic, description } = req.body;

    if (!topic || !description) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both topic and description'
      });
    }

    let roomCode = generateRoomCode();
    let codeExists = await Debate.findOne({ roomCode });
    while (codeExists) {
      roomCode = generateRoomCode();
      codeExists = await Debate.findOne({ roomCode });
    }

    const debate = await Debate.create({
      topic,
      description,
      host: req.user._id,
      roomCode,
      participants: [req.user._id],
      debaters: [req.user._id],
      status: 'waiting',
      isRandom: false
    });

    const populatedDebate = await Debate.findById(debate._id)
      .populate('host', 'name email')
      .populate('participants', 'name email')
      .populate('debaters', 'name email');

    res.status(201).json({
      success: true,
      message: 'Debate room created successfully',
      debate: populatedDebate
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all available debate rooms (status: waiting)
// @route   GET /api/debates
// @access  Public / Private
const getDebates = async (req, res, next) => {
  try {
    const debates = await Debate.find({ status: 'waiting' })
      .populate('host', 'name email')
      .populate('debaters', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: debates.length,
      debates
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Join a debate room by room code
// @route   POST /api/debates/join/:roomCode
// @access  Private
const joinDebate = async (req, res, next) => {
  try {
    const { roomCode } = req.params;
    const userId = req.user._id;

    const debate = await Debate.findOne({ roomCode: roomCode.toUpperCase() });

    if (!debate) {
      return res.status(404).json({
        success: false,
        message: 'Debate room not found'
      });
    }

    const isParticipant = debate.participants.some(
      (pId) => pId.toString() === userId.toString()
    );

    if (!isParticipant) {
      debate.participants.push(userId);
    }

    const isDebater = debate.debaters.some((dId) => dId.toString() === userId.toString());
    if (!isDebater && debate.debaters.length < 2) {
      debate.debaters.push(userId);
    }

    await debate.save();

    const updatedDebate = await Debate.findById(debate._id)
      .populate('host', 'name email')
      .populate('participants', 'name email')
      .populate('debaters', 'name email');

    const io = req.app.get('io');
    if (io) {
      io.to(debate.roomCode).emit('roomStateUpdated', updatedDebate);
    }

    res.status(200).json({
      success: true,
      message: 'Joined debate room successfully',
      debate: updatedDebate
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single debate room details by room code
// @route   GET /api/debates/:roomCode
// @access  Private
const getDebateByCode = async (req, res, next) => {
  try {
    const { roomCode } = req.params;

    const debate = await Debate.findOne({ roomCode: roomCode.toUpperCase() })
      .populate('host', 'name email')
      .populate('participants', 'name email')
      .populate('debaters', 'name email')
      .populate('winner', 'name email');

    if (!debate) {
      return res.status(404).json({
        success: false,
        message: 'Debate room not found'
      });
    }

    res.status(200).json({
      success: true,
      debate
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle debater ready status
// @route   POST /api/debates/:roomCode/ready
// @access  Private
const toggleReady = async (req, res, next) => {
  try {
    const { roomCode } = req.params;
    const userId = req.user._id;

    const debate = await Debate.findOne({ roomCode: roomCode.toUpperCase() });

    if (!debate) {
      return res.status(404).json({
        success: false,
        message: 'Debate room not found'
      });
    }

    const debaterIndex = debate.debaters.findIndex(
      (dId) => dId.toString() === userId.toString()
    );

    if (debaterIndex === -1) {
      return res.status(403).json({
        success: false,
        message: 'Only selected debaters can mark ready status'
      });
    }

    if (debaterIndex === 0) {
      debate.player1Ready = true;
    } else if (debaterIndex === 1) {
      debate.player2Ready = true;
    }

    if (debate.debaters.length === 2 && debate.player1Ready && debate.player2Ready) {
      debate.status = 'ready';
    }

    await debate.save();

    const updatedDebate = await Debate.findById(debate._id)
      .populate('host', 'name email')
      .populate('participants', 'name email')
      .populate('debaters', 'name email');

    const io = req.app.get('io');
    if (io) {
      io.to(debate.roomCode).emit('readyStatusUpdated', updatedDebate);
      io.to(debate.roomCode).emit('roomStateUpdated', updatedDebate);
    }

    res.status(200).json({
      success: true,
      message: 'Ready status updated',
      debate: updatedDebate
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Start debate
// @route   PATCH /api/debates/start/:roomCode
// @access  Private
const startDebate = async (req, res, next) => {
  try {
    const { roomCode } = req.params;
    const userId = req.user._id;

    const debate = await Debate.findOne({ roomCode: roomCode.toUpperCase() });

    if (!debate) {
      return res.status(404).json({
        success: false,
        message: 'Debate room not found'
      });
    }

    const isDebaterOrHost =
      debate.host.toString() === userId.toString() ||
      debate.debaters.some((dId) => dId.toString() === userId.toString());

    if (!isDebaterOrHost) {
      return res.status(403).json({
        success: false,
        message: 'Only selected debaters or host can start the debate'
      });
    }

    if (!debate.player1Ready || !debate.player2Ready) {
      return res.status(400).json({
        success: false,
        message: 'Both debaters must click "I\'m Ready" before starting the debate'
      });
    }

    debate.status = 'active';
    debate.currentRound = 1;
    debate.currentTurnIndex = 0;
    debate.turnNumber = 1;
    debate.player1Score = 0;
    debate.player2Score = 0;

    await debate.save();

    const updatedDebate = await Debate.findById(debate._id)
      .populate('host', 'name email')
      .populate('participants', 'name email')
      .populate('debaters', 'name email');

    const io = req.app.get('io');
    if (io) {
      io.to(debate.roomCode).emit('debateStarted', updatedDebate);
      io.to(debate.roomCode).emit('roomStateUpdated', updatedDebate);
    }

    res.status(200).json({
      success: true,
      message: 'Debate starting...',
      debate: updatedDebate
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Quit debate (Debater forfeits debate)
// @route   POST /api/debates/:roomCode/quit
// @access  Private (Debater only)
const quitDebate = async (req, res, next) => {
  try {
    const { roomCode } = req.params;
    const userId = req.user._id;

    const debate = await Debate.findOne({ roomCode: roomCode.toUpperCase() })
      .populate('debaters', 'name email');

    if (!debate) {
      return res.status(404).json({
        success: false,
        message: 'Debate room not found'
      });
    }

    const debaterIndex = debate.debaters.findIndex(
      (d) => d._id.toString() === userId.toString()
    );

    if (debaterIndex === -1) {
      return res.status(403).json({
        success: false,
        message: 'Only active debaters can quit the debate'
      });
    }

    const quittingUser = debate.debaters[debaterIndex];
    const opponentIndex = debaterIndex === 0 ? 1 : 0;
    const opponentUser = debate.debaters[opponentIndex];

    debate.status = 'completed';
    debate.result = 'quit';
    if (opponentUser) {
      debate.winner = opponentUser._id;
      debate.winnerReason = `${quittingUser.name} left the debate.`;
    } else {
      debate.winnerReason = `${quittingUser.name} left the debate.`;
    }

    await debate.save();

    const updatedDebate = await Debate.findById(debate._id)
      .populate('host', 'name email')
      .populate('participants', 'name email')
      .populate('debaters', 'name email')
      .populate('winner', 'name email');

    const io = req.app.get('io');
    if (io) {
      io.to(debate.roomCode).emit('playerQuit', {
        quittingUser: quittingUser.name,
        winner: opponentUser ? opponentUser.name : 'Opponent',
        debate: updatedDebate
      });
      io.to(debate.roomCode).emit('debateEnded', updatedDebate);
      io.to(debate.roomCode).emit('roomStateUpdated', updatedDebate);
    }

    res.status(200).json({
      success: true,
      message: 'You have quit the debate',
      debate: updatedDebate
    });
  } catch (error) {
    next(error);
  }
};

// @desc    End debate
// @route   PATCH /api/debates/end/:roomCode
// @access  Private
const endDebate = async (req, res, next) => {
  try {
    const { roomCode } = req.params;
    const userId = req.user._id;

    const debate = await Debate.findOne({ roomCode: roomCode.toUpperCase() });

    if (!debate) {
      return res.status(404).json({
        success: false,
        message: 'Debate room not found'
      });
    }

    debate.status = 'completed';

    if (debate.result !== 'quit') {
      if (debate.player1Score > debate.player2Score) {
        debate.winner = debate.debaters[0];
        debate.result = 'player1';
      } else if (debate.player2Score > debate.player1Score) {
        debate.winner = debate.debaters[1];
        debate.result = 'player2';
      } else {
        debate.winner = null;
        debate.result = 'tie';
      }
    }

    await debate.save();

    const updatedDebate = await Debate.findById(debate._id)
      .populate('host', 'name email')
      .populate('participants', 'name email')
      .populate('debaters', 'name email')
      .populate('winner', 'name email');

    const io = req.app.get('io');
    if (io) {
      io.to(debate.roomCode).emit('debateEnded', updatedDebate);
      io.to(debate.roomCode).emit('roomStateUpdated', updatedDebate);
    }

    res.status(200).json({
      success: true,
      message: 'Debate ended successfully',
      debate: updatedDebate
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get debate results summary
// @route   GET /api/debates/:roomCode/results
// @access  Private
const getDebateResults = async (req, res, next) => {
  try {
    const { roomCode } = req.params;

    const debate = await Debate.findOne({ roomCode: roomCode.toUpperCase() })
      .populate('host', 'name email')
      .populate('debaters', 'name email')
      .populate('winner', 'name email');

    if (!debate) {
      return res.status(404).json({
        success: false,
        message: 'Debate room not found'
      });
    }

    const argumentsList = await Argument.find({ debate: debate._id }).populate('user', 'name');

    const totalArguments = argumentsList.length;
    const totalVotes = argumentsList.reduce((sum, arg) => sum + arg.votes, 0);

    const player1 = debate.debaters[0] ? debate.debaters[0].name : 'Player 1';
    const player2 = debate.debaters[1] ? debate.debaters[1].name : 'Player 2';

    let result = debate.result;
    if (!result) {
      if (debate.player1Score > debate.player2Score) {
        result = 'player1';
      } else if (debate.player2Score > debate.player1Score) {
        result = 'player2';
      } else {
        result = 'tie';
      }
    }

    res.status(200).json({
      success: true,
      topic: debate.topic,
      player1,
      player2,
      player1Score: debate.player1Score || 0,
      player2Score: debate.player2Score || 0,
      totalArguments,
      totalVotes,
      winner: debate.winner ? debate.winner.name : (result === 'tie' ? null : (result === 'player1' ? player1 : player2)),
      result,
      winnerReason: debate.winnerReason || null,
      aiAnalysis: debate.aiAnalysis || null
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate or retrieve AI debate analysis using Google Gemini API
// @route   POST /api/debates/:roomCode/analyze
// @access  Private
const analyzeDebate = async (req, res, next) => {
  try {
    const { roomCode } = req.params;

    const debate = await Debate.findOne({ roomCode: roomCode.toUpperCase() });

    if (!debate) {
      return res.status(404).json({
        success: false,
        message: 'Debate room not found'
      });
    }

    if (debate.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'AI analysis can only be generated for completed debates'
      });
    }

    if (debate.aiAnalysis && debate.aiAnalysis.summary) {
      return res.status(200).json({
        success: true,
        message: 'Retrieved existing AI debate analysis',
        aiAnalysis: debate.aiAnalysis
      });
    }

    const argumentsList = await Argument.find({ debate: debate._id }).populate('user', 'name');

    if (argumentsList.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot generate AI analysis for a debate with no submitted arguments'
      });
    }

    const aiAnalysisResult = await generateDebateAnalysis(
      debate.topic,
      debate.description,
      argumentsList
    );

    debate.aiAnalysis = aiAnalysisResult;
    await debate.save();

    res.status(200).json({
      success: true,
      message: 'AI debate analysis generated successfully',
      aiAnalysis: debate.aiAnalysis
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
