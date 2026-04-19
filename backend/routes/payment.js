const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const PLAN_CONFIG = {
  Premium: {
    amount: 2100, // ₹21 in paise
    currency: 'INR',
    description: 'Smart Pilot Premium Plan',
    maxDevices: 2,
  },
};

/**
 * POST /api/payment/create-order
 * Create a Razorpay order for plan upgrade
 */
router.post('/create-order', protect, async (req, res) => {
  try {
    const { plan } = req.body;

    if (!PLAN_CONFIG[plan]) {
      return res.status(400).json({ message: `Invalid plan: ${plan}` });
    }

    const config = PLAN_CONFIG[plan];

    const order = await razorpay.orders.create({
      amount: config.amount,
      currency: config.currency,
      receipt: `rp_${req.user._id}_${String(Date.now()).slice(-8)}`,
      notes: {
        userId: String(req.user._id),
        plan,
        email: req.user.email,
      },
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      plan,
      user: {
        name: req.user.name,
        email: req.user.email,
      },
    });
  } catch (err) {
    console.error('[payment/create-order]', err);
    res.status(500).json({ message: 'Failed to create payment order.' });
  }
});

/**
 * POST /api/payment/verify
 * Verify Razorpay payment signature and upgrade plan
 */
router.post('/verify', protect, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Payment details are incomplete.' });
    }

    // Verify signature
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Payment verification failed. Invalid signature.' });
    }

    // Upgrade user plan
    if (!PLAN_CONFIG[plan]) {
      return res.status(400).json({ message: 'Invalid plan specified.' });
    }

    const user = req.user;
    user.upgradePlan(plan);
    user.lastPaymentId = razorpay_payment_id;
    await user.save();

    res.json({
      success: true,
      message: `Successfully upgraded to ${plan} plan!`,
      plan: user.plan,
      maxDevices: user.maxDevices,
      planExpiresAt: user.planExpiresAt,
      paymentId: razorpay_payment_id,
    });
  } catch (err) {
    console.error('[payment/verify]', err);
    res.status(500).json({ message: 'Payment verification failed.' });
  }
});

/**
 * GET /api/payment/plans
 * Get available plans and pricing (public)
 */
router.get('/plans', (req, res) => {
  res.json({
    plans: [
      {
        id: 'Starter',
        name: 'Starter',
        price: 0,
        currency: 'INR',
        maxDevices: 1,
        features: ['1 Device at same time', '10 AI Campaign Emails / 24 hrs', '10 Workspace Tasks Max', 'No Team Connect', 'Email Support'],
      },
      {
        id: 'Premium',
        name: 'Premium',
        price: 21,
        currency: 'INR',
        maxDevices: 2,
        features: ['2 Devices at same time', 'Unlimited AI Campaign Emails', 'Unlimited Workspace Tasks', 'Team Connect Enabled', 'Priority Support'],
      },
    ],
  });
});

module.exports = router;
