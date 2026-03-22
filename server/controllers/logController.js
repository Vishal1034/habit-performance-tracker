const Log = require('../models/Log');
const { normalizeDomain } = require('../utils/urlNormalizer');
const { resolveUserContext } = require('../utils/userResolver');

const createLog = async (req, res) => {
  try {
    const { url, duration } = req.body;
    const { userId } = resolveUserContext(req);

    if (!url || !duration) {
      return res.status(400).json({ message: 'URL and duration are required.' });
    }

    const normalizedUrl = normalizeDomain(url);

    if (!normalizedUrl) {
      return res.status(400).json({ message: 'Invalid URL format.' });
    }

    const newLog = await Log.create({
      user: userId,
      url: normalizedUrl,
      duration: duration
    });

    res.status(201).json({
      success: true,
      data: newLog
    });
  } catch (error) {
    console.error('Error saving log:', error.message);
    res.status(500).json({ message: 'Server Error: Could not save activity log.' });
  }
};

module.exports = {
  createLog
};
