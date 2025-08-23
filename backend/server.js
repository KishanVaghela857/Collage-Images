const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();
const imageRoutes = require('./routes/imageRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();

app.use(cors({
  origin: 'http://localhost:5173', // frontend ka URL
  credentials: true,
}));

app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB connection error:', err));

app.use('/api/auth', authRoutes);
app.use('/api/images', imageRoutes);
// Removed static serving of uploads directory for security
// app.use('/uploads', express.static('uploads'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
