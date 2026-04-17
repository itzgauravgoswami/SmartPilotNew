const mongoose = require('mongoose');

const chatRequestSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Accepted', 'Declined'],
      default: 'Pending',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ChatRequest', chatRequestSchema);
