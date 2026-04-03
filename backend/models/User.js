const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // never returned in queries by default
    },
    avatarUrl: {
      type: String,
      default: null,
    },
    avatarPublicId: {
      type: String,
      default: null,
    },
    // OAuth provider info
    provider: {
      type: String,
      enum: ['local', 'google', 'github', 'microsoft'],
      default: 'local',
    },
    providerId: {
      type: String,
      default: null,
    },
    googleId: {
      type: String,
      default: null,
    },
    githubId: {
      type: String,
      default: null,
    },
    microsoftId: {
      type: String,
      default: null,
    },
    // Subscription
    plan: {
      type: String,
      enum: ['Starter', 'Premium'],
      default: 'Starter',
    },
    maxDevices: {
      type: Number,
      default: 1,
    },
    planExpiresAt: {
      type: Date,
      default: null,
    },
    // Profile
    domain: {
      type: String,
      default: 'General',
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
      default: '',
    },
    // Flags
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Razorpay
    razorpayCustomerId: {
      type: String,
      default: null,
    },
    lastPaymentId: {
      type: String,
      default: null,
    },
    // Default Invoice Configuration & Business Profile
    companyName: { type: String, default: '' },
    companyAddress: { type: String, default: '' },
    companyLogo: { type: String, default: '' },
    companySignature: { type: String, default: '' },
    companyPhone: { type: String, default: '' },
    companyEmail: { type: String, default: '' },
    companyGST: { type: String, default: '' },
    bankName: { type: String, default: '' },
    bankAccName: { type: String, default: '' },
    bankAccNo: { type: String, default: '' },
    bankIFSC: { type: String, default: '' },
    bankUPI: { type: String, default: '' },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Upgrade plan helper
userSchema.methods.upgradePlan = function (plan) {
  const planConfig = {
    Premium: { maxDevices: 2 },
    Starter: { maxDevices: 1 },
  };
  this.plan = plan;
  this.maxDevices = planConfig[plan]?.maxDevices || 1;
  
  if (plan === 'Premium') {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30); // 30 days
    this.planExpiresAt = expiryDate;
  } else {
    this.planExpiresAt = null;
  }
};

module.exports = mongoose.model('User', userSchema);
