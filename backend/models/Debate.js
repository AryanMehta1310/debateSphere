const mongoose = require('mongoose');

const debateSchema = new mongoose.Schema(
  {
    topic: {
      type: String,
      required: [true, 'Please provide a debate topic'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Please provide a description'],
      trim: true
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    roomCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    debaters: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    player1Ready: {
      type: Boolean,
      default: false
    },
    player2Ready: {
      type: Boolean,
      default: false
    },
    player1Score: {
      type: Number,
      default: 0
    },
    player2Score: {
      type: Number,
      default: 0
    },
    isRandom: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ['waiting', 'ready', 'active', 'completed'],
      default: 'waiting'
    },
    result: {
      type: String,
      enum: ['player1', 'player2', 'tie', 'quit', null],
      default: null
    },
    currentRound: {
      type: Number,
      default: 1
    },
    currentTurnIndex: {
      type: Number,
      default: 0
    },
    turnNumber: {
      type: Number,
      default: 1
    },
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    winnerReason: {
      type: String
    },
    aiAnalysis: {
      summary: String,
      mainPoints: [String],
      strengths: [String],
      weaknesses: [String],
      conclusion: String,
      rawAnalysis: String,
      generatedAt: Date
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

const Debate = mongoose.model('Debate', debateSchema);

module.exports = Debate;
