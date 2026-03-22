const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const UserIdentity = require('../models/UserIdentity');

const DUMMY_PASSWORD = process.env.DUMMY_PASSWORD || 'demo123';

const isComEmail = (email) => /@[^\s@]+\.com$/.test(email);

const emailToObjectId = (email) => {
  return crypto.createHash('md5').update(email).digest('hex').slice(0, 24);
};

const recordLogin = async ({ userId, email, mode }) => {
  await UserIdentity.findOneAndUpdate(
    { user: userId },
    {
      $set: {
        user: userId,
        email,
        mode,
        lastLoginAt: new Date(),
      },
      $inc: { loginCount: 1 },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  );
};

const recordLoginSafely = async (payload) => {
  try {
    await recordLogin(payload);
  } catch (error) {
    console.error('recordLogin failed:', error.message);
  }
};

const login = async (req, res) => {
  try {
    const { email, password, mode } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    if (mode === 'dummy') {
      if (!isComEmail(normalizedEmail)) {
        return res.status(401).json({ success: false, message: 'Dummy login requires a valid @.com email.' });
      }

      if (password !== DUMMY_PASSWORD) {
        return res.status(401).json({ success: false, message: 'Invalid dummy password.' });
      }

      const dummyUserId = emailToObjectId(normalizedEmail);

      const token = jwt.sign(
        { id: dummyUserId, email: normalizedEmail, mode: 'dummy' },
        process.env.JWT_SECRET || 'dev_jwt_secret',
        { expiresIn: '7d' }
      );

      await recordLoginSafely({
        userId: dummyUserId,
        email: normalizedEmail,
        mode: 'dummy',
      });

      return res.status(200).json({
        success: true,
        token,
        user: { id: dummyUserId, email: normalizedEmail, mode: 'dummy' }
      });
    }

    const realEmail = (process.env.AUTH_EMAIL || '').toLowerCase();
    const realPassword = process.env.AUTH_PASSWORD || '';
    const configuredRealUserId = process.env.AUTH_USER_ID;

    if (realEmail && realPassword) {
      if (normalizedEmail !== realEmail || password !== realPassword) {
        return res.status(401).json({ success: false, message: 'Invalid real email/password.' });
      }

      const realUserId = configuredRealUserId || emailToObjectId(normalizedEmail);

      const token = jwt.sign(
        { id: realUserId, email: normalizedEmail, mode: 'real' },
        process.env.JWT_SECRET || 'dev_jwt_secret',
        { expiresIn: '7d' }
      );

      await recordLoginSafely({
        userId: realUserId,
        email: normalizedEmail,
        mode: 'real',
      });

      return res.status(200).json({
        success: true,
        token,
        user: { id: realUserId, email: normalizedEmail, mode: 'real' }
      });
    }

    if (!isComEmail(normalizedEmail)) {
      return res.status(401).json({ success: false, message: 'Please enter a valid @.com email.' });
    }

    const realUserId = configuredRealUserId || emailToObjectId(normalizedEmail);

    const token = jwt.sign(
      { id: realUserId, email: normalizedEmail, mode: 'real' },
      process.env.JWT_SECRET || 'dev_jwt_secret',
      { expiresIn: '7d' }
    );

    await recordLoginSafely({
      userId: realUserId,
      email: normalizedEmail,
      mode: 'real',
    });

    return res.status(200).json({ success: true, token, user: { id: realUserId, email: normalizedEmail, mode: 'real' } });
  } catch (error) {
    console.error('Login error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server Error: Could not login.',
      error: error.message,
    });
  }
};

module.exports = { login };
