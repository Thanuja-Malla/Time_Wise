const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { connectDB } = require('./config/db');
const mongoose = require('mongoose');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const studentRoutes = require('./routes/studentRoutes');
const lateEntryRoutes = require('./routes/lateEntryRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();



// Security Headers
app.use(
  helmet({
    crossOriginResourcePolicy: false
  })
);

// CORS
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(
  cors({
    origin: [clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Request parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// HTTP Request Logger
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate limiting for auth login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 attempts per IP
  message: {
    success: false,
    message: 'Too many login attempts from this IP, please try again after 15 minutes'
  }
});
app.use('/api/auth/login', loginLimiter);

// API Health Check
app.get('/api/health', (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  res.status(200).json({
    status: isDbConnected ? 'online' : 'degraded',
    database: isDbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    service: 'TimeWise API Server',
    version: '1.0.0'
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/late-entries', lateEntryRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reports', reportRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API Route not found: ${req.method} ${req.originalUrl}`
  });
});

// Centralized Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const { initUnifiedExcelFile, syncAllExistingLateEntries } = require('./services/excelService');
const LateEntry = require('./models/LateEntry');

const startServer = async () => {
  try {
    await connectDB();
    initUnifiedExcelFile();
    await syncAllExistingLateEntries(LateEntry);
    const server = app.listen(PORT, () => {
      console.log(`[TimeWise Server] Running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      console.log(`[TimeWise Server] Local API Health: http://localhost:${PORT}/api/health`);
    });
  } catch (err) {
    console.error(`[TimeWise Server Fatal]: ${err.message}`);
    process.exit(1);
  }
};

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`[Unhandled Rejection]: ${err.message}`);
});

module.exports = app;
