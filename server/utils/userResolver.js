const crypto = require('crypto');
const mongoose = require('mongoose');

const DEFAULT_EMAIL = 'demo@habitstabilitytracker.com';

const normalizeEmail = (value) => {
  if (!value || typeof value !== 'string') return DEFAULT_EMAIL;
  const email = value.trim().toLowerCase();
  return email || DEFAULT_EMAIL;
};

const emailToObjectId = (email) => {
  const hex = crypto.createHash('md5').update(email).digest('hex').slice(0, 24);
  return new mongoose.Types.ObjectId(hex);
};

const resolveUserContext = (req) => {
  const tokenUserId = req.user && req.user.id;

  if (tokenUserId && mongoose.isValidObjectId(tokenUserId)) {
    return {
      userId: new mongoose.Types.ObjectId(tokenUserId),
      email: normalizeEmail((req.user && req.user.email) || req.headers['x-user-email']),
    };
  }

  const headerEmail = req.headers['x-user-email'];
  const bodyEmail = req.body && req.body.email;
  const queryEmail = req.query && req.query.email;
  const email = normalizeEmail(headerEmail || bodyEmail || queryEmail);

  return {
    userId: emailToObjectId(email),
    email,
  };
};

module.exports = { resolveUserContext };

