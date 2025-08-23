const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  const authHeader = req.headers.authorization;

  console.log('🔥 Auth Header:', authHeader);  // DEBUG

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('❌ No token provided');
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  console.log('🔐 Extracted Token:', token); // DEBUG

  try {
    console.log('🧪 JWT_SECRET:', process.env.JWT_SECRET); // DEBUG
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token decoded:', decoded); // DEBUG
    req.user = decoded;
    next();
  } catch (err) {
    console.error('❌ Invalid token:', err.message);
    return res.status(401).json({ message: 'Invalid token' });
  }
};
