const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization; // get header 'Authorization'
  if (!authHeader) {
    return res.status(401).json({ message: 'No token provided' });
  }

  // Extract token from "Bearer <token>"
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Token missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;  // store decoded payload in req.user
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

module.exports = verifyToken;
