const mongoose = require('mongoose');
const { getISTDate } = require('../utils/dateUtils');

const businessSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  city: { type: String, required: true },
  category: { type: String, required: true },
  name: { type: String, required: true },
  owner: { type: String, required: true },
  email: { type: String, required: true },
  mobile: { type: Number, required: true },
  service: {
    type: [String],
    validate: [arrayLimit, '{PATH} exceeds the limit of 10'],
    required: true
  },
  address: { type: String, required: true },
  logo: { type: String },
  logoThumbnail: { type: String },
  gallery: {
    type: [String],
    validate: [arrayLimit, '{PATH} exceeds the limit of 10'],
  },
  galleryThumbnails: {
    type: [String],
    validate: [arrayLimit, '{PATH} exceeds the limit of 10'],
  },
  rating: { type: Number, default: 0 },
  total_rating: { type: Number, default: 0 },
  total_rated: { type: Number, default: 0 },
  created_at: { type: Date, default: getISTDate },
  updated_at: { type: Date, default: null }
});

function arrayLimit(val) {
  return val.length <= 10;
}

// Create indexes for fields that are frequently queried
businessSchema.index({ city: 1 });
businessSchema.index({ category: 1 });
businessSchema.index({ rating: 1 });
businessSchema.index({ user_id: 1 });
businessSchema.index({ created_at: -1 });
businessSchema.index({ updated_at: -1 });

const Business = mongoose.model('business', businessSchema);

module.exports = Business;
