const mongoose = require('mongoose');

const argumentSchema = new mongoose.Schema(
  {
    debate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Debate',
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: [true, 'Argument content cannot be empty'],
      trim: true
    },
    round: {
      type: Number,
      default: 1
    },
    turnNumber: {
      type: Number,
      default: 1
    },
    votes: {
      type: Number,
      default: 0
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

const Argument = mongoose.model('Argument', argumentSchema);

module.exports = Argument;
