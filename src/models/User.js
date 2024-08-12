const mongoose = require('mongoose');
const { getISTDate } = require('../utils/dateUtils');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  mobile: { type: Number, default: null }, // Set default to null if mobile is optional
  city: { type: String, default: null },
  email: { type: String, required: true, unique: true },
  image: { type: String, default: null },
  type: { type: String, enum: ['consumer', 'business'], default: null },
  created_at: { type: Date, default: getISTDate },
  updated_at: { type: Date, default: null },
  last_logged_in_at: { type: Date, default: getISTDate }
});

const User = mongoose.model('user', userSchema);

module.exports = User;
