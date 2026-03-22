const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  const authHeader = req.headers.authorization || '';

  if (!authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_jwt_secret');
    req.user = {
      id: decoded.id || decoded.userId || decoded._id,
      email: decoded.email,
    };
  } catch (error) {
  }

  return next();
};

module.exports = { protect };
