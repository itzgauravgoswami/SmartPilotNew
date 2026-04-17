const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const TeamMember = require('../models/TeamMember');
const TeamChannel = require('../models/TeamChannel');
const ChannelMessage = require('../models/ChannelMessage');
const PrivateMessage = require('../models/PrivateMessage');
const ChatRequest = require('../models/ChatRequest');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Enforce premium subscription for Team Connect
router.use(protect);
router.use((req, res, next) => {
  if (req.user.plan === 'Starter') {
    return res.status(403).json({
      message: 'Team Connect is a premium-only feature. Please upgrade your plan to access Team Connect.',
      premiumRequired: true
    });
  }
  next();
});

// GET /api/team/members
router.get('/members', protect, async (req, res) => {
  try {
    res.json([]);
  } catch (err) {
    console.error('[GET /api/team/members]', err);
    res.status(500).json({ message: 'Failed to fetch team members.' });
  }
});

// POST /api/team/members
router.post('/members', protect, async (req, res) => {
  try {
    res.status(400).json({ message: 'Offline members are disabled. Real users must be invited via chat requests.' });
  } catch (err) {
    console.error('[POST /api/team/members]', err);
    res.status(500).json({ message: 'Failed to add team member.' });
  }
});

// GET /api/team/channels
router.get('/channels', protect, async (req, res) => {
  try {
    const channels = await TeamChannel.find({
      $or: [
        { userId: req.user._id },
        { members: req.user._id }
      ]
    }).sort({ createdAt: 1 });
    res.json(channels);
  } catch (err) {
    console.error('[GET /api/team/channels]', err);
    res.status(500).json({ message: 'Failed to fetch channels.' });
  }
});

// POST /api/team/channels
router.post('/channels', protect, async (req, res) => {
  try {
    const { name, desc } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Channel name is required.' });
    }
    const cleanName = name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '');

    // Check if channel already exists globally in the database
    let channel = await TeamChannel.findOne({
      name: { $regex: new RegExp(`^${cleanName}$`, 'i') }
    });

    // Find all accepted chat partners to auto-add them
    const acceptedRequests = await ChatRequest.find({
      status: 'Accepted',
      $or: [
        { senderId: req.user._id },
        { receiverId: req.user._id }
      ]
    });
    const partnerIds = acceptedRequests.map(r => 
      String(r.senderId) === String(req.user._id) ? r.receiverId : r.senderId
    );
    const allUserIds = [req.user._id, ...partnerIds].map(id => new mongoose.Types.ObjectId(String(id)));

    if (channel) {
      let modified = false;
      for (const userId of allUserIds) {
        const uIdStr = String(userId);
        const hasMember = channel.members.some(mId => String(mId) === uIdStr);
        if (!hasMember) {
          channel.members.push(new mongoose.Types.ObjectId(uIdStr));
          modified = true;
        }
      }
      if (modified) {
        await channel.save();
      }
      return res.status(200).json(channel);
    }

    channel = new TeamChannel({
      userId: req.user._id,
      name: cleanName,
      desc: desc || '',
      members: allUserIds
    });
    await channel.save();
    res.status(201).json(channel);
  } catch (err) {
    console.error('[POST /api/team/channels]', err);
    res.status(500).json({ message: 'Failed to create channel.' });
  }
});

// GET /api/team/messages
router.get('/messages', protect, async (req, res) => {
  try {
    const channels = await TeamChannel.find({
      $or: [
        { userId: req.user._id },
        { members: req.user._id }
      ]
    });
    const channelIds = channels.map(c => String(c._id));

    const messages = await ChannelMessage.find({ 
      channelId: { $in: channelIds } 
    }).sort({ time: 1 });

    res.json(messages);
  } catch (err) {
    console.error('[GET /api/team/messages]', err);
    res.status(500).json({ message: 'Failed to fetch channel messages.' });
  }
});

// POST /api/team/messages
router.post('/messages', protect, async (req, res) => {
  try {
    const { channelId, text } = req.body;
    const message = new ChannelMessage({
      userId: req.user._id,
      channelId,
      senderName: req.user.name || 'Anonymous',
      senderId: String(req.user._id),
      text,
      time: new Date()
    });
    await message.save();
    res.status(201).json(message);
  } catch (err) {
    console.error('[POST /api/team/messages]', err);
    res.status(500).json({ message: 'Failed to send channel message.' });
  }
});

// GET /api/team/private-messages
router.get('/private-messages', protect, async (req, res) => {
  try {
    // Return all private messages where current user is sender OR receiver
    const userIdStr = String(req.user._id);
    const messages = await PrivateMessage.find({
      $or: [
        { senderId: userIdStr },
        { receiverId: userIdStr }
      ]
    }).sort({ time: 1 });
    res.json(messages);
  } catch (err) {
    console.error('[GET /api/team/private-messages]', err);
    res.status(500).json({ message: 'Failed to fetch private messages.' });
  }
});

// POST /api/team/private-messages
router.post('/private-messages', protect, async (req, res) => {
  try {
    const { receiverId, text } = req.body;
    const message = new PrivateMessage({
      userId: req.user._id,
      receiverId,
      senderName: req.user.name || 'Anonymous',
      senderId: String(req.user._id), // ensure senderId is current user ID
      text,
      time: new Date()
    });
    await message.save();
    res.status(201).json(message);
  } catch (err) {
    console.error('[POST /api/team/private-messages]', err);
    res.status(500).json({ message: 'Failed to send private message.' });
  }
});

// ─── Chat Invitation Requests Endpoints ─────────────────────────────────────

// POST /api/team/invites (Send chat invite by email, with optional channelId)
router.post('/invites', protect, async (req, res) => {
  try {
    const { email, channelId } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email address is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail === req.user.email.toLowerCase()) {
      return res.status(400).json({ message: 'You cannot invite yourself.' });
    }

    // Find if user exists
    const targetUser = await User.findOne({ email: cleanEmail });
    if (!targetUser) {
      return res.status(404).json({ message: 'User with this email does not exist.' });
    }

    // If channelId is provided, handle channel member addition
    let channelAddedText = '';
    if (channelId) {
      const channel = await TeamChannel.findById(channelId);
      if (!channel) {
        return res.status(404).json({ message: 'Channel not found.' });
      }
      
      // Ensure targetUser is in channel members
      const targetUserIdStr = String(targetUser._id);
      const isMember = channel.members.some(mId => String(mId) === targetUserIdStr);
      if (!isMember) {
        channel.members.push(new mongoose.Types.ObjectId(targetUserIdStr));
        await channel.save();
        channelAddedText = ` and added to #${channel.name}`;
      } else {
        channelAddedText = ` (already in #${channel.name})`;
      }
    }

    // Check if an invite request already exists (in either direction)
    const existing = await ChatRequest.findOne({
      $or: [
        { senderId: req.user._id, receiverId: targetUser._id },
        { senderId: targetUser._id, receiverId: req.user._id }
      ]
    });

    if (existing) {
      if (existing.status === 'Accepted') {
        return res.json({ message: `You are already connected in chat${channelAddedText}!` });
      }
      return res.status(400).json({ message: `A chat request is already ${existing.status.toLowerCase()}${channelAddedText}.` });
    }

    // Create pending request
    const request = new ChatRequest({
      senderId: req.user._id,
      receiverId: targetUser._id,
      status: 'Pending'
    });
    await request.save();

    res.status(201).json({ message: `Chat request sent successfully${channelAddedText}.`, request });
  } catch (err) {
    console.error('[POST /api/team/invites]', err);
    res.status(500).json({ message: 'Failed to send chat invite.' });
  }
});

// GET /api/team/invites/pending (Get pending invites incoming & outgoing)
router.get('/invites/pending', protect, async (req, res) => {
  try {
    // Incoming
    const incoming = await ChatRequest.find({
      receiverId: req.user._id,
      status: 'Pending'
    }).populate('senderId', 'name email avatarUrl');

    // Outgoing
    const outgoing = await ChatRequest.find({
      senderId: req.user._id,
      status: 'Pending'
    }).populate('receiverId', 'name email avatarUrl');

    res.json({ incoming, outgoing });
  } catch (err) {
    console.error('[GET /api/team/invites/pending]', err);
    res.status(500).json({ message: 'Failed to fetch pending chat requests.' });
  }
});

// PUT /api/team/invites/:id (Accept or Decline chat request)
router.put('/invites/:id', protect, async (req, res) => {
  try {
    const { action } = req.body;
    const { id } = req.params;

    if (!['accept', 'decline'].includes(action)) {
      return res.status(400).json({ message: 'Invalid invite action.' });
    }

    const request = await ChatRequest.findById(id);
    if (!request) {
      return res.status(404).json({ message: 'Chat request not found.' });
    }

    // Ensure recipient is the one accepting/declining
    if (String(request.receiverId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to modify this invite request.' });
    }

    if (action === 'accept') {
      request.status = 'Accepted';
      await request.save();

      // Find all channels where either the sender or receiver is the creator,
      // and add both sender and receiver to their members list!
      const channels = await TeamChannel.find({
        userId: { $in: [request.senderId, request.receiverId] }
      });

      for (const ch of channels) {
        let modified = false;
        const senderIdStr = String(request.senderId);
        const receiverIdStr = String(request.receiverId);

        if (!ch.members.some(mId => String(mId) === senderIdStr)) {
          ch.members.push(new mongoose.Types.ObjectId(senderIdStr));
          modified = true;
        }
        if (!ch.members.some(mId => String(mId) === receiverIdStr)) {
          ch.members.push(new mongoose.Types.ObjectId(receiverIdStr));
          modified = true;
        }
        if (modified) {
          await ch.save();
        }
      }
    } else {
      request.status = 'Declined';
      await request.save();
      // Optionally delete declined request
      await ChatRequest.findByIdAndDelete(id);
    }

    res.json({ message: `Chat invitation ${action}ed successfully.` });
  } catch (err) {
    console.error('[PUT /api/team/invites/:id]', err);
    res.status(500).json({ message: 'Failed to process chat invite response.' });
  }
});

// GET /api/team/active-chats (Get users with whom we have accepted chat request)
router.get('/active-chats', protect, async (req, res) => {
  try {
    const acceptedRequests = await ChatRequest.find({
      status: 'Accepted',
      $or: [
        { senderId: req.user._id },
        { receiverId: req.user._id }
      ]
    })
    .populate('senderId', 'name email avatarUrl')
    .populate('receiverId', 'name email avatarUrl');

    const chatPartners = acceptedRequests.map(reqs => {
      const otherUser = String(reqs.senderId._id) === String(req.user._id)
        ? reqs.receiverId
        : reqs.senderId;
      
      return {
        requestId: reqs._id,
        id: otherUser._id,
        name: otherUser.name,
        email: otherUser.email,
        avatarUrl: otherUser.avatarUrl,
        online: true, // simple status
        color: 'bg-indigo-500'
      };
    });

    res.json(chatPartners);
  } catch (err) {
    console.error('[GET /api/team/active-chats]', err);
    res.status(500).json({ message: 'Failed to fetch active chat sessions.' });
  }
});

module.exports = router;
