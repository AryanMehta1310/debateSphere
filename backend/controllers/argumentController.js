const Argument = require('../models/Argument');
const Debate = require('../models/Debate');
const Vote = require('../models/Vote');

// @desc    Submit an argument for a debate room
// @route   POST /api/arguments/:roomCode
// @access  Private (Debater turn only)
const submitArgument = async (req, res, next) => {
  try {
    const { roomCode } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Argument content cannot be empty'
      });
    }

    const debate = await Debate.findOne({ roomCode: roomCode.toUpperCase() });

    if (!debate) {
      return res.status(404).json({
        success: false,
        message: 'Debate room not found'
      });
    }

    if (debate.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Debate is not active. Arguments can only be submitted during an active debate.'
      });
    }

    const currentDebaterId = debate.debaters[debate.currentTurnIndex];
    if (!currentDebaterId || currentDebaterId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "It is not your turn to submit an argument."
      });
    }

    const existingArg = await Argument.findOne({
      debate: debate._id,
      turnNumber: debate.turnNumber
    });

    if (existingArg) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted an argument for this turn.'
      });
    }

    const argument = await Argument.create({
      debate: debate._id,
      user: userId,
      content: content.trim(),
      round: debate.currentRound || 1,
      turnNumber: debate.turnNumber || 1
    });

    const populatedArgument = await Argument.findById(argument._id).populate('user', 'name email');

    const io = req.app.get('io');
    if (io) {
      io.to(debate.roomCode).emit('newArgument', populatedArgument);
    }

    res.status(201).json({
      success: true,
      message: 'Argument submitted successfully',
      argument: populatedArgument
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all arguments for a debate room
// @route   GET /api/arguments/:roomCode
// @access  Private
const getArguments = async (req, res, next) => {
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

    const argumentsList = await Argument.find({ debate: debate._id })
      .populate('user', 'name email')
      .sort({ createdAt: 1 });

    const userVotes = await Vote.find({
      user: userId,
      argument: { $in: argumentsList.map((a) => a._id) }
    });

    const userVotedArgumentIds = userVotes.map((v) => v.argument.toString());

    res.status(200).json({
      success: true,
      count: argumentsList.length,
      arguments: argumentsList,
      userVotedArgumentIds
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Vote for an argument (Audience members only)
// @route   POST /api/arguments/vote/:argumentId
// @access  Private (Audience only)
const voteArgument = async (req, res, next) => {
  try {
    const { argumentId } = req.params;
    const userId = req.user._id;

    const argument = await Argument.findById(argumentId).populate('debate');

    if (!argument) {
      return res.status(404).json({
        success: false,
        message: 'Argument not found'
      });
    }

    const debate = await Debate.findById(argument.debate._id);

    if (debate.status !== 'active' && debate.status !== 'ready') {
      return res.status(400).json({
        success: false,
        message: 'Voting is only allowed during active debate rounds'
      });
    }

    // Check if user is one of the two debaters
    const isDebater = debate.debaters.some(
      (dId) => dId.toString() === userId.toString()
    );

    if (isDebater) {
      return res.status(403).json({
        success: false,
        message: 'Debaters cannot vote on debate arguments'
      });
    }

    // Record vote in DB (Unique index handles duplicate vote check)
    try {
      await Vote.create({
        user: userId,
        argument: argumentId,
        debate: debate._id
      });
    } catch (dbErr) {
      if (dbErr.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'You have already voted for this argument'
        });
      }
      throw dbErr;
    }

    argument.votes += 1;
    await argument.save();

    // Recalculate debater score
    const isPlayer1Arg = debate.debaters[0] && debate.debaters[0].toString() === argument.user.toString();
    if (isPlayer1Arg) {
      debate.player1Score += 1;
    } else {
      debate.player2Score += 1;
    }

    await debate.save();

    const updatedArgument = await Argument.findById(argumentId).populate('user', 'name email');

    const io = req.app.get('io');
    if (io) {
      io.to(debate.roomCode).emit('voteReceived', {
        argumentId: updatedArgument._id,
        votes: updatedArgument.votes,
        argument: updatedArgument
      });
      io.to(debate.roomCode).emit('scoreUpdated', {
        player1Score: debate.player1Score,
        player2Score: debate.player2Score
      });
    }

    res.status(200).json({
      success: true,
      message: 'Vote recorded successfully',
      argument: updatedArgument,
      player1Score: debate.player1Score,
      player2Score: debate.player2Score
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitArgument,
  getArguments,
  voteArgument
};
