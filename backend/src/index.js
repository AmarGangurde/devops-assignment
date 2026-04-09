require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { register, collectDefaultMetrics } = require('prom-client');
const logger = require('./utils/logger');
const chatRouter = require('./routes/chat');
const healthRouter = require('./routes/health');
const crudRouter = require('./routes/crud');
const { requestMetrics } = require('./middleware/metrics');

const app = express();
const PORT = process.env.PORT || 3001;

// Prometheus default metrics
collectDefaultMetrics({ prefix: 'supachat_' });

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(requestMetrics);

// Routes
app.use('/api', chatRouter);
app.use('/api/crud', crudRouter);
app.use('/health', healthRouter);

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err.message);
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  logger.info(`SupaChat backend running on port ${PORT}`);
});

module.exports = app;
