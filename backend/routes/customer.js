const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const { protect } = require('../middleware/auth');

// GET /api/customers
router.get('/', protect, async (req, res) => {
  try {
    const customers = await Customer.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(customers);
  } catch (err) {
    console.error('[GET /api/customers]', err);
    res.status(500).json({ message: 'Failed to fetch customers.' });
  }
});

// POST /api/customers
router.post('/', protect, async (req, res) => {
  try {
    const { name, business, address, email, segment } = req.body;
    const customer = new Customer({
      userId: req.user._id,
      name,
      business,
      address,
      email,
      segment
    });
    await customer.save();
    res.status(201).json(customer);
  } catch (err) {
    console.error('[POST /api/customers]', err);
    res.status(500).json({ message: 'Failed to create customer.' });
  }
});

// PUT /api/customers/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found.' });
    }
    res.json(customer);
  } catch (err) {
    console.error('[PUT /api/customers/:id]', err);
    res.status(500).json({ message: 'Failed to update customer.' });
  }
});

// DELETE /api/customers/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const customer = await Customer.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found.' });
    }
    res.json({ success: true, message: 'Customer deleted.' });
  } catch (err) {
    console.error('[DELETE /api/customers/:id]', err);
    res.status(500).json({ message: 'Failed to delete customer.' });
  }
});

module.exports = router;
