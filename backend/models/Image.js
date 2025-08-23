const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    default: null,  // in case no password is provided
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Image', imageSchema);
