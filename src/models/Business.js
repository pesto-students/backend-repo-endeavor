const mongoose = require('mongoose');
const { getISTDate } = require('../utils/dateUtils');

const businessSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  city: { type: String, required: true },
  category: { type: String, required: true },
  name: { type: String, required: true },
  owner: { type: String, required: true },
  mobile: { type: Number, required: true },
  service: {
    type: [String],
    validate: [arrayLimit, '{PATH} exceeds the limit of 10'],
    required: true
  },
  address: { type: String, required: true },
  logo: { type: String },
  gallery: {
    type: [String],
    validate: [arrayLimit, '{PATH} exceeds the limit of 10'],
  },
  total_rating: { type: Number, default: 0 },
  total_rated: { type: Number, default: 0 },
  created_at: { type: Date, default: getISTDate },
  updated_at: { type: Date, default: null }
});

function arrayLimit(val) {
  return val.length <= 10;
}

const Business = mongoose.model('business', businessSchema);

module.exports = Business;
