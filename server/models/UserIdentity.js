const mongoose = require('mongoose');

const userIdentitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    unique: true,
    index: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    index: true,
  },
  mode: {
    type: String,
    enum: ['dummy', 'real'],
    required: true,
  },
  lastLoginAt: {
    type: Date,
    default: Date.now,
  },
  loginCount: {
    type: Number,
    default: 1,
    min: 1,
  },
}, { timestamps: true });

module.exports = mongoose.model('UserIdentity', userIdentitySchema);
