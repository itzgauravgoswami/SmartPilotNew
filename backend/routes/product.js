const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');

// GET /api/products
router.get('/', protect, async (req, res) => {
  try {
    const products = await Product.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    console.error('[GET /api/products]', err);
    res.status(500).json({ message: 'Failed to fetch products.' });
  }
});

// POST /api/products
router.post('/', protect, async (req, res) => {
  try {
    const { name, description, type, price, tax } = req.body;
    const product = new Product({
      userId: req.user._id,
      name,
      description,
      type,
      price,
      tax
    });
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    console.error('[POST /api/products]', err);
    res.status(500).json({ message: 'Failed to create product.' });
  }
});

// PUT /api/products/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }
    res.json(product);
  } catch (err) {
    console.error('[PUT /api/products/:id]', err);
    res.status(500).json({ message: 'Failed to update product.' });
  }
});

// DELETE /api/products/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }
    res.json({ success: true, message: 'Product deleted.' });
  } catch (err) {
    console.error('[DELETE /api/products/:id]', err);
    res.status(500).json({ message: 'Failed to delete product.' });
  }
});

module.exports = router;
