const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const axios = require('axios');

const User = require('../models/User');
const Session = require('../models/Session');
const OTP = require('../models/OTP');
const Task = require('../models/Task');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Invoice = require('../models/Invoice');
const SentEmail = require('../models/SentEmail');
const TeamMember = require('../models/TeamMember');
const ChatRequest = require('../models/ChatRequest');
const PrivateMessage = require('../models/PrivateMessage');
const ChannelMessage = require('../models/ChannelMessage');
const { signToken, hashToken } = require('../utils/token');
const { sendOtpEmail, sendWelcomeEmail, sendPasswordResetOtp } = require('../utils/email');
const { parseDevice } = require('../utils/device');
const { protect } = require('../middleware/auth');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function createSession(userId, token, req) {
  const { deviceName, deviceType, browser, os } = parseDevice(req.headers['user-agent']);
  const tokenHash = hashToken(token);
  const ipAddress =
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    '0.0.0.0';

  return Session.create({
    userId,
    tokenHash,
    deviceName,
    deviceType,
    browser,
    os,
    ipAddress,
    userAgent: req.headers['user-agent'] || '',
  });
}

async function handleLogin(user, req, res) {
  const { force, evictSessionId } = req.body;

  const activeSessions = await Session.find({ userId: user._id }).sort({ lastActive: -1 });
  const limit = user.maxDevices || 1;

  if (activeSessions.length >= limit) {
    if (force && evictSessionId) {
      await Session.findOneAndDelete({ _id: evictSessionId, userId: user._id });
    } else {
      return res.json({
        deviceLimitReached: true,
        plan: user.plan,
        maxDevices: limit,
        activeSessions: activeSessions.map(s => ({
          id: s._id,
          deviceName: s.deviceName,
          deviceType: s.deviceType,
          browser: s.browser,
          os: s.os,
          ipAddress: s.ipAddress,
          lastActive: s.lastActive,
        })),
      });
    }
  }

  const token = signToken(user._id);
  await createSession(user._id, token, req);

  return res.json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      plan: user.plan,
      avatarUrl: user.avatarUrl,
    },
  });
}

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/send-register-otp
 * Step 1 of email registration — validates fields, hashes password, stores OTP, sends email
 */
router.post('/send-register-otp', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }

    // Check if email already registered
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    // Hash password before storing in OTP record
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const otp = generateOTP();

    // Upsert OTP record (replace if already requested)
    await OTP.findOneAndReplace(
      { email: email.toLowerCase() },
      { email: email.toLowerCase(), name, hashedPassword, otp, attempts: 0 },
      { upsert: true, new: true }
    );

    // Send real OTP email
    await sendOtpEmail(email, name, otp);

    res.json({ message: 'Verification code sent to your email address.' });
  } catch (err) {
    console.error('[send-register-otp]', err);
    res.status(500).json({ message: 'Failed to send verification code. Please try again.' });
  }
});

/**
 * POST /api/auth/verify-register-otp
 * Step 2 — verifies OTP, creates user, issues JWT
 */
router.post('/verify-register-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required.' });
    }

    const record = await OTP.findOne({ email: email.toLowerCase() });

    if (!record) {
      return res.status(400).json({ message: 'Verification code expired. Please request a new one.' });
    }

    // Prevent brute force
    if (record.attempts >= 5) {
      await record.deleteOne();
      return res.status(429).json({ message: 'Too many failed attempts. Please request a new code.' });
    }

    if (record.otp !== otp) {
      record.attempts += 1;
      await record.save();
      return res.status(400).json({ message: `Incorrect verification code. ${5 - record.attempts} attempts remaining.` });
    }

    // Create user with pre-hashed password
    const user = await User.create({
      name: record.name,
      email: record.email,
      password: record.hashedPassword, // already hashed, skip the pre-save hook
      provider: 'local',
      isEmailVerified: true,
    });

    // Don't run bcrypt hash again — password is already hashed
    // We need to bypass the pre-save hook for already-hashed passwords
    // So we use updateOne directly:
    await User.updateOne({ _id: user._id }, { password: record.hashedPassword });

    await record.deleteOne();

    // Send welcome email (non-blocking)
    sendWelcomeEmail(user.email, user.name).catch(() => {});

    const token = signToken(user._id);
    await createSession(user._id, token, req);

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, plan: user.plan, avatarUrl: user.avatarUrl },
    });
  } catch (err) {
    console.error('[verify-register-otp]', err);
    res.status(500).json({ message: 'Registration failed. Please try again.' });
  }
});

/**
 * POST /api/auth/login
 * Email/password login with device limit enforcement
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (!user.password) {
      return res.status(400).json({
        message: `No password set. This account uses ${user.provider} sign-in. Please use that method.`,
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    return handleLogin(user, req, res);
  } catch (err) {
    console.error('[login]', err);
    res.status(500).json({ message: 'Login failed. Please try again.' });
  }
});

/**
 * POST /api/auth/google-token
 * Exchange Google access token for app JWT
 */
router.post('/google-token', async (req, res) => {
  try {
    const { accessToken } = req.body;
    if (!accessToken) {
      return res.status(400).json({ message: 'Google access token is required.' });
    }

    // Fetch Google user profile
    const { data: profile } = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const { sub: googleId, email, name, picture } = profile;
    if (!email) {
      return res.status(400).json({ message: 'Could not retrieve email from Google.' });
    }

    let user = await User.findOne({ googleId });
    if (!user) {
      // New Google user — needs password setup
      return res.json({
        requiresPassword: true,
        email,
        name,
        avatarUrl: picture,
        provider: 'google',
        providerId: googleId,
      });
    }

    // Link Google ID if not already saved (e.g. updating profile details)
    let updated = false;
    if (user.provider === 'local' && !user.providerId) {
      user.provider = 'google';
      user.providerId = googleId;
      updated = true;
    }
    if (!user.avatarUrl && picture) {
      user.avatarUrl = picture;
      updated = true;
    }
    if (updated) {
      await user.save();
    }

    return handleLogin(user, req, res);
  } catch (err) {
    console.error('[google-token]', err.response?.data || err.message);
    res.status(500).json({ 
      message: 'Google authentication failed. Please try again.',
      error: err.message,
      details: err.response?.data || null
    });
  }
});

/**
 * POST /api/auth/github-token
 * Exchange GitHub access token or code for app JWT
 */
router.post('/github-token', async (req, res) => {
  try {
    const { accessToken, code } = req.body;
    if (!accessToken && !code) {
      return res.status(400).json({ message: 'GitHub access token or code is required.' });
    }

    let token = accessToken;
    if (code) {
      const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }, {
        headers: { Accept: 'application/json' }
      });
      token = tokenResponse.data.access_token;
      if (!token) {
        return res.status(400).json({ message: 'Failed to exchange GitHub authorization code.' });
      }
    }

    // Fetch GitHub user
    const { data: profile } = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${token}` },
    });

    // GitHub may not expose email — fetch separately
    let email = profile.email;
    if (!email) {
      const { data: emails } = await axios.get('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const primary = emails.find(e => e.primary && e.verified);
      email = primary?.email;
    }

    if (!email) {
      return res.status(400).json({ message: 'Could not retrieve a verified email from GitHub.' });
    }

    const { id: githubId, name: githubName, login, avatar_url } = profile;
    const name = githubName || login;

    let user = await User.findOne({ githubId: String(githubId) });
    if (!user) {
      return res.json({
        requiresPassword: true,
        email,
        name,
        avatarUrl: avatar_url,
        provider: 'github',
        providerId: String(githubId),
      });
    }

    // Link GitHub ID if not already saved (e.g. updating profile details)
    let updated = false;
    if (user.provider === 'local' && !user.providerId) {
      user.provider = 'github';
      user.providerId = String(githubId);
      updated = true;
    }
    if (!user.avatarUrl && avatar_url) {
      user.avatarUrl = avatar_url;
      updated = true;
    }
    if (updated) {
      await user.save();
    }

    return handleLogin(user, req, res);
  } catch (err) {
    console.error('[github-token]', err.response?.data || err.message);
    res.status(500).json({ 
      message: 'GitHub authentication failed. Please try again.',
      error: err.message,
      details: err.response?.data || null
    });
  }
});

/**
 * POST /api/auth/microsoft-token
 * Exchange Microsoft access token or code for app JWT
 */
router.post('/microsoft-token', async (req, res) => {
  try {
    const { accessToken, code } = req.body;
    if (!accessToken && !code) {
      return res.status(400).json({ message: 'Microsoft access token or code is required.' });
    }

    let token = accessToken;
    if (code) {
      const tokenResponse = await axios.post(`https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID || 'common'}/oauth2/v2.0/token`, new URLSearchParams({
        client_id: process.env.MICROSOFT_CLIENT_ID,
        client_secret: process.env.MICROSOFT_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.MICROSOFT_REDIRECT_URI || 'http://localhost:5173/login',
      }));
      token = tokenResponse.data.access_token;
      if (!token) {
        return res.status(400).json({ message: 'Failed to exchange Microsoft authorization code.' });
      }
    }

    const { data: profile } = await axios.get('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${token}` },
    });

    const { id: msId, displayName, mail, userPrincipalName } = profile;
    const email = mail || userPrincipalName;
    const name = displayName;

    if (!email) {
      return res.status(400).json({ message: 'Could not retrieve email from Microsoft.' });
    }

    let user = await User.findOne({ microsoftId: msId });
    if (!user) {
      return res.json({
        requiresPassword: true,
        email,
        name,
        avatarUrl: null,
        provider: 'microsoft',
        providerId: msId,
      });
    }

    // Link Microsoft ID if not already saved (e.g. updating profile details)
    let updated = false;
    if (user.provider === 'local' && !user.providerId) {
      user.provider = 'microsoft';
      user.providerId = msId;
      updated = true;
    }
    if (updated) {
      await user.save();
    }

    return handleLogin(user, req, res);
  } catch (err) {
    console.error('[microsoft-token]', err.response?.data || err.message);
    res.status(500).json({ 
      message: 'Microsoft authentication failed. Please try again.',
      error: err.message,
      details: err.response?.data || null
    });
  }
});

/**
 * POST /api/auth/social-register
 * Complete registration for social OAuth users (set password)
 */
router.post('/social-register', async (req, res) => {
  try {
    const { name, email, password, confirmPassword, avatarUrl, provider, providerId } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    if (providerId) {
      const query = {};
      if (provider === 'google') query.googleId = providerId;
      else if (provider === 'github') query.githubId = String(providerId);
      else if (provider === 'microsoft') query.microsoftId = providerId;

      if (Object.keys(query).length > 0) {
        const existingProvider = await User.findOne(query);
        if (existingProvider) {
          return res.status(409).json({ message: `This ${provider} account is already connected to another workspace user.` });
        }
      }
    }

    const userFields = {
      name: name || 'User',
      email: email.toLowerCase(),
      password,
      avatarUrl: avatarUrl || null,
      provider: provider || 'local',
      providerId: providerId || null,
      isEmailVerified: true, // social accounts are pre-verified
    };
    if (provider === 'google') userFields.googleId = providerId;
    if (provider === 'github') userFields.githubId = providerId;
    if (provider === 'microsoft') userFields.microsoftId = providerId;

    const user = await User.create(userFields);

    sendWelcomeEmail(user.email, user.name).catch(() => {});

    const token = signToken(user._id);
    await createSession(user._id, token, req);

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, plan: user.plan, avatarUrl: user.avatarUrl },
    });
  } catch (err) {
    console.error('[social-register]', err);
    res.status(500).json({ message: 'Registration failed. Please try again.' });
  }
});

/**
 * POST /api/auth/logout
 * Invalidate current session
 */
router.post('/logout', protect, async (req, res) => {
  try {
    const tokenHash = hashToken(req.token);
    await Session.findOneAndDelete({ tokenHash });
    res.json({ message: 'Logged out successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Logout failed.' });
  }
});



/**
 * POST /api/auth/connect-oauth
 * Link a social OAuth account (Google, GitHub, Microsoft) to the current user profile
 */
router.post('/connect-oauth', protect, async (req, res) => {
  try {
    const { provider, accessToken, code } = req.body;
    const user = req.user;

    if (!provider) {
      return res.status(400).json({ message: 'Provider is required.' });
    }

    if (provider === 'google') {
      if (!accessToken) {
        return res.status(400).json({ message: 'Access token is required for Google connection.' });
      }
      const { data: profile } = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const googleId = profile.sub;
      if (!googleId) {
        return res.status(400).json({ message: 'Failed to retrieve Google profile ID.' });
      }

      // Check if another user is already connected to this Google ID
      const existing = await User.findOne({ googleId, _id: { $ne: user._id } });
      if (existing) {
        return res.status(409).json({ message: 'This Google account is already linked to another workspace user.' });
      }

      user.googleId = googleId;
      await user.save();
      return res.json({ success: true, message: 'Google account connected successfully!' });
    }

    if (provider === 'github') {
      if (!accessToken && !code) {
        return res.status(400).json({ message: 'Access token or authorization code is required for GitHub connection.' });
      }
      let token = accessToken;
      if (code) {
        const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
        }, {
          headers: { Accept: 'application/json' }
        });
        token = tokenResponse.data.access_token;
        if (!token) {
          return res.status(400).json({ message: 'Failed to exchange GitHub authorization code.' });
        }
      }

      const { data: profile } = await axios.get('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const githubId = String(profile.id);

      // Check if another user is already connected
      const existing = await User.findOne({ githubId, _id: { $ne: user._id } });
      if (existing) {
        return res.status(409).json({ message: 'This GitHub account is already linked to another workspace user.' });
      }

      user.githubId = githubId;
      await user.save();
      return res.json({ success: true, message: 'GitHub account connected successfully!' });
    }

    if (provider === 'microsoft') {
      if (!accessToken && !code) {
        return res.status(400).json({ message: 'Access token or authorization code is required for Microsoft connection.' });
      }
      let token = accessToken;
      if (code) {
        const tokenResponse = await axios.post(`https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID || 'common'}/oauth2/v2.0/token`, new URLSearchParams({
          client_id: process.env.MICROSOFT_CLIENT_ID,
          client_secret: process.env.MICROSOFT_CLIENT_SECRET,
          code,
          grant_type: 'authorization_code',
          redirect_uri: process.env.MICROSOFT_REDIRECT_URI || 'http://localhost:5173/login',
        }));
        token = tokenResponse.data.access_token;
        if (!token) {
          return res.status(400).json({ message: 'Failed to exchange Microsoft authorization code.' });
        }
      }

      const { data: profile } = await axios.get('https://graph.microsoft.com/v1.0/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const msId = profile.id;

      // Check if another user is already connected
      const existing = await User.findOne({ microsoftId: msId, _id: { $ne: user._id } });
      if (existing) {
        return res.status(409).json({ message: 'This Microsoft account is already linked to another workspace user.' });
      }

      user.microsoftId = msId;
      await user.save();
      return res.json({ success: true, message: 'Microsoft account connected successfully!' });
    }

    return res.status(400).json({ message: 'Unsupported provider.' });
  } catch (err) {
    console.error('[connect-oauth]', err.response?.data || err.message);
    res.status(500).json({ message: 'Failed to connect account. Please try again.' });
  }
});

/**
 * POST /api/auth/disconnect-oauth
 * Disconnect a linked social OAuth account
 */
router.post('/disconnect-oauth', protect, async (req, res) => {
  try {
    const { provider } = req.body;
    const user = req.user;

    if (!provider) {
      return res.status(400).json({ message: 'Provider is required.' });
    }

    if (user.provider === provider) {
      return res.status(400).json({ message: `Cannot disconnect ${provider} because your account was created using this method.` });
    }

    if (provider === 'google') {
      user.googleId = null;
    } else if (provider === 'github') {
      user.githubId = null;
    } else if (provider === 'microsoft') {
      user.microsoftId = null;
    } else {
      return res.status(400).json({ message: 'Unsupported provider.' });
    }

    await user.save();
    return res.json({ success: true, message: `${provider} account disconnected successfully!` });
  } catch (err) {
    console.error('[disconnect-oauth]', err.message);
    res.status(500).json({ message: 'Failed to disconnect account.' });
  }
});

/**
 * POST /api/auth/forgot-password
 * Send a password-reset OTP to the user's email
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required.' });

    const user = await User.findOne({ email: email.toLowerCase() });
    // Always return success to prevent user enumeration attacks
    if (!user) {
      return res.json({ message: 'If this email exists, a reset code has been sent.' });
    }

    const otp = generateOTP();
    const hashedOtp = await bcrypt.hash(otp, 10);

    // Store OTP in DB (reuse OTP collection with a type flag)
    await OTP.deleteMany({ email: email.toLowerCase(), type: 'password_reset' });
    await OTP.create({
      email: email.toLowerCase(),
      name: user.name,
      otp: hashedOtp,
      hashedPassword: 'reset_placeholder', // required field — not used for reset
      type: 'password_reset',
    });

    await sendPasswordResetOtp(user.email, user.name, otp);

    res.json({ message: 'If this email exists, a reset code has been sent.' });
  } catch (err) {
    console.error('[forgot-password]', err.message);
    res.status(500).json({ message: 'Failed to send reset code. Please try again.' });
  }
});

/**
 * POST /api/auth/reset-password
 * Verify OTP and set a new password
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP, and new password are required.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match.' });
    }

    const record = await OTP.findOne({ email: email.toLowerCase(), type: 'password_reset' });
    if (!record) {
      return res.status(400).json({ message: 'Reset code is invalid or has expired.' });
    }

    // Increment attempts
    record.attempts = (record.attempts || 0) + 1;
    if (record.attempts > 5) {
      await OTP.deleteOne({ _id: record._id });
      return res.status(429).json({ message: 'Too many incorrect attempts. Please request a new code.' });
    }
    await record.save();

    const valid = await bcrypt.compare(otp, record.otp);
    if (!valid) {
      return res.status(400).json({ message: 'Incorrect reset code. Please try again.' });
    }

    // Update the user's password
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'Account not found.' });
    }

    user.password = newPassword; // pre-save hook will hash this
    await user.save();

    // Invalidate all existing sessions for security
    await Session.deleteMany({ userId: user._id });

    // Cleanup OTP record
    await OTP.deleteOne({ _id: record._id });

    res.json({ success: true, message: 'Password reset successfully. You can now log in with your new password.' });
  } catch (err) {
    console.error('[reset-password]', err.message);
    res.status(500).json({ message: 'Failed to reset password. Please try again.' });
  }
});

/**
 * DELETE /api/auth/delete-account
 * Permanently delete current user account and all associated data
 */
router.delete('/delete-account', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    // Delete active sessions and OTP records
    await Session.deleteMany({ userId });
    await OTP.deleteMany({ email: req.user.email });

    // Delete user created resources
    await Task.deleteMany({ userId });
    await Customer.deleteMany({ userId });
    await Product.deleteMany({ userId });
    await Invoice.deleteMany({ userId });
    await SentEmail.deleteMany({ userId });
    await TeamMember.deleteMany({ userId });
    await ChatRequest.deleteMany({ $or: [{ senderId: userId }, { recipientId: userId }] });
    await PrivateMessage.deleteMany({ $or: [{ senderId: userId }, { recipientId: userId }] });
    await ChannelMessage.deleteMany({ senderId: userId });

    // Delete user account
    await User.findByIdAndDelete(userId);

    res.json({ success: true, message: 'Account deleted successfully.' });
  } catch (err) {
    console.error('[delete-account]', err.message || err);
    res.status(500).json({ message: 'Failed to delete account. Please try again.' });
  }
});

module.exports = router;
