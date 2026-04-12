const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    type: {
      type: String,
      enum: ['Product', 'Service'],
      default: 'Product',
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      default: 0,
    },
    tax: {
      type: Number,
      default: 18,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
