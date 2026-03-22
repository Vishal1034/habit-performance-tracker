const mongoose = require('mongoose');

const habitSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['focus', 'distraction'],
    required: true
  },
  urls: [{
    type: String,
    trim: true
  }],
  dailyGoal: {
    type: Number, // in seconds
    required: true,
    min: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Habit', habitSchema);
