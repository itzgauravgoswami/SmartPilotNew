const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Session = require('../models/Session');
const { protect } = require('../middleware/auth');
const { hashToken } = require('../utils/token');

/**
 * GET /api/user/me
 * Get current user profile with active sessions
 */
router.get('/me', protect, async (req, res) => {
  try {
    const user = req.user;
    const sessions = await Session.find({ userId: user._id }).sort({ lastActive: -1 });

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      plan: user.plan,
      maxDevices: user.maxDevices,
      planExpiresAt: user.planExpiresAt,
      googleId: user.googleId,
      githubId: user.githubId,
      microsoftId: user.microsoftId,
      domain: user.domain,
      bio: user.bio,
      provider: user.provider,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
      companyName: user.companyName,
      companyAddress: user.companyAddress,
      companyLogo: user.companyLogo,
      companySignature: user.companySignature,
      companyPhone: user.companyPhone,
      companyEmail: user.companyEmail,
      companyGST: user.companyGST,
      bankName: user.bankName,
      bankAccName: user.bankAccName,
      bankAccNo: user.bankAccNo,
      bankIFSC: user.bankIFSC,
      bankUPI: user.bankUPI,
      activeSessions: sessions.map(s => ({
        id: s._id,
        deviceName: s.deviceName,
        deviceType: s.deviceType,
        browser: s.browser,
        os: s.os,
        ipAddress: s.ipAddress,
        lastActive: s.lastActive,
        isCurrent: hashToken(req.token) === s.tokenHash,
      })),
    });
  } catch (err) {
    console.error('[user/me]', err);
    res.status(500).json({ message: 'Failed to fetch user profile.' });
  }
});

/**
 * PUT /api/user/profile
 * Update user profile (name, bio, domain, avatarUrl)
 */
router.put('/profile', protect, async (req, res) => {
  try {
    const allowedFields = [
      'name', 'bio', 'domain', 'avatarUrl',
      'companyName', 'companyAddress', 'companyLogo', 'companySignature',
      'companyPhone', 'companyEmail', 'companyGST',
      'bankName', 'bankAccName', 'bankAccNo', 'bankIFSC', 'bankUPI'
    ];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No valid fields to update.' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      domain: user.domain,
      companyName: user.companyName,
      companyAddress: user.companyAddress,
      companyLogo: user.companyLogo,
      companySignature: user.companySignature,
      companyPhone: user.companyPhone,
      companyEmail: user.companyEmail,
      companyGST: user.companyGST,
      bankName: user.bankName,
      bankAccName: user.bankAccName,
      bankAccNo: user.bankAccNo,
      bankIFSC: user.bankIFSC,
      bankUPI: user.bankUPI,
    });
  } catch (err) {
    console.error('[user/profile]', err);
    res.status(500).json({ message: 'Failed to update profile.' });
  }
});

/**
 * POST /api/user/change-password
 * Change user password (requires old password)
 */
router.post('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters.' });
    }

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect.' });
    }

    user.password = newPassword;
    await user.save();

    // Invalidate all other sessions
    const tokenHash = hashToken(req.token);
    await Session.deleteMany({ userId: user._id, tokenHash: { $ne: tokenHash } });

    res.json({ message: 'Password changed successfully. Other sessions have been terminated.' });
  } catch (err) {
    console.error('[change-password]', err);
    res.status(500).json({ message: 'Failed to change password.' });
  }
});

/**
 * POST /api/sessions/evict
 * Terminate a specific session by ID
 */
router.post('/sessions/evict', protect, async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ message: 'Session ID is required.' });
    }

    const session = await Session.findOneAndDelete({
      _id: sessionId,
      userId: req.user._id,
    });

    if (!session) {
      return res.status(404).json({ message: 'Session not found.' });
    }

    res.json({ success: true, message: 'Session terminated successfully.' });
  } catch (err) {
    console.error('[sessions/evict]', err);
    res.status(500).json({ message: 'Failed to terminate session.' });
  }
});

module.exports = router;
