const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
    user_id: { type: String, required: true },
    token: { type: String, required: true },
    type: { type: String, required: true },
    created_at: { type: Date, default: Date.now }
});

// Set TTL index programmatically
tokenSchema.index({ created_at: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 2 }); // 2 days

const Token = mongoose.model('token', tokenSchema);

module.exports = Token;