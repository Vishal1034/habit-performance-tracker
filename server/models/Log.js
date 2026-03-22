const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  url: {
    type: String,
    required: true,
    trim: true
  },
  duration: {
    type: Number, // Duration in seconds
    required: true
  },
  loggedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Log', logSchema);
