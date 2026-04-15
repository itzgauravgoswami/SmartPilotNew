const express = require('express');
const router = express.Router();
const SentEmail = require('../models/SentEmail');
const { protect } = require('../middleware/auth');
const { sendCustomEmail } = require('../utils/email');

// GET /api/emails
router.get('/', protect, async (req, res) => {
  try {
    const emails = await SentEmail.find({ userId: req.user._id }).sort({ date: -1 });
    res.json(emails);
  } catch (err) {
    console.error('[GET /api/emails]', err);
    res.status(500).json({ message: 'Failed to fetch sent emails.' });
  }
});

// POST /api/emails
router.post('/', protect, async (req, res) => {
  try {
    const { recipientName, email, subject, body, attachedInvoice, pdfData, pdfName } = req.body;

    if (req.user.plan === 'Starter') {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const emailCount = await SentEmail.countDocuments({
        userId: req.user._id,
        date: { $gte: oneDayAgo }
      });
      if (emailCount >= 10) {
        return res.status(403).json({
          message: 'Free user email limit reached (maximum 10 AI emails per 24 hours). Please upgrade to Premium for unlimited emails.',
          limitReached: true
        });
      }
    }

    let deliveryStatus = 'Delivered';
    try {
      await sendCustomEmail(email, subject, body, pdfData, pdfName);
    } catch (mailErr) {
      console.error('Nodemailer failed to send email:', mailErr);
      deliveryStatus = 'Failed';
    }

    const sentEmail = new SentEmail({
      userId: req.user._id,
      recipientName,
      email,
      subject,
      body,
      attachedInvoice,
      status: deliveryStatus,
      date: new Date()
    });
    await sentEmail.save();

    if (deliveryStatus === 'Failed') {
      return res.status(500).json({ message: 'Failed to send email. Please check your SMTP configuration in .env.' });
    }

    res.status(201).json(sentEmail);
  } catch (err) {
    console.error('[POST /api/emails]', err);
    res.status(500).json({ message: 'Failed to store sent email.' });
  }
});

// DELETE /api/emails/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const email = await SentEmail.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!email) {
      return res.status(404).json({ message: 'Email log not found.' });
    }
    res.json({ success: true, message: 'Email log deleted.' });
  } catch (err) {
    console.error('[DELETE /api/emails/:id]', err);
    res.status(500).json({ message: 'Failed to delete email log.' });
  }
});

module.exports = router;
