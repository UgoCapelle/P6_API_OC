const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Token manquant' });
    }

    const decodedToken = jwt.verify(token, 'RANDOM_TOKEN_SECRET');
    req.userId = decodedToken.userId;

    next();
  } catch (error) {
    res.status(401).json({ message: 'Requête non authentifiée' });
  }
};