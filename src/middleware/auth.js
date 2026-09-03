const jwt = require('jsonwebtoken');

function requireAuth(req) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    throw new Error('Unauthorized: No token provided');
  }

  try {
    return jwt.verify(token, Bun.env.JWT_SECRET);
  } catch (err) {
    throw new Error('Forbidden: Invalid token');
  }
}

module.exports = {
  requireAuth
};
