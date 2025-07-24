const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'mon_secret_jwt';

module.exports = function exposeUser(req, res, next) {
  const token = req.cookies?.token;
  if (!token) {
    res.locals.currentUser = null;
    return next();
  }

  jwt.verify(token, SECRET, (err, user) => {
    if (err) {
      res.locals.currentUser = null;
      return next();
    }
    res.locals.currentUser = user; // accessible dans toutes les vues EJS
    next();
  });
};
