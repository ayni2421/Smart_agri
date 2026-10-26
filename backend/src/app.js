require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const commodityRoutes = require('./routes/commodities');
const marketRoutes = require('./routes/markets');
const priceRoutes = require('./routes/prices');
const anomalyRoutes = require('./routes/anomalies');
const supplierRoutes = require('./routes/suppliers');
const orderRoutes = require('./routes/orders');
const inventoryRoutes = require('./routes/inventory');
const batchRoutes = require('./routes/batches');
const deliveryRoutes = require('./routes/deliveries');
const transactionRoutes = require('./routes/transactions');
const notificationRoutes = require('./routes/notifications');
const reportRoutes = require('./routes/reports');
const auditRoutes = require('./routes/audit');

const app = express();

// Connect to database.
// Skip only when explicitly running jest (process.env.JEST_WORKER_ID is set by jest).
// This prevents the guard from firing when NODE_ENV is injected externally.
if (!process.env.JEST_WORKER_ID) {
  connectDB();
}

// Security middleware
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000', credentials: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false }));

// Request logging (suppress in jest test runs)
if (!process.env.JEST_WORKER_ID) {
  app.use(morgan('dev'));
}

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', env: process.env.NODE_ENV }));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/commodities', commodityRoutes);
app.use('/api/markets', marketRoutes);
app.use('/api/prices', priceRoutes);
app.use('/api/anomalies', anomalyRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/audit', auditRoutes);

// 404 handler
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (!process.env.JEST_WORKER_ID) {
  app.listen(PORT, () => console.log(`SAMIC API running on port ${PORT}`));
}

module.exports = app;
