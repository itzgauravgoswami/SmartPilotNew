const { verifyToken, hashToken } = require('../utils/token');
const User = require('../models/User');
const Session = require('../models/Session');

/**
 * Middleware: Verify JWT and attach user to req.user
 * Expects: Authorization: Bearer <token>
 */
async function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ message: 'Unauthorized. Invalid or expired token.' });
    }

    // Verify session still exists in DB
    const tokenHash = hashToken(token);
    const session = await Session.findOne({ tokenHash });
    if (!session) {
      return res.status(401).json({ message: 'Session expired or terminated. Please log in again.' });
    }

    // Update last active timestamp (non-blocking)
    session.touch().catch(() => {});

    // Attach user
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User account not found or deactivated.' });
    }

    // Auto-expire Premium subscription after 30 days
    if (user.plan === 'Premium') {
      if (!user.planExpiresAt) {
        // Backfill expiry for existing accounts upgraded before this logic was added
        const expiryDate = new Date(user.createdAt || Date.now());
        expiryDate.setDate(expiryDate.getDate() + 30);
        
        // If calculated date is already past, assign 30 days from now for active testing
        if (expiryDate < new Date()) {
          const freshExpiry = new Date();
          freshExpiry.setDate(freshExpiry.getDate() + 30);
          user.planExpiresAt = freshExpiry;
        } else {
          user.planExpiresAt = expiryDate;
        }
        await user.save();
      } else if (new Date() > user.planExpiresAt) {
        user.plan = 'Starter';
        user.maxDevices = 1;
        user.planExpiresAt = null;
        await user.save();
      }

      // Auto-correct device limits for Premium
      if (user.maxDevices !== 2) {
        user.maxDevices = 2;
        await user.save();
      }
    }

    // Auto-correct device limits for Starter
    if (user.plan === 'Starter' && user.maxDevices !== 1) {
      user.maxDevices = 1;
      await user.save();
    }

    req.user = user;
    req.session = session;
    req.token = token;
    next();
  } catch (err) {
    console.error('[Auth Middleware Error]', err.message);
    return res.status(500).json({ message: 'Internal server error during authentication.' });
  }
}

module.exports = { protect };
