const User = require('../models/User');
const jwt = require('jsonwebtoken');  // <-- add this line

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const newUser = new User({ name, email, password });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || user.password !== password) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // JWT payload me user info
    const payload = {
      id: user._id,
      name: user.name,
      email: user.email,
    };

    // JWT sign karna (secret key ko .env me rakho)
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });
    res.status(200).json({
      message: 'Login successful',
      user: {
        name: user.name,
        email: user.email,
      },
      token, // real token yahi send karenge
    });
    localStorage.setItem('token', data.token);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { register, login };
