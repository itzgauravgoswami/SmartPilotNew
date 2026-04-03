const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },
    deviceName: {
      type: String,
      default: 'Unknown Device',
    },
    deviceType: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet', 'unknown'],
      default: 'desktop',
    },
    browser: {
      type: String,
      default: 'Unknown Browser',
    },
    os: {
      type: String,
      default: 'Unknown OS',
    },
    ipAddress: {
      type: String,
      default: '0.0.0.0',
    },
    userAgent: {
      type: String,
      default: '',
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days
      index: { expireAfterSeconds: 0 }, // MongoDB TTL auto-cleanup
    },
  },
  { timestamps: true }
);

// Update lastActive timestamp
sessionSchema.methods.touch = function () {
  this.lastActive = new Date();
  return this.save();
};

module.exports = mongoose.model('Session', sessionSchema);
