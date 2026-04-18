const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Use memory storage (upload to Cloudinary directly from buffer)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, WebP, and GIF images are allowed.'));
    }
  },
});

/**
 * Upload buffer to Cloudinary using streams
 */
function uploadToCloudinary(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
    stream.end(buffer);
  });
}

/**
 * POST /api/upload/avatar
 * Upload user avatar to Cloudinary
 */
router.post('/avatar', protect, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided.' });
    }

    // Delete old avatar from Cloudinary if exists
    if (req.user.avatarPublicId) {
      await cloudinary.uploader.destroy(req.user.avatarPublicId).catch(() => {});
    }

    const result = await uploadToCloudinary(req.file.buffer, {
      folder: 'smart-pilot/avatars',
      public_id: `avatar_${req.user._id}`,
      overwrite: true,
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 'auto', fetch_format: 'auto' },
      ],
    });

    // Update user record
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatarUrl: result.secure_url, avatarPublicId: result.public_id },
      { new: true }
    );

    res.json({
      avatarUrl: user.avatarUrl,
      message: 'Avatar updated successfully.',
    });
  } catch (err) {
    console.error('[upload/avatar]', err);
    if (err.message?.includes('Only')) {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Image upload failed. Please try again.' });
  }
});


// Multer error handler
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 5MB.' });
    }
  }
  next(err);
});

module.exports = router;
