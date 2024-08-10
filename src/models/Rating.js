const mongoose = require('mongoose');
const { getISTDate } = require('../utils/dateUtils');

const ratingSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  business_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  rating: { type: Number, default: null, min: 0, max: 5 }, // Assuming ratings are from 0 to 5
  created_at: { type: Date, default: getISTDate },
  updated_at: { type: Date, default: null }
});

const Rating = mongoose.model('rating', ratingSchema);

module.exports = Rating;