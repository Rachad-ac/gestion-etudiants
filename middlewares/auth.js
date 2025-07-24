const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'mon_secret_jwt';

function authenticateToken(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return res.redirect('/auth/login');

  jwt.verify(token, SECRET, (err, user) => {
    if (err) {
      res.clearCookie('token');
      return res.redirect('/auth/login');
    }
    req.user = user;
    next();
  });
}

function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).send('Accès refusé');
    }
    next();
  };
}

module.exports = { authenticateToken, authorizeRoles };
