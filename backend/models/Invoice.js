const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    customerId: {
      type: String,
      required: true,
    },
    invoiceNo: {
      type: String,
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    dueDate: {
      type: String,
      required: true,
    },
    currency: {
      type: String,
      default: 'INR (₹)',
    },
    status: {
      type: String,
      enum: ['Draft', 'Paid', 'Unpaid', 'Overdue'],
      default: 'Draft',
    },
    items: [
      {
        name: { type: String, required: true },
        description: { type: String, default: '' },
        qty: { type: Number, default: 1 },
        price: { type: Number, default: 0 },
        discount: { type: Number, default: 0 },
        tax: { type: Number, default: 18 },
      }
    ],
    subtotal: {
      type: Number,
      default: 0,
    },
    totalDiscount: {
      type: Number,
      default: 0,
    },
    totalTax: {
      type: Number,
      default: 0,
    },
    grandTotal: {
      type: Number,
      default: 0,
    },
    paymentInstructions: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
    terms: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

const Invoice = mongoose.model('Invoice', invoiceSchema);

// Safely drop legacy invoiceNumber_1 index if it exists in MongoDB
const dropLegacyIndex = () => {
  Invoice.collection.dropIndex('invoiceNumber_1').catch(() => {});
};
if (mongoose.connection.readyState === 1) {
  dropLegacyIndex();
} else {
  mongoose.connection.on('connected', dropLegacyIndex);
}

module.exports = Invoice;
