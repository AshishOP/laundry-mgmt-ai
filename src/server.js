require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();

// ─── Security Middleware ────────────────────────────────────────
// Helmet: sets various HTTP security headers
app.use(helmet({
    contentSecurityPolicy: false, // Allow inline scripts for frontend
}));

// CORS configuration
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting: prevent brute force / DDoS
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 min
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
    message: {
        success: false,
        message: 'Too many requests. Please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', limiter);

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20, // 20 auth attempts per 15 min
    message: {
        success: false,
        message: 'Too many authentication attempts. Please try again later.',
    },
});
app.use('/api/auth', authLimiter);

// ─── Body Parsing ───────────────────────────────────────────────
app.use(express.json({ limit: '10kb' })); // limit body size
app.use(express.urlencoded({ extended: false }));

// ─── Serve Static Frontend ─────────────────────────────────────
app.use(express.static(path.join(__dirname, '..', 'public')));

// ─── Health Check ───────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Laundry Order Management API is running',
        timestamp: new Date().toISOString(),
    });
});

// ─── API Routes ─────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api', orderRoutes);

// ─── SPA Fallback ───────────────────────────────────────────────
app.use((req, res, next) => {
    if (req.url.startsWith('/api')) return next();
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// ─── Global Error Handler ───────────────────────────────────────
app.use((err, req, res, _next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
    });
});

// ─── Start Server ───────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

connectDB().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`\n🧺 Laundry Order Management System`);
        console.log(`   Server is running on port: ${PORT}`);
        console.log(`   API available at /api`);
    });
});

module.exports = app;
