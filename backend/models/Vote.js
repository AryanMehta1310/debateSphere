const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    argument: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Argument',
      required: true
    },
    debate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Debate',
      required: true
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

// Compound unique index to prevent duplicate votes per user per argument
voteSchema.index({ user: 1, argument: 1 }, { unique: true });

const Vote = mongoose.model('Vote', voteSchema);

module.exports = Vote;
