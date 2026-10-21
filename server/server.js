require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');

const { getDatabaseAsync } = require('./config/database');
const { processDueRemindersAndFines } = require('./services/reminderJob');
const apiRoutes = require('./routes/apiRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads directory for academic resources & previews
const uploadsDir = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsDir));

// API Routes
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'Smart Library Backend API',
    timestamp: new Date().toISOString()
  });
});

// API 404 Handler - Always return JSON for any unmatched /api route
app.all('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint [${req.method}] ${req.originalUrl} not found.`
  });
});

// Serve frontend in production if build exists
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    return next();
  }
  const indexPath = path.join(clientDist, 'index.html');
  res.sendFile(indexPath, err => {
    if (err) next();
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'An unexpected server error occurred. Please try again.'
  });
});

async function startServer() {
  try {
    console.log('⏳ Initializing Smart Library Database...');
    await getDatabaseAsync();
    console.log('✅ Database connected and schema verified.');

    // Schedule automated due-date reminders & fine calculations every hour
    cron.schedule('0 * * * *', () => {
      try {
        processDueRemindersAndFines();
      } catch (cronErr) {
        console.error('Error during scheduled background reminder task:', cronErr);
      }
    });

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Smart Library Backend Server running on http://localhost:${PORT}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api/health`);
    });

    return server;
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
