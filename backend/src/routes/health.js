const express = require('express');
const router = express.Router();
const { testConnection } = require('../services/db');

// GET /health
router.get('/', async (req, res) => {
  const dbOk = await testConnection();
  const status = dbOk ? 'ok' : 'degraded';
  res.status(dbOk ? 200 : 503).json({
    status,
    service: 'supachat-backend',
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    checks: {
      database: dbOk ? 'connected' : 'disconnected',
      openai: process.env.OPENAI_API_KEY ? 'configured' : 'missing',
    },
  });
});

module.exports = router;
