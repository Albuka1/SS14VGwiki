const jwt = require('jsonwebtoken');

function getJwtSecret() {
  return process.env.JWT_SECRET || 'local-development-jwt-secret';
}

function createToken(payload) {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: '12h'
  });
}

function requireAuth(request, response, next) {
  const authorization = request.headers.authorization;

  if (!authorization?.startsWith('Bearer ')) {
    return response.status(401).json({
      message: 'Authorization token is required.'
    });
  }

  const token = authorization.slice(7);

  try {
    const payload = jwt.verify(token, getJwtSecret());
    request.user = payload;
    return next();
  } catch {
    return response.status(401).json({
      message: 'Authorization token is invalid or expired.'
    });
  }
}

module.exports = {
  createToken,
  requireAuth
};

