const mongoose = require('mongoose');

const sentEmailSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recipientName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    attachedInvoice: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      default: 'Delivered',
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SentEmail', sentEmailSchema);
