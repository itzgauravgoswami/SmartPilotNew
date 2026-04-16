const mongoose = require('mongoose');

const teamMemberSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      default: 'Member',
    },
    online: {
      type: Boolean,
      default: true,
    },
    color: {
      type: String,
      default: 'bg-orange-500',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TeamMember', teamMemberSchema);
