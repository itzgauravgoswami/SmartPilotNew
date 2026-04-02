require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
require('./config/cloudinary'); // Initialize Cloudinary

// Route imports
const authRoutes    = require('./routes/auth');
const userRoutes    = require('./routes/user');
const paymentRoutes = require('./routes/payment');
const aiRoutes      = require('./routes/ai');
const uploadRoutes  = require('./routes/upload');
const taskRoutes    = require('./routes/task');
const customerRoutes = require('./routes/customer');
const productRoutes = require('./routes/product');
const invoiceRoutes = require('./routes/invoice');
const teamRoutes    = require('./routes/team');
const emailRoutes   = require('./routes/email');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Security Middleware ───────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false
}));

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  ...(process.env.EXTRA_ALLOWED_ORIGINS
    ? process.env.EXTRA_ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
    : []),
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' || !process.env.NODE_ENV ? 10000 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' || !process.env.NODE_ENV ? 500 : 20,
  message: { message: 'Too many authentication attempts. Please try again in 15 minutes.' },
});

app.use(globalLimiter);

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── HTTP Logging ─────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Smart Pilot API',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',    authLimiter, authRoutes);
app.use('/api/user',    userRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/ai',      aiRoutes);
app.use('/api/upload',  uploadRoutes);
app.use('/api/tasks',    taskRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products',  productRoutes);
app.use('/api/invoices',  invoiceRoutes);
app.use('/api/team',      teamRoutes);
app.use('/api/emails',    emailRoutes);

// Backwards compat: session eviction lives under /api/user
app.use('/api', userRoutes);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.path} not found.` });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Global Error]', err.stack || err.message);

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ message: messages.join(', ') });
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({ message: `An account with this ${field} already exists.` });
  }
  if (err.message?.startsWith('CORS')) {
    return res.status(403).json({ message: err.message });
  }

  res.status(err.status || 500).json({
    message: err.message || 'Internal server error.',
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
async function start() {
  await connectDB();

  app.listen(PORT, () => {
    console.log('');
    console.log('🚀 Smart Pilot Backend Server');
    console.log(`   URL:         http://localhost:${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Health:      http://localhost:${PORT}/health`);
    console.log('');
    console.log('   Routes:');
    console.log(`   POST  /api/auth/send-register-otp`);
    console.log(`   POST  /api/auth/verify-register-otp`);
    console.log(`   POST  /api/auth/login`);
    console.log(`   POST  /api/auth/google-token`);
    console.log(`   POST  /api/auth/github-token`);
    console.log(`   POST  /api/auth/microsoft-token`);
    console.log(`   POST  /api/auth/social-register`);
    console.log(`   POST  /api/auth/logout`);
    console.log(`   GET   /api/user/me`);
    console.log(`   PUT   /api/user/profile`);
    console.log(`   POST  /api/payment/create-order`);
    console.log(`   POST  /api/payment/verify`);
    console.log(`   POST  /api/ai/chat`);
    console.log(`   POST  /api/upload/avatar`);
    console.log('');
  });
}

start().catch(err => {
  console.error('❌ Failed to start server:', err.message);
  process.exit(1);
});
