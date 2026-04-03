const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  name: { type: String, required: true },
  hashedPassword: { type: String, required: true },
  otp: { type: String, required: true },
  attempts: { type: Number, default: 0 },
  type: { type: String, default: 'register', enum: ['register', 'password_reset'] },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600, // TTL: auto-delete after 10 minutes
  },
});

module.exports = mongoose.model('OTP', otpSchema);
