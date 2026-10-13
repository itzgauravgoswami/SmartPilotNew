const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');
const { protect } = require('../middleware/auth');

// GET /api/invoices
router.get('/', protect, async (req, res) => {
  try {
    const invoices = await Invoice.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(invoices);
  } catch (err) {
    console.error('[GET /api/invoices]', err);
    res.status(500).json({ message: 'Failed to fetch invoices.' });
  }
});

// POST /api/invoices
router.post('/', protect, async (req, res) => {
  try {
    await Invoice.collection.dropIndex('invoiceNumber_1').catch(() => {});

    const {
      customerId, invoiceNo, date, dueDate, currency, status,
      items, subtotal, totalDiscount, totalTax, grandTotal,
      paymentInstructions, notes, terms
    } = req.body;

    const invoice = new Invoice({
      userId: req.user._id,
      customerId,
      invoiceNo,
      date,
      dueDate,
      currency,
      status,
      items,
      subtotal,
      totalDiscount,
      totalTax,
      grandTotal,
      paymentInstructions,
      notes,
      terms
    });

    await invoice.save();
    res.status(201).json(invoice);
  } catch (err) {
    console.error('[POST /api/invoices]', err);
    res.status(500).json({ message: 'Failed to create invoice.' });
  }
});

// PUT /api/invoices/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found.' });
    }
    res.json(invoice);
  } catch (err) {
    console.error('[PUT /api/invoices/:id]', err);
    res.status(500).json({ message: 'Failed to update invoice.' });
  }
});

// DELETE /api/invoices/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found.' });
    }
    res.json({ success: true, message: 'Invoice deleted.' });
  } catch (err) {
    console.error('[DELETE /api/invoices/:id]', err);
    res.status(500).json({ message: 'Failed to delete invoice.' });
  }
});

module.exports = router;
