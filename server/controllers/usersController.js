const UserIdentity = require('../models/UserIdentity');

const listUsers = async (_req, res) => {
  try {
    const users = await UserIdentity.find({})
      .sort({ lastLoginAt: -1, createdAt: -1 })
      .select('email mode lastLoginAt loginCount createdAt');

    res.status(200).json({
      success: true,
      data: users,
      total: users.length,
    });
  } catch (error) {
    console.error('List users error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server Error: Could not fetch users.',
    });
  }
};

module.exports = { listUsers };
